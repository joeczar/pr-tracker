import { Database } from 'bun:sqlite';
import { DatabaseManager } from '../db/database.js';
import { User, GitHubUser, UserSession } from '../types/auth.js';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

export class UserService {
  private db: Database;
  private encryptionKey: string;

  constructor() {
    this.db = DatabaseManager.getInstance().getDatabase();
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    
    if (this.encryptionKey === 'default-key-change-in-production') {
      console.warn('⚠️  Using default encryption key. Set ENCRYPTION_KEY environment variable in production!');
    }
  }

  private encryptToken(token: string): string {
    return CryptoJS.AES.encrypt(token, this.encryptionKey).toString();
  }

  private decryptToken(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async createOrUpdateUser(
    githubUser: GitHubUser,
    accessToken: string,
    refreshToken: string | null,
    scopes: string[],
    expiresAt: Date | null
  ): Promise<User> {
    const encryptedAccessToken = this.encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? this.encryptToken(refreshToken) : null;
    const scopesJson = JSON.stringify(scopes);

    // Check if user exists
    const existingUser = await this.getUserByGitHubId(githubUser.id);

    if (existingUser) {
      // Update existing user
      const stmt = this.db.prepare(`
        UPDATE users 
        SET login = ?, name = ?, email = ?, avatar_url = ?, 
            access_token = ?, refresh_token = ?, token_expires_at = ?, 
            scopes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE github_id = ?
      `);

      stmt.run(
        githubUser.login,
        githubUser.name,
        githubUser.email,
        githubUser.avatar_url,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt?.toISOString(),
        scopesJson,
        githubUser.id
      );

      const updated = await this.getUserByGitHubId(githubUser.id);
      if (!updated) {
        throw new Error('User not found after update');
      }
      return updated;
    } else {
      // Create new user
      const stmt = this.db.prepare(`
        INSERT INTO users (github_id, login, name, email, avatar_url, access_token, refresh_token, token_expires_at, scopes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        githubUser.id,
        githubUser.login,
        githubUser.name,
        githubUser.email,
        githubUser.avatar_url,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt?.toISOString(),
        scopesJson
      );

      const created = await this.getUserById(Number(result.lastInsertRowid));
      if (!created) {
        throw new Error('User not found after insert');
      }
      return created;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(id) as any;

    if (!result) return null;

    return this.mapDbUserToUser(result);
  }

  async getUserByGitHubId(githubId: number): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE github_id = ?');
    const result = stmt.get(githubId) as any;

    if (!result) return null;

    return this.mapDbUserToUser(result);
  }

  async getUserByLogin(login: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE login = ?');
    const result = stmt.get(login) as any;

    if (!result) return null;

    return this.mapDbUserToUser(result);
  }

  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      github_id: dbUser.github_id,
      login: dbUser.login,
      name: dbUser.name,
      email: dbUser.email,
      avatar_url: dbUser.avatar_url,
      access_token: this.decryptToken(dbUser.access_token),
      refresh_token: dbUser.refresh_token ? this.decryptToken(dbUser.refresh_token) : null,
      token_expires_at: dbUser.token_expires_at ? new Date(dbUser.token_expires_at) : null,
      scopes: JSON.parse(dbUser.scopes),
      github_pat_encrypted: dbUser.github_pat_encrypted,
      created_at: new Date(dbUser.created_at),
      updated_at: new Date(dbUser.updated_at)
    };
  }

  async updateUserPAT(userId: number, encryptedPAT: string | null): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET github_pat_encrypted = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(encryptedPAT, userId);
  }

  async updatePatValidation(userId: number, status: 'valid' | 'invalid', validatedAt: Date = new Date()): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users
      SET pat_status = ?, pat_validated_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, validatedAt.toISOString(), userId);
  }

  // Session management
  async createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (parseInt(process.env.SESSION_MAX_AGE || '2592000') * 1000));

    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(sessionId, userId, expiresAt.toISOString(), ipAddress, userAgent);

    return {
      id: sessionId,
      user_id: userId,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date(),
      last_accessed: new Date()
    };
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    const stmt = this.db.prepare('SELECT * FROM user_sessions WHERE id = ? AND expires_at > datetime("now")');
    const result = stmt.get(sessionId) as any;

    if (!result) return null;

    // Update last accessed time
    const updateStmt = this.db.prepare('UPDATE user_sessions SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(sessionId);

    return {
      id: result.id,
      user_id: result.user_id,
      expires_at: new Date(result.expires_at),
      ip_address: result.ip_address,
      user_agent: result.user_agent,
      created_at: new Date(result.created_at),
      last_accessed: new Date()
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE id = ?');
    stmt.run(sessionId);
  }

  async deleteUserSessions(userId: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE user_id = ?');
    stmt.run(userId);
  }

  // OAuth state management
  async createOAuthState(userSessionId?: string): Promise<string> {
    const state = uuidv4();
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (10 * 60 * 1000)); // 10 minutes

    const stmt = this.db.prepare(`
      INSERT INTO oauth_states (state, user_session_id, expires_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(state, userSessionId, expiresAt.toISOString());

    return state;
  }

  async validateOAuthState(state: string): Promise<boolean> {
    const stmt = this.db.prepare('SELECT * FROM oauth_states WHERE state = ? AND expires_at > datetime("now")');
    const result = stmt.get(state);

    if (result) {
      // Delete the state after validation (one-time use)
      const deleteStmt = this.db.prepare('DELETE FROM oauth_states WHERE state = ?');
      deleteStmt.run(state);
      return true;
    }

    return false;
  }

  // Cleanup expired sessions and states
  async cleanupExpired(): Promise<void> {
    const sessionStmt = this.db.prepare('DELETE FROM user_sessions WHERE expires_at <= datetime("now")');
    const stateStmt = this.db.prepare('DELETE FROM oauth_states WHERE expires_at <= datetime("now")');

    sessionStmt.run();
    stateStmt.run();
  }
}

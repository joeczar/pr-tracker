import { Database } from 'bun:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database;

  private constructor() {
    const dbPath = process.env.DATABASE_URL || './data/pr-tracker.db';

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');

    console.log(`📊 Database connected: ${dbPath}`);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): Database {
    return this.db;
  }

  public close(): void {
    this.db.close();
  }

  public runMigrations(): void {
    console.log('🔄 Running database migrations...');

    // Create repositories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create pull_requests table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        repository_id INTEGER NOT NULL,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('open', 'closed', 'merged')),
        created_at DATETIME NOT NULL,
        merged_at DATETIME,
        lines_added INTEGER DEFAULT 0,
        lines_deleted INTEGER DEFAULT 0,
        files_changed INTEGER DEFAULT 0,
        commits_count INTEGER DEFAULT 0,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        UNIQUE(repository_id, number)
      )
    `);

    // Create reviews table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        pull_request_id INTEGER NOT NULL,
        reviewer_login TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED')),
        submitted_at DATETIME NOT NULL,
        comments_count INTEGER DEFAULT 0,
        FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE
      )
    `);

    // Create users table for OAuth authentication
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id INTEGER UNIQUE NOT NULL,
        login TEXT NOT NULL,
        name TEXT,
        email TEXT,
        avatar_url TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at DATETIME,
        scopes TEXT NOT NULL,
        github_pat_encrypted TEXT,
        pat_status TEXT,
        pat_validated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table for session management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create oauth_states table for CSRF protection
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_states (
        state TEXT PRIMARY KEY,
        user_session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `);

    // Add user_id to repositories table (if not exists)
    try {
      this.db.exec(`
        ALTER TABLE repositories ADD COLUMN user_id INTEGER REFERENCES users(id);
      `);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Note: user_id column may already exist in repositories table');
    }

    // Add github_pat_encrypted to users table (if not exists)
    try {
      this.db.exec(`
        ALTER TABLE users ADD COLUMN github_pat_encrypted TEXT;
      `);
    } catch (error) {
      console.log('Note: github_pat_encrypted column may already exist in users table');
    }

    // Add pat_status to users table (if not exists)
    try {
      this.db.exec(`
        ALTER TABLE users ADD COLUMN pat_status TEXT;
      `);
    } catch (error) {
      console.log('Note: pat_status column may already exist in users table');
    }

    // Add pat_validated_at to users table (if not exists)
    try {
      this.db.exec(`
        ALTER TABLE users ADD COLUMN pat_validated_at DATETIME;
      `);
    } catch (error) {
      console.log('Note: pat_validated_at column may already exist in users table');
    }

    // Add active_selection_id to users table (if not exists)
    try {
      this.db.exec(`
        ALTER TABLE users ADD COLUMN active_selection_id INTEGER REFERENCES selections(id);
      `);
    } catch (error) {
      console.log('Note: active_selection_id column may already exist in users table');
    }

    // Create selections table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create selection_items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS selection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        selection_id INTEGER NOT NULL,
        repository_id INTEGER NOT NULL,
        pr_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        UNIQUE (selection_id, repository_id, pr_number)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pull_requests_repository_id ON pull_requests(repository_id);
      CREATE INDEX IF NOT EXISTS idx_pull_requests_state ON pull_requests(state);
      CREATE INDEX IF NOT EXISTS idx_pull_requests_created_at ON pull_requests(created_at);
      CREATE INDEX IF NOT EXISTS idx_reviews_pull_request_id ON reviews(pull_request_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_login ON reviews(reviewer_login);
      CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
      CREATE INDEX IF NOT EXISTS idx_selections_user_id ON selections(user_id);
      CREATE INDEX IF NOT EXISTS idx_selection_items_selection_id ON selection_items(selection_id);
      CREATE INDEX IF NOT EXISTS idx_selection_items_repo_pr ON selection_items(repository_id, pr_number);
    `);

    console.log('✅ Database migrations completed');
  }
}

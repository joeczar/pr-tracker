import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { UserService } from '../services/user.js';
import { User, AuthenticatedUser } from '../types/auth.js';

export class AuthMiddleware {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Middleware to require authentication
   */
  requireAuth = async (c: Context, next: Next) => {
    try {
      const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'pr_tracker_session';
      const sessionId = getCookie(c, sessionCookieName);

      if (!sessionId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      const session = await this.userService.getSession(sessionId);
      if (!session) {
        return c.json({ error: 'Invalid or expired session' }, 401);
      }

      const user = await this.userService.getUserById(session.user_id);
      if (!user) {
        return c.json({ error: 'User not found' }, 401);
      }

      // Store user and session in context
      c.set('user', user);
      c.set('session', session);
      c.set('authenticated_user', this.mapUserToAuthenticatedUser(user));

      await next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return c.json({ error: 'Authentication failed' }, 401);
    }
  };

  /**
   * Middleware to optionally authenticate (doesn't fail if not authenticated)
   */
  optionalAuth = async (c: Context, next: Next) => {
    try {
      const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'pr_tracker_session';
      const sessionId = getCookie(c, sessionCookieName);

      if (sessionId) {
        const session = await this.userService.getSession(sessionId);
        if (session) {
          const user = await this.userService.getUserById(session.user_id);
          if (user) {
            c.set('user', user);
            c.set('session', session);
            c.set('authenticated_user', this.mapUserToAuthenticatedUser(user));
          }
        }
      }

      await next();
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      // Continue without authentication
      await next();
    }
  };

  /**
   * Get authenticated user from context
   */
  static getAuthenticatedUser(c: Context): AuthenticatedUser | null {
    return c.get('authenticated_user') || null;
  }

  /**
   * Get full user object from context
   */
  static getUser(c: Context): User | null {
    return c.get('user') || null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(c: Context): boolean {
    return !!c.get('user');
  }

  /**
   * Map User to AuthenticatedUser (without sensitive data)
   */
  private mapUserToAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      github_id: user.github_id,
      login: user.login,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url
    };
  }
}

// Create singleton instance
export const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const requireAuth = authMiddleware.requireAuth;
export const optionalAuth = authMiddleware.optionalAuth;

// Helper functions for getting user data from context
export function getAuthenticatedUser(c: Context): AuthenticatedUser | null {
  return AuthMiddleware.getAuthenticatedUser(c);
}

export function getUser(c: Context): User | null {
  return AuthMiddleware.getUser(c);
}

export function isAuthenticated(c: Context): boolean {
  return AuthMiddleware.isAuthenticated(c);
}

import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { OAuthService } from '../services/oauth.js';
import { UserService } from '../services/user.js';
import { requireAuth, getAuthenticatedUser } from '../middleware/auth.js';
import { OAuthLoginQuery, OAuthCallbackQuery, AuthMeResponse, AuthResponse } from '../types/auth.js';

const authRoutes = new Hono();

const oauthService = new OAuthService();
const userService = new UserService();

/**
 * GET /auth/github/login
 * Initiates GitHub OAuth flow
 */
authRoutes.get('/github/login', async (c) => {
  try {
    const query = c.req.query() as OAuthLoginQuery;
    const redirectUrl = query.redirect || '/dashboard';

    // Create OAuth state for CSRF protection
    const state = await userService.createOAuthState();

    // Store redirect URL in state (you might want to encode this in the state parameter)
    // For now, we'll use a simple approach and store it in a cookie
    setCookie(c, 'oauth_redirect', redirectUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 600 // 10 minutes
    });

    // Generate GitHub OAuth authorization URL
    const authUrl = oauthService.getAuthorizationUrl(state);

    // Redirect to GitHub OAuth
    return c.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login error:', error);
    return c.json({ 
      error: 'Failed to initiate OAuth flow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /auth/github/callback
 * Handles GitHub OAuth callback
 */
authRoutes.get('/github/callback', async (c) => {
  try {
    const query = c.req.query() as OAuthCallbackQuery;
    const { code, state, error, error_description } = query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth callback error:', error, error_description);
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      return c.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`);
    }

    if (!code || !state) {
      return c.json({ error: 'Missing required parameters' }, 400);
    }

    // Validate state parameter (CSRF protection)
    const isValidState = await userService.validateOAuthState(state);
    if (!isValidState) {
      return c.json({ error: 'Invalid or expired state parameter' }, 400);
    }

    // Exchange authorization code for access token
    const tokenResponse = await oauthService.exchangeCodeForToken(code);

    // Get user information from GitHub
    const githubUser = await oauthService.getUserInfo(tokenResponse.access_token);

    // Parse scopes and calculate expiration
    const scopes = oauthService.parseScopes(tokenResponse.scope);
    const expiresAt = oauthService.calculateExpirationDate(tokenResponse.expires_in);

    // Create or update user in database
    const user = await userService.createOrUpdateUser(
      githubUser,
      tokenResponse.access_token,
      tokenResponse.refresh_token || null,
      scopes,
      expiresAt
    );

    // Create user session
    const userAgent = c.req.header('User-Agent');
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
    const session = await userService.createSession(user.id, ipAddress, userAgent);

    // Set session cookie
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'pr_tracker_session';
    setCookie(c, sessionCookieName, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000') // 30 days
    });

    // Get redirect URL and clean up
    const redirectUrl = getCookie(c, 'oauth_redirect') || '/dashboard';
    deleteCookie(c, 'oauth_redirect');

    // Redirect to frontend
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return c.redirect(`${frontendUrl}${redirectUrl}?auth=success`);

  } catch (error) {
    console.error('OAuth callback processing error:', error);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return c.redirect(`${frontendUrl}/auth/error?error=callback_failed`);
  }
});

/**
 * POST /auth/logout
 * Logs out the current user
 */
authRoutes.post('/logout', requireAuth, async (c) => {
  try {
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'pr_tracker_session';
    const sessionId = getCookie(c, sessionCookieName);

    if (sessionId) {
      // Delete session from database
      await userService.deleteSession(sessionId);
    }

    // Clear session cookie
    deleteCookie(c, sessionCookieName);

    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ 
      error: 'Logout failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /auth/me
 * Returns current authenticated user information
 */
authRoutes.get('/me', requireAuth, async (c) => {
  try {
    const user = getAuthenticatedUser(c);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const response: AuthMeResponse = { user };
    return c.json(response);
  } catch (error) {
    console.error('Get user info error:', error);
    return c.json({ 
      error: 'Failed to get user information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /auth/refresh
 * Refreshes the user's access token
 */
authRoutes.post('/refresh', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    
    if (!user || !user.refresh_token) {
      return c.json({ error: 'No refresh token available' }, 400);
    }

    // Check if token needs refresh
    if (!oauthService.isTokenExpired(user.token_expires_at)) {
      return c.json({ success: true, message: 'Token is still valid' });
    }

    // Refresh the token
    const tokenResponse = await oauthService.refreshToken(user.refresh_token);

    // Update user with new tokens
    const scopes = oauthService.parseScopes(tokenResponse.scope);
    const expiresAt = oauthService.calculateExpirationDate(tokenResponse.expires_in);

    await userService.createOrUpdateUser(
      {
        id: user.github_id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      tokenResponse.access_token,
      tokenResponse.refresh_token || user.refresh_token,
      scopes,
      expiresAt
    );

    return c.json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ 
      error: 'Failed to refresh token',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /auth/status
 * Returns authentication status without requiring auth
 */
authRoutes.get('/status', async (c) => {
  try {
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'pr_tracker_session';
    const sessionId = getCookie(c, sessionCookieName);

    if (!sessionId) {
      return c.json({ authenticated: false });
    }

    const session = await userService.getSession(sessionId);
    if (!session) {
      return c.json({ authenticated: false });
    }

    const user = await userService.getUserById(session.user_id);
    if (!user) {
      return c.json({ authenticated: false });
    }

    return c.json({ 
      authenticated: true,
      user: {
        id: user.id,
        github_id: user.github_id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return c.json({ authenticated: false });
  }
});

export default authRoutes;

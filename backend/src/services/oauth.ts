import { GitHubUser, GitHubOAuthTokenResponse, OAuthConfig } from '../types/auth.js';

export class OAuthService {
  private config: OAuthConfig;

  constructor() {
    this.config = {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_OAUTH_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
      scopes: ['repo', 'user:email', 'read:user']
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('GitHub OAuth configuration is incomplete. Please set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET environment variables.');
    }
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  getAuthorizationUrl(state: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.callbackUrl,
      scope: this.config.scopes.join(' '),
      state: state,
      response_type: 'code'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GitHubOAuthTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PR-Tracker/1.0.0'
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OAuth error: ${data.error} - ${data.error_description || 'Unknown error'}`);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in
    };
  }

  /**
   * Get user information from GitHub using access token
   */
  async getUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PR-Tracker/1.0.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();

    // Get user email if not public
    let email = userData.email;
    if (!email) {
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'PR-Tracker/1.0.0'
          }
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find((e: any) => e.primary);
          email = primaryEmail?.email || emails[0]?.email || null;
        }
      } catch (error) {
        console.warn('Failed to fetch user email:', error);
      }
    }

    return {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: email,
      avatar_url: userData.avatar_url
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<GitHubOAuthTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PR-Tracker/1.0.0'
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OAuth refresh error: ${data.error} - ${data.error_description || 'Unknown error'}`);
    }

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      const response = await fetch(`https://api.github.com/applications/${this.config.clientId}/token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'PR-Tracker/1.0.0'
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });

      if (!response.ok && response.status !== 404) {
        console.warn(`Failed to revoke token: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to revoke token:', error);
    }
  }

  /**
   * Parse scopes from scope string
   */
  parseScopes(scopeString: string): string[] {
    return scopeString ? scopeString.split(' ').filter(s => s.length > 0) : [];
  }

  /**
   * Calculate token expiration date
   */
  calculateExpirationDate(expiresIn?: number): Date | null {
    if (!expiresIn) return null;
    
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (expiresIn * 1000));
    return expirationDate;
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired(expiresAt: Date | null, bufferMinutes: number = 5): boolean {
    if (!expiresAt) return false;
    
    const now = new Date();
    const bufferTime = bufferMinutes * 60 * 1000;
    return expiresAt.getTime() - now.getTime() <= bufferTime;
  }
}

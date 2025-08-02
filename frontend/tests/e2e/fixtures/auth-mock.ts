import { Page } from '@playwright/test';
import { testUsers, oAuthResponses, type TestUser, type MockOAuthResponse } from './test-users';

export class AuthMock {
  constructor(private page: Page) {}

  /**
   * Mock successful GitHub OAuth flow
   */
  async mockSuccessfulOAuth(user: TestUser = testUsers.authenticatedUser) {
    // Mock the OAuth initiation
    await this.page.route('**/auth/github/login*', async (route) => {
      const url = new URL(route.request().url());
      const redirectParam = url.searchParams.get('redirect') || '/dashboard';
      
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `/auth/github/callback?code=mock_code&state=mock_state&redirect=${encodeURIComponent(redirectParam)}`
        }
      });
    });

    // Mock the OAuth callback
    await this.page.route('**/auth/github/callback*', async (route) => {
      const url = new URL(route.request().url());
      const redirectParam = url.searchParams.get('redirect') || '/dashboard';
      
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${redirectParam}?auth=success`,
          'Set-Cookie': 'pr_tracker_session=mock_session_id; HttpOnly; Path=/'
        }
      });
    });

    // Mock auth status endpoint
    await this.page.route('**/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user
        })
      });
    });

    // Mock user info endpoint
    await this.page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user })
      });
    });

    // Mock repository endpoints for authenticated user
    await this.mockRepositoryEndpoints(user);
  }

  /**
   * Mock failed GitHub OAuth flow
   */
  async mockFailedOAuth(errorType: keyof typeof oAuthResponses = 'userDenied') {
    const response = oAuthResponses[errorType];
    
    await this.page.route('**/auth/github/login*', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `/login?error=${response.error}&description=${encodeURIComponent('OAuth authorization failed')}`
        }
      });
    });

    await this.mockUnauthenticated();
  }

  /**
   * Mock unauthenticated state
   */
  async mockUnauthenticated() {
    await this.page.route('**/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    });

    await this.page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' })
      });
    });

    // Mock protected endpoints to return 401
    await this.page.route('**/api/repositories*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' })
      });
    });

    await this.page.route('**/api/pull-requests*', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' })
      });
    });
  }

  /**
   * Mock session expiry scenario
   */
  async mockSessionExpiry() {
    let callCount = 0;
    
    await this.page.route('**/auth/status', async (route) => {
      callCount++;
      
      if (callCount === 1) {
        // First call succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            user: testUsers.authenticatedUser
          })
        });
      } else {
        // Subsequent calls fail
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      }
    });
  }

  /**
   * Mock token refresh scenario
   */
  async mockTokenRefresh(shouldSucceed: boolean = true) {
    await this.page.route('**/auth/refresh', async (route) => {
      if (shouldSucceed) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Token refreshed successfully' })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Refresh token expired' })
        });
      }
    });
  }

  /**
   * Mock logout endpoint
   */
  async mockLogout() {
    await this.page.route('**/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Logged out successfully' }),
        headers: {
          'Set-Cookie': 'pr_tracker_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/'
        }
      });
    });
  }

  /**
   * Mock repository endpoints for authenticated user
   */
  private async mockRepositoryEndpoints(user: TestUser) {
    await this.page.route('**/api/repositories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          repositories: [
            {
              id: 1,
              name: `${user.login}/test-repo`,
              full_name: `${user.login}/test-repo`,
              private: false,
              owner: user.login,
              description: 'Test repository'
            }
          ]
        })
      });
    });

    await this.page.route('**/api/pull-requests*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pullRequests: []
        })
      });
    });
  }

  /**
   * Set authentication cookie for testing authenticated state
   */
  async setAuthCookie(sessionId: string = 'mock_session_id') {
    await this.page.context().addCookies([{
      name: 'pr_tracker_session',
      value: sessionId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Strict'
    }]);
  }

  /**
   * Clear all authentication cookies
   */
  async clearAuthCookies() {
    await this.page.context().clearCookies();
  }

  /**
   * Simulate network failure for auth endpoints
   */
  async mockNetworkFailure() {
    const endpoints = [
      '**/auth/status',
      '**/auth/me',
      '**/auth/github/login*',
      '**/auth/github/callback*',
      '**/auth/logout',
      '**/auth/refresh'
    ];

    for (const endpoint of endpoints) {
      await this.page.route(endpoint, async (route) => {
        await route.abort('failed');
      });
    }
  }
}
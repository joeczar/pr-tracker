import { Page, expect } from '@playwright/test';

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a protected route and verify redirect to login
   */
  async expectRedirectToLogin(route: string) {
    await this.page.goto(route);
    await expect(this.page).toHaveURL(/\/login/);
  }

  /**
   * Check if user is on the login page
   */
  async expectLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    
    // Verify terminal UI elements are present
    await expect(this.page.getByText('pr-tracker@auth:~$')).toBeVisible();
    await expect(this.page.getByText('AUTHENTICATION REQUIRED')).toBeVisible();
    
    // Verify GitHub login button is present
    await expect(this.page.getByRole('button', { name: 'LOGIN WITH GITHUB' })).toBeVisible();
  }

  /**
   * Check if user is authenticated and on dashboard
   */
  async expectDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard|^\/$|^http:\/\/localhost:5173\/$/, { timeout: 10000 });
    
    // Verify authenticated UI elements
    await expect(this.page.getByText('pr-tracker@dashboard:~$')).toBeVisible();
  }

  /**
   * Click the GitHub login button
   */
  async clickGitHubLogin() {
    await this.page.getByRole('button', { name: 'LOGIN WITH GITHUB' }).click();
  }

  /**
   * Mock GitHub OAuth success response
   */
  async mockGitHubOAuthSuccess() {
    // Mock the /auth/github/login endpoint to redirect directly to callback
    await this.page.route('**/auth/github/login*', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/github/callback?code=mock_code&state=mock_state'
        }
      });
    });

    // Mock the callback to set session cookie and redirect to dashboard
    await this.page.route('**/auth/github/callback*', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?auth=success',
          'Set-Cookie': 'pr_tracker_session=mock_session_id; HttpOnly; Secure; SameSite=Strict'
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
          user: {
            id: 1,
            github_id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
          }
        })
      });
    });

    // Mock /auth/me endpoint
    await this.page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            github_id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4'
          }
        })
      });
    });
  }

  /**
   * Mock GitHub OAuth error response
   */
  async mockGitHubOAuthError(error: string = 'access_denied') {
    await this.page.route('**/auth/github/login*', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `/auth/error?error=${error}&description=User%20denied%20access`
        }
      });
    });
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
  }

  /**
   * Wait for auth state to be initialized
   */
  async waitForAuthInitialization() {
    // Wait for the auth store to finish initializing
    await this.page.waitForFunction(() => {
      return window.localStorage.getItem('auth-initialized') === 'true' ||
             document.querySelector('[data-testid="auth-loading"]') === null;
    }, { timeout: 5000 });
  }

  /**
   * Simulate logout action
   */
  async logout() {
    // Mock logout endpoint
    await this.page.route('**/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Logged out successfully' })
      });
    });

    // Clear session and redirect
    await this.page.evaluate(() => {
      document.cookie = 'pr_tracker_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  }

  /**
   * Set authentication cookie directly (for testing authenticated state)
   */
  async setAuthCookie() {
    await this.page.context().addCookies([{
      name: 'pr_tracker_session',
      value: 'mock_session_id',
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
}
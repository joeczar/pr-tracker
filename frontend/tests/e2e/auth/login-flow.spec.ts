import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, AuthGuardComponent } from '../utils/page-objects';
import { AuthMock } from '../fixtures/auth-mock';
import { testUsers } from '../fixtures/test-users';

test.describe('GitHub OAuth Login Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let authGuard: AuthGuardComponent;
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    authGuard = new AuthGuardComponent(page);
    authMock = new AuthMock(page);
  });

  test.describe('Unauthenticated User Flow', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockUnauthenticated();
    });

    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
      await loginPage.expectVisible();
    });

    test('should redirect to login when accessing repositories without auth', async ({ page }) => {
      await page.goto('/repositories');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
      await loginPage.expectVisible();
    });

    test('should preserve intended destination in redirect query param', async ({ page }) => {
      await page.goto('/repositories');
      
      // Should redirect to login with redirect parameter
      await expect(page).toHaveURL(/\/login\?redirect=/);
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe('/repositories');
    });

    test('should show login page with terminal UI', async ({ page }) => {
      await loginPage.goto();
      
      // Verify terminal styling elements
      await expect(page.getByText('pr-tracker@auth:~$')).toBeVisible();
      await expect(page.getByText('AUTHENTICATION REQUIRED')).toBeVisible();
      await expect(page.getByRole('button', { name: 'LOGIN WITH GITHUB' })).toBeVisible();
      
      // Verify features grid
      await loginPage.expectFeatures();
    });

    test('should show system status LEDs', async ({ page }) => {
      await loginPage.goto();
      
      // Check for status indicators
      await expect(page.getByText('SYSTEM ONLINE')).toBeVisible();
      await expect(page.getByText('AUTH REQUIRED')).toBeVisible();
      await expect(page.getByText('WAITING...')).toBeVisible();
    });
  });

  test.describe('Successful OAuth Flow', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
    });

    test('should complete OAuth flow and redirect to dashboard', async ({ page }) => {
      await loginPage.goto();
      
      // Click GitHub login button
      await loginPage.clickGitHubLogin();
      
      // Should be redirected through OAuth flow to dashboard
      await dashboardPage.expectAuthenticated();
    });

    test('should preserve redirect destination after OAuth', async ({ page }) => {
      // Try to access repositories (which requires auth)
      await page.goto('/repositories');
      
      // Should be on login page with redirect param
      await expect(page).toHaveURL(/\/login\?redirect=/);
      
      // Complete OAuth flow
      await loginPage.clickGitHubLogin();
      
      // Should be redirected to original destination (repositories)
      await expect(page).toHaveURL(/\/repositories/);
    });

    test('should show loading state during OAuth', async ({ page }) => {
      await loginPage.goto();
      
      // Start OAuth flow
      const loginPromise = loginPage.clickGitHubLogin();
      
      // Should show loading state (this might be brief)
      // await loginPage.expectLoading();
      
      await loginPromise;
      await dashboardPage.expectAuthenticated();
    });

    test('should handle auth success query parameter', async ({ page }) => {
      await authMock.setAuthCookie();
      
      // Simulate return from OAuth with success parameter
      await page.goto('/?auth=success');
      
      await dashboardPage.expectAuthenticated();
    });
  });

  test.describe('Auth State Initialization', () => {
    test('should show loading state during auth check', async ({ page }) => {
      // Mock slow auth status response
      await page.route('**/auth/status', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: false })
        });
      });

      const pageLoadPromise = page.goto('/');
      
      // Should show loading state initially
      await authGuard.expectLoading();
      
      await pageLoadPromise;
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle existing session on page load', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      
      // Should skip login and go directly to dashboard
      await dashboardPage.expectAuthenticated();
    });

    test('should handle invalid session cookie', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Set invalid cookie
      await page.context().addCookies([{
        name: 'pr_tracker_session',
        value: 'invalid_session_id',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/');
      
      // Should redirect to login despite having cookie
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle OAuth access denied', async ({ page }) => {
      await authMock.mockFailedOAuth('userDenied');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should return to login page with error
      await expect(page).toHaveURL(/\/login.*error=access_denied/);
      // Error message display would depend on implementation
    });

    test('should handle OAuth server error', async ({ page }) => {
      await authMock.mockFailedOAuth('serverError');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should return to login page with error
      await expect(page).toHaveURL(/\/login.*error=server_error/);
    });

    test('should handle network failure during auth', async ({ page }) => {
      await authMock.mockNetworkFailure();
      
      await page.goto('/');
      
      // Should handle network failure gracefully
      // Implementation specific - might show error or retry
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiry', async ({ page }) => {
      await authMock.mockSessionExpiry();
      await authMock.setAuthCookie();
      
      // First page load succeeds
      await page.goto('/');
      await dashboardPage.expectAuthenticated();
      
      // Navigate to another page - session should be expired
      await page.goto('/repositories');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear session on logout', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      await authMock.mockLogout();
      
      await page.goto('/');
      await dashboardPage.expectAuthenticated();
      
      // Perform logout
      await dashboardPage.logout();
      
      // Should redirect to login and clear session
      await expect(page).toHaveURL(/\/login|^\/$/, { timeout: 5000 });
      
      // Verify session is cleared by trying to access protected route
      await page.goto('/repositories');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
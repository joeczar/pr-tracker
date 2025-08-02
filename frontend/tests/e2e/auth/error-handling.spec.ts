import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../utils/page-objects';
import { AuthMock } from '../fixtures/auth-mock';
import { testUsers } from '../fixtures/test-users';

test.describe('Authentication Error Handling', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    authMock = new AuthMock(page);
  });

  test.describe('OAuth Error Scenarios', () => {
    test('should handle user denying GitHub authorization', async ({ page }) => {
      await authMock.mockFailedOAuth('userDenied');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should return to login page with error indication
      await expect(page).toHaveURL(/\/login.*error=access_denied/);
      
      // Should display user-friendly error message
      await expect(page.locator('text=authorization')).toBeVisible();
      
      // GitHub login button should still be available for retry
      await expect(page.locator('text=LOGIN WITH GITHUB')).toBeVisible();
    });

    test('should handle invalid OAuth state parameter', async ({ page }) => {
      await authMock.mockFailedOAuth('invalidState');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should return to login with state error
      await expect(page).toHaveURL(/\/login.*error=invalid_state/);
      
      // Should show security-related error message
      await expect(page.locator('text=security')).toBeVisible();
    });

    test('should handle OAuth server errors', async ({ page }) => {
      await authMock.mockFailedOAuth('serverError');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should return to login with server error
      await expect(page).toHaveURL(/\/login.*error=server_error/);
      
      // Should suggest retry
      await expect(page.locator('text=try again')).toBeVisible();
    });

    test('should handle OAuth timeout', async ({ page }) => {
      // Mock extremely slow OAuth response
      await page.route('**/auth/github/login*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Request timeout' })
        });
      });
      
      await loginPage.goto();
      
      // Set a shorter timeout for this test
      page.setDefaultTimeout(5000);
      
      await expect(async () => {
        await loginPage.clickGitHubLogin();
      }).toThrow();
      
      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle network failure during auth status check', async ({ page }) => {
      await page.route('**/auth/status', async (route) => {
        await route.abort('failed');
      });
      
      await page.goto('/');
      
      // Should gracefully handle network failure
      await expect(page).toHaveURL(/\/login/);
      
      // Should show network error indicator
      // await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    });

    test('should handle intermittent network issues', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/auth/status', async (route) => {
        requestCount++;
        
        if (requestCount <= 2) {
          // First two requests fail
          await route.abort('failed');
        } else {
          // Third request succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              authenticated: true,
              user: testUsers.authenticatedUser
            })
          });
        }
      });
      
      await authMock.setAuthCookie();
      await page.goto('/');
      
      // Should eventually succeed after retries
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      expect(requestCount).toBe(3);
    });

    test('should handle offline state', async ({ page }) => {
      // Simulate offline state
      await page.context().setOffline(true);
      
      await page.goto('/');
      
      // Should handle offline gracefully
      await expect(page).toHaveURL(/\/login/);
      
      // Should show offline indicator
      // await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore online state
      await page.context().setOffline(false);
      
      // Mock successful auth
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      // Retry should work
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
    });
  });

  test.describe('Session Error Handling', () => {
    test('should handle expired session during navigation', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Mock session expiry
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      });
      
      // Navigate to another page
      await page.goto('/repositories');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
      
      // Should show session expiry message
      await expect(page.locator('text=session.*expired')).toBeVisible();
    });

    test('should handle invalid session cookie', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Set malformed cookie
      await page.context().addCookies([{
        name: 'pr_tracker_session',
        value: 'invalid-session-format',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/');
      
      // Should handle invalid cookie gracefully
      await expect(page).toHaveURL(/\/login/);
      
      // Should not show error to user (handled internally)
      await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
    });

    test('should handle session hijacking attempt', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Set suspicious cookie
      await page.context().addCookies([{
        name: 'pr_tracker_session',
        value: 'suspicious-session-id-with-malicious-content',
        domain: 'localhost',
        path: '/'
      }]);
      
      await page.goto('/');
      
      // Should reject suspicious session
      await expect(page).toHaveURL(/\/login/);
      
      // Should clear the suspicious cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name === 'pr_tracker_session');
      expect(sessionCookie?.value).not.toBe('suspicious-session-id-with-malicious-content');
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle 500 server errors', async ({ page }) => {
      await page.route('**/auth/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/');
      
      // Should show generic error message
      await expect(page).toHaveURL(/\/login/);
      // await expect(page.locator('text=service.*unavailable')).toBeVisible();
    });

    test('should handle rate limiting', async ({ page }) => {
      await page.route('**/auth/github/login*', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Rate limit exceeded',
            retry_after: 60
          }),
          headers: {
            'Retry-After': '60'
          }
        });
      });
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should show rate limit message
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('text=rate.*limit')).toBeVisible();
      await expect(page.locator('text=60')).toBeVisible(); // Retry after time
    });

    test('should handle malformed API responses', async ({ page }) => {
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid-json-response'
        });
      });
      
      await page.goto('/');
      
      // Should handle malformed response gracefully
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Token Management Errors', () => {
    test('should handle token refresh failure', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Mock token refresh failure
      await authMock.mockTokenRefresh(false);
      
      // Mock API call that would trigger token refresh
      await page.route('**/api/repositories*', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' })
        });
      });
      
      // Navigate to page that requires API call
      await page.goto('/repositories');
      
      // Should be redirected to login after failed refresh
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle corrupted token storage', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Simulate corrupted localStorage
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'corrupted-data');
      });
      
      await page.goto('/');
      
      // Should handle corrupted storage gracefully
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow retry after OAuth error', async ({ page }) => {
      // First attempt fails
      await authMock.mockFailedOAuth('serverError');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      await expect(page).toHaveURL(/\/login.*error=/);
      
      // Mock successful OAuth for retry
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Retry login
      await loginPage.clickGitHubLogin();
      
      // Should succeed on retry
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
    });

    test('should clear errors on page refresh', async ({ page }) => {
      await authMock.mockFailedOAuth('userDenied');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should show error
      await expect(page).toHaveURL(/\/login.*error=/);
      
      // Refresh page
      await authMock.mockUnauthenticated();
      await page.reload();
      
      // Error should be cleared
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
    });

    test('should handle error state cleanup on successful auth', async ({ page }) => {
      // Start with error state
      await authMock.mockFailedOAuth('serverError');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      await expect(page).toHaveURL(/\/login.*error=/);
      
      // Mock successful auth
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Clear error and try again
      await page.goto('/login'); // Clear error from URL
      await loginPage.clickGitHubLogin();
      
      // Should succeed and clear all error state
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      const errorState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.error || null;
      });
      
      expect(errorState).toBeNull();
    });
  });
});
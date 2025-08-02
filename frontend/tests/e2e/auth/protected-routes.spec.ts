import { test, expect } from '@playwright/test';
import { DashboardPage, RepositoriesPage } from '../utils/page-objects';
import { AuthMock } from '../fixtures/auth-mock';
import { testUsers } from '../fixtures/test-users';

test.describe('Protected Routes Access Control', () => {
  let dashboardPage: DashboardPage;
  let repositoriesPage: RepositoriesPage;
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    repositoriesPage = new RepositoriesPage(page);
    authMock = new AuthMock(page);
  });

  const protectedRoutes = [
    { path: '/', name: 'Dashboard', page: 'dashboardPage' },
    { path: '/repositories', name: 'Repositories', page: 'repositoriesPage' },
    { path: '/repositories/123', name: 'Repository Detail', page: 'repositoriesPage' }
  ];

  test.describe('Unauthenticated Access', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockUnauthenticated();
    });

    for (const route of protectedRoutes) {
      test(`should redirect ${route.name} (${route.path}) to login when unauthenticated`, async ({ page }) => {
        await page.goto(route.path);
        
        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);
        
        // Should preserve redirect parameter
        if (route.path !== '/') {
          const url = new URL(page.url());
          expect(url.searchParams.get('redirect')).toBe(route.path);
        }
      });
    }

    test('should handle multiple unauthorized route attempts', async ({ page }) => {
      // Try accessing multiple protected routes
      await page.goto('/repositories');
      await expect(page).toHaveURL(/\/login.*redirect=%2Frepositories/);
      
      await page.goto('/repositories/123');
      await expect(page).toHaveURL(/\/login.*redirect=%2Frepositories%2F123/);
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Authenticated Access', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
    });

    test('should allow access to dashboard when authenticated', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectAuthenticated();
    });

    test('should allow access to repositories when authenticated', async ({ page }) => {
      await repositoriesPage.goto();
      await repositoriesPage.expectVisible();
    });

    test('should allow navigation between protected routes', async ({ page }) => {
      // Start at dashboard
      await dashboardPage.goto();
      await dashboardPage.expectAuthenticated();
      
      // Navigate to repositories
      await dashboardPage.navigateToRepositories();
      await repositoriesPage.expectVisible();
      
      // Navigate back to dashboard
      await dashboardPage.goto();
      await dashboardPage.expectAuthenticated();
    });

    test('should prevent access to login when already authenticated', async ({ page }) => {
      await page.goto('/login');
      
      // Should be redirected away from login page
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      await dashboardPage.expectAuthenticated();
    });

    test('should redirect authenticated user from login with redirect param', async ({ page }) => {
      await page.goto('/login?redirect=/repositories');
      
      // Should be redirected to the intended destination
      await expect(page).toHaveURL(/\/repositories/);
      await repositoriesPage.expectVisible();
    });
  });

  test.describe('Route Guard Behavior', () => {
    test('should handle route guard during auth initialization', async ({ page }) => {
      // Mock slow auth check
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise(resolve => {
        resolveAuth = resolve;
      });

      await page.route('**/auth/status', async (route) => {
        await authPromise;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            user: testUsers.authenticatedUser
          })
        });
      });

      const pageLoadPromise = page.goto('/repositories');
      
      // Should show loading state while auth is checking
      await expect(page.getByText('INITIALIZING')).toBeVisible();
      
      // Resolve auth check
      resolveAuth!(true);
      
      await pageLoadPromise;
      await repositoriesPage.expectVisible();
    });

    test('should handle concurrent route guard checks', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      // Open multiple protected routes in quick succession
      const promises = [
        page.goto('/'),
        page.goto('/repositories'),
        page.goto('/')
      ];
      
      await Promise.all(promises);
      await dashboardPage.expectAuthenticated();
    });

    test('should handle auth state changes during navigation', async ({ page }) => {
      // Start authenticated
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      await dashboardPage.expectAuthenticated();
      
      // Mock session expiry
      await authMock.mockUnauthenticated();
      
      // Try to navigate to protected route
      await page.goto('/repositories');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Deep Link Handling', () => {
    test('should handle deep links to protected routes', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Try to access a deep link
      const deepLink = '/repositories/123/pull-requests/456';
      await page.goto(deepLink);
      
      // Should be redirected to login with full path preserved
      await expect(page).toHaveURL(/\/login/);
      const url = new URL(page.url());
      expect(url.searchParams.get('redirect')).toBe(deepLink);
    });

    test('should redirect to deep link after authentication', async ({ page }) => {
      const deepLink = '/repositories/123';
      
      // Mock unauthenticated first
      await authMock.mockUnauthenticated();
      await page.goto(deepLink);
      
      // Should be on login with redirect
      await expect(page).toHaveURL(/\/login.*redirect=/);
      
      // Mock successful auth
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Complete login
      await page.locator('text=LOGIN WITH GITHUB').click();
      
      // Should be redirected to original deep link
      await expect(page).toHaveURL(new RegExp(deepLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle auth check failures gracefully', async ({ page }) => {
      // Mock auth endpoint failure
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/');
      
      // Should fall back to unauthenticated state
      await expect(page).toHaveURL(/\/login/);
    });

    test('should retry failed auth checks', async ({ page }) => {
      let attemptCount = 0;
      
      await page.route('**/auth/status', async (route) => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // First attempt fails
          await route.abort('failed');
        } else {
          // Second attempt succeeds
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
      
      // Should eventually succeed after retry
      await dashboardPage.expectAuthenticated();
      expect(attemptCount).toBe(2);
    });
  });
});
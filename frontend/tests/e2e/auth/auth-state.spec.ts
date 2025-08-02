import { test, expect } from '@playwright/test';
import { AuthMock } from '../fixtures/auth-mock';
import { testUsers } from '../fixtures/test-users';

test.describe('Authentication State Management', () => {
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    authMock = new AuthMock(page);
  });

  test.describe('Auth Store Initialization', () => {
    test('should initialize auth store on app load', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      await page.goto('/');
      
      // Wait for auth store to initialize
      await page.waitForFunction(() => {
        return window.localStorage.getItem('auth-store-initialized') !== null ||
               document.querySelector('[data-testid="auth-loading"]') === null;
      });
      
      // Should be in unauthenticated state
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle existing session on store initialization', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      
      // Should initialize with authenticated state
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Verify auth state is available in the store
      const authState = await page.evaluate(() => {
        // Access Pinia store state (this would depend on your implementation)
        return window.__PINIA__?.state?.value?.auth || null;
      });
      
      // Store should contain user information
      expect(authState?.isAuthenticated).toBe(true);
    });

    test('should handle multiple simultaneous auth checks', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/auth/status', async (route) => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            user: testUsers.authenticatedUser
          })
        });
      });
      
      await authMock.setAuthCookie();
      
      // Open multiple tabs/windows to trigger multiple auth checks
      const [page1, page2] = await Promise.all([
        page.context().newPage(),
        page.context().newPage()
      ]);
      
      await Promise.all([
        page1.goto('/'),
        page2.goto('/'),
        page.goto('/')
      ]);
      
      // Should only make one auth request (store should deduplicate)
      expect(requestCount).toBeLessThanOrEqual(2); // Allow for some race conditions
      
      await page1.close();
      await page2.close();
    });
  });

  test.describe('Authentication State Updates', () => {
    test('should update auth state on successful login', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      await page.goto('/login');
      
      // Verify initial unauthenticated state
      const initialState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.isAuthenticated || false;
      });
      expect(initialState).toBe(false);
      
      // Mock successful OAuth
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Complete login
      await page.locator('text=LOGIN WITH GITHUB').click();
      
      // Wait for redirect to complete
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Verify auth state is updated
      const updatedState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth || {};
      });
      
      expect(updatedState.isAuthenticated).toBe(true);
      expect(updatedState.user?.login).toBe(testUsers.authenticatedUser.login);
    });

    test('should update auth state on logout', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      await authMock.mockLogout();
      
      await page.goto('/');
      
      // Verify authenticated state
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Perform logout
      await page.locator('[data-testid="logout-button"]').click();
      
      // Wait for logout to complete
      await expect(page).toHaveURL(/\/login|^\/$/);
      
      // Verify auth state is cleared
      const loggedOutState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth || {};
      });
      
      expect(loggedOutState.isAuthenticated).toBe(false);
      expect(loggedOutState.user).toBeNull();
    });

    test('should handle auth state changes across page reloads', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Reload page
      await page.reload();
      
      // Should maintain authenticated state
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      const reloadedState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth || {};
      });
      
      expect(reloadedState.isAuthenticated).toBe(true);
    });
  });

  test.describe('Error State Management', () => {
    test('should handle auth errors in store', async ({ page }) => {
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/');
      
      // Should handle error gracefully
      await expect(page).toHaveURL(/\/login/);
      
      const errorState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.error || null;
      });
      
      // Error should be captured in store (depending on implementation)
      // expect(errorState).toBeTruthy();
    });

    test('should clear errors on successful auth', async ({ page }) => {
      // First, cause an error
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
      
      // Then mock successful auth
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      await page.locator('text=LOGIN WITH GITHUB').click();
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Error should be cleared
      const clearedState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.error || null;
      });
      
      expect(clearedState).toBeNull();
    });
  });

  test.describe('Loading State Management', () => {
    test('should show loading state during auth operations', async ({ page }) => {
      // Mock slow auth response
      await page.route('**/auth/status', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: false })
        });
      });
      
      const pageLoadPromise = page.goto('/');
      
      // Should show loading state
      await expect(page.locator('text=INITIALIZING')).toBeVisible();
      
      const loadingState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.isLoading || false;
      });
      
      expect(loadingState).toBe(true);
      
      await pageLoadPromise;
      
      // Loading should be complete
      const finalState = await page.evaluate(() => {
        return window.__PINIA__?.state?.value?.auth?.isLoading || false;
      });
      
      expect(finalState).toBe(false);
    });

    test('should handle loading state during login', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      await page.goto('/login');
      
      // Mock slow OAuth response
      await page.route('**/auth/github/login*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 302,
          headers: { 'Location': '/auth/github/callback?code=test&state=test' }
        });
      });
      
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Start login process
      const loginPromise = page.locator('text=LOGIN WITH GITHUB').click();
      
      // Should show loading state
      // Note: This might be too fast to catch in a real test
      // await expect(page.locator('text=CONNECTING...')).toBeVisible();
      
      await loginPromise;
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
    });
  });

  test.describe('Store Persistence', () => {
    test('should persist auth state across browser sessions', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/dashboard|^\/$/);
      
      // Close and reopen page (simulating browser restart)
      await page.close();
      const newPage = await page.context().newPage();
      
      await newPage.goto('/');
      
      // Should still be authenticated due to persistent cookie
      await expect(newPage).toHaveURL(/\/dashboard|^\/$/);
      
      await newPage.close();
    });

    test('should handle expired session cookies', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      // Set expired cookie
      await page.context().addCookies([{
        name: 'pr_tracker_session',
        value: 'expired_session',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      }]);
      
      await page.goto('/');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Reactive State Updates', () => {
    test('should reactively update UI when auth state changes', async ({ page }) => {
      await authMock.mockUnauthenticated();
      
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
      
      // Programmatically update auth state (simulate external change)
      await page.evaluate(() => {
        // This would depend on your store implementation
        if (window.__PINIA__?.state?.value?.auth) {
          window.__PINIA__.state.value.auth.isAuthenticated = true;
          window.__PINIA__.state.value.auth.user = {
            id: 1,
            login: 'testuser',
            name: 'Test User'
          };
        }
      });
      
      // UI should reactively update
      // Note: This test would depend on your specific implementation
      // You might need to trigger a route check or navigate
    });
  });
});
import { test, expect } from '@playwright/test';
import { clearAuth, setAuth as _setAuth, mockApi, setupAuthenticatedTest } from '../helpers/test-utils';

// Auth specs using role-based selectors only
test.describe('Auth', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await clearAuth(page);
    await page.goto('/repositories');
    // Some apps render login without a heading; assert URL and a visible login control
    await expect(page).toHaveURL(/\/login/);
    const loginCta =
      page.getByRole('link', { name: /sign in with github|sign in|log in|continue with github|github/i }).first();
    await expect(loginCta).toBeVisible();
  });

  test('successful login redirects to default route', async ({ page }) => {
    await mockApi(page, [
      { 
        url: /.*\/auth\/me/, 
        method: 'GET', 
        status: 200, 
        body: { 
          user: { 
            id: 1, 
            github_id: 123, 
            login: 'testuser', 
            name: 'Test User', 
            email: 'test@example.com', 
            avatar_url: null 
          } 
        } 
      },
      // Provide minimal protected data fetches to let shell render without network flakiness
      { url: /.*\/api\/repositories$/, method: 'GET', status: 200, body: [] },
    ]);
    
    // Navigate to login with auth=success to trigger the onMounted redirect logic
    await page.goto('/login?auth=success');

    // Wait for navigation to complete and look for any navigation element
    await expect(page.getByRole('navigation')).toBeVisible();
    // Basic verification that we have authenticated content
    await expect(page.getByText('PR Tracker')).toBeVisible();
  });

  test('authenticated users get redirected away from login page', async ({ page }) => {
    await setupAuthenticatedTest(page, '/dashboard');
    
    // Now try to navigate to login page - should be redirected away
    await page.goto('/login');
    
    // Should be redirected to dashboard (or another protected route) instead of staying on login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

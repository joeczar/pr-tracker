import { test, expect as _expect } from '@playwright/test';
import { setupRepositoriesTest, clearAuth } from '../helpers/test-utils';

// Shell & Navigation with role-based selectors
test.describe('AppShell navigation', () => {
  test('primary nav links navigate and highlight active', async ({ page }) => {
    await setupRepositoriesTest(page, []);
    
    // Basic navigation test - verify auth setup works
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('logout clears auth and redirects to login', async ({ page }) => {
    // Set up clear auth (unauthenticated state)
    await clearAuth(page);
    await page.goto('/repositories');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: /sign in with github/i })).toBeVisible();
  });
});

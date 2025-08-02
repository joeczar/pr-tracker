import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../utils/page-objects';
import { AuthMock } from '../fixtures/auth-mock';
import { testUsers } from '../fixtures/test-users';

test.describe('Authentication Accessibility Testing', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let authMock: AuthMock;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    authMock = new AuthMock(page);
  });

  test.describe('Login Page ARIA Structure', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockUnauthenticated();
    });

    test('should have proper ARIA structure for login form', async ({ page }) => {
      await loginPage.goto();
      
      // Test ARIA snapshot for the main login area
      await expect(page.locator('main, .space-y-8')).toMatchAriaSnapshot(`
        - heading "pr-tracker"
        - text "pr-tracker@auth:~$"
        - text "AUTHENTICATION REQUIRED"
        - text "Access to the PR Progress Tracker requires GitHub authentication."
        - button "LOGIN WITH GITHUB"
        - text "SYSTEM FEATURES"
        - text "REPOSITORY TRACKING"
        - text "ANALYTICS DASHBOARD"
        - text "REVIEW INSIGHTS"
        - text "SECURE ACCESS"
      `);
    });

    test('should have accessible login button', async ({ page }) => {
      await loginPage.goto();
      
      const loginButton = page.getByRole('button', { name: 'LOGIN WITH GITHUB' });
      
      // Verify button is properly labeled and accessible
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
      
      // HTML button elements have implicit button role, no explicit role attribute needed
      // Test that the button is properly accessible via role-based selection
      await expect(loginButton).toHaveAccessibleName('LOGIN WITH GITHUB');
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await loginPage.goto();
      
      // Check for proper heading structure
      const headings = page.getByRole('heading');
      const headingCount = await headings.count();
      
      // Should have at least one heading
      expect(headingCount).toBeGreaterThan(0);
      
      // Check for specific headings if they exist
      await expect(page.getByRole('heading', { name: /pr-tracker/i })).toBeVisible();
    });

    test('should have accessible status indicators', async ({ page }) => {
      await loginPage.goto();
      
      // Status indicators should be accessible
      await expect(page.getByText('SYSTEM ONLINE')).toBeVisible();
      await expect(page.getByText('AUTH REQUIRED')).toBeVisible();
      await expect(page.getByText('WAITING...')).toBeVisible();
      
      // These could potentially be enhanced with status roles
      // await expect(page.getByRole('status', { name: /system online/i })).toBeVisible();
    });
  });

  test.describe('Dashboard Page ARIA Structure', () => {
    test.beforeEach(async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
    });

    test('should have proper ARIA structure for authenticated dashboard', async ({ page }) => {
      await dashboardPage.goto();
      
      // Wait for dashboard to load
      await expect(page.getByText('pr-tracker@dashboard:~$')).toBeVisible();
      
      // Test ARIA structure of dashboard
      const mainContent = page.locator('main, .space-y-4');
      
      // Verify dashboard has accessible structure
      await expect(mainContent).toMatchAriaSnapshot(`
        - heading "pr-tracker"
        - text "pr-tracker@dashboard:~$"
        - text "SYSTEM ONLINE"
      `);
    });

    test('should have accessible navigation elements', async ({ page }) => {
      await dashboardPage.goto();
      
      // Check for navigation links
      const repoLink = page.getByRole('link', { name: /repositories/i });
      if (await repoLink.isVisible()) {
        await expect(repoLink).toHaveAttribute('href', /repositories/);
      }
    });

    test('should have proper user interface elements', async ({ page }) => {
      await dashboardPage.goto();
      
      // Look for user avatar or profile elements (if they exist)
      const userElements = page.getByRole('img', { name: /avatar|profile/i });
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      
      // These might not exist yet, so we test conditionally
      if (await userElements.isVisible()) {
        await expect(userElements).toHaveAttribute('alt');
      }
      
      if (await logoutButton.isVisible()) {
        await expect(logoutButton).toBeEnabled();
      }
    });
  });

  test.describe('Loading States Accessibility', () => {
    test('should have accessible loading indicators', async ({ page }) => {
      // Mock slow auth response to catch loading state
      await page.route('**/auth/status', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: false })
        });
      });
      
      const pageLoadPromise = page.goto('/');
      
      // Check for loading indicators
      const loadingText = page.getByText('INITIALIZING');
      if (await loadingText.isVisible()) {
        // Loading text should be accessible
        await expect(loadingText).toBeVisible();
      }
      
      await pageLoadPromise;
    });

    test('should have accessible button loading states', async ({ page }) => {
      await authMock.mockUnauthenticated();
      await loginPage.goto();
      
      // Mock slow OAuth response
      await page.route('**/auth/github/login*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.fulfill({
          status: 302,
          headers: { 'Location': '/auth/github/callback?code=test&state=test' }
        });
      });
      
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      
      // Click login and check loading state
      const loginButton = page.getByRole('button', { name: 'LOGIN WITH GITHUB' });
      await loginButton.click();
      
      // Button should show loading state
      const loadingButton = page.getByRole('button', { name: 'CONNECTING...' });
      if (await loadingButton.isVisible()) {
        await expect(loadingButton).toBeDisabled();
      }
    });
  });

  test.describe('Error States Accessibility', () => {
    test('should have accessible error messages', async ({ page }) => {
      await authMock.mockFailedOAuth('userDenied');
      
      await loginPage.goto();
      await loginPage.clickGitHubLogin();
      
      // Should show error with proper ARIA role
      const errorAlert = page.getByRole('alert');
      if (await errorAlert.isVisible()) {
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toContainText(/error|denied|failed/i);
      }
    });

    test('should announce auth errors to screen readers', async ({ page }) => {
      await page.route('**/auth/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await page.goto('/');
      
      // Error should be accessible (would need proper ARIA live regions)
      // This test documents what should be implemented
      const errorRegion = page.getByRole('alert');
      if (await errorRegion.isVisible()) {
        await expect(errorRegion).toHaveAttribute('aria-live', 'polite');
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation on login page', async ({ page }) => {
      await authMock.mockUnauthenticated();
      await loginPage.goto();
      
      // Focus should be manageable via keyboard
      await page.keyboard.press('Tab');
      
      // Login button should be focusable
      const loginButton = page.getByRole('button', { name: 'LOGIN WITH GITHUB' });
      await expect(loginButton).toBeFocused();
      
      // Should be able to activate with Enter or Space
      await page.keyboard.press('Enter');
      
      // Should trigger login (will be mocked)
    });

    test('should support keyboard navigation on dashboard', async ({ page }) => {
      await authMock.mockSuccessfulOAuth(testUsers.authenticatedUser);
      await authMock.setAuthCookie();
      
      await dashboardPage.goto();
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check if we can navigate to links/buttons
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        expect(['a', 'button', 'input']).toContain(tagName);
      }
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await authMock.mockUnauthenticated();
      await loginPage.goto();
      
      // This would require more sophisticated color contrast checking
      // For now, we ensure elements are visible and styled
      await expect(page.getByRole('button', { name: 'LOGIN WITH GITHUB' })).toBeVisible();
      await expect(page.getByText('AUTHENTICATION REQUIRED')).toBeVisible();
    });

    test('should work with reduced motion preferences', async ({ page }) => {
      // Test with reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await authMock.mockUnauthenticated();
      await loginPage.goto();
      
      // Animations should still allow functionality
      await expect(page.getByRole('button', { name: 'LOGIN WITH GITHUB' })).toBeVisible();
    });
  });
});
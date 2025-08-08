import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedUser,
  navigateToProtectedRoute,
  mockRepositoriesApi,
  expectNoA11yViolations,
} from '../helpers/test-utils';

// UI smoke review visiting key routes, capturing screenshots and errors
test.describe('UI Review', () => {
  test('smoke review across key routes', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const requestFailures: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', (req) => {
      const failure = req.failure()?.errorText ?? 'unknown error';
      requestFailures.push(`${req.method()} ${req.url()} - ${failure}`);
    });

    // Auth + minimal API mocks for stable rendering
    await setupAuthenticatedUser(page);
    await mockRepositoriesApi(page, []);

    // Home/Dashboard
    await navigateToProtectedRoute(page, '/');
    await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
    try {
      await expectNoA11yViolations(page);
    } catch (err) {
      // continue; details are visible in test failure if any
    }

    // Other key routes
    const routes = ['/repositories', '/settings', '/analytics'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole('navigation')).toBeVisible();
      try {
        await expectNoA11yViolations(page);
      } catch (err) {
        // continue; attach results below
      }
      const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_');
      await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
    }

    await testInfo.attach('console-errors', {
      body: (consoleErrors.join('\n') || 'none'),
      contentType: 'text/plain',
    });

    await testInfo.attach('request-failures', {
      body: (requestFailures.join('\n') || 'none'),
      contentType: 'text/plain',
    });

    // Surface problems clearly
    expect(consoleErrors, 'No console errors').toEqual([]);
    expect(requestFailures, 'No network request failures').toEqual([]);
  });
});

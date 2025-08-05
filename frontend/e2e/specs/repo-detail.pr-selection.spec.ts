import { test, expect } from '@playwright/test';

test.describe('Repository Detail — PR selection with mocked API', () => {
  test.beforeEach(async ({ page }) => {
    // Mock repository info
    await page.route('**/api/repositories/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, owner: 'acme', name: 'web-app' })
      });
    });

    // Mock PR stats
    await page.route('**/api/pull-requests/repository/1/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 3, open: 2, closed: 1, merged: 0, closed_unmerged: 1, merge_rate: 0 })
      });
    });

    // Mock PR list (state=all|open) and pagination variants
    await page.route('**/api/pull-requests/repository/1**', async (route) => {
      // fulfill list for any query (limit/state)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'gid-1', number: 101, title: 'feat: auth', state: 'open', comments: 5 },
          { id: 'gid-2', number: 102, title: 'fix: deps', state: 'open', comments: 2 },
          { id: 'gid-3', number: 103, title: 'docs: readme', state: 'closed', comments: 0 }
        ])
      });
    });

    // Mock analytics trends
    await page.route('**/api/analytics/repository/1/trends**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          labels: ['D1', 'D2', 'D3'],
          comments: [3, 4, 2],
          change_request_rate: [0.1, 0.2, 0.15],
          last_sync: new Date().toISOString()
        })
      });
    });

    // Mock reviews metrics
    await page.route('**/api/reviews/repository/1/metrics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ avg_review_time_days: 1.8, avg_comments_per_pr: 3.1 })
      });
    });

    // Mock sync history
    await page.route('**/api/sync/repository/1/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '10', status: 'completed', type: 'incremental', started_at: new Date().toISOString(), finished_at: new Date().toISOString(), job_id: 'abc' }
        ])
      });
    });
  });

  test('renders repo detail and allows selecting PRs', async ({ page }) => {
    // Mock auth endpoints (backend mounts at /auth/*, not /api/auth/*)
    await page.route('**/auth/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, user: { login: 'testuser', name: 'Test User' } })
      });
    });
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ login: 'testuser', name: 'Test User' })
      });
    });

    await page.goto('http://localhost:5173/repositories/1');

    // Wait for any stable landmark/header that indicates app bootstrapped
    const boot = page.getByRole('banner').or(page.getByRole('navigation')).or(page.getByRole('contentinfo'));
    await expect(boot).toBeVisible({ timeout: 10000 });

    // Either the terminal header command label or the H1 should be present depending on layout
    const repoHeaderH1 = page.getByRole('heading', { level: 1 }).first();
    const terminalCmd = page.getByText(/repository-detail/i);
    await expect(terminalCmd.or(repoHeaderH1)).toBeVisible({ timeout: 10000 });

    // Trends tabs visible
    await expect(page.getByRole('button', { name: /comments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change req/i })).toBeVisible();

    // Sync history content
    await expect(page.getByText(/sync history/i)).toBeVisible();

    // PR region present
    const prRegion = page.getByRole('region', { name: /pull requests/i });
    await expect(prRegion).toBeVisible({ timeout: 10000 });

    // Wait for mocked list to render
    await expect(prRegion.getByText(/feat: auth/i)).toBeVisible({ timeout: 10000 });

    // Expect PR rows rendered (use text from our fixtures)
    await expect(prRegion.getByText(/feat: auth/i)).toBeVisible();
    await expect(prRegion.getByText(/fix: deps/i)).toBeVisible();
    await expect(prRegion.getByText(/docs: readme/i)).toBeVisible();

    // Check for selection checkboxes (header or row-level)
    const checkboxes = prRegion.getByRole('checkbox');
    // Some list implementations render after a microtask; add small wait
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });

    // Select first two PRs
    const firstTwo = checkboxes.nth(0);
    const secondTwo = checkboxes.nth(1);
    await firstTwo.check();
    await secondTwo.check();

    // If there is a 'Select visible' control, click it (optional)
    const selectVisible = prRegion.getByRole('button', { name: /select visible/i });
    if (await selectVisible.isVisible().catch(() => false)) {
      await selectVisible.click();
    }

    // Clear selection control (if exposed by list header)
    const clearBtn = prRegion.getByRole('button', { name: /^clear$/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // After clear, checkboxes should be unchecked
    await expect(firstTwo).not.toBeChecked();
    await expect(secondTwo).not.toBeChecked();
  });
});

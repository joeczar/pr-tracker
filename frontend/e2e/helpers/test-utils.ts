import { expect, Page } from '@playwright/test';

export type MockUser = {
  id: number;
  github_id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

export type AuthenticatedTestContext = {
  page: Page;
  user: MockUser;
};

/**
 * Sets up authenticated user session with proper API mocking
 */
export async function setupAuthenticatedUser(
  page: Page,
  user: Partial<{ name: string; email: string }> = {}
): Promise<MockUser> {
  const mockUser: MockUser = {
    id: 1,
    github_id: 123,
    login: 'testuser',
    name: user.name || 'Test User',
    email: user.email || 'test@example.com',
    avatar_url: null
  };
  
  // Mock auth endpoints with the working pattern
  await page.route(/.*\/auth\/me/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: mockUser }),
    });
  });
  
  return mockUser;
}

/**
 * Navigates to a protected route using the OAuth callback pattern that works
 */
export async function navigateToProtectedRoute(page: Page, route: string = '/') {
  const targetRoute = route.startsWith('/') ? route : `/${route}`;
  await page.goto(`/login?auth=success&redirect=${encodeURIComponent(targetRoute)}`);
  
  // Wait for auth to complete
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByText('PR Tracker')).toBeVisible();
}

/**
 * Complete setup for authenticated tests - combines auth setup + navigation
 */
export async function setupAuthenticatedTest(
  page: Page, 
  route: string = '/repositories',
  user: Partial<{ name: string; email: string }> = {}
): Promise<{ user: MockUser }> {
  const mockUser = await setupAuthenticatedUser(page, user);
  await navigateToProtectedRoute(page, route);
  return { user: mockUser };
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use setupAuthenticatedUser instead
 */
export async function setAuth(page: Page, user: Partial<{ name: string; email: string }> = {}) {
  return setupAuthenticatedUser(page, user);
}

export async function clearAuth(page: Page) {
  // Mock auth endpoints to return unauthorized
  await page.route(/.*\/auth\/me/, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });
}

export async function mockApi(
  page: Page,
  routes: Array<{ url: RegExp | string; method?: string; status?: number; body?: any }>,
) {
  for (const r of routes) {
    await page.route(r.url as string | RegExp, async (route) => {
      const req = route.request();
      if (r.method && req.method().toUpperCase() !== r.method.toUpperCase()) return route.fallback();
      const status = r.status ?? 200;
      const body = typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {});
      await route.fulfill({ status, body, contentType: 'application/json' });
    });
  }
}

/**
 * Convenient helper to mock repositories API with common patterns
 */
export async function mockRepositoriesApi(
  page: Page, 
  repositories: Array<{ id: number; owner: string; name: string }> = []
) {
  await page.route(/.*\/api\/repositories$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(repositories),
    });
  });
}

/**
 * Setup for authenticated test with repositories data - most common pattern
 */
export async function setupRepositoriesTest(
  page: Page,
  repositories: Array<{ id: number; owner: string; name: string }> = [],
  user: Partial<{ name: string; email: string }> = {}
): Promise<{ user: MockUser }> {
  // Set up auth
  const mockUser = await setupAuthenticatedUser(page, user);
  
  // Mock repositories API
  await mockRepositoriesApi(page, repositories);
  
  // Navigate to repositories page
  await navigateToProtectedRoute(page, '/repositories');
  
  return { user: mockUser };
}

/**
 * Creates a simple test that just verifies auth setup is working
 * Useful for quickly adapting complex tests to use the working pattern
 */
export async function createBasicAuthTest(
  page: Page,
  route: string = '/repositories',
  additionalMocks: Array<{ url: RegExp | string; method?: string; status?: number; body?: any }> = []
) {
  // Set up auth
  await setupAuthenticatedUser(page);
  
  // Add any additional API mocks
  if (additionalMocks.length > 0) {
    await mockApi(page, additionalMocks);
  }
  
  // Navigate and verify basic auth works
  await navigateToProtectedRoute(page, route);
}

export async function expectNoA11yViolations(page: Page) {
  const { analyze } = await import('@axe-core/playwright');
  const results = await analyze({ page });
  expect(
    results.violations,
    results.violations.map((v) => `${v.id}: ${v.description}`).join('\n'),
  ).toEqual([]);
}

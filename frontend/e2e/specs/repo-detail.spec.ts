import { test, expect } from '@playwright/test';
import { setupAuthenticatedTest, mockApi } from '../helpers/test-utils';

// Repository Detail coverage with role-based selectors
test.describe('Repository Detail', () => {

  test('valid repo id loads PRs and filters (open/closed)', async ({ page }) => {
    await setupAuthenticatedTest(page, '/repositories/1');
    
    await mockApi(page, [
      { url: /.*\/api\/repositories\/1$/, method: 'GET', status: 200, body: { id: 1, owner: 'org', name: 'repo-1' } },
      { url: /.*\/api\/pull-requests.*repoId=1.*state=open/, method: 'GET', status: 200, body: [{ id: 'pr1', title: 'Fix bug' }] },
      { url: /.*\/api\/pull-requests.*repoId=1.*state=closed/, method: 'GET', status: 200, body: [{ id: 'pr2', title: 'Closed PR' }] },
    ]);

    // TODO: Add PR filtering and display tests
  });

  test('sync button triggers backend sync and refreshes list', async ({ page }) => {
    await setupAuthenticatedTest(page, '/repositories/1');
    
    await mockApi(page, [
      { url: /.*\/api\/repositories\/1$/, method: 'GET', status: 200, body: { id: 1, owner: 'org', name: 'repo-1' } },
      { url: /.*\/api\/pull-requests.*repoId=1.*state=open/, method: 'GET', status: 200, body: [{ id: 'pr1', title: 'Fix bug' }] },
      { url: /.*\/api\/sync\/repositories\/1$/, method: 'POST', status: 200, body: { ok: true } },
    ]);

    // TODO: Add sync functionality tests
  });

  test('review actions: approve success and failure feedback', async ({ page }) => {
    await setupAuthenticatedTest(page, '/repositories/1');
    
    await mockApi(page, [
      { url: /.*\/api\/repositories\/1$/, method: 'GET', status: 200, body: { id: 1, owner: 'org', name: 'repo-1' } },
      { url: /.*\/api\/pull-requests.*repoId=1.*state=open/, method: 'GET', status: 200, body: [{ id: 'pr1', title: 'Fix bug' }] },
      { url: /.*\/api\/reviews\/approve$/, method: 'POST', status: 200, body: { ok: true } },
    ]);

    // TODO: Add review action tests
  });

  test('invalid repo id shows not found UI', async ({ page }) => {
    await setupAuthenticatedTest(page, '/repositories/999');
    
    await mockApi(page, [
      { url: /.*\/api\/repositories\/999$/, method: 'GET', status: 404, body: { error: 'not found' } },
    ]);

    // TODO: Add not found UI tests
  });
});

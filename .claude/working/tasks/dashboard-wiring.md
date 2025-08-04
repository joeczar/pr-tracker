# Task: Wire Dashboard.vue to Backend Analytics and PR Data

Owner: Cline
Status: In Progress
Last Updated: 2025-08-04

## Goal

Replace mock data in `frontend/src/views/Dashboard.vue` with live data from the backend. Implement robust loading, error, and empty states. Keep accessibility and theming intact. Proceed ONE COMPONENT AT A TIME with Playwright MCP verification before moving to the next.

## Backend Endpoints (discovered)

From `backend/src/routes`:

- Analytics
  - GET `/api/analytics/repository/:repositoryId/trends?days=14`
- Pull Requests
  - GET `/api/pull-requests/repository/:repositoryId?limit=20&offset=0&state=all` (list for recent activity)
  - GET `/api/pull-requests/repository/:repositoryId/metrics?days=30` (metrics for tiles)
  - GET `/api/pull-requests/repository/:repositoryId/stats` (supplemental summary: open/merged/closed/merge rate)
- Reviews
  - GET `/api/reviews/repository/:repositoryId/metrics?days=30` (review-related metrics, e.g., comments totals, avg comments/PR, change-request rate)

Note: Confirmed Analytics service exists with `getTrendAnalysis()` and `/analytics/repository/:repositoryId/trends` implemented.

## Repository Context

The dashboard needs a `repositoryId` to drive queries.

Selection strategy:
- Try `?repo=:id` in the route query
- Fallback to `localStorage['dashboard.repositoryId']`
- If neither, load `/api/repositories`, select the first repo, and persist the selection

UI:
- Minimal selector (native & accessible) in Dashboard header to switch repositories.
- Persist selection to localStorage.

## Frontend Changes

File: `frontend/src/views/Dashboard.vue`

1) Data fetching with TanStack Query (`@tanstack/vue-query`)
- Queries keyed via `frontend/src/lib/api/queryKeys.ts`:
  - `repositories.list` to populate selector and determine default repo
  - `analytics.trends(repoId, days)` to feed Trends chart
  - `prs.metrics(repoId, 30)` and/or `reviews.metrics(repoId, 30)` to feed Quick Metrics tiles
  - `prs.byRepo(repoId, { limit, state: 'all' })` to feed Recent Activity

2) Replace mocks with computed mappings
- Quick Metrics:
  - Total Comments (30d): from `/api/reviews/repository/:id/metrics?days=30` (e.g., `avg_comments_per_pr * total_prs` or a provided total if available)
  - Avg Comments / PR: from reviews metrics
  - Change-request rate: from reviews metrics (percent)
  - Active Repos: count of `/api/repositories` or an alternative metric (e.g., open PRs) if desired
- Trends:
  - Use analytics trends data; map selected tab:
    - comments: `avg_comments` or daily comments from trends
    - change: `avg_reviews` or a derived change-request rate series if available
    - avg: `avg_comments` series (avg comments per PR)
- Goals:
  - Keep current ProgressRadial UI; derive simple placeholders based on metrics with TODO for real goals endpoint
- Recent Activity:
  - Render PR list from `/api/pull-requests/repository/:id?limit=20&state=all`

3) Loading/Error/Empty states
- For each section:
  - Loading: skeleton/dashed placeholder
  - Error: concise message, a Retry button using `queryClient.invalidateQueries` or query `refetch`
  - Empty: clear message when no results

4) A11y/Theming
- Preserve ARIA labels and summaries
- Keep dark mode and styling tokens
- Ensure selector and buttons have aria-labels

## Frontend API Layer

Use existing wrappers:
- `analyticsApi.trendsByRepo(repositoryId, days)` ✓
- `repositoriesApi.list()` ✓ and `listWithDetails()` if needed
- Pull Requests: `frontend/src/lib/api/pullRequests.ts` ✓
- Reviews: `frontend/src/lib/api/reviews.ts` ✓
- Query Keys: `frontend/src/lib/api/queryKeys.ts` ✓

## Implementation Steps (ONE BY ONE with verification)

Step 0: Scaffolding in Dashboard.vue
- Add repo selector with persistence and defaulting logic.
- Keep existing UI; introduce queries but do not replace visuals until each section passes verification.

Step 1: Quick Metrics Tiles
- Wire tiles to reviews/PR metrics endpoints.
- Implement loading/error/empty.
- Verify with Playwright MCP:
  - Launch app, authenticate if needed, navigate to `/`
  - Assert tiles render numeric values (no mock/random)
  - Optionally switch repo selection and verify updates

Step 2: Trends Chart
- Replace mock `labels`/datasets with analytics trends data for the selected repo.
- Maintain tabs (`comments`, `change`, `avg`) and a11y summary.
- Implement loading/error/empty.
- Verify with Playwright MCP:
  - Switch tabs and assert chart updates and data table reflects dataset lengths

Step 3: Goals (temporary derived)
- Compute progress values from current metrics (e.g., target thresholds).
- Keep existing component and a11y.
- Verify with Playwright MCP:
  - Values are numbers between 0-100; aria-label contains goal info

Step 4: Recent Activity
- Replace dashed placeholders with PR list from `pullRequestsApi.list`.
- Render title, state, updated date.
- Implement Refresh button to call `refetch`.
- Verify with Playwright MCP:
  - Items render; refresh triggers re-fetch

Step 5: Polish
- Retry buttons invalidate relevant queries
- Final pass on dark mode, aria, and empty states

## Tests

- Add/extend Playwright e2e for dashboard:
  - Tiles render numbers and not placeholders
  - Trend tabs switch and chart updates
  - Recent activity lists items and refresh works
- Reuse existing helpers in `frontend/e2e/helpers/test-utils.ts`

## Open Questions / Assumptions

- Exact fields in reviews metrics for total comments vs avg comments: derive totals when not provided.
- If change-request rate series is not directly available, use proxy (avg_reviews or derived rate).
- Repo selection UX is intentionally minimal for this pass.

## Definition of Done

- Dashboard has no mock/random data
- All sections fetch from backend
- Repo selection with persistence
- Robust loading/error/empty
- Verified section-by-section with Playwright MCP

## Next Commits (planned)

- feat(frontend): dashboard repo selector with persistence
- feat(frontend): wire quick metrics to reviews/pr metrics
- feat(frontend): wire trends to analytics service
- feat(frontend): wire recent activity list and refresh
- test(e2e): dashboard verification with Playwright MCP

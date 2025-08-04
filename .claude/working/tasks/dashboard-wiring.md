# Task: Wire Dashboard.vue to PR-Centric Context from Repositories View

Owner: Cline  
Status: In Progress  
Last Updated: 2025-08-04

## Goal

The Dashboard must present analytics based on the PRs selected in the Repositories/RepositoryDetail view. The Dashboard should not have its own repository selector. Instead, it consumes a shared selection (repository + one or more PRs) and renders tiles, trends, goals, and recent activity scoped to that selection. Implement robust loading, error, and empty states. Preserve accessibility and theming. Proceed ONE COMPONENT AT A TIME with Playwright MCP verification before moving to the next.

## Backend Endpoints (discovered)

From `backend/src/routes`:

- Analytics
  - GET `/api/analytics/repository/:repositoryId/trends?days=14`
- Pull Requests
  - GET `/api/pull-requests/repository/:repositoryId?limit=20&offset=0&state=all`
  - GET `/api/pull-requests/repository/:repositoryId/metrics?days=30`
  - GET `/api/pull-requests/repository/:repositoryId/stats`
- Reviews
  - GET `/api/reviews/repository/:repositoryId/metrics?days=30`

Notes:
- PR-scoped metrics endpoints are not present yet. For now, derive PR-specific aggregations client-side using list endpoints and repository-level metrics when needed. Add TODOs for future backend endpoints to compute PR-filtered metrics server-side.

## Selection Source of Truth

- Repositories/RepositoryDetail view is the canonical place where users select:
  - A repository (`route.params.id`)
  - Optional deep-linked PR(s) via `?pr=123` (RepositoryDetail already adjusts filters when `?pr` is present)
- A new shared selection store will be used by both views:
  - `selectedRepositoryId: number | null`
  - `selectedPullRequestIds: number[]`
- RepositoryDetail must update this store when repository or PR selection changes.
- Dashboard consumes this store. If the store is empty:
  - Hydrate from URL (`?repo`, `?pr`) when available; else show a guided empty state linking to Repositories to choose PRs.

## Frontend Changes

Primary files:
- `frontend/src/stores/selection.ts` (new): Export reactive store for selected repo and PRs
- `frontend/src/views/RepositoryDetail.vue`: Finish PR selection UX (multi-select, toolbar, deep-link sync) and write into selection store
- `frontend/src/components/repositories/RepositoryCard.vue`: 
  - Card title links to the repository view (/repositories/:id)
  - Show selected PRs chips for the selected repository; recent PRs link to PR-focused context (see “PR View Strategy” below)
- `frontend/src/views/Dashboard.vue`: Remove repo selector; read selection from store (with URL fallback). Scope all queries and data to selected PRs.
- `frontend/src/views/PullRequestDetail.vue` (optional new): Dedicated PR detail view if we adopt the “Dedicated PR route” strategy

Query Keys:
- Use existing `frontend/src/lib/api/queryKeys.ts` where possible.
- For any ad-hoc PR-filtered derived data, keep calculations in computed properties until backend endpoints exist.

## Implementation Steps (ONE BY ONE with Playwright MCP verification)

Step 0: Selection Store + Repo View + Repo Cards UX
- Create `frontend/src/stores/selection.ts`:
  - `selectedRepositoryId: Ref<number | null>`
  - `selectedPullRequestIds: Ref<number[]>`
  - Helpers: `setRepository(id)`, `setSelectedPRs(ids: number[])`, `clearSelection()`
  - Optional: URL sync helpers (`hydrateFromUrl()`, `syncToUrl()`) for robustness
- Update `RepositoryDetail.vue`:
  - On route param `id` change, call `setRepository(id)`
  - When user deep-links via `?pr` or selects PRs in the list, call `setSelectedPRs([...])`
- Update `Dashboard.vue`:
  - Remove local repository selector and localStorage.
  - Consume `selectedRepositoryId` and `selectedPullRequestIds` from the store.
  - If both are unset or empty, show guided empty state with link to Repositories.
  - Keep existing visual mocks temporarily; just scaffold selection-driven enabling.
- Update `RepositoryCard.vue`:
  - Accept a required `id` prop for repository id.
  - Title is a link to `/repositories/:id` to open the repository view (source of truth for PR selection).
  - Show “Selected PRs” chips when `id === selectedRepositoryId` with each chip linking to a PR-focused context (see “PR View Strategy”).
  - Make each recent PR title a link to the PR-focused context for that repo (see strategy).
- Playwright MCP verification (Step 0):
  - Navigate to `/repositories`:
    - Assert repository cards render.
    - Card title routes to `/repositories/:id` (Repository view opens).
    - For a repository with id X, ensure recent PR links and “Selected PRs” chips lead to the PR-focused context (see strategy; verify URL and focus state).
  - Navigate to `/repositories/:id` (e.g., `/repositories/3`) and assert "Repository Details" renders.
  - Deep-link test: navigate to PR-focused context (see strategy) and confirm the Repository view enters PR focus with selection updated in the store.
  - From `/repositories`, if selection exists for id X, assert the card for id X shows “Selected PRs” chips and that clicking a chip routes to the PR-focused context and selection is reflected.

Step 1: Quick Metrics Tiles (PR-scoped)
- Wire tiles to reflect ONLY selected PRs:
  - Use `pullRequestsApi.listByRepo(repoId, { state: 'all', limit: N })` to fetch a working set.
  - Filter list by `selectedPullRequestIds`. If no PRs selected, show guided empty state for tiles.
  - reviews metrics proxy:
    - If repository-level reviews metrics are available for the period (`reviewsApi.metricsByRepo(repoId, 30)`), and selected PRs ⊆ fetched list:
      - Derive totals for selected PRs client-side if possible; else fall back to repo-level values with a subtle note flag (internal TODO).
    - Calculate:
      - Total Comments (30d): derive from aggregated per-PR data if accessible; otherwise `avg_comments_per_pr * selected_total_prs`.
      - Avg Comments / PR: derived average over selected PRs.
      - Change-request rate: percent over selected PRs.
      - Active Repos: 1 when a repo is selected (or from repositories count if design prefers).
- Loading/Error/Empty:
  - Loading: placeholder tiles when pending and no previous data for the selected set.
  - Error: inline message + Retry button to refetch relevant queries.
  - Empty: “Select PRs in the repository view to populate metrics.”
- Playwright MCP verification (Step 1):
  - Navigate to `/repositories/:id`, select one or more PRs (or use `/repositories/:id?pr=<knownPr>`).
  - Navigate to `/` and assert:
    - Each of the 4 tiles renders a non-placeholder numeric value (e.g., not "—", not "Loading...", not empty).
    - "Active Repos" matches 1 (if PR-centric) or the repositories count by design.
  - Change selection:
    - Back to `/repositories/:id?pr=<differentPr>`, then return to `/`.
    - Assert at least one tile value changes relative to the previous view (indicating refetch based on selection).
  - Error path:
    - Temporarily disconnect network (if feasible) or simulate refetch; assert the error message and "Retry" button is present; click "Retry" and assert tiles recover.

Step 2: Trends Chart (PR-scoped)
- Replace mock chart data with trends derived from selected PRs.
  - If backend trends are repository-level only, compute a best-effort client-side series for selected PRs using available PR/review data.
  - Maintain tabs (e.g., comments, change) and a11y summary.
- Loading/Error/Empty:
  - Loading: chart skeleton when pending and no data.
  - Error: concise message with Retry.
  - Empty: “Select PRs in the repository view to populate trends.”
- Playwright MCP verification (Step 2):
  - With selected PRs:
    - Navigate to `/` and assert the chart is visible and dataset length > 0 (summary should say e.g., "Points: N" or "Data points: N days").
    - Click tab buttons (Comments, Change Req) and assert the chart updates (e.g., dataset labels or values change).
  - Empty path:
    - Clear PR selection in `/repositories/:id` and return to `/`.
    - Assert trends area shows the guided empty state for trends.
  - Error path:
    - Simulate a failure and assert "Failed to load trends." with Retry, click Retry, and assert recovery.

Step 3: Goals (derived from selected PRs)
- Keep existing ProgressRadial UI; compute values from current metrics scoped to selected PRs (e.g., thresholds).
- Values are strictly 0–100, aria-label contains goal info.
- Playwright MCP verification (Step 3):
  - With selected PRs:
    - Navigate to `/` and assert that each ProgressRadial shows a numeric value between 0 and 100.
    - Inspect ARIA: Each radial group has an aria-label that includes goal information.
  - No selection:
    - Assert the guided empty goals state is visible.

Step 4: Recent Activity (PR-scoped)
- Replace placeholders with list of selected PRs:
  - Fetch via `pullRequestsApi.listByRepo(repoId, { state: 'all', limit })` and filter by `selectedPullRequestIds`.
  - Render title, state, updated date.
  - Implement Refresh button calling `refetch`.
- Loading/Error/Empty states as above.
- Playwright MCP verification (Step 4):
  - With selected PRs:
    - Navigate to `/` and assert the Recent Activity list renders items corresponding to selected PRs (title and state visible).
    - Click "Refresh" and assert a refetch occurs (e.g., network call visible in logs or list timestamps change).
  - No selection:
    - Assert the guided empty state for Recent Activity.

Step 5: Polish
- Retry buttons invalidate relevant queries.
- Ensure route/store synchronization is robust:
  - On app load, hydrate store from URL if present.
  - When selection changes in repo view, Dashboard reflects changes on navigation without manual reload.
- Final pass on dark mode, ARIA, and empty states.

## Tests

- Extend Playwright e2e for PR-centric dashboard:
  - Select PRs in `/repositories/:id`, navigate to `/`:
    - Tiles render numbers for selected PRs (no placeholders).
    - Trends tabs switch and chart updates reflect dataset lengths.
    - Recent activity lists selected PRs and refresh works.
  - Clear PR selection and assert guided empty states on `/`.
- Reuse helpers in `frontend/e2e/helpers/test-utils.ts`.

## Open Questions / Assumptions

- Without PR-scoped backend metrics, client-side derivations may be approximate. Plan to add endpoints:
  - `/api/reviews/repository/:repoId/metrics?days=30&prIds=...`
  - `/api/analytics/repository/:repoId/trends?days=14&prIds=...`
- Selection UX in RepositoryDetail:
  - If not yet present, add multi-select affordance or deep-link `?pr` array support.

## PR View Strategy (Decision)

We will NOT introduce a separate PR view for now. The Dashboard is the primary surface for PR details and analytics.

- PR focus will be handled inline within RepositoryDetail via `?pr=<number>`:
  - RepositoryDetail highlights/expands the focused PR row.
  - Provides a “Select PR” control in-line, writing to the shared selection store.
  - Deep-linking supports multiple PRs via repeated or comma-separated `?pr`.

RepositoryCard link behavior:
- Card title: links to `/repositories/:id` (always opens the repository workspace).
- Recent PRs and “Selected PRs” chips: link to `/repositories/:id?pr=<number>` to focus that PR inline.
- No dedicated PR route is created; keep this as a future enhancement if user needs evolve.

## Dashboard Selection Controls (Decision)

Dashboard remains selection consumer, but WILL show lightweight selection controls when multiple PRs are selected:
- A compact “Selection Controls” bar at the top when `hasSelection` is true:
  - Summarize selection (e.g., “X PRs selected from repo Y”).
  - Actions:
    - Clear selection (calls store.clearSelection()).
    - Review selection (router-link to `/repositories/:repoId` with existing `?pr` params to adjust).
- All Dashboard panels (tiles, trends, goals, recent activity) continue to scope to the current selection.

## Repository vs Dashboard — PR-centric Responsibilities

Purpose and scope
- Repository view (RepositoryDetail.vue): Selection and operations hub for a single repository. Users choose PRs here (via UI or deep-link ?pr). Shows repo-specific operational data (PR list with filters, repo stats, trends for that repo, sync controls).
- Dashboard (Dashboard.vue): Read-only analytics consumer for the current selection. No selection UI. Displays tiles, trends, goals, and recent activity strictly scoped to the selected PRs.

Primary interactions
- Repository view:
  - Select PRs: via UI or deep-link ?pr, and write to the shared selection store (selectedRepositoryId, selectedPullRequestIds).
  - Filter PRs (state/pagination), inspect PRs, trigger repo sync.
  - Serve as navigational hub for PR drill-down.
- Dashboard:
  - Read the shared selection (no local selection).
  - Display analytics derived from the selection.
  - Provide retry/refresh for analytics; no sync/filter controls.

Data model and queries
- Repository view:
  - Route-driven repoId (/repositories/:id).
  - Queries: prList (byRepo), prStats, review metrics (by repo), analytics trends (by repo), optional sync history.
  - Writes selection: setRepository(id), setSelectedPRs([...]).
- Dashboard:
  - Reads selection from store (with optional URL hydrate).
  - Queries: initially proxy repo-level metrics; conceptually compute PR-scoped analytics for selectedPullRequestIds; later switch to PR-scoped endpoints.

UI and a11y
- Repository view: Operational UI (filters, list, sync), interactive PR list; deep-link influences list/filters and selection.
- Dashboard: Analytics panels only; tabs for trends, tiles for KPIs, goals visualization, recent activity; guided empty copy when selection is missing.

Navigation and state
- Repository view: Source of truth for repoId via route and editor for selection; persists to shared store (URL sync optional).
- Dashboard: Route-agnostic consumer; relies on store populated by repository view.

Repository cards
- Repository cards (list page): Show “Selected PRs” chips for the selected repository; chips and recent PR titles link to /repositories/:id?pr=<number> to focus selection in RepositoryDetail.

## Definition of Done

- Dashboard has no mock/random data.
- Dashboard reflects the PRs selected in the Repositories/RepositoryDetail view.
- Shared store holds repository and PR selections; Dashboard consumes it.
- Robust loading/error/empty states.
- Verified section-by-section with Playwright MCP.

## Next Commits (planned)

- feat(frontend): selection store for repo and PRs; hydrate from route
- feat(frontend): dashboard consumes PR-centric selection; remove local repo selector
- feat(frontend): wire quick metrics to selected PRs
- feat(frontend): wire trends to selected PRs
- feat(frontend): wire recent activity to selected PRs and refresh
- test(e2e): dashboard PR-centric verification with Playwright MCP

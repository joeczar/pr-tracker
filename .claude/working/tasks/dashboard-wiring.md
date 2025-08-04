# Task: Wire Dashboard.vue to PR-Centric Context from Repositories View

Owner: Cline  
Status: In Progress  
Last Updated: 2025-08-04 (updated after componentization, Quick Metrics empty states, and Trends wiring)

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
(done)
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
(done: componentized, queries owned in section, robust loading/error/empty; empty shows normal zeros with faded style and hover tooltips)
- Enhancements delivered:
  - Always render 4 tiles to keep layout stable.
  - No-selection/empty: 0 or 0% values in a disabled/faded style; tooltip explains “Select PRs to populate” or “No data in the last 30 days”.
  - Error with Retry; loading skeletons preserved.
- TODO (follow-up when PR-scoped endpoints exist): compute exact per-PR aggregates instead of proportional proxies.
- Playwright MCP (pending): add assertions for card presence in empty state and tooltip visibility on hover.

Step 2: Trends Chart (repo analytics wired; selection-aware derivations pending)
(in progress: wired to analyticsApi.trendsByRepo(repoId, 14) with loading/error/empty; tabs mapped: comments, change %, avg)
- Implemented:
  - Live data via analyticsApi.trendsByRepo.
  - Loading placeholder, concise Error with Retry, Empty shows faded zeroed chart to keep layout stable.
  - Change tab normalizes 0–1 to %, or derives proxy from avg_reviews.
- TODO: selection-aware trend derivation once PR-scoped trends endpoint exists.
- Playwright MCP (pending): verify tabs switch and dataset lengths/labels update; verify empty/error states and Retry.

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
(in progress: wired to repo list and filtered by selection; enhanced empty states)
- Implemented:
  - Fetch repo PR list with undefined state (all) and limit; client-side filter to selected PR IDs.
  - Refresh triggers refetch.
  - Empty states:
    - No selection: “Select PRs…” message.
    - Selected but none in range: explanatory message + tip.
- TODO: when backend supports PR-scoped query, request only selected PRs.
- Playwright MCP (pending): assert list items match selection; Refresh triggers refetch; empty states render as described.

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

- feat(frontend): selection store for repo and PRs; hydrate from route (done)
- feat(frontend): dashboard consumes PR-centric selection; remove local repo selector (done)
- feat(frontend): componentize dashboard sections (done)
- feat(frontend): quick metrics section with robust states and empty tooltips (done)
- feat(frontend): trends section wired to analytics with robust states (in progress)
- feat(frontend): recent activity section with robust states and refresh (in progress)
- feat(frontend): goals section derived from metrics (pending)
- test(e2e): dashboard PR-centric verification with Playwright MCP (pending)

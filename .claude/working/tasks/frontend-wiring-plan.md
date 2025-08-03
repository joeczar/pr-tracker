# Frontend Wiring Plan for PR Tracker

Goal: Wire the existing backend to the Vue 3 + Vite frontend with a clean API client layer, auth handling, and view-level integrations. This plan documents endpoints, data flows, and a step-by-step checklist to track progress.

Backend surface area (from backend/src/index.ts)
- Base: http://localhost:3000
- Routes:
  - /auth (authRoutes)
  - /webhooks (webhookRoutes)
  - /api/github (githubRoutes)
  - /api/repositories (repositoryRoutes)
  - /api/pull-requests (pullRequestRoutes)
  - /api/reviews (reviewRoutes)
  - /api/analytics (analyticsRoutes)
  - /api/sync (syncRoutes)
- CORS: origin default http://localhost:5173, cookies allowed, credentials true
- Health: GET /health

Auth routes (backend/src/routes/auth.ts)
- GET /auth/github/login?redirect=/path
  - Redirects to GitHub OAuth, sets oauth_redirect cookie, expects to return to frontend with ?auth=success
- GET /auth/github/callback
  - Handles the exchange; on success redirects to `${FRONTEND}${redirect}?auth=success` else `${FRONTEND}/auth/error?...`
  - Sets session cookie SESSION_COOKIE_NAME (default pr_tracker_session) with httpOnly
- POST /auth/logout (requireAuth)
- GET /auth/me (requireAuth) -> { user: AuthenticatedUser }
- POST /auth/refresh (requireAuth)
- GET /auth/status -> { authenticated: boolean, user? }

Repositories (backend/src/routes/repositories.ts)
- GET /api/repositories (requireAuth) -> Repository[]
- POST /api/repositories (requireAuth) body: { owner, name } -> Repository
- GET /api/repositories/:id (requireAuth) -> Repository
- DELETE /api/repositories/:id (requireAuth) -> { success: true }

Pull Requests (backend/src/routes/pull-requests.ts)
- GET /api/pull-requests/repository/:repositoryId?limit=&offset=&state= -> PR[]
- GET /api/pull-requests/repository/:repositoryId/metrics?days= -> Metrics
- GET /api/pull-requests/:id -> PR
- POST /api/pull-requests/repository/:repositoryId/sync -> { ...result }
- GET /api/pull-requests/repository/:repositoryId/stats -> summary { total, open, merged, closed, merge_rate }

Reviews (backend/src/routes/reviews.ts)
- GET /api/reviews/pull-request/:pullRequestId -> Review[]
- GET /api/reviews/repository/:repositoryId/metrics?days= -> Metrics
- GET /api/reviews/:id -> Review
- POST /api/reviews/pull-request/:pullRequestId/sync -> { ...result }

Analytics (backend/src/routes/analytics.ts)
- GET /api/analytics/repository/:repositoryId/trends?days= -> trends
- POST /api/analytics/compare body: { repository_ids: number[], days?: number } -> comparison

GitHub proxy (backend/src/routes/github.ts)
- GET /api/github/test (requireAuth) -> { success, user }
- GET /api/github/rate-limit (requireAuth)
- GET /api/github/repos/:owner/:repo (requireAuth) -> repo info
- GET /api/github/repos/:owner/:repo/pulls?state=&page=&per_page= -> PRs
- GET /api/github/repos/:owner/:repo/pulls/:pull_number -> PR detail
- GET /api/github/repos/:owner/:repo/pulls/:pull_number/files -> files
- GET /api/github/repositories?pagination... -> { repositories, pagination }

Sync (backend/src/routes/sync.ts)
- POST /api/sync/repository/:repositoryId body: { type?: 'full' | 'incremental' } -> { success, job_id }
- GET /api/sync/job/:jobId -> { ...status } | 404
- GET /api/sync/repository/:repositoryId/history?limit= -> history[]
- GET /api/sync/rate-limit -> status
- POST /api/sync/periodic/start body: { interval_minutes } -> start message

High-level frontend architecture plan
1) API base setup
   - Create a typed API client module with:
     - Base URL from env: import.meta.env.VITE_API_URL default http://localhost:3000
     - Include credentials: fetch with credentials: 'include'
     - JSON handling, errors normalization using backend error format
     - Retry logic for 401: attempt /auth/status and/or a guarded flow
   - Endpoints as functions grouped by domain: authClient, repositoriesClient, pullRequestsClient, reviewsClient, analyticsClient, githubClient, syncClient.

2) Auth flow
   - Login Button: window.location.href = `${API}/auth/github/login?redirect=${encodeURIComponent(currentPath)}`
   - On App bootstrap:
     - Call GET /auth/status to detect session. If authenticated, store user in a global auth store (Pinia or reactive object).
     - If URL has auth=success, clear it and refresh /auth/status or /auth/me to pull user.
   - Logout: POST /auth/logout then clear store, navigate to /login
   - Route guards:
     - Protected routes: redirect to /login if not authenticated
     - Public routes: login page
   - Error page for /auth/error to read query and display message.

3) Frontend usage mapping

Views and components (existing)
- frontend/src/views/Login.vue
- frontend/src/views/Home.vue, Dashboard.vue, Analytics.vue, Repositories.vue, RepositoryDetail.vue, Settings.vue
- repositories components: AddRepositoryDialog.vue, RepositoryCard.vue
- analytics components: MetricTile.vue, ProgressRadial.vue, TrendChart.vue
- layout AppShell.vue

Mappings
- Login.vue
  - Shows “Sign in with GitHub” button -> triggers /auth/github/login
  - On return auth=success, verify session via /auth/status then redirect to redirect target or /dashboard

- AppShell.vue
  - On mount, check /auth/status; maintain user avatar/name; show Logout that calls POST /auth/logout
  - Provide a reactive auth context for other components

- Repositories.vue
  - On mount: GET /api/repositories to list tracked repositories
  - AddRepositoryDialog.vue:
    - Validates owner/name
    - POST /api/repositories
    - On success, close and refresh list
  - RepositoryCard.vue:
    - Show delete action -> DELETE /api/repositories/:id then refresh
    - Navigate to RepositoryDetail.vue

- RepositoryDetail.vue
  - On mount:
    - GET /api/repositories/:id (optional basic info)
    - GET /api/pull-requests/repository/:id?state=open&limit=50
    - GET /api/pull-requests/repository/:id/stats
    - GET /api/reviews/repository/:id/metrics?days=30
    - GET /api/analytics/repository/:id/trends?days=30
  - Buttons:
    - “Sync now” incremental -> POST /api/pull-requests/repository/:id/sync
    - Optionally show sync job status via /api/sync/repository/:id/history and /api/sync/job/:jobId

- Analytics.vue
  - Supports global comparison:
    - POST /api/analytics/compare with selected repository_ids
  - When navigated from a repository context, load GET /api/analytics/repository/:id/trends?days=

- Settings.vue
  - Show GitHub API status via GET /api/github/test and /api/github/rate-limit
  - List accessible GitHub repos via GET /api/github/repositories with pagination; potentially enable “Track” by POST /api/repositories with owner/name

- Command Palette / A11y utilities
  - Wire actions to route navigation and to trigger “Sync now”

4) Client modules (to implement)
- src/lib/api/http.ts
  - fetchJson(url, options?) ensuring credentials: 'include', headers['Content-Type']='application/json' for body, uniform error parsing, 401 handling hook
- src/lib/api/auth.ts
  - status(), me(), login(redirectPath), logout(), refresh()
- src/lib/api/repositories.ts
  - list(), create({owner,name}), get(id), remove(id)
- src/lib/api/pullRequests.ts
  - listByRepo(id, query), metricsByRepo(id, days), get(id), syncRepo(id), statsByRepo(id)
- src/lib/api/reviews.ts
  - listByPullRequest(id), metricsByRepo(id, days), get(id), syncForPullRequest(id)
- src/lib/api/analytics.ts
  - trendsByRepo(id, days), compare({ repository_ids, days })
- src/lib/api/github.ts
  - test(), rateLimit(), getRepo(owner, repo), listPulls(owner, repo, opts), getPull(owner, repo, number), getPullFiles(owner, repo, number), listAccessibleRepositories(opts)
- src/lib/api/sync.ts
  - queueRepoSync(id, type?), jobStatus(jobId), repoHistory(id, limit), startPeriodic(interval_minutes)

5) State management
- src/stores/auth.ts (Pinia) or a composable:
  - state: authenticated, user, loading
  - actions: checkStatus, logout, setUser
- Repositories local state in Repositories.vue using composables or local refs; optionally global store if needed.
- Errors and toasts: use ui/toast components for error surface and success confirmations.

6) Error handling and UX
- Normalize backend errors to { error, message?, details? }
- Show form errors in AddRepositoryDialog.vue for zod validation responses (400)
- Global 401 handler: redirect to /login unless on auth endpoints
- Vue Query driven loading/error states with suspense-friendly components
- Configure query defaults: staleTime ~30s, refetchOnWindowFocus false, retry <=2 except 401
- Loading spinners and skeletons for queries (repositories, PRs, analytics, github repos)
- Rate limit display component reading /api/github/rate-limit via useQuery

7) Environment configuration
- frontend/.env.example add:
  - VITE_API_URL=http://localhost:3000
- Ensure fetch uses withCredentials via RequestInit: credentials: 'include'
- CORS is already configured with credentials true on backend

8) Security/Session notes
- Session stored as httpOnly cookie pr_tracker_session; frontend cannot read it; rely on /auth/status and /auth/me
- SameSite Strict in prod may affect cross-domain auth if domains differ; align FRONTEND and CORS_ORIGIN in envs

9) Testing checklist
- Auth happy path and error path (/auth/error)
- Repository add/list/delete
- PR list, stats, metrics
- Reviews list and metrics
- Analytics trends and compare
- Sync queue and history
- GitHub test and rate limit

Implementation checklist with embedded testing checkpoints
[x] 0. Create API base and modules
    [x] src/lib/api/http.ts with fetchJson and error normalization
    [x] src/lib/api/auth.ts
    [x] src/lib/api/repositories.ts
    [x] src/lib/api/pullRequests.ts
    [x] src/lib/api/reviews.ts
    [x] src/lib/api/analytics.ts
    [x] src/lib/api/github.ts
    [x] src/lib/api/sync.ts
    [x] frontend/.env.example add VITE_API_URL
    [Testing checkpoints]
      - Unit: http.ts error normalization and safe 204 handling (frontend/tests/http.test.ts)
      - Unit: API base URL fallback when env absent (frontend/tests/http.test.ts)
      - Unit: authApi status/me/logout/refresh call shapes (frontend/tests/auth.test.ts)
      - Lint/typecheck: pnpm -C frontend typecheck && pnpm -C frontend lint

[x] 1. Auth wiring
    [x] Create auth store/composable (src/stores/auth.ts or src/composables/useAuth.ts)
    [x] In App.vue or AppShell.vue, check /auth/status on mount and populate store
    [x] Implement Login.vue OAuth initiation via anchor -> `${API}/auth/github/login?redirect=...` (replaces button click handler)
    [x] Handle auth=success query on return and re-check status in Login.vue
    [x] Removed duplicate auth=success handling from AppShell.vue
    [x] Implement logout action calling POST /auth/logout
    [x] Route guards for protected routes (router.beforeEach)
    [x] Auth error page for /auth/error
    [Testing checkpoints]
      - Integration: unauthenticated navigation to protected route redirects to /login with ?redirect
      - Integration: clicking “Sign in with GitHub” navigates to /auth/github/login with redirect param
      - Integration: returning with ?auth=success triggers status check and navigates to redirect or /dashboard
      - Component: AuthError.vue renders message/error/details and retry/back actions update location as expected
      - E2E (manual): With backend running, full OAuth flow works, session cookie present, and auth persists across refresh

[ ] 2. Repositories page
    [x] Wire GET /api/repositories to list
    [x] Wire AddRepositoryDialog.vue to POST /api/repositories
    [x] Wire delete on RepositoryCard.vue to DELETE /api/repositories/:id
    [x] Toasts and error handling
    [Testing checkpoints]
      - Integration: Repositories.vue shows loading skeleton, then list on success; error state visible on failure
      - Mutation: Adding repository invalidates list and renders new item; zod 400 shows inline/form error
      - Mutation: Deleting repository disables confirm during request; invalidates/reloads list
      - Accessibility: Dialog focus trap smoke test and keyboard navigation for actions menu

[x] 3. Repository detail
    [x] Load repository info GET /api/repositories/:id
    [x] Load PR list GET /api/pull-requests/repository/:id
    [x] Load PR stats GET /api/pull-requests/repository/:id/stats
    [x] Load review metrics GET /api/reviews/repository/:id/metrics?days=30
    [x] Load analytics trends GET /api/analytics/repository/:id/trends?days=30
    [x] Add “Sync now” -> POST /api/pull-requests/repository/:id/sync with invalidation of related queries
    [ ] Optionally show sync history via /api/sync/repository/:id/history
    [Testing checkpoints]
      - Integration: Detail view renders all queries with loading/error states using Vue Query
      - Data: Stats/metrics/trends display with correct formatting and update after refetch
      - Mutation: “Sync now” enqueues sync; success toast; invalidates PR list/stats/trends/history
      - Optional: Sync history list paginates/limits; empty state handled

[x] 4. Analytics view
    [x] Trends for selected repository via GET /api/analytics/repository/:id/trends?days=
    [x] Compare multiple repositories via POST /api/analytics/compare (basic selector + submit)
    [Testing checkpoints]
      - Integration: Trends query respects selected repo and days; loading/error handled
      - Compare: Submitting selected repositories returns comparison and renders charts
      - State: Enabled query or mutation flow doesn’t duplicate requests; cache keys stable

[ ] 5. Settings view
    [ ] Show GitHub connection test /api/github/test and rate limit
    [ ] List accessible repositories via /api/github/repositories, with pagination
    [ ] “Track” action -> POST /api/repositories
    [Testing checkpoints]
      - Integration: /api/github/test and /api/github/rate-limit render values and handle errors
      - Pagination: Accessible repositories list paginates correctly and preserves filters
      - Action: “Track” adds repository and invalidates repository lists; handles duplicate/validation errors

[ ] 6. UX polish
    [ ] Loading states and skeletons
    [ ] Toast notifications
    [ ] Error boundary patterns
    [Testing checkpoints]
      - Visual: Skeletons appear during loads on key views (repos, detail, analytics, settings)
      - Feedback: Success/error toasts show normalized messages from HttpError payloads
      - Resilience: Error boundaries prevent app crashes and show recoverable UI

[ ] 7. End-to-end verify with backend running
    [Testing checkpoints]
      - E2E: Full happy path covering login, listing repos, adding/removing, viewing repo detail stats/metrics/trends, running sync, analytics compare, settings checks
      - Docs: Local runbook validated; environment variables documented and honored (CORS/credentials)
      - Session: Auth persists via httpOnly cookie; logout clears state and redirects to /login

Reference snippets

Example http.ts
- Base URL:
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
- fetchJson:
  async function fetchJson(path, init) {
    const res = await fetch(API_BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    });
    if (!res.ok) {
      let payload: any;
      try { payload = await res.json(); } catch { /* ignore */ }
      const err = new Error(payload?.message || payload?.error || res.statusText);
      err['status'] = res.status;
      err['payload'] = payload;
      throw err;
    }
    // 204 handling
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

Example auth.ts
- status: () => fetchJson('/auth/status', { method: 'GET' })
- me: () => fetchJson('/auth/me', { method: 'GET' })
- login: (redirect) => window.location.href = `${API_BASE}/auth/github/login?redirect=${encodeURIComponent(redirect || '/dashboard')}`
- logout: () => fetchJson('/auth/logout', { method: 'POST' })

Router guard sketch
router.beforeEach(async (to, from, next) => {
  const publicRoutes = ['/login', '/auth/error'];
  if (publicRoutes.includes(to.path)) return next();
  const auth = useAuthStore();
  if (!auth.checked) await auth.checkStatus();
  if (!auth.authenticated) return next({ path: '/login', query: { redirect: to.fullPath } });
  next();
});

Notes/assumptions
- Some backend routes like reviews/pull-requests aren’t protected; rely on DB-level filtering where appropriate. If protection is required, add requireAuth in backend later.
- For pagination and filters, start with simplest defaults; extend UI later.
- Auth/session should not be stored in Vue Query; keep in auth store and clear/invalidate queries on auth change.

Changelog
- 2025-08-03: Initial backend review and frontend wiring plan created.
- 2025-08-03: Adopted @tanstack/vue-query, added query keys, configured provider, and created http/auth API modules.
- 2025-08-03: Implemented domain API clients (repositories, pullRequests, reviews, analytics, github, sync) and added frontend/.env.example with VITE_API_URL.
- 2025-08-03: Added Pinia auth store (src/stores/auth.ts), wired global router guard, integrated auth bootstrap and logout in AppShell.vue, and handled auth=success URL parameter.
- 2025-08-03: Wired Repositories.vue with Vue Query (list, add, delete) including toasts and loading/error states. Added Vitest config, TS config for tests, and implemented tests for http.ts and auth flows; CI green locally.
- 2025-08-03: Fixed login initiation by switching Login.vue to anchor-based OAuth start; centralized auth=success handling in Login.vue; removed duplicate handling from AppShell.vue.
- 2025-08-03: RepositoryDetail wired with Vue Query (info, PRs, stats, review metrics, trends) and “Sync now” mutation with invalidations.
- 2025-08-03: Analytics view wired for repo trends and comparison mutation with repository selector.

Milestones, owners, and timeline
Note: Owners are placeholders; adjust as needed.

Milestone M0 — Foundations (API client + Auth + Vue Query) — 1-2 days — Owner: FE-1
Scope:
- Implement API base module (http.ts) with credentials + error normalization
- Decide and adopt @tanstack/vue-query for server state management (repositories, PRs, metrics, analytics, GitHub lists)
- Implement domain API clients (auth, repositories, pullRequests, reviews, analytics, github, sync)
- Add VITE_API_URL to frontend/.env.example
- Create auth store/composable and router guard (auth remains outside Vue Query cache)
- Provide Vue Query in main.ts with a QueryClient and sane defaults (staleTime, retries, focus refetch behavior)
Deliverables:
- src/lib/api/*.ts modules
- src/stores/auth.ts (or src/composables/useAuth.ts)
- src/lib/api/queryKeys.ts with typed query keys
- Vue Query provider wired in main.ts
- Router guard integrated
Exit criteria:
- Visiting app with an active session shows authenticated UI without manual refresh
- Hitting protected routes without session redirects to /login
- Server-state queries in Repositories.vue are powered by Vue Query with cache and proper loading/error states
Tracking:
[x] http.ts done
[x] domain clients done
[x] env example updated
[x] auth store done
[x] guards wired
[x] Vue Query installed and provider set up
[x] queryKeys.ts scaffolded
[x] Repositories.vue migrated to useQuery/useMutation

Milestone M1 — Repositories CRUD wiring (Vue Query) — 1 day — Owner: FE-2
Scope:
- Wire Repositories.vue to list tracked repos using useQuery(queryKey: qk.repositories.list()) and repositoriesApi.list
- Implement AddRepositoryDialog.vue to add repo via useMutation(repositoriesApi.create) with invalidateQueries on success
- Implement delete action in RepositoryCard.vue via useMutation(repositoriesApi.remove) with invalidateQueries
- Toast and error states for zod 400s and server errors using normalized HttpError payload
Deliverables:
- Working repositories page with add/delete and error handling
Exit criteria:
- Add repository shows in list; delete removes it; errors visible to user
- Network calls are deduped/cached and refresh correctly
Tracking:
[x] list (useQuery)
[x] add (useMutation + invalidate)
[x] delete (useMutation + invalidate)
[x] toasts/errors

Milestone M2 — Repository Detail + PR/Review/Analytics (Vue Query) — 2-3 days — Owner: FE-1
Scope:
- RepositoryDetail.vue loads with Vue Query:
  - PR list: useQuery(qk.prs.byRepo(id, { state, limit }), pullRequestsApi.listByRepo)
  - PR stats: useQuery(qk.prs.stats(id), pullRequestsApi.statsByRepo)
  - Review metrics: useQuery(qk.reviews.metrics(id, 30), reviewsApi.metricsByRepo)
  - Analytics trends: useQuery(qk.analytics.trends(id, 30), analyticsApi.trendsByRepo)
- Add “Sync now” (useMutation pullRequestsApi.syncRepo) and refetch related queries on success; optional sync history useQuery(qk.sync.history(id, limit))
Deliverables:
- Populated detail page; sync button flows with proper query invalidation
Exit criteria:
- Stats/metrics/trends render for a repo with data; sync enqueues and user receives feedback
- Related queries are invalidated/refetched appropriately after sync
Tracking:
[x] PR list (useQuery)
[x] PR stats (useQuery)
[x] Review metrics (useQuery)
[x] Analytics trends (useQuery)
[x] Sync now (useMutation + invalidate)
[ ] Sync history (optional, useQuery)

Milestone M3 — Global Analytics Compare (Vue Query) — 1 day — Owner: FE-3
Scope:
- Analytics.vue compare flow:
  - useMutation(analyticsApi.compare) for submit-driven compare
- Multi-select repositories UX; basic result render (JSON preview stub; charting to be refined)
Deliverables:
- Comparison view submits and renders results
Exit criteria:
- Submitting selected repositories returns comparison without errors
Tracking:
[x] compare wiring (mutation)
[x] repository selector
[ ] chart render (follow-up: visualize comparison results)

Milestone M4 — Settings + GitHub integration tools (Vue Query) — 1 day — Owner: FE-2
Scope:
- Settings.vue shows:
  - GitHub connection test: useQuery(qk.github.test(), githubApi.test)
  - Rate limit: useQuery(qk.github.rateLimit(), githubApi.rateLimit) with shorter staleTime
- List accessible repos with pagination: useQuery(qk.github.repositories({ page, per_page, sort, direction, affiliation, visibility }), githubApi.listAccessibleRepositories)
- “Track” action: useMutation(repositoriesApi.create) and invalidate repositories list queries
Deliverables:
- Functional settings page to bootstrap tracking
Exit criteria:
- User can discover a repo from GitHub list and track it from UI
Tracking:
[ ] connection test
[ ] rate limit
[ ] list repos (paginated query)
[ ] track action (mutation + invalidate)

Milestone M5 — UX polish, errors, loading states — 1 day — Owner: FE-1
Scope:
- Loading skeletons for lists/cards
- Centralized error toasts (normalized backend errors)
- Auth error page (/auth/error) and inline form errors (zod)
Deliverables:
- Consistent UX across flows
Exit criteria:
- No raw exceptions; meaningful user feedback on failures
Tracking:
[ ] skeletons
[ ] toasts
[ ] auth error page
[ ] form errors

Milestone M6 — End-to-end validation and docs — 0.5-1 day — Owner: FE-Lead
Scope:
- Run backend + frontend, validate all checklists
- Add README sections for local setup, env, and flows
Deliverables:
- Verified integration; updated docs
Exit criteria:
- “Happy path” and primary error paths work across all features
Tracking:
[ ] E2E runbook
[ ] README updates

Testing per milestone (expanded checkpoints)
M0 — Foundations
- Unit: http.ts error normalization and JSON parsing (safeJson), API_BASE fallback when env absent. [frontend/tests/http.test.ts]
- Unit: authApi.status/me/logout/refresh call shapes (mock fetch). [frontend/tests/auth.test.ts]
- Unit: auth store checkStatus sets authenticated/user correctly on status and on me() fallback; logout clears state even when logout API fails (error propagates but state cleared). [frontend/tests/auth.test.ts]
- Integration: router guard redirects unauthenticated users to /login; allows access when authenticated (mock store).
- Component: AppShell handles auth=success param and updates URL without reload; shows user identity in dropdown.

M1 — Repositories
- Integration: Repositories.vue calls repositoriesApi.list and renders items; shows skeleton while loading; shows error on failure.
- Mutation: AddRepositoryDialog submit triggers repositoriesApi.create and invalidates qk.repositories.list on success; shows toast on error with HttpError payload message.
- Mutation: Delete action triggers repositoriesApi.remove, disables confirm button while pending, invalidates list on success, and shows toast; shows error toast on failure.
- Accessibility: actions menu keyboard navigable and dialog focus trap smoke test.

M2 — Repository Detail
- Integration: Renders repository info, PR list, stats, review metrics, analytics trends; shows skeletons and error states.
- Mutation: Sync now invalidates relevant queries and shows success toast; handles error toast.
- Optional: Sync history fetch, paging/limit, empty state.

M3 — Analytics Compare
- Integration: Compare flow returns data for selected repositories; charts render; handles empty selection and errors.
- Caching: Query keys stable; no duplicate network calls; respects enabled flag.

M4 — Settings + GitHub tools
- Integration: GitHub test and rate limit values render; errors surfaced.
- Pagination: Accessible repos paginated; filters preserved on navigation.
- Action: “Track” mutation adds repo and invalidates repository list; handles duplicates/zod errors.

M5 — UX/Errors/Loading
- Visual: Skeletons implemented across key data surfaces.
- Feedback: Toasts for success/errors standardized to normalized backend payload.
- Stability: Error boundaries prevent crashes and present retry affordances.

M6 — E2E + Docs
- End-to-end: Full flow validation with backend running; includes auth, CRUD, metrics, sync, analytics, and settings.
- Documentation: README sections for local setup, env config, and usage validated by running steps.
- Cross-origin/session: Credentialed requests succeed; cookie SameSite behavior vetted in local config.

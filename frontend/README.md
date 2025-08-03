# PR Tracker — Frontend

Vue 3 + Vite frontend for PR Tracker, wired to the backend at http://localhost:3000 by default. Uses @tanstack/vue-query for server state, Pinia for auth/session state, and a thin API client layer with credentialed requests.

## Quick Start

Prereqs:
- Node 18+ (or Bun); pnpm recommended
- Backend running at http://localhost:3000 (see ../backend/README.md)

Install and run:
```bash
pnpm install
pnpm dev
```

Environment:
- Copy `.env.example` to `.env` and adjust as needed.
- `VITE_API_URL` defaults to `http://localhost:3000`.

## E2E Runbook (Local Validation)

This runbook verifies the end-to-end flow against the local backend.

1) Start backend
- Open a new terminal at `../backend`
- Configure `.env` (GitHub OAuth or use test/dummy if applicable)
- Start server:
  ```bash
  pnpm install
  pnpm dev
  ```
- Health check: GET http://localhost:3000/health should return OK.

2) Start frontend
- From `./frontend`:
  ```bash
  pnpm install
  pnpm dev
  ```
- Visit http://localhost:5173

3) Auth flow
- Navigate to a protected route (e.g. /repositories) and verify redirect to /login with ?redirect.
- Click “Sign in with GitHub”: should navigate to `${API}/auth/github/login?redirect=...`
- Complete OAuth and return with `?auth=success`.
- The app should call `/auth/status` and show authenticated UI (user menu in AppShell).
- “Logout” triggers POST `/auth/logout` and returns to /login.

Troubleshooting:
- If you see 401 loops, ensure cookies are not blocked. Backend CORS must include origin http://localhost:5173 with credentials enabled. The session cookie should be httpOnly.
- Verify FRONTEND and CORS_ORIGIN alignment in backend env.

4) Repositories
- Navigate to /repositories.
- Verify initial list loads via GET `/api/repositories`. Loading skeleton should appear, followed by items.
- Add a repository via dialog (owner/name) -> POST `/api/repositories`. On success, list should refresh. Zod 400 shows inline/toast error.
- Delete a repository -> DELETE `/api/repositories/:id`. Confirm and verify list updates.

5) Repository Detail
- Click a repo to open /repositories/:id.
- Verify:
  - Info via GET `/api/repositories/:id`.
  - PR list via GET `/api/pull-requests/repository/:id`.
  - Stats via GET `/api/pull-requests/repository/:id/stats`.
  - Review metrics via GET `/api/reviews/repository/:id/metrics?days=30`.
  - Trends via GET `/api/analytics/repository/:id/trends?days=30`.
- Click “Sync” to queue sync -> POST `/api/pull-requests/repository/:id/sync`.
  - On success, a toast displays and queries invalidated/refetched.
  - Optional: Sync history should render via GET `/api/sync/repository/:id/history?limit=...`.

6) Analytics
- Navigate to /analytics.
- Select a repository; ensure GET `/api/analytics/repository/:id/trends?days=` renders charts.
- Select multiple repos and click “Compare”. POST `/api/analytics/compare` returns comparison. Initial charts/data preview render.
- Ensure no duplicate network calls; query keys stable; loading/error states handled.

7) Settings
- Navigate to /settings.
- Verify connectivity:
  - GET `/api/github/test` and GET `/api/github/rate-limit` show status/rate-limit values.
- Accessible repos:
  - GET `/api/github/repositories?page=&per_page=` lists items with pagination controls.
- “Track” action:
  - POST `/api/repositories` from a GitHub repo item adds it to tracked repos and invalidates lists. Duplicates/zod errors surfaced via toasts.

8) Error boundaries and UX
- The app root wraps `<router-view />` with an ErrorBoundary. Per-view boundaries in RepositoryDetail, Settings, and Analytics guard heavy sections.
- To simulate errors (optional), temporarily throw in a component’s setup or render; verify fallback shows diagnostics and Retry re-renders subtree.
- Skeletons appear on long loads; toasts show normalized HttpError payloads for failures.

## Project Structure (Frontend)

- `src/lib/api/*` — Typed API clients (http/auth/repositories/pullRequests/reviews/analytics/github/sync)
- `src/stores/auth.ts` — Pinia auth store; router guard checks `/auth/status` on navigation
- `src/views/*` — Pages (Repositories, RepositoryDetail, Analytics, Settings, Login, AuthError, etc.)
- `src/components/error/ErrorBoundary.vue` — Diagnostic-friendly boundary with Retry
- `src/components/ui/*` — UI components (terminal, inputs, dialogs, buttons, etc.)

## Scripts

- `pnpm dev` — Vite dev server
- `pnpm build` — Production build
- `pnpm preview` — Preview built app
- `pnpm typecheck` — TypeScript type checking
- `pnpm lint` — ESLint

## Testing Notes

Unit/Integration tests are located under `frontend/tests/`:
- http/auth API behaviors (`http.test.ts`, `auth.test.ts`)
- Repository detail integration (`repositoryDetail.integration.test.ts`)
- Settings integration (`settings.integration.test.ts`)

To run tests (if configured in package.json):
```bash
pnpm test
```

## Environment

- `.env.example` includes `VITE_API_URL=http://localhost:3000`.
- All API requests include credentials and rely on httpOnly session cookie (`pr_tracker_session`).
- Ensure SameSite and CORS origins are aligned when testing across domains.

## Troubleshooting

- 401 on all API calls: validate CORS and cookie policies; check backend session and secrets.
- OAuth redirect issues: verify backend FRONTEND/redirect paths, and GitHub OAuth app callback URLs.
- Missing data: ensure backend seed/sync exists for repositories; run a repo sync to populate PRs/reviews.

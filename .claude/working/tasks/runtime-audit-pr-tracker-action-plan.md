# PR Tracker Action Plan — Prioritized Tasks with Implementation Steps

Date: 2025-08-03
Source: .claude/working/tasks/runtime-audit-pr-tracker.md

This plan organizes fixes and enhancements by priority with concrete steps, code targets, and acceptance criteria.

## Priority 0 — Restore Auth Flow End-to-End

Goal: After clicking “Sign in with GitHub”, the user lands on the requested route authenticated, without console warnings.

Tasks:
1) Frontend: Session bootstrap + cookie-based auth
   - Configure HTTP client to send credentials.
     - File: frontend/src/lib/api/http.ts
     - Ensure axios/fetch baseURL = import.meta.env.VITE_API_URL and withCredentials = true.
   - Implement app bootstrap to validate session:
     - Files: frontend/src/main.ts, frontend/src/stores/auth.ts
     - On app mount or first router navigation, call GET /auth/me. If 200, set user in pinia and proceed; else route to /login.
   - Handle callback parameters and redirect:
     - File: frontend/src/router/index.ts
     - In beforeEach, if query.auth === 'success', call /auth/me, then route to to.query.redirect ?? '/'.
     - Show a loading guard (skeleton/spinner) while validating session to avoid flicker.

2) Backend: OAuth callback + cookies + CORS for dev
   - Ensure callback sets session cookie(s) usable on localhost.
     - Files: backend/src/routes/auth.ts, backend/src/services/oauth.ts
     - Cookie flags for dev:
       - httpOnly: true
       - sameSite: 'Lax' (or 'None' with secure=false only for localhost)
       - secure: false (localhost)
       - domain: omit (use default localhost)
       - path: '/'
   - Implement/verify /auth/me:
     - File: backend/src/routes/auth.ts
     - Returns user payload when session cookie valid; 401 otherwise.
   - CORS with credentials:
     - File: backend/src/index.ts
     - Allow origin: http://localhost:5173 (exact), credentials: true, allowed headers/methods proper.

3) Router/UI polish
   - Show loading state during session check.
   - Route failures to AuthError.vue with actionable message.

Acceptance criteria:
- From a fresh browser context, clicking “Sign in with GitHub” authenticates and routes to original path.
- /auth/me returns user when logged in; 401 when not.
- No auth-related console errors/warnings.

### Brief Diff Plan (to implement now)

Frontend
1) HTTP client: send credentials
- File: frontend/src/lib/api/http.ts
- Change:
  - Set axios instance with `withCredentials: true`.
  - Ensure `baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'`.

2) Auth API helper
- File: frontend/src/lib/api/auth.ts
- Change:
  - Implement `getCurrentUser()` -> GET `/auth/me` returning `User | null`.
  - Export `getLoginUrl(target: string)` -> `${baseURL}/auth/github/login?redirect=${encodeURIComponent(target)}`.

3) Auth store
- File: frontend/src/stores/auth.ts
- Change:
  - State: `user: User | null`, `initialized: boolean`, `loading: boolean`, `error: string | null`.
  - Actions: `bootstrap()`, `setUser(user)`, `clearUser()`.
  - `bootstrap()` calls `/auth/me` once and sets state.

4) Router guard
- File: frontend/src/router/index.ts
- Change:
  - `beforeEach`:
    - If `to.query.auth === 'success'`: await `authStore.bootstrap()`; redirect to `to.query.redirect ?? '/'` (drop query).
    - For protected routes: if `!authStore.initialized`, await `bootstrap`; then if `!user`, redirect to `/login?redirect=${to.fullPath}`.
  - Provide loading indicator while awaiting bootstrap.

5) App entry
- File: frontend/src/main.ts
- Change:
  - Option A: call `authStore.bootstrap()` before `app.mount('#app')`.
  - Option B: rely on first navigation guard; optionally show splash.

6) Login view
- File: frontend/src/views/Login.vue
- Change:
  - Use `getLoginUrl()` and include `redirect` from route query (default `/`).

Backend
7) CORS with credentials
- File: backend/src/index.ts
- Change:
  - Add CORS middleware:
    - origin: 'http://localhost:5173'
    - credentials: true
    - allowed headers/methods.

8) OAuth callback cookie flags
- Files: backend/src/routes/auth.ts, backend/src/services/oauth.ts
- Change:
  - Set cookie on success:
    - httpOnly: true
    - secure: false (localhost)
    - sameSite: 'Lax' (or 'None' if required)
    - path: '/'
    - no domain
  - Redirect to frontend with `?auth=success&redirect=<original>` or directly to original.

9) /auth/me endpoint
- File: backend/src/routes/auth.ts
- Change:
  - GET `/auth/me` returns user JSON if cookie valid; 401 otherwise.

10) Auth middleware alignment
- Files: backend/src/middleware/auth.ts, backend/src/utils/errors.ts
- Change:
  - Ensure consistent cookie reading and 401 response format.

Testing & Acceptance
- Fresh browser context -> / -> /login.
- Click Sign in with GitHub -> return authenticated to original route.
- /auth/me returns 200 when logged in; 401 when not.
- No auth-related console warnings.

## Priority 1 — Fix Composition API Misuse Warnings

Goal: Eliminate Vue warnings about inject()/onMounted/onBeforeUnmount usage outside setup().

Tasks:
1) Identify offending code
   - Search for imports calling inject(), onMounted, onBeforeUnmount at module top-level.
   - Likely files: frontend/src/composables/, frontend/src/stores/, frontend/src/components/ui/*, frontend/src/main.ts.

2) Refactor pattern
   - Rule: Only call inject and lifecycle hooks inside component setup().
   - For composables, export factory functions that are invoked from setup() instead of executing on import.
   - For global listeners/timers, expose init/cleanup APIs called from a root component’s setup().

3) Guard tests
   - Add unit tests to composables (vitest) to ensure they can be imported without throwing and only act when invoked from setup().

Acceptance criteria:
- No Vue warnings: inject/use lifecycle outside setup().
- All unit tests pass.

## Priority 2 — Fix modelValue Prop Type Errors

Goal: Remove “Invalid prop: type check failed for prop 'modelValue'. Expected Boolean, got Undefined.”

Tasks:
1) Locate the component(s)
   - Inspect frequently used primitives: Dialog.vue, Checkbox.vue, Switch.vue, Tabs, etc., and their parent usage.
   - Search for v-model usage without default initialization in parents.

2) Normalize props
   - For components expecting Boolean modelValue:
     - Define props with default: false.
     - Ensure emits('update:modelValue', boolean) is consistent.
   - For parent usage:
     - Initialize reactive state e.g., const open = ref(false) before passing.

3) Type alignment
   - Ensure prop types and emit typings align with Vue 3 conventions in TypeScript.

Acceptance criteria:
- No “modelValue” type warnings at runtime.
- v-model works across all primitives and dialogs in app walkthrough.

## Priority 3 — Repair Font Pipeline (Fira Code)

Goal: Fira Code fonts load without OTS parsing errors; correct fallbacks applied.

Tasks:
1) Validate font assets
   - Confirm fonts exist under frontend/public/fonts/fira-code or assets with correct filenames and valid files.
   - Replace with known-good files (woff2 preferred, woff fallback). Use official Fira Code releases.

2) CSS @font-face
   - Files: frontend/src/style.css (or global CSS importing fonts)
   - Ensure correct src URLs, format('woff2')/format('woff'), and font-weight mappings.
   - Example:
     @font-face {
       font-family: 'Fira Code';
       src: url('/fonts/fira-code/FiraCode-Regular.woff2') format('woff2'),
            url('/fonts/fira-code/FiraCode-Regular.woff') format('woff');
       font-weight: 400;
       font-style: normal;
       font-display: swap;
     }

3) MIME types and Vite dev server
   - Ensure files have .woff2/.woff extensions and live in public/ so Vite serves with correct headers.

Acceptance criteria:
- No “Failed to decode downloaded font” or OTS errors.
- Computed font-family shows Fira Code where intended.

## Priority 4 — Harden Route Guards and Loading UX

Goal: Smooth transitions during auth checks, clear error states.

Tasks:
1) Guard flow
   - In router beforeEach, if route requires auth and user unknown, trigger session check and show loading layout.
   - Redirect to /login with redirect param only after failed session validation.

2) Error routes
   - Use AuthError.vue for callback failures; display actionable troubleshooting tips.

Acceptance criteria:
- No flash of login when already authenticated.
- Clear messaging on auth failures.

## Priority 5 — Verify Protected Views Post-Auth

Goal: Ensure core features work once authenticated.

Tasks:
1) Repositories
   - Verify list fetch via src/lib/api/repositories.ts.
   - Exercise AddRepositoryDialog: open dialog, validate inputs, submit; verify list updates and error states.

2) Repository Detail
   - Load PRs, reviews; test pagination/filters; ensure skeletons and empty states.

3) Analytics
   - Charts render or show empty states gracefully; no JS errors.

4) Settings
   - Any preferences or tokens save and read back.

Acceptance criteria:
- Complete happy-path navigation across key views without console errors.
- Meaningful empty and error states.

## Priority 6 — Backend E2E and Webhooks/Sync

Goal: Validate server-side data flows align with UI.

Tasks:
1) Sync endpoints
   - Exercise /sync routes; ensure idempotency and appropriate responses.

2) GitHub webhooks
   - Provide a local verification flow with mock payloads. Validate signature handling and DB updates.

3) Health coverage
   - Extend integration tests for all route groups; ensure consistent error format.

Acceptance criteria:
- E2E smoke passes; DB reflects webhook and sync operations as expected.

## Priority 7 — Observability Enhancements

Goal: Faster troubleshooting for auth and data flows.

Tasks:
1) Backend structured logs
   - Log at auth callback: state, user id, cookie set success, redirect target.
   - Log /auth/me hits, outcomes.

2) Frontend debug logs (dev only)
   - Auth store logs state transitions and API results.

Acceptance criteria:
- Logs provide clear timeline of auth events and failures.

## Priority 8 — CI and Playwright E2E Smoke

Goal: Prevent regressions and catch runtime warnings.

Tasks:
1) Add Playwright smoke
   - Mock OAuth to set session cookie.
   - Verify landing on dashboard, repositories empty state, open “Add Repository” dialog.
   - Capture console messages; treat Vue warnings as test failures.

2) Reports and CI
   - Enable playwright HTML report.
   - Integrate with existing test scripts in frontend/package.json.

Acceptance criteria:
- Playwright smoke passes locally and in CI.
- Console warning gate keeps lifecycle misuse from reappearing.

---

## Execution Notes

- Start with Priority 0 auth work; it unblocks all downstream verification.
- Tackle Priority 1/2 in parallel where possible (localized component/composable fixes).
- After Priority 0 lands, iterate through Priority 5 verification tasks and backfill missing UI states.
- Keep changes small and test-driven; use vitest for unit, Playwright for E2E.

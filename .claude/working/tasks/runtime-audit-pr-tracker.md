# PR Tracker Runtime Audit and Gap Analysis

Date: 2025-08-03

This document captures the current runtime behavior of the PR Tracker application, observed issues from interactive browser testing, and a comparison against intended features inferred from the codebase. It concludes with prioritized, actionable next steps.

## Summary

- Backend appears to initialize and migrate DB successfully but port 3000 was already in use prior to our run attempt, suggesting an existing server instance.
- Frontend is running at http://localhost:5173 and routes unauthenticated users to /login with a GitHub OAuth link targeting the backend at http://localhost:3000/auth/github/login.
- Several frontend runtime warnings and asset errors are present (Vue injection lifecycle misuse warnings and failed font decoding).
- Login flow likely stubs/short-circuits in development (observed redirect parameter `?auth=success`), but the app remained on the login screen, indicating incomplete/placeholder auth handling on the client or blocked backend OAuth flow in this environment.

---

## Architecture and Intended Feature Set (Inferred)

Monorepo layout with shared types:
- Frontend: Vue 3 + Vite + TypeScript + Tailwind + shadcn-vue style UI primitives; pinia store; tanstack/vue-query; routes: Login, Settings, Repositories, RepositoryDetail, Analytics, Dashboard, Home; API layer in `src/lib/api/*`.
- Backend: Bun + Hono; routes: auth, repositories, pull-requests, reviews, analytics, sync, github, webhooks; services mirror routes; DB via `backend/src/db/*`.
- Integration with GitHub: OAuth service and GitHub service; sync and webhooks endpoints suggest data ingestion from GitHub and background synchronization.

Intended UX:
- OAuth-based GitHub login
- Post-login: dashboard, repositories listing/management, PR/review analytics, settings
- Command palette, sidebar navigation, accessible layout and components

---

## Browser-based Findings

Test environment:
- Frontend URL: http://localhost:5173
- Backend base URL configured by frontend: VITE_API_URL=http://localhost:3000

Entry and navigation:
- Landing redirected to: /login?redirect=/ (and later /login?redirect=/?auth=success after clicking "Sign in with GitHub")
- Top-level app shell renders: header with primary nav, sidebar with nav, footer note indicates "Layout skeleton • placeholders only • responsive: mobile-first with md+ sidebar" — implies some placeholder/incomplete sections.

Authentication flow:
- "Sign in with GitHub" link present and points to backend endpoint with redirect to the requested path.
- After clicking login link, the frontend URL updated to `/?auth=success` and then back to the login screen with `redirect=/?auth=success`, indicating:
  - Either the backend returns immediately with an auth success marker but no cookie/session is established, or
  - The frontend tries to parse `auth=success` but auth store/state is not updated, causing re-route to login, or
  - CORS/cookie issues prevent session from being recognized by the frontend.
- Result: Unable to reach authenticated routes; user remains on login screen.

Runtime console warnings and errors:
- Vue warnings:
  - "inject() can only be used inside setup() or functional components."
  - "onMounted is called when there is no active component instance to be associated with."
  - "onBeforeUnmount is called when there is no active component instance to be associated with."
  - "Invalid prop: type check failed for prop 'modelValue'. Expected Boolean, got Undefined."
- Asset errors:
  - Failed to decode downloaded fonts: FiraCode Regular/Bold/Medium (OTS parsing error: invalid sfntVersion)
- Vite HMR connects and works.

Impact of warnings:
- The composition API misuse warnings suggest some composables or component-level hooks are invoked outside of setup() (or before component context exists). This can lead to non-reactive behavior, event listeners not being cleaned up, and subtle bugs.
- The modelValue type error indicates improper v-model binding or default prop handling in a UI primitive (likely a dialog, switch, or checkbox).
- Font decode failures indicate either invalid/corrupted font files, incorrect MIME types, or wrong font formats/paths.

---

## Gaps and Missing Features

1. Auth lifecycle handling gap
   - Frontend remains on login screen despite apparent `auth=success` redirect flow.
   - Likely missing handling of callback parameters or cookie-based session verification (e.g., calling `/auth/me` and storing user in pinia).
   - No visible failure UI for auth errors beyond redirect.

2. Placeholder layout elements
   - Footer note indicates skeleton/placeholder; suggests parts of the app shell (sidebar filters, content placeholders) are not wired to actual data.

3. Repository/PR data flows unverified
   - Due to blocked auth, repositories view, repository detail, PR lists, reviews, analytics could not be exercised.
   - Sync, webhook, and analytics endpoints not verified from UI.

4. Error handling and accessibility
   - ErrorBoundary component exists, but no observed error to trigger it; unclear if API errors surface meaningful UI states.
   - Accessibility warnings not observed, but lifecycle misuse can break semantics/ARIA behavior; requires audit.

5. Font and asset pipeline
   - Fira Code font decoding failures across multiple weights.
   - Missing local font formats or incorrect headers from Vite dev server static handling.

---

## Broken or Incomplete Functionality

- Authentication loop: Clicking "Sign in with GitHub" did not transition the UI to an authenticated state; the app remained on the login page with adjusted redirect params.
- Composition API usage errors:
  - inject/use lifecycle hooks outside component setup context.
  - modelValue prop invalid type (Boolean expected, undefined provided).
- Fonts fail to load: OTS parsing errors for Fira Code fonts (Regular/Bold/Medium), causing typography fallbacks.

---

## Specific Issues Observed

1) Auth redirect not completing
- Steps: Visit /, redirected to /login; click "Sign in with GitHub"
- Observed: URL flips to /?auth=success then returns to /login?redirect=/?auth=success; no authenticated session in UI.
- Hypotheses:
  - Backend did not set HttpOnly cookie (domain/secure/sameSite), or Playwright context blocked cross-site cookies.
  - Frontend lacks callback handling to exchange code/state or validate session via `/auth/me`.
  - Dev stub `?auth=success` not wired to update auth store.

2) Vue runtime warnings
- "inject() can only be used inside setup()": likely from a composable or plugin invoked at module top-level or outside a component (e.g., composable that calls inject() when imported).
- "onMounted/onBeforeUnmount called when there is no active component instance": lifecycle hooks used outside setup, possibly in utility or store files.
- "Invalid prop modelValue": some UI component expects a Boolean v-model but receives undefined. Candidates include Dialog, Checkbox, Switch, Tabs, etc.

3) Font pipeline errors
- Fira Code woff/woff2 fail to decode; may be corrupt, wrongly encoded, wrong path in CSS, or served with incorrect MIME type.

---

## Comparison: Implementation vs Intended Requirements

Requirement (inferred) | Current State | Delta
-----------------------|---------------|------
GitHub OAuth login | Link exists; redirect loop keeps user on login | Session establishment and/or client-side auth handling incomplete
Repositories management (list/add/detail) | Components exist; protected routes | Not reachable without auth
PR and review analytics | Views/components exist | Not reachable; data/API flows unverified
Sync and GitHub webhooks | Backend routes present | Not verified E2E; no UI indications tested
UI/Design system (shadcn-vue style) | Many primitives implemented | Some primitives show prop type issues (modelValue), lifecycle misuse
Accessibility | A11y components (LiveRegion) included | Lifecycle misuse may harm a11y patterns; needs audit
Assets/Fonts | Custom font paths for Fira Code | Failing to load; fallback fonts in use

---

## Root Cause Leads

- Frontend auth store and http client
  - Check `frontend/src/stores/auth.ts` for session bootstrap on app load and response to `auth=success`.
  - Check `frontend/src/lib/api/auth.ts` and `http.ts` for baseURL, withCredentials, and `/auth/me` usage.
  - Verify router guards in `src/router/index.ts` enforce login but allow callback handling.

- Backend auth endpoints
  - `backend/src/routes/auth.ts` and `services/oauth.ts`: ensure callback sets cookie/session and responds with proper redirect to frontend origin, with sameSite=Lax/None as needed for local dev.
  - CORS and cookie flags for localhost: ensure domain, secure, and sameSite configurations work in dev.

- UI primitive modelValue prop
  - Identify components using v-model without default value or proper prop typing; ensure Boolean defaults or mark prop as optional with defined defaults.

- Composables using inject/onMounted
  - Search for composables calling inject() or onMounted at module top-level; refactor to only call within setup() and return closures that can be invoked later.

- Font files
  - Inspect /fonts/fira-code assets under frontend/public or src; validate file integrity and correct import paths. Ensure correct MIME types via Vite (use .woff2, .woff, correct url()).

---

## Recommended Next Steps (Actionable)

1) Fix auth end-to-end (High)
- Frontend:
  - In router beforeEach or app bootstrap (main.ts), handle `auth=success` or backend callback route by calling `GET /auth/me` to validate session and populate pinia store.
  - Configure Axios/fetch with `withCredentials: true` to send cookies.
  - Update store to persist user and route to requested path (`redirect` query) after successful validation.
- Backend:
  - Ensure OAuth callback sets secure cookie flags suitable for localhost dev:
    - sameSite: "Lax" or "None" with secure false in dev; domain unset for localhost.
  - Add CORS middleware to allow credentials from http://localhost:5173 and set `Access-Control-Allow-Credentials: true`.
  - Provide `/auth/me` endpoint returning user info when cookie is valid.

2) Resolve Vue lifecycle/inject usage warnings (High)
- Audit composables and any plugin code to ensure inject(), onMounted, onBeforeUnmount are only called inside setup() of components.
- Refactor offending code to export functions that are called from setup() rather than invoking at import time.
- Add unit tests for these composables to catch misuse.

3) Fix modelValue prop type errors (Medium)
- Locate component(s) emitting "Invalid prop: modelValue expected Boolean, got Undefined".
- Provide default values or ensure parent passes explicit v-model values.
- Align prop types with usage (Boolean vs string/number).

4) Repair font pipeline (Medium)
- Replace Fira Code font files with verified woff2/woff sources.
- Confirm public/ or assets/ path and CSS @font-face src URLs match files.
- Verify correct MIME types via Vite; avoid TTF if not needed; prefer woff2.
- Test in dev and build preview.

5) Implement robust route guards and loading states (Medium)
- While checking session, show spinner/loading route state instead of dumping user to login immediately.
- On auth failure, route to AuthError.vue with actionable messaging.

6) Verify protected views after auth (Medium)
- Repositories: ensure list loads via `src/lib/api/repositories.ts`; AddRepositoryDialog creates repo; error and empty states present.
- RepositoryDetail: verify PRs, reviews, pagination/filters; ensure analytics tiles render.
- Settings: verify API tokens or preferences persist.
- Analytics: ensure charts load and handle no data.

7) Backend E2E checks (Medium)
- Test sync endpoints and webhook route signatures with mock GitHub payloads.
- Validate DB migrations idempotency and seed paths for dev fixtures.
- Add health endpoint coverage in tests for all route groups.

8) Improve observability (Low)
- Add structured logs around auth callback, cookie set, and `/auth/me` to troubleshoot env issues quickly.
- Include client-side logging in auth store during bootstrap.

9) CI and Playwright e2e smoke (Medium)
- Add a Playwright test that:
  - Mocks OAuth to set a session cookie in dev and verifies navigation to dashboard.
  - Checks repositories list empty state and add flow dialog appears.
  - Captures console warnings as test failures for lifecycle misuse.

---

## Candidate Code Targets to Inspect/Modify

- frontend/src/stores/auth.ts
- frontend/src/lib/api/http.ts
- frontend/src/lib/api/auth.ts
- frontend/src/router/index.ts
- frontend/src/main.ts
- frontend/src/components/ui/* components using v-model (Dialog, Switch, Checkbox, Tabs)
- frontend/src/style.css or wherever @font-face is declared; verify fonts folder under public/
- backend/src/routes/auth.ts
- backend/src/services/oauth.ts
- backend/src/middleware/auth.ts
- backend/src/index.ts (CORS and cookie settings)
- backend/src/utils/errors.ts (standardize error responses)

---

## Acceptance Checks After Fixes

- From a fresh browser context:
  - Navigate to /, click "Sign in with GitHub"; after callback, user lands on / (or redirect target) with sidebar and dashboard visible.
  - No Vue warnings appear in console.
  - No font decode errors; computed font-family includes Fira Code where expected.
  - Repositories page loads without auth redirects; empty state instructs to add repo; "Add Repository" dialog opens; form validation works.
  - Analytics page shows loading -> data/empty state without errors.

---

## Notes from Attempted Local Run

- Backend bun dev indicated "Failed to start server. Is port 3000 in use?" but logs before that showed DB connection and migration succeeded. This implies an existing backend server already bound to port 3000. Confirm single instance to avoid port conflicts.

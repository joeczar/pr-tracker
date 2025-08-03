# E2E Test Plan: PR Tracker

Goal: Define end-to-end coverage to validate core user flows across all routes with deterministic, resilient tests.

## Routes and Critical Flows

Protected routes are guarded; unauthenticated users should be redirected to /login. Base URL assumed from dev server (Vite).

- Public
  - /login (Login)
  - /auth-error (OAuth Error)
- Protected
  - / (Dashboard or Home within AppShell)
  - /repositories (Repositories list)
  - /repositories/:id (Repository Detail)
  - /analytics (Analytics)
  - /settings (Settings)
- Global
  - AppShell navigation and user menu
  - Command Palette
  - Error Boundary fallback
  - 404 (Unknown route)

## Global Scenarios

1) Auth guard
- Unauthed visiting protected route redirects to /login
- Authed visiting /login redirects to default route (e.g., /repositories or /dashboard)

2) AppShell
- Navbar renders user identity, primary nav; active route highlighted
- Clicking nav items navigates to correct pages (no full reload)
- Logout clears auth state and redirects to /login

3) Command Palette
- Opens via keyboard shortcut (e.g., mod+k)
- Filters commands as you type
- Can navigate to a route from palette
- Closes on escape

4) ErrorBoundary
- When a child throws, fallback UI is shown with recover action
- Recover action resets component and resumes normal render

5) 404
- Unknown route renders NotFound with link back to a safe route

## Page Scenarios

### Login (/login)
- Redirect flow: visiting a protected route when unauthenticated lands on /login and shows info message
- Successful login: submit credentials or click "Sign in with GitHub" mock; store updated; redirected to default route
- Failed login: shows error state and remains on /login
- Already authenticated: visiting /login redirects to default route

### OAuth Error (/auth-error)
- Renders friendly message with reason if query param present
- Link back to login navigates to /login

### Dashboard or Home (/)
- Loads key metrics for the user
- Loading state visible, success renders Metric tiles/charts
- Failed fetch shows toast/error message and retry works

### Repositories (/repositories)
- Loads repository list with cards
- Empty state rendered when none
- Add Repository flow:
  - Open dialog, validate inputs, submit, success toast, list updates with new repo
  - Failed submit shows errors and no list change
- Card navigation to Repository Detail
- Fetch failure shows toast and retry refetch works

### Repository Detail (/repositories/:id)
- Valid ID loads PRs; loading skeleton shows, then data
- Invalid ID shows not found or redirect to list
- PR list:
  - Filters (open/closed) update list; persists via query params/localStorage if applicable
  - Pagination or lazy loading works
- Review actions:
  - Approve/Request changes mocked success updates UI
  - Mocked failure shows toast and reverts state
- Sync button triggers backend sync; on success refreshes list; on failure shows toast
- Breadcrumb/back navigation returns to Repositories and preserves previous filters

### Analytics (/analytics)
- Renders MetricTile, TrendChart, ProgressRadial with default date range
- Changing date range/repo filters triggers refetch and updates visuals
- Error during fetch shows toast; retry works
- Deep-linking via query params restores selected date range and filters

### Settings (/settings)
- Loads current settings
- Toggling options and saving persists via API and shows success toast
- Validation errors rendered inline; general API error shows toast
- Navigating away with unsaved changes prompts and respects user choice
- If API token regeneration exists: clicking regenerate shows new token (masked by default), copy-to-clipboard works, security caveats noted

## Test Data and Mocking Strategy

- Deterministic network using test runner request interception:
  - /auth/*: login, logout, user profile
  - /repositories: list, create
  - /repositories/:id: detail
  - /pull-requests for a repository: list, actions
  - /reviews: actions
  - /analytics: metrics, trends
  - /sync: repository sync trigger
- Fixtures for each endpoint:
  - happy.json, empty.json, error.json variants
  - repo-detail/{open.json, closed.json}
  - analytics/{default.json, error.json}
- State seeding helpers:
  - setAuth(): seed cookie/localStorage for authenticated sessions
  - clearAuth(): ensure logged-out
  - seedQueryParams(): apply deep-link state

## Tooling and Structure

- Runner: Playwright
- Directory structure:
  frontend/e2e/
    - fixtures/
      - auth/
      - repositories/
      - repo-detail/
      - pull-requests/
      - reviews/
      - analytics/
      - sync/
    - helpers/
      - auth.ts (login state helpers)
      - api.ts (route mocks: page.route with fixtures)
      - ui.ts (selectors and shared interactions)
      - a11y.ts (axe checks)
      - state.ts (query/localStorage seeds)
    - specs/
      - auth.spec.ts
      - shell.spec.ts
      - repositories.spec.ts
      - repo-detail.spec.ts
      - analytics.spec.ts
      - settings.spec.ts
      - command-palette.spec.ts
      - error-boundary.spec.ts
      - not-found.spec.ts
    - playwright.config.ts
- Projects: chromium, webkit (firefox optional)
- baseURL from environment (Vite dev server); use reuseExistingServer for local dev

## Accessibility Checks

- Integrate axe-core for critical pages:
  - Login, Repositories, Repository Detail, Analytics, Settings
- Include checks for:
  - Proper roles and names on interactive elements (buttons, links, dialog)
  - Labels and descriptions on form fields
  - Dialog focus trap and aria-labelledby for DialogTitle
  - Command palette semantics and keyboard handling
  - Color contrast on key UI elements (if automated checks feasible)

## Performance Smoke

- Use Playwright trace, measure first render heuristics:
  - Wait for key landmark presence and network idle
  - Optionally inject performance marks in app under test for route mounts
  - Enforce soft thresholds to catch regressions (non-blocking)

## Flake Prevention

- Avoid arbitrary waits; rely on getByRole/getByText and expect polls
- Prefer accessible selectors over test ids; only use test ids when necessary
- Disable CSS animations/transitions via a test theme or global style in test env
- Stabilize network via mocks; fail fast on unexpected calls
- Reset storage between tests; isolate state

## Example Specs Outline

auth.spec.ts
- redirects unauthenticated users to /login
- successful login redirects to default with user shown in AppShell
- failed login shows error and remains on /login
- visiting /login when authenticated redirects to default

shell.spec.ts
- navbar contains routes and highlights active
- logout clears auth and redirects to /login

repositories.spec.ts
- loads repositories and renders cards
- empty state renders with add CTA
- add flow saves and updates list; error shows toast
- clicking a card navigates to detail

repo-detail.spec.ts
- valid repo loads PRs and filters work
- invalid repo id shows not found
- review action success updates UI; failure shows toast
- sync trigger refreshes list; failure shows toast

analytics.spec.ts
- charts render with default data
- changing date range updates charts
- error fetch shows toast and retry works
- deep-link via query params restores state

settings.spec.ts
- loads settings; toggles save and persist
- validation and API error handling
- unsaved changes prompt on navigation
- token regeneration flow if applicable

command-palette.spec.ts
- opens via shortcut, filters, navigates to route, closes on escape

error-boundary.spec.ts
- simulated child error shows fallback; recover resumes

not-found.spec.ts
- unknown route renders 404 and back link navigates to safe route

## Mock Matrix (per route)
- Auth: unauthenticated, authenticated
- Data: empty, typical, large
- API: success (200), client error (400/401/403), server error (500)
- Feature flags: if present, off/on for analytics or beta features

## CI Integration
- Add Playwright to frontend package, run in CI across chromium/webkit
- Artifacts: HTML report, traces, videos/screenshots on failure
- Ability to run with real backend disabled by default; separate job for smoke against dev backend if needed

## Playwright Role-based Testing (No data-testid)

This project will use Playwright Testing Library-style, accessibility-first selectors, avoiding brittle data-testids. Prefer queries by accessible role, name, label, and semantic landmarks.

Key query APIs:
- getByRole(role, options): primary API; matches ARIA roles and accessible names.
- getByLabel(text): for form controls associated with a label.
- getByPlaceholder(text): for inputs with placeholder text.
- getByText(text): for visible text content when roles are not appropriate.
- getByTitle(text): for title attribute based matches.
- getByAltText(text): for images (img) alternative text.
- getByTestId: avoid; only as last resort when no semantic handle exists.

Common roles and practices:
- Buttons: page.getByRole('button', { name: /save/i })
- Links: page.getByRole('link', { name: 'Repositories' })
- Headings: page.getByRole('heading', { level: 1, name: /analytics/i })
- Dialogs/Modals: page.getByRole('dialog', { name: 'Add Repository' })
  - Ensure Dialog has aria-labelledby via DialogTitle for a name.
  - Interact within dialog: dialog.getByRole('button', { name: 'Submit' })
- Forms and fields:
  - Labels: page.getByLabel('Repository URL')
  - Combobox/Select: page.getByRole('combobox', { name: 'Repository' })
  - Checkbox: page.getByRole('checkbox', { name: 'Enable sync' })
  - Radio: page.getByRole('radio', { name: 'Open PRs' })
- Navigation and landmarks:
  - Navigation: page.getByRole('navigation')
  - Main: page.getByRole('main')
  - Search: page.getByRole('search')
- Tables and lists:
  - Table: page.getByRole('table').getByRole('row')
  - List: page.getByRole('list').getByRole('listitem')

Text matching tips:
- Use regex with /i for case-insensitive matches.
- Prefer exact: false to allow flexible names, e.g., { name: /add repo/i, exact: false }.
- Scope to containers to avoid ambiguity:
  - const dialog = page.getByRole('dialog', { name: 'Add Repository' })
  - await dialog.getByRole('button', { name: 'Submit' }).click()

ARIA and app responsibilities:
- Ensure components expose correct roles/names:
  - Buttons and links must have discernible text (or aria-label).
  - Dialog content should have DialogTitle connected via aria-labelledby.
  - Icon-only buttons need aria-label or an accessible name via aria-labelledby.
  - Command palette should have role="dialog" or "listbox" appropriately with labeled input.
- Avoid role collisions; do not over-assign ARIA roles when native semantics suffice.

Examples aligned to app:

Login
- await page.getByRole('heading', { name: /sign in/i })
- await page.getByRole('button', { name: /sign in with github/i }).click()

AppShell nav
- await page.getByRole('navigation').getByRole('link', { name: 'Repositories' }).click()
- await expect(page.getByRole('link', { name: 'Repositories' })).toHaveAttribute('aria-current', /page|true/)

Repositories
- await page.getByRole('heading', { name: /repositories/i })
- await page.getByRole('button', { name: /add repository/i }).click()
- const dialog = page.getByRole('dialog', { name: /add repository/i })
- await dialog.getByLabel('Repository URL').fill('https://github.com/org/repo')
- await dialog.getByRole('button', { name: /save|add/i }).click()

Repository Detail
- await page.getByRole('heading', { name: /pull requests/i })
- await page.getByRole('tab', { name: /open/i }).click()
- await page.getByRole('button', { name: /sync/i }).click()
- await page.getByRole('button', { name: /approve/i }).click()

Analytics
- await page.getByRole('heading', { name: /analytics/i })
- await page.getByRole('combobox', { name: /date range/i }).click()
- await page.getByRole('option', { name: /last 30 days/i }).click()

Settings
- await page.getByRole('heading', { name: /settings/i })
- await page.getByRole('checkbox', { name: /notifications/i }).check()
- await page.getByRole('button', { name: /save/i }).click()

Command Palette
- await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
- const palette = page.getByRole('dialog', { name: /command palette/i })
- await palette.getByRole('textbox', { name: /search/i }).fill('repo')
- await palette.getByRole('option', { name: /repositories/i }).click()

Error handling and toasts:
- If toasts are not announced via roles, consider getByText with visible match.
- Prefer role="alert" for error toasts, then:
  - await expect(page.getByRole('alert', { name: /failed/i })).toBeVisible()

Assertions (typical):
- await expect(page.getByRole('heading', { name: /repositories/i })).toBeVisible()
- await expect(page.getByRole('button', { name: /save/i })).toBeEnabled()
- await expect(page.getByRole('status')).toContainText(/loading/i) // if using role="status" during loading

Cross-browser considerations:
- Use roles that are supported by webkit/chromium; avoid relying on shadow DOM internals.

References:
- Playwright getBy* locators: https://playwright.dev/docs/locators#locate-by-role
- ARIA roles: https://www.w3.org/TR/wai-aria-1.2/#roles

## Next Steps (Implementation)
1) Scaffold Playwright in frontend/e2e with config and example spec
2) Build helpers for auth and network interception with fixtures
3) Add initial specs for auth, shell, repositories happy path using role-based queries
4) Expand to error cases, repo detail actions, analytics, settings, global features
5) Wire into CI with reports and artifacts

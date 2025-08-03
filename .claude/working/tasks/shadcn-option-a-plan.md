# UI Redesign — Option A (shadcn-vue refresh + modern refactor)
Owner: Cline (AI)
Mode: Incremental implementation with Playwright checks after each view

Executive Summary
We will deliver a sleek modern dev tool UI using shadcn-vue primitives and a cohesive cyberpunk-lite theme. This document is an execution tracker with verifiable steps and acceptance criteria. If progress remains unsatisfactory, Option B proposes a greenfield UX with tighter design constraints.

Ground Truth (verified via Playwright MCP)
- Vite server available: http://localhost:5173
- Theme system: initializes and applies scheme: light (from console logs)
- /repositories: renders header ASCII, add-repo card, empty state; no figlet warnings; no console errors
- /: dashboard renders; now using shadcn for metrics/cards/buttons (implemented)
- /repositories/:id: repository detail renders with shadcn cards for loading/error/metrics/PR list (implemented)

Shadcn-vue Baseline
- components.json schema OK and CLI validated previously
- Installed primitives: button, card, input, select, badge, dropdown-menu, table, alert, tooltip, skeleton, sheet
- Tailwind theme layer present in src/style.css with utilities: glass-panel, card-cyber, btn-neo, neon, ring-neon, content-grid

Current Implementation Status
1) Dashboard (DONE phase 1)
- Replaced legacy .btn/.card classes with shadcn Button/Card/Alert/Badge
- Applied content-grid, neon headings, glass-panel, card-cyber, btn-neo
- Removed invalid Badge variants (success) to pass types
Validation: Playwright navigation to / shows new structure and clean console

2) Repository Detail (DONE phase 1)
- Replaced Terminal layout with shadcn Cards
- Implemented Loading, Error, Metrics grid, Recent PRs list using shadcn primitives
- Fixed SFC structure and bound pullRequests via computed
Validation: Playwright navigation to /repositories/1 loads page; theme/console healthy

3) Repositories (UNCHANGED this pass)
- Already in acceptable state; no console warnings; add flow visible

4) Login (UNCHANGED)
- Route presently leads to app shell; will implement centered Card next

Gaps and Issues To Address
- Mobile navigation: Sheet-based drawer not yet integrated into AppShell
- Repository Detail: PR state badges styling could be richer (map states to outline/success/destructive or custom classes)
- Table semantics: Repository Detail still uses cards for PR items; target is shadcn Table with sortable headers and scope="col"
- Accessibility: Run headings/order/contrast sweep and prefers-reduced-motion audit
- Snapshot validation: Expand Playwright checks to confirm interactive affordances (focus rings, keyboard nav)

Plan — Incremental Milestones with Acceptance Criteria
[Progress Legend] TODO | IN PROGRESS | DONE (phase 1) | DONE (validated)

M1: Mobile Nav via Sheet (AppShell)
M1: Mobile Nav via Sheet (AppShell) — DONE (phase 1)
- Implemented Sheet, SheetTrigger, SheetContent to render sidebar on small screens in AppShell.vue
- Wired v-model:open to existing mobileOpen; preserved ARIA labeling
- Relied on shadcn/reka-ui dialog primitive for focus trap and Escape handling
Validation: Manual run on http://localhost:5175 showed trigger present; no new console errors beyond existing auth CORS warnings. Playwright a11y test pending.
Acceptance delta: Add Playwright to assert open/close, focus trap, and Escape close.

M2: Repository Detail Table
- Replace card list with shadcn Table: thead>tr>th[scope=col], tbody rows from pullRequests
- Sorting on state and created_at (client-side)
- Status Badge mapping (open=default/green border, merged=secondary/purple tint, closed=destructive/red)
Acceptance: Playwright – table appears with headers, click header toggles sort; rows re-order; no console errors

M3: Login Page
- Centered Card with primary CTA (Sign in with GitHub), subtle ambient background (content-grid + glass-panel)
- Clear heading/landmark structure
Acceptance: Playwright – /login renders centered card, primary button focus-visible, contrast AA

M4: Dashboard Polish
- Extract MetricCard component using shadcn Card with prop-driven icon/trend
- Tighten spacing and ensure heading hierarchy
Acceptance: Playwright – dashboard renders with extracted MetricCard; keyboard traversal sane

M5: Accessibility & Visual QA
- Global focus-visible rings, motion-reduction, heading/landmark audit
- Contrast audit for neon/rings on both themes
Acceptance: Playwright – scripted checks pass; no runtime console warnings across routes

Playwright MCP Validation Script (to run per milestone)
- Navigate to route under test (/, /repositories, /repositories/:id, /login)
- Read console logs; assert no warnings/errors (ignore known auth CORS during local dev)
- For interactive milestones (Sheet, Table sorting): execute DOM interactions and confirm expected state changes

Pending validation tasks:
- Add Playwright test: open Sheet via trigger (role="button", name=/open navigation/i), assert dialog is visible and focus trapped; press Escape to close; assert no console errors.
- Record run artifacts and update status to DONE (validated) once passing.

Decision Gate: Should we start from scratch? (Option B)
If visual cohesion or UX still falls short after M1–M3, pivot to Option B: Greenfield shadcn-vue UI kit
- Scaffold minimal fresh views using only shadcn primitives and the cyberpunk-lite design tokens
- Migrate feature logic piece-by-piece into new views
Pros: Tighter, cleaner UI with fewer legacy constraints
Cons: Higher refactor scope; temporary feature parity gaps
Trigger: If two successive MCP validations show recurring UX/structure issues or if design coherence remains unsatisfactory to the stakeholder

Definition of Done
- All key views (Dashboard, Repositories, Repository Detail, Login) built with shadcn-vue primitives
- Mobile nav via Sheet working with full a11y
- Repository Detail uses shadcn Table with sorting and proper semantics
- Visual polish consistent: glass panels, neon accents, spacing/typography coherent
- Accessibility: headings/roles/focus/contrast AA; prefers-reduced-motion respected
- No console warnings in normal navigation
- Playwright MCP checks recorded as clean for each route

Execution Notes
- Keep Badge variants to allowed types ("default" | "destructive" | "outline" | "secondary")
- Prefer stateless presentational components (e.g., MetricCard) to reduce duplication

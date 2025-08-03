# shadcn-vue Migration Tracker

Purpose: Track progress of replacing custom components with shadcn-vue equivalents, ensuring consistency, accessibility, and incremental adoption.

## Legend
- [ ] Not started
- [~] In progress
- [x] Done
- (n/a) Keep custom

## Phase 1 — Install and Base Primitives
- [x] Install shadcn-vue and configure generators
- [x] Generate base primitives: Button, Card, Input, Label, Separator, Badge
- [x] Add cn/tw-merge utility alignment with `frontend/src/lib/utils.ts`
- [x] Add docs note in DESIGN_SYSTEM.md

## Phase 2 — Dropdown Menu
- [x] Replace custom dropdown components:
  - [x] `frontend/src/components/ui/dropdown-menu/*` (generated via shadcn; matches official exports)
- [x] Keep index barrel path compatibility (exports/index mappings)
  - Verified index barrel re-exports: DropdownMenu, Trigger, Content, Item, Label, Separator, Group, Sub, SubTrigger, SubContent, CheckboxItem, RadioGroup, RadioItem, Shortcut, Portal.
- [x] Verify keyboard nav and focus-trap behavior
  - Verified via reka-ui under the hood; AppShell trigger uses Button asChild, content aligned end. Arrow keys/esc/roving tabindex work.
- [x] Update callsites (if prop/slot differences)
  - AppShell import/usage already aligned with shadcn-vue API.
- [x] Add user/menu dropdown in `AppShell.vue` (header actions)
  - Implemented user avatar button, menu items, and separators; aligns right.
  - Note: Confirmed exports parity with shadcn-vue docs; no custom overrides required.

## Phase 3 — Dialog / Modal
- [x] Convert `frontend/src/components/repositories/AddRepositoryDialog.vue` to shadcn Dialog
- [x] Replace inputs inside with Input/Label/Button
- [x] Optional: Integrate shadcn Form + Zod for validation
  - Implemented: Added Zod schema, `ui/form` primitives (FormItem/Label/Control/Message), disabled submit until valid.
- [ ] Replace ad-hoc overlays elsewhere with shadcn Dialog where applicable

## Phase 4 — Buttons
- [x] Replace `frontend/src/components/ui/terminal/TerminalButton.vue` internals with shadcn Button
- [~] Migrate ad-hoc buttons across views to shadcn variants
  - Implemented: Migrated AppShell mobile sidebar toggle to `ui/button` (outline, icon size).
  - Next: Review Dashboard/Settings for ad-hoc buttons and migrate if any.
- [x] Preserve terminal/cyber theme via Tailwind classes
- [x] Audit for remaining non-shadcn button usage in views (Login/Settings/Dashboard)
  - Implemented: Repo-wide grep; only remaining raw button is inside `ui/command/CommandItem.vue` (primitive), intentionally left as native button.

## Phase 5 — Cards & Badges
- [x] Repository cards to shadcn Card (+ Badge for status)
  - [x] `frontend/src/components/repositories/RepositoryCard.vue`
- [x] Metric tiles to shadcn Card (+ Badge/Tooltip for trend)
  - [x] `frontend/src/components/analytics/MetricTile.vue`
- [x] Chart containers to shadcn Card
  - [x] `frontend/src/components/analytics/TrendChart.vue`
  - [x] Adopt `ui/badge` where status/trend labels are present

## Phase 6 — Command Palette
- [x] Port `frontend/src/components/ui/terminal/CommandPalette.vue` to shadcn Command
  - Implemented new `frontend/src/components/ui/command/CommandPalette.vue` using local `ui/command` primitives; integrated in `AppShell.vue` with v-model and navigation on select
- [x] Keep terminal styling; confirm keyboard navigation & a11y parity
  - Teleported overlay with backdrop; ESC to close handled globally; roving focus via Command primitives.
- [~] Wire with `useCommandPalette.ts`
  - Added optional dynamic import hook in CommandPalette.vue to consume composable if present; falls back to static items.
- [x] Map palette items to routes/actions; keep terminal theme via classes
  - Note: Using `ui/command` structure (Command, CommandInput, CommandList, CommandItem, CommandGroup)
  - Next: Replace minimal local primitives with generated shadcn-vue Command components if desired; expand items and wire to composable

## Phase 7 — Views: Inputs and Layout
- [x] Login view: replace inputs and form controls
  - [x] `frontend/src/views/Login.vue` (Card, Button, Separator)
- [x] Settings view: replace toggles/inputs/selects
  - [x] `frontend/src/views/Settings.vue` (Switch, Input, Separator, Card, Button)
- [ ] Layout/App
  - [x] `frontend/src/components/layout/AppShell.vue` (Button/Dropdown/Separator in header)
    - Implemented user menu dropdown using `ui/dropdown-menu` + `ui/button`, added ⌘K shortcut button
  - [x] `frontend/src/App.vue` (wire Toast Toaster provider)

## Phase 8 — Analytics & Dashboard Enhancements
- [x] Tabs for timeframe filters (7d/30d/90d)
  - Implemented: `frontend/src/views/Analytics.vue` imports Tabs primitives and binds v-model to timeframe with 7d/30d/90d triggers.
  - Added stub data fetch wiring on timeframe change (`fetchAnalytics(tf)`), with initial load and loading state.
- [x] Tooltip/Dropdown for chart actions/info
  - [x] `frontend/src/components/analytics/TrendChart.vue`
- [x] Progress (linear) for background/sync states
  - Implemented: Repository cards show linear Progress when syncing; dynamic progress wired in `Repositories.vue` with simulated updates and completion toast.
- [~] Use Badge for state chips across analytics where helpful
  - Action: Apply `ui/badge` for trend/status chips with standardized variants.
- [x] Skeleton loaders for lists/cards where loading occurs
  - [x] Implemented in `Analytics.vue` (filters and chart placeholders)
  - [x] Implemented in `Repositories.vue` (card placeholders)

## Phase 9 — Repositories and Detail
- [x] Repositories list item actions using DropdownMenu
  - [x] `frontend/src/views/Repositories.vue` (Actions: Open, Sync Now, Delete; hover-revealed menu on each card)
- [x] Dialogs for destructive actions (confirmations)
  - Implemented in `Repositories.vue`: View-level shadcn Dialog confirm for Delete with toasts (confirm/cancel), wired from dropdown and card remove.
  - Decision: Keep a single shared dialog at view level for consistency and to avoid multiple dialog instances per card; per-card dialogs not required.
- [x] Badge standardization for repo statuses (open/merged/draft/syncing/idle/error)
  - Implemented: Standardized status→Badge variant mapping in `RepositoryCard.vue` (error→destructive, syncing→secondary, ok→default, idle→outline).
- [~] Linear Progress for repo syncing states where appropriate
  - Action: Display `ui/progress` on repository cards when `syncing === true`.
  - Next: Add actions dropdown per repo (Open, Sync Now, Delete) with shadcn Dialog confirm for Delete; wire Sync to toast + placeholder service.

## Phase 10 — System-wide UX
- [x] Toast system (success/error feedback) — Toaster mounted in `frontend/src/App.vue`
- [x] Skeleton loaders (lists, analytics, cards)
- [~] Separator standardization across forms/headers
  - Status: Current audit found no obvious ad-hoc separators to replace. Keep watch and replace with `ui/separator` as forms/headers evolve.
- [x] Wire `use-toast` in flows (add repo success/error, sync started/completed)
  - Implemented: Add Repo success/error, Sync started/completed, Delete confirmed/canceled toasts in `Repositories.vue`.

## Keep as Custom (n/a)
- (n/a) `frontend/src/components/analytics/ProgressRadial.vue` (radial; keep, add shadcn Progress for linear usage)
- (n/a) `frontend/src/components/accessibility/LiveRegion.vue` (a11y enhancement; keep)
- (n/a) Terminal theme wrappers: 
  - `frontend/src/components/ui/terminal/TerminalWindow.vue`
  - `frontend/src/components/ui/terminal/TerminalHeader.vue`
  - `frontend/src/components/ui/terminal/TerminalTitle.vue`
  - `frontend/src/components/ui/terminal/TerminalIcon.vue`
  - Note: Use shadcn primitives inside where possible (Button, Tooltip, Separator, DropdownMenu)

## Dependencies / Setup Notes
- Ensure Tailwind config includes shadcn tokens and themes
- Confirm class-variance-authority (cva) setup if used
- Align `utils.ts` with shadcn's `cn` pattern
- Generators configured at `frontend/components.json`; components live under `frontend/src/components/ui/*`
- Dropdown, Dialog, Button, Card, Badge, Tabs, Skeleton present; Command present (local primitives aligned)

## Risks / Mitigations
- API differences in dropdown/dialog may require minor callsite updates → mitigate via index barrel and wrapper props
- Visual regressions due to spacing/radius defaults → snapshot review and targeted overrides
- A11y regressions → use shadcn primitives to improve consistency and test with keyboard/screen reader

## Links
- shadcn-vue docs: https://www.shadcn-vue.com/
- Components generator config: `frontend/components.json`

## Next Implementation Steps (quick pick-up)
- [x] Add zod + shadcn Form to `AddRepositoryDialog.vue` (schema, messages, disabled submit)
- [x] Add destructive Dialog confirm for Delete in `Repositories.vue`/`RepositoryCard.vue`; wire to toasts
  - Implemented in `Repositories.vue` (view-level dialog + toasts). Decision: per-card dialog not needed; shared dialog pattern adopted.
- [x] Standardize Badge variants for repo status in `RepositoryCard.vue`
- [x] Show linear Progress when a repo is syncing
  - Implemented in `RepositoryCard.vue`; dynamic progress simulation wired in `Repositories.vue`.
- [x] Audit and replace remaining raw buttons with `ui/button`
  - Done for AppShell mobile toggle; remaining native buttons are inside `ui/command` primitive by design.
- [x] Ensure `ui/tabs` exports and wire timeframe v-model in `Analytics.vue`
  - Verified exports present and v-model wired in `Analytics.vue`; added stub timeframe-driven fetch handler with loading state.
- [~] Replace ad-hoc borders with `ui/separator` across forms/headers
  - Current audit found no obvious ad-hoc separators to replace; keep as a watch item for future forms/headers.
- [x] Wire `use-toast` in add/sync/delete flows
  - Implemented in `Repositories.vue` (add success/error with duplicate guard, sync started/completed, delete confirm/cancel).
  - Completed in Repositories (add success/error, sync started/completed, delete confirm/cancel)

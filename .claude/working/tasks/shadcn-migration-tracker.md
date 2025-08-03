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
- [ ] Add docs note in DESIGN_SYSTEM.md

## Phase 2 — Dropdown Menu
- [ ] Replace custom dropdown components:
  - [ ] `frontend/src/components/ui/dropdown-menu/*` (generator shows files are identical; adopt official exports and remove custom overrides if any)
- [ ] Keep index barrel path compatibility (exports/index mappings)
- [ ] Verify keyboard nav and focus-trap behavior
- [ ] Update callsites (if prop/slot differences)

## Phase 3 — Dialog / Modal
- [x] Convert `frontend/src/components/repositories/AddRepositoryDialog.vue` to shadcn Dialog
- [x] Replace inputs inside with Input/Label/Button
- [ ] Optional: Integrate shadcn Form + Zod for validation
- [ ] Replace ad-hoc overlays elsewhere with shadcn Dialog where applicable

## Phase 4 — Buttons
- [x] Replace `frontend/src/components/ui/terminal/TerminalButton.vue` internals with shadcn Button
- [ ] Migrate ad-hoc buttons across views to shadcn variants
- [x] Preserve terminal/cyber theme via Tailwind classes
- [ ] Audit for remaining non-shadcn button usage in views (Login/Settings/Dashboard)

## Phase 5 — Cards & Badges
- [x] Repository cards to shadcn Card (+ Badge for status)
  - [x] `frontend/src/components/repositories/RepositoryCard.vue`
- [x] Metric tiles to shadcn Card (+ Badge/Tooltip for trend)
  - [x] `frontend/src/components/analytics/MetricTile.vue`
- [ ] Chart containers to shadcn Card
  - [ ] `frontend/src/components/analytics/TrendChart.vue`
  - [x] Adopt `ui/badge` where status/trend labels are present

## Phase 6 — Command Palette
- [ ] Port `frontend/src/components/ui/terminal/CommandPalette.vue` to shadcn Command
- [ ] Keep terminal styling; confirm keyboard navigation & a11y parity
- [ ] Wire with `useCommandPalette.ts`

## Phase 7 — Views: Inputs and Layout
- [ ] Login view: replace inputs and form controls
  - [ ] `frontend/src/views/Login.vue` (Input, Label, Button, Card)
- [ ] Settings view: replace toggles/inputs/selects
  - [ ] `frontend/src/views/Settings.vue` (Switch, Input, Select, Separator)
- [ ] Layout/App
  - [ ] `frontend/src/components/layout/AppShell.vue` (Button/Dropdown/Separator in header)
  - [ ] `frontend/src/App.vue` (wire Toast Toaster provider)

## Phase 8 — Analytics & Dashboard Enhancements
- [ ] Tabs for timeframe filters (7d/30d/90d)
  - [ ] `frontend/src/views/Analytics.vue`
- [ ] Tooltip for chart actions/info
  - [ ] `frontend/src/components/analytics/TrendChart.vue`
- [ ] Progress (linear) for background/sync states
  - [ ] Add where applicable (Dashboard/Analytics)

## Phase 9 — Repositories and Detail
- [ ] Repositories list item actions using DropdownMenu
  - [ ] `frontend/src/views/Repositories.vue`
- [ ] Dialogs for destructive actions (confirmations)
  - [ ] Add where applicable
- [ ] Badge standardization for repo statuses (open/merged/draft/syncing/idle/error)
  - [ ] `RepositoryCard.vue` and related

## Phase 10 — System-wide UX
- [x] Toast system (success/error feedback) — Toaster mounted in `frontend/src/App.vue`
- [ ] Skeleton loaders (lists, analytics, cards)
- [ ] Separator standardization across forms/headers
- [ ] Wire `use-toast` in flows (add repo success/error, sync started/completed)

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

## Risks / Mitigations
- API differences in dropdown/dialog may require minor callsite updates → mitigate via index barrel and wrapper props
- Visual regressions due to spacing/radius defaults → snapshot review and targeted overrides
- A11y regressions → use shadcn primitives to improve consistency and test with keyboard/screen reader

## Links
- shadcn-vue docs: https://www.shadcn-vue.com/
- Components generator config: `frontend/components.json`

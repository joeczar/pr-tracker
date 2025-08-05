# Task: Repository Selection & Repo View — UX Workshop and Implementation Plan

Owner: Cline
Status: In Progress
Last Updated: 2025-08-05

Goal
Design and implement a simple, clear, analytics-focused user flow for selecting repositories and PRs. The flow must be consistent across “Add Repository” and “Repository Detail” and enable multi-select of PRs across multiple repos/orgs, strictly for analytics scoping (comments, time-to-merge, trends).

Non-Goals
- Not a review workflow manager. No reviewer assignment, approvals, etc.
- No backend scope expansion in this task (we will rely on existing endpoints; add TODOs where missing).

Principles
- Analytics-first: Selection only scopes analytics views (Dashboard/Analytics).
- Consistency: Same selection affordances in Add Repo and Repo Detail.
- Visibility: Global selection summary bar appears when selection is non-empty.
- Accessibility: WCAG 2.1 AA, keyboard-first, semantic controls, LiveRegion announcements.
- Predictable: Keep users oriented; avoid hidden state changes without explicit feedback.

Current Pain Points (observed)
- AddRepo picker vs RepoDetail selection feel different and disconnected.
- Unclear “where do selected PRs go” and how to “use” them.
- Multi-select across repos exists conceptually but isn’t surfaced or managed globally.
- Repo view tools competing with Dashboard responsibilities (selection vs analytics).

Proposed Unified Flow

A) Entry Points
1) Repositories view
   - Each RepositoryCard has a prominent “Select PRs” action that deep-links to Repo Detail’s PR list.
   - Optional quick picker modal is possible later, but default is navigate to Repo Detail to keep mental model simple.

2) Add Repository flow
   - After adding, user is taken directly to Repo Detail for that repo with PR list at the top and selection controls enabled.
   - This avoids two separate “selection” UIs and teaches a single selection surface.

B) Repo Detail (canonical selection surface)
- PR list shows a checkbox on each PR row.
- Header includes:
  - “Select all on page” checkbox with aria-checked="mixed" when partial.
  - Filters (state/open/closed/all at minimum).
  - Count of selected in this repo.
- Checking PRs updates a shared selection store with composite keys (owner/repo#number or node_id).
- Selected rows are visibly highlighted; checked state persists on navigation and on returning to this view.

C) Global Selection Bar (appears when selection.count > 0)
- Summary: “N PRs selected across M repos”
- Actions:
  - Analyze Selected → navigates to Dashboard with the selected set applied (store-driven; Dashboard consumes selection).
  - Clear All → empties selection store and dismisses the bar.
  - Manage → opens a simple drawer listing selected PRs grouped by repo with remove buttons.

D) Dashboard/Analytics behavior
- If selection non-empty, scope metrics, tiles, and charts to the selected PRs; show a visible badge “Filtered by selection”.
- If selection empty, show the normal repository-wide metrics or guided empty state prompting to “Select PRs”.

Information Architecture
- Selection surface: RepositoryDetail only (and optionally during Add Repo but it routes into Repo Detail for consistency).
- Consumption: Dashboard/Analytics only.
- Repositories list: navigational; offers “Select PRs” funnel into Repo Detail.

Accessibility
- Checkboxes labeled as “Select PR #123: {title}”.
- Header checkbox manages page selection with aria-checked semantics.
- Global bar is announced via LiveRegion when it appears/updates (e.g., “3 PRs selected across 2 repositories”).

MVP Scope (target for first implementation PR)
1) Repo Detail
   - Add checkbox column to PR list.
   - Add header “Select all on page” and show count “Selected in this repo: N”.
   - Wire to selection store with composite key.

2) Selection store
   - Key: repoFullName#prNumber or GitHub node_id.
   - API:
     - add(item), remove(key), toggle(item)
     - clearAll()
     - listAll(), listByRepo(repoFullName)
     - count, repoCount
   - Optional: persist selection in session storage; no hard requirement for v1.

3) Global selection bar
   - Mount in AppShell so it’s available everywhere.
   - Shows count + actions: Analyze Selected, Clear All, Manage (drawer optional for MVP).
   - Analyze Selected → route to Dashboard (selection consumed, no new URL params required for v1).

4) Add Repository flow
   - After successful add, navigate to /repositories/:id and scroll to PR list anchor.
   - Remove any separate in-dialog PR selection widget for MVP to unify behavior.

5) Dashboard consumption
   - When selection non-empty, scope computations to selected set (client-side derivation baseline).
   - Show a clear badge “Filtered by selection (N PRs)”.

Open Questions
- Should selection persist across reload via localStorage? MVP: optional; we can implement later.
- Bulk select beyond “page” (e.g., “Select all matching filter”)? MVP: page-only, with a future expansion.

Technical Plan

Frontend touchpoints
- frontend/src/stores/selection.ts
  - Extend to support composite key and grouping helpers.
- frontend/src/views/RepositoryDetail.vue
  - Add checkbox column + header select + count; integrate with selection store.
- frontend/src/components/dashboard/SelectionControls.vue
  - Generalize for global usage; ensure actions: Analyze Selected, Clear All.
  - Mount in AppShell.
- frontend/src/components/layout/AppShell.vue
  - Render the global selection bar conditionally.
- frontend/src/views/Dashboard.vue
  - Read selection; when non-empty, apply filter logic; show “Filtered by selection” badge.

Analytics wiring
- For now, client-side filter selected PRs using the repository PR list and any available metrics endpoints.
- Add TODOs for backend PR-scoped endpoints for future accuracy and performance:
  - /api/analytics/repository/:repoId/trends?days&prIds=
  - /api/reviews/repository/:repoId/metrics?days&prIds=

States and empty/error
- Repo Detail PR list:
  - No PRs: show “No pull requests match filters.”
  - When selection contains items not on current page, keep them selected; show “Some selected PRs are not on this page” as subtle hint.
- Global selection bar:
  - Always visible when selection.count > 0; collapses to a chip on small screens.

Keyboard
- Header checkbox toggles all on page: Space toggles; Enter applies.
- Each row checkbox toggles with Space; row labels are accessible.

Phase Breakdown

Phase 1 (MVP)
- Implement Repo Detail selection checkboxes and header. [pending]
- Implement/extend selection store. [pending]
- Implement global selection bar with Analyze + Clear actions (Manage optional). [pending]
- Dashboard consumes selection (badge + scoping where feasible client-side). [pending]
- Persist selection on server (active selection) with API. [done]

Phase 2 (Usability)
- Add Manage drawer with grouped selected PRs and remove buttons. [pending]
- Persist selection to localStorage with a “restore selection?” prompt. [pending]

Phase 3 (Refinement)
- “Select all matching filter” option with confirmation and paging strategy. [pending]
- URL encoding for sharable selections (optional). [pending]

Progress

Backend
- Schema: Added tables selections, selection_items and users.active_selection_id with indexes. [done]
- Service: Implemented SelectionService (ensure/get/clear active selection, add/remove items). [done]
- Routes: Added /api/selections endpoints (active get/create/clear, add/remove items) behind requireAuth. [done]
- Server: Wired /api/selections into backend/src/index.ts. [done]

Next Frontend Tasks
- Add selections API client (frontend/src/lib/api/selections.ts): active(), ensureActive(), addItems(), removeItems(), clear(). [done]
- Wire selection store to call server endpoints with optimistic updates. [pending]
- RepositoryDetail: checkbox column + header select -> calls add/remove items. [pending]
- Global selection bar: Clear All -> DELETE /api/selections/active; Analyze -> navigate Dashboard. [pending]
- App bootstrap: hydrate selection from GET /api/selections/active. [pending]

Verification (MCP/Playwright) — Current Status
- Authenticated session GET /api/selections/active returns 200 and creates/reads active selection. [verified]
- POST /api/selections/active/items requires valid repository_id & pr_number (FK enforced). UI must send real ids from repo detail list. [verified]
- Items currently empty because UI/store not yet persisting selection to server. [identified gap]

Acceptance Criteria
- User can select PRs in Repo Detail via checkboxes and see a live global count.
- Selection persists across routes and is visible in a global bar.
- Dashboard clearly indicates and scopes to the selection.
- Flow from Add Repo to selection is linear and obvious (post-add → Repo Detail).
- Accessibility: role/label correctness; keyboard navigable; LiveRegion feedback.

Next Steps (concrete)
1) Wire Repo Detail checkboxes + header select + count into selection store.
2) Add global selection bar to AppShell with actions (Analyze, Clear).
3) Route Add Repo success to Repo Detail and focus PR list anchor.
4) Dashboard reads selection; show badge and apply scoping (initial derivations).
5) Validate with Playwright: select in Repo Detail → see global bar → Analyze → Dashboard filtered.

Notes
- This plan intentionally removes parallel selection UX from AddRepositoryPickerDialog to reduce confusion. The dialog should focus on adding and then direct the user into the unified selection surface (Repo Detail).
- Ensure LiveRegion announces both “Added to selection” and “Removed from selection” and the global summary changes.

Server-side Persistence Plan (Addendum)
Rationale
- Persisting selection server-side enables continuity across sessions/devices and unlocks efficient backend analytics (comments, time-to-merge) for selected PRs without heavy client filtering.

Data model
- Table: selections
  - id (pk)
  - user_id (fk users.id)
  - name TEXT NULL (optional; for saved/named sets later)
  - created_at, updated_at
- Table: selection_items
  - id (pk)
  - selection_id (fk selections.id)
  - repository_id (fk repositories.id)
  - pr_number INTEGER NOT NULL
  - UNIQUE(selection_id, repository_id, pr_number)
- Column: users.active_selection_id (nullable)
  - Each user may have one active “working” selection used by Dashboard/Analytics.

API surface (MVP)
- GET /api/selections/active → { selection, items }
- POST /api/selections/active → create new empty selection and set as active
- POST /api/selections/active/items → body [{ repository_id, pr_number }] add many (idempotent)
- DELETE /api/selections/active/items → body [{ repository_id, pr_number }] remove many (ignore missing)
- DELETE /api/selections/active → clear active selection (delete items; optionally delete selection row)

Backend analytics enhancements (Phase 2)
- Accept PR constraints to compute selection-scoped metrics:
  - GET /api/analytics/repository/:repoId/trends?days=&prNumbers=1,2,3
  - GET /api/reviews/repository/:repoId/metrics?days=&prNumbers=...
  - Or GET /api/analytics/selection/:selectionId/trends?days=
- Dashboard can switch from client-side derivations to server-side once available.

Frontend behavior
- On app boot, fetch active selection into store; keep store in sync with server (optimistic updates for add/remove).
- Repo Detail checkboxes call add/remove item endpoints.
- Global selection bar reflects the active server selection.
- “Clear All” calls DELETE /api/selections/active.
- Optional: “Save as…” later to name current selection and list via /api/selections.

Security/constraints
- Scope all endpoints by user_id; never expose other users’ selections.
- Enforce referential integrity on repository_id; consider adding a pull_requests table later for richer joins (not required for MVP).
- Idempotent add/remove to simplify UI.

Rollout
- Phase 1 (MVP): migrations + active selection endpoints + frontend wiring (optimistic).
- Phase 2: analytics endpoints support prNumbers/selectionId; Dashboard switches to server-side metrics when present.
- Phase 3 (optional): saved/named selections and activation workflow.

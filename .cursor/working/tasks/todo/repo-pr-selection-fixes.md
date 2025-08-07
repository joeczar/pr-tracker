## Task: Fix PR Selection Persistence and Visual Indication in Repository Detail

### Context
- Users report two issues in the Repository Detail view PR selection system:
  1) "Clear all" selection does not persist after reload.
  2) Selected PRs are not visually obvious in the list.

- Current flow: `PRList.vue` emits `update:selectedNumbers` → `RepositoryDetail.vue` calls `useSelectionStore().setSelectedPRNumbersPersisted(repoId, nums)` (optimistic + diffed persistence) and clear actions call `clearRepositorySelection(repoId)`. Hydration on enter uses `hydrateFromServer()`; deep-linking via `?pr` currently re-applies selection when PR list data changes.

### Objectives
- Ensure repo-scoped "Clear"/"Clear all" fully persist across reloads.
- Improve selected PR visual indication and accessibility in the PR list.
- Prevent deep-linked `?pr` from overwriting server state after initial application.
- Keep architecture simple and state consistent (store as single source of truth + server reconciliation when needed).

### Success Criteria / Acceptance Tests
- After selecting two PRs, reload: checkboxes remain checked; Selected PRs panel shows both items.
- Click "Clear" in list OR "Clear all" in Selected PRs panel → reload: no PRs are selected; Selected PRs panel hidden.
- Selected rows in `PRList` show clear visual highlight and expose `aria-selected="true"` and `data-selected="true"` attributes for testability.
- Deep-links `?pr=...` apply only once on first load; subsequent data refreshes do not re-apply if store already has state.
- E2E spec `repo-detail.pr-selection.spec.ts` passes consistently.

### Implementation Plan
1) RepositoryDetail deep-link guard
   - Add a one-time flag (e.g., `appliedDeepLink`) so deep-link application runs only when the store is empty and only once per navigation.
   - Update watcher that currently applies deep-link on every PR list data change to respect this guard.

2) Reconciliation after actions
   - After `sel.setSelectedPRNumbersPersisted(repoId, nums)` and after `sel.clearRepositorySelection(repoId)`, await the action, then call `sel.hydrateFromServer()` once to reconcile the store with server truth before syncing URL.
   - Ensure the call sites in `RepositoryDetail.vue` await the async store actions.

3) Selected row styling + accessibility
   - In `PRList.vue` rows, add `:aria-selected` and `:data-selected` bindings based on `selectedNumbers.includes(pr.number)`.
   - Strengthen visual styles for selected rows (e.g., add `border-cyber-accent/50 bg-cyber-accent/5` in addition to the existing ring).

4) Additional selected PRs query staleness
   - When selection becomes empty, ensure `selectedPRs` computed returns `[]` regardless of `additionalSelectedPRs` cached data, or invalidate that query explicitly after clear/replace.

5) Tests
   - Extend `frontend/e2e/specs/repo-detail.pr-selection.spec.ts`:
     - Assert that after clear + reload, no checkboxes are checked and the Selected PRs region is absent.
     - Assert visible indication via `[data-selected="true"]` count.
     - Assert deep-link applies once and does not override server/hydrated state after subsequent loads.

### Files to Edit
- `frontend/src/views/RepositoryDetail.vue`
- `frontend/src/components/repositories/PRList.vue`
- `frontend/src/stores/selection.ts` (optional small helper/use: reconcile)
- `frontend/e2e/specs/repo-detail.pr-selection.spec.ts`

### Detailed Tasks
- [ ] Add `appliedDeepLink` boolean in `RepositoryDetail.vue`; apply deep-link only if `!appliedDeepLink && sel.selectedPullRequestNumbers.value.length === 0`; set true after applying.
- [ ] Update event handlers in `RepositoryDetail.vue`:
  - [ ] `@update:selectedNumbers`: `await sel.setSelectedPRNumbersPersisted(...); await sel.hydrateFromServer(); sel.syncToUrl({ replace: true })`.
  - [ ] `@request:clear`: `await sel.clearRepositorySelection(...); await sel.hydrateFromServer(); sel.syncToUrl({ replace: true })`.
  - [ ] `@deselect` in `SelectedPRsSection`: `await sel.removeSelectedPRNumber(...); await sel.hydrateFromServer(); sel.syncToUrl({ replace: true })`.
- [ ] In `PRList.vue`, add `:aria-selected` and `:data-selected` to row wrapper, enhance selected styles with border + bg.
- [ ] Guard `selectedPRs` computed: if `sel.selectedPullRequestNumbers.value.length === 0`, return `[]`.
- [ ] Optionally invalidate/clear `additionalSelectedPRs` query after clear by key or return `enabled: false` when empty (already present) and ensure combined selection ignores stale data when empty.
- [ ] Update e2e spec to assert `data-selected` and post-clear reload behavior.

### Estimates
- Deep-link guard + await/reconcile wiring: 60–90 min
- Styling + a11y attributes: 20–30 min
- Query staleness guard: 20 min
- E2E additions and stabilization: 30–45 min

### Risks / Mitigations
- Risk: Extra server fetch after each action could add latency → We maintain optimistic UI and fetch in background; UI remains responsive.
- Risk: Over-applying deep-links → One-time guard prevents repeated overrides.

### Definition of Done
- All acceptance tests pass locally (including updated E2E).
- Visual selection is obvious and accessible.
- Manual verification: select, reload, clear, reload sequences behave consistently.

### Parking Lot (defer)
- Server-side atomic replace endpoint: `PUT /api/selections/active/repository/:repoId { pr_numbers: number[] }` to simplify FE diffs.
- Named/persisted multi-selections beyond "active" selection.



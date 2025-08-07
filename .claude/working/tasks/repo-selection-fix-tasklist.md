# PR Selection System — Fix and Improvements Task List

Context: Address two bugs in Repository Detail PR selection:
1) "Clear all" does not persist.
2) Selected PRs are not visually indicated as active/selected.

This file captures actionable tasks derived from the technical analysis to fix, simplify, and harden the selection system.

## Frontend (Vue) — Selection Store and Wiring

- [ ] Add persisted bulk update API to selection store:
  - [ ] Implement `setSelectedPRNumbersPersisted(repoId: number, numbers: number[])`
        - Compute diffs vs current selection: toAdd, toRemove.
        - Optimistically set local state to `numbers`.
        - Persist:
          - [ ] `selectionsApi.addItems(toAdd.map(n => ({ repository_id: repoId, pr_number: n })))`
          - [ ] `selectionsApi.removeItems(toRemove.map(n => ({ repository_id: repoId, pr_number: n })))`
        - Log errors; keep local state optimistic; optional re-hydrate after.

- [ ] Add repo-scoped clear method in store:
  - [ ] Implement `clearRepositorySelection(repoId: number)`
        - Optimistically set local selection to `[]`.
        - Persist by removing all currently selected numbers for that repo via `selectionsApi.removeItems`.
        - DO NOT call global `clearActive()` here.

- [ ] Deprecate global-clear usage for repo UI:
  - [ ] Keep `clearSelection()` only for account-wide reset (e.g., Settings), not for Repository Detail.

- [ ] RepositoryDetail.vue integration:
  - [ ] Replace `@update:selectedNumbers` handler to call `sel.setSelectedPRNumbersPersisted(repoId, nums)`.
  - [ ] Replace `@request:selectVisible` to compute next = unique(current + visible) and call persisted bulk setter.
  - [ ] Replace `@request:clear` to call `sel.clearRepositorySelection(repoId)`.
  - [ ] Update SelectedPRsSection `@clear` to use `sel.clearRepositorySelection(repoId)`.
  - [ ] Remove calls that set repository after clear; rely on route watcher to manage repo context.

- [ ] Optional hydration after bulk ops:
  - [ ] Consider `await sel.hydrateFromServer()` after bulk operations for quick reconciliation.

- [ ] Ensure PRList visual state is bound to `sel.selectedPullRequestNumbers` and remains consistent after navigation/reload.

## Backend (Hono + SQLite) — Optional Ergonomics

- [ ] Add repository-scoped clear endpoint (optional, performance/ergonomics):
  - [ ] `DELETE /api/selections/active/items?repo_id=:repoId` to delete all items for that repo in the active selection.
  - [ ] Wire to service method to bulk-delete by `selection_id` + `repository_id`.

- [ ] Keep `DELETE /api/selections/active` for global reset only; do not use for per-repo clear in UI.

## Tests — E2E and Unit

- [ ] E2E: `frontend/e2e/specs/repo-detail.pr-selection.spec.ts`
  - [ ] Select a PR, reload: selection persists and remains highlighted.
  - [ ] Select visible, reload: selection persists and remains highlighted.
  - [ ] Clear (repo-level): only this repo’s selected items are cleared; selections in another repo remain intact.
  - [ ] Deselect single item: persists and re-hydrates correctly.
  - [ ] Visual state (checkbox + ring) matches selection state in store.

- [ ] Unit/Integration (optional):
  - [ ] Selection store diff computation correctness (toAdd/toRemove).
  - [ ] API client calls issued with correct payloads.
  - [ ] Hydration correctly filters by current `selectedRepositoryId`.

## Developer Notes

- Root causes:
  - Bulk selection mutations were local-only (no persistence).
  - UI "Clear" used a global-clear that deletes the entire active selection and also nulled `selectedRepositoryId`, causing hydration and visual state inconsistencies.

- Simplification:
  - Treat repository-level operations as first-class (bulk add/remove, clear by repo).
  - Avoid resetting `selectedRepositoryId` to null for repo-level actions.
  - Centralize persistence in store methods; components should call these, not local-only setters.

- Data flow target:
  - User action → selection store (optimistic) → backend persistence → optional re-hydration → PRList reflects via `selectedNumbers` prop.

## Implementation Order

1) Implement new store methods (bulk set + repo clear).
2) Update RepositoryDetail wiring to use new methods.
3) Manually verify PRList visual ring and checkbox states.
4) Add/adjust E2E tests to lock behavior.
5) Optionally implement BE repo-scoped clear for efficiency, then refactor FE to use it.

## Task: App Audit — Problems, Errors, and Incomplete Implementations

### Key Findings
- **Type safety gaps (frontend)**: Widespread `as any` casts across views/components reduce safety and mask errors (`RepositoryDetail.vue`, metrics/trends sections, settings). Rule: “NO any ever” not followed.
- **Deep-link selection overwrite (fixed)**: Now guarded; keep regression test coverage.
- **Selection reconciliation**: Post-action rehydration added for clear/deselect; consider server-side atomic replace endpoint later.
- **Accessibility**:
  - Selected PR rows now expose `aria-selected`/`data-selected`, but some components lack roles/labels consistency (e.g., `PRListItem.vue` not used; duplicated list implementations).
- **Error handling**:
  - Frontend relies on `window.__toast` fallbacks; consider a typed toast utility with centralized error normalizer.
  - Backend logs with `console.log/error`; consider structured logger and consistent error responses.
- **Config/CORS**:
  - Ensure `CORS_ORIGIN` matches frontend; README hints, but add env validation at boot.
- **Testing**:
  - E2E green for PR selection, but limited coverage for settings, analytics edge cases.
  - Backend tests exist but no coverage for selection routes/services.
- **Docs**:
  - Frontend README is solid; backend README present. Add MCP usage note (done in AGENTS.md). Add selection API doc.

### Action Plan
1) Type Safety (frontend)
- [ ] Replace `any` with specific types or generics; add helper mappers for API results.
- [ ] Tighten `selection.ts` types (avoid `as any` in number checks).
- [ ] Add `no-explicit-any` ESLint rule override to error and fix violations.

2) Accessibility & UI Consistency
- [ ] Consolidate PR row rendering: prefer `PRList.vue` and remove/align `PRListItem.vue` or refactor to use it.
- [ ] Audit buttons/labels across repo detail and settings for accessible names.

3) Error Handling & Logging
- [ ] Frontend: create `lib/errors.ts` with `normalizeError(e): { message, status? }`; integrate in API call sites.
- [ ] Backend: add minimal structured logger (pino or console wrapper) and standardize error responses via `utils/errors.ts`.

4) Selection API Enhancements (optional)
- [ ] Backend route: `PUT /api/selections/active/repository/:repoId` to atomically replace repo selection.
- [ ] Add backend tests for selections service and routes.

5) Config Hardening
- [ ] Validate required env at boot (PORT, CORS_ORIGIN, DATABASE_URL), fail fast with readable messages.

6) Testing Coverage
- [ ] Add e2e for settings PAT validate flows and error states.
- [ ] Add e2e for analytics filters and empty-state behavior.
- [ ] Backend unit/integration for selection add/remove/clear and active selection hydration.

### Acceptance Criteria
- No `any` usages remain in frontend source (exceptions documented with generics/types).
- Lighthouse/aXe pass on Repo Detail selection area (roles/labels present).
- Selection replace/clear flows covered by tests (unit/e2e), green locally.
- Backend selection routes have tests for add/remove/clear and invalid payloads.
- App boot logs validate env and exit on misconfig.

### Estimates
- Types and a11y consolidation: 1–2 days
- Error/logging + config validation: 0.5 day
- Selection API + tests: 1 day (optional)
- E2E additions: 0.5–1 day

### Risks
- Type tightening may surface latent issues; address incrementally with tests.
- API change requires FE alignment if replace endpoint is added.



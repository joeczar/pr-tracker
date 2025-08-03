# Task: Replace manual repo entry with backend-powered Repo ➜ PR picker + Organization support

Status: In Progress
Owner: Cline
Updated: 2025-08-03

Progress Log:
- Implemented deep-link PR navigation from Repositories.vue to RepositoryDetail.vue with ?pr query parameter.
- RepositoryDetail.vue now watches PR data and adjusts filters/limit for visibility, highlights the deep-linked PR.
- Fixed typings by moving onSuccess handling into a watch on the query result.

## Goal
Replace manual repository input with a 2-step picker that uses backend APIs to select:
1) Repository (from personal or organization scope)
2) Pull Request (from selected repository)

On submit, persist the repository selection and optionally use the chosen PR number to deep-link or pre-focus.

## Backend Endpoints (available/added)
- Existing:
  - GET /api/github/repositories — lists accessible repositories (pagination, sort, affiliation, visibility)
  - GET /api/github/repos/:owner/:repo/pulls — lists PRs for a repository (state, page, per_page)
- Added for Org support:
  - GET /api/github/organizations — lists orgs for the authenticated user
  - GET /api/github/orgs/:org/repos — lists repositories for the given org (pagination, sort, type)
- Service additions (backend/src/services/github.ts)
  - getUserOrganizations(): OrgSummary[]
  - getOrganizationRepositories(org, { page, per_page, sort, direction, type })

## Implementation Summary (done)
Frontend
- New dialog: frontend/src/components/repositories/AddRepositoryPickerDialog.vue
  - Two-step Repo ➜ PR picker
  - Repo step:
    - Scope toggle: Personal (default) | Organization
    - When Org is selected: org selector (Command list) above repo search; repo list filtered to that org
    - Repo list: paginated, client-side search (full_name, description), loading skeletons, error banners
  - PR step:
    - State filter (open/all), client-side search (title/#), pagination, loading skeletons, error banners
  - Emits payload on submit: { owner, name, url, prNumber? }
  - Uses githubApi.listAccessibleRepositories, githubApi.listOrgRepos, githubApi.listPulls
- View wiring: frontend/src/views/Repositories.vue
  - Replaced AddRepositoryDialog with AddRepositoryPickerDialog
  - Handles @submit by calling repositoriesApi.create({ owner, name })
- UI/Command exports:
  - frontend/src/components/ui/command/index.ts — barrel exports for Command primitives to fix TS resolution

Backend
- Service: backend/src/services/github.ts
  - Added getUserOrganizations(), getOrganizationRepositories()
  - Type adjustments to satisfy Octokit typings for repos.listForOrg type param
- Routes: backend/src/routes/github.ts
  - Added GET /api/github/organizations
  - Added GET /api/github/orgs/:org/repos

Frontend API Layer
- frontend/src/lib/api/github.ts
  - Added GitHubOrganization type
  - Added listOrganizations(), listOrgRepos(org, opts)
  - Existing listAccessibleRepositories and listPulls retained

## Outstanding Work
1) Optional: Deep-link to selected PR after add — DONE
   - Implemented in Repositories.vue: after repositoriesApi.create succeeds and payload.prNumber exists, navigate to repository-detail with ?pr query.
   - Implemented in RepositoryDetail.vue: reads ?pr= query, widens filters/limit, and visually highlights the matching PR item.

2) Error handling polish
   - Map backend error shape consistently to user-friendly messages in picker banners.
   - Consider rate-limit specific copy using githubApi.rateLimit.

3) Pagination UX
   - Current approach: “Load more” buttons. Consider infinite scroll for Commands lists.

4) E2E tests with Playwright
   - Flows:
     - Personal scope:
       - Open picker → type repo search → select repo → PR step → select PR → Add → assert repo appears (and optional PR deep-link)
     - Organization scope:
       - Open picker → toggle Organization → select org → type repo search → select repo → PR step → select PR → Add → assert repo appears
   - Ensure vite overlay resolution is clean for browser-based tests.

5) Accessibility
   - Ensure org toggle and org selector have appropriate roles/labels.
   - Review keyboard navigation between scope toggle, org selector, repo list, and PR list.

## Acceptance Criteria
- Users can add a repository using the new dialog without manual owner/name input.
- Repo scope toggle: Personal (default) and Organization. When Organization is selected, only repos from the selected org are shown.
- PR selection is possible after repo selection; both lists are searchable; loading+error states visible.
- Added repositories appear in the “Tracked Repositories” list on success.
- No TypeScript errors in modified components.
- Optional deep-linking: Selecting a PR in the picker and adding navigates to repository detail with the PR highlighted.
- Playwright tests for both Personal and Organization flows are added and passing (if requested).

## Notes / Decisions
- Terminal UI: kept per-component imports (TerminalWindow/Header/Title/Button) to match this repo.
- Command primitives imported via barrel '@/components/ui/command' for stability.
- API calls adapted to this repo’s githubApi instead of a Pinia repository store used in previous implementation.
- Organization support implemented server-side to enable org-specific filtering.

## Backend Org Fetch – Current Status and Issues
- Symptom: GET /api/github/organizations returns {"organizations": []} for a user with orgs; avatar now appears, so session/auth is working.
- OAuth scope requirement: read:org is required for private org membership and many org repo listings.
  - Implemented: backend/src/services/oauth.ts now requests scopes ['repo', 'read:org', 'user:email', 'read:user'].
  - Action needed by user: Re-authenticate after backend restart so the new scope is granted to the session token.
- Org policy requirement: Some organizations enforce “Third-party application access policy”.
  - If enabled, the org admin must approve the OAuth app for the organization, otherwise GitHub hides org membership from the app (resulting in an empty list).
  - Path: GitHub Org Settings → Third-party access → approve this OAuth app.
- Frontend picker behavior:
  - AddRepositoryPickerDialog now force-fetches orgs when toggling Organization (and logs fetch start/completion), ensuring a visible network call is made.
- Next steps to fully resolve:
  1) Restart backend to pick up updated scopes, then log out and log in again to re-consent with read:org.
  2) Approve the OAuth app under each org with third-party access restrictions.
  3) Validate by toggling Organization (console should show “[repo-picker] organizations loaded: N” and Network tab shows 200 with listed orgs).

## Follow-ups / Links
- Consider server-side search parameters for repositories and PRs to reduce client work on large orgs.
- Optional: add caching for organizations list to reduce API calls across dialog opens.
- Optional: feature flag to hide organization toggle for users without orgs.

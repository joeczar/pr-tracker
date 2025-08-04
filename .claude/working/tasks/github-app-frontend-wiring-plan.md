# GitHub App Frontend Wiring Plan: Org and Repo Selection/Search

Status: Planned
Scope: Wire the frontend to use the new GitHub App endpoints for organization repositories and PRs, while preserving OAuth-based flows for personal scope and fallback.

## Background

Backend added endpoints:
- GET /api/github-app/orgs/:org/repos?installation_id=...&page=&per_page=&sort=&direction=&type=
- GET /api/github-app/orgs/:org/repos/:repo/pulls?installation_id=...&state=&page=&per_page=
- Existing test endpoint provides installations for verification: GET /api/github-app/test

Frontend current state:
- AddRepositoryPickerDialog.vue supports two scopes: personal/org
- Uses OAuth endpoints via githubApi:
  - listOrganizations() -> /api/github/organizations
  - listOrgRepos(org, opts) -> /api/github/orgs/:org/repos
  - listAccessibleRepositories(opts) -> /api/github/repositories
  - listPulls(owner, repo, opts) -> /api/github/repos/:owner/:repo/pulls
- Needs to utilize GitHub App endpoints for org repos + PRs using installation_id.

## Goals

1) Use GitHub App installation authentication to fetch organization repositories when available.
2) Use GitHub App to fetch repository PRs when the selected repo belongs to an org with an installation.
3) Keep OAuth endpoints for personal scope and as a fallback for org scope when no installation exists.
4) Preserve current UX (repo picker flow) with minimal UI changes. Add subtle indicators for auth mode and clear errors.

## API Layer Changes

Add a new client section in frontend/src/lib/api/github.ts (or create a new module githubApp.ts if we want separation). For simplicity, extend the existing file.

- listInstallations (temporary via test endpoint)
  - GET /api/github-app/test
  - Returns: { success: boolean, installations: Array<{ id, account: { login, type } | null }> }
  - Normalize to: { id: number, account_login: string | null, account_type: string | null }

- listInstallationRepositories(installationId: number)
  - GET /api/github-app/installations/:installationId/repositories
  - Returns array of repositories (shape close to GitHub)

- listAppOrgRepos(org: string, installationId: number, opts)
  - GET /api/github-app/orgs/:org/repos?installation_id=&page=&per_page=&sort=&direction=&type=
  - Returns { repositories: GitHubRepo[], pagination }

- listAppRepoPulls(org: string, repo: string, installationId: number, opts)
  - GET /api/github-app/orgs/:org/repos/:repo/pulls?installation_id=&state=&page=&per_page=
  - Returns GitHubPull[]

Type reuse:
- Use existing GitHubRepo, GitHubPull types for shape consistency.

## Component Changes: AddRepositoryPickerDialog.vue

New state:
- installations: Array<{ id: number; account_login: string | null; account_type: string | null }>
- orgInstallationIdByLogin: Record<string, number>
- modeIndicator: 'app' | 'oauth' for the latest fetch operation (optional UI)

Load installations:
- On dialog open or when switching to 'org' scope, call listInstallations() and build orgInstallationIdByLogin map for accounts with account_type === 'Organization' and account_login.

Repo loading logic (in loadRepos):
- If scope === 'org' && selectedOrg:
  - Resolve installationId = orgInstallationIdByLogin[selectedOrg]
  - If installationId exists:
    - Call githubAppApi.listAppOrgRepos(selectedOrg, installationId, { page, per_page, sort: 'updated', direction: 'desc', type: 'all' })
    - Set modeIndicator = 'app'
  - Else:
    - Fallback to githubApi.listOrgRepos (OAuth)
    - Set modeIndicator = 'oauth'
- Else (personal):
  - Use existing githubApi.listAccessibleRepositories (OAuth)
  - Set modeIndicator = 'oauth'

PR loading logic (in loadPulls):
- Determine orgLogin = selectedRepo.owner.login
- If selectedRepo.owner is an org (if owner type known or infer by presence in orgInstallationIdByLogin):
  - Resolve installationId from orgInstallationIdByLogin[orgLogin]
  - If installationId exists:
    - Use githubAppApi.listAppRepoPulls(orgLogin, selectedRepo.name, installationId, { state, page, per_page })
    - modeIndicator = 'app'
  - Else fallback to githubApi.listPulls
- Else fallback to githubApi.listPulls

UI additions:
- In the repository section sticky toolbar, show a small badge: "Mode: App" or "Mode: OAuth"
- If org scope and no installation exists: show a non-blocking warning banner "GitHub App not installed on this org; using OAuth fallback (access may be limited)."
- Maintain current skeletons, paging, and search behavior.

Error handling:
- Keep existing normalization for status 401/403/rate limit.
- For 400 with "installation_id query param is required", treat as fallback condition and set meaningful message if we attempted to use app endpoints without id (should not happen if our guard works).

Caching/perf:
- Cache installations for the lifetime of the dialog in component refs.
- Only re-fetch installations on first switch to org scope or dialog open.

## Query Keys

If using a query library elsewhere, consider adding keys:
- ['githubApp', 'installations']
- ['githubApp', 'org', org, 'repos', { page, per_page, sort, direction, type, installationId }]
- ['githubApp', 'repo', org, repo, 'pulls', { state, page, per_page, installationId }]

The picker currently uses local state; adding keys is optional now.

## Testing

Unit:
- API helper functions: listInstallations, listAppOrgRepos, listAppRepoPulls using mock http.

Integration:
- Simulate dialog open, scope switch to org, installations loaded, select org with installation → repos via App
- Org without installation → fallback to OAuth repos
- Select repo in org with installation → PRs via App; otherwise fallback

E2E (playwright):
- Extend repositories.spec.ts to include the org selection flow and verify repositories appear, search works, and PR list loads.

## Implementation Steps

1) Extend github.ts with githubAppApi helpers:
   - listInstallations()
   - listInstallationRepositories(installationId)
   - listAppOrgRepos(org, installationId, opts)
   - listAppRepoPulls(org, repo, installationId, opts)

2) Update AddRepositoryPickerDialog.vue:
   - Add state: installations, orgInstallationIdByLogin, modeIndicator
   - Load installations on open or on switching to org scope
   - Modify loadRepos() and loadPulls() to use app endpoints when installationId available, with fallback

3) Optional: Add UI badges/messages for mode and fallback

4) Tests:
   - Unit test API helpers
   - Integration path for picker with both app and fallback modes
   - E2E adjustments to cover org/app path

## Example Code Sketches

API additions (github.ts):
```ts
export const githubAppApi = {
  listInstallations: async () => {
    const res = await http.get('/api/github-app/test') as { success: boolean; installations: Array<{ id: number; account: { login: string; type: string } | null }> }
    const items = (res.installations || []).map(i => ({
      id: i.id,
      account_login: i.account?.login ?? null,
      account_type: i.account?.type ?? null,
    }))
    return items
  },

  listInstallationRepositories: (installationId: number) =>
    http.get(`/api/github-app/installations/${installationId}/repositories`) as Promise<{ success: boolean; installation_id: number; repositories: GitHubRepo[] }>,

  listAppOrgRepos: (org: string, installationId: number, opts?: { page?: number; per_page?: number; sort?: 'created' | 'updated' | 'pushed' | 'full_name'; direction?: 'asc' | 'desc'; type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member' }) => {
    const params = new URLSearchParams()
    params.set('installation_id', String(installationId))
    if (opts?.page != null) params.set('page', String(opts.page))
    if (opts?.per_page != null) params.set('per_page', String(opts.per_page))
    if (opts?.sort) params.set('sort', opts.sort)
    if (opts?.direction) params.set('direction', opts.direction)
    if (opts?.type) params.set('type', opts.type)
    const qs = params.toString()
    return http.get(`/api/github-app/orgs/${org}/repos?${qs}`) as Promise<{ repositories: GitHubRepo[]; pagination?: any }>
  },

  listAppRepoPulls: (org: string, repo: string, installationId: number, opts?: { state?: 'open' | 'closed' | 'all'; page?: number; per_page?: number }) => {
    const params = new URLSearchParams()
    params.set('installation_id', String(installationId))
    if (opts?.state) params.set('state', opts.state)
    if (opts?.page != null) params.set('page', String(opts.page))
    if (opts?.per_page != null) params.set('per_page', String(opts.per_page))
    const qs = params.toString()
    return http.get(`/api/github-app/orgs/${org}/repos/${repo}/pulls?${qs}`) as Promise<GitHubPull[]>
  },
}
```

Picker integration (high-level):
```ts
const installations = ref<{ id: number; account_login: string | null; account_type: string | null }[]>([])
const orgInstallationIdByLogin = ref<Record<string, number>>({})
const modeIndicator = ref<'app' | 'oauth'>('oauth')

async function loadInstallationsIfNeeded(force = false) {
  if (!force && installations.value.length) return
  const list = await githubAppApi.listInstallations()
  installations.value = list
  const map: Record<string, number> = {}
  for (const ins of list) {
    if (ins.account_type === 'Organization' && ins.account_login) {
      map[ins.account_login] = ins.id
    }
  }
  orgInstallationIdByLogin.value = map
}
```

This plan enables organization and repository selection/search using GitHub App installation permissions with graceful fallback to OAuth where necessary, aligning frontend behavior with the new backend capabilities.

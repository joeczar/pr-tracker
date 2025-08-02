# GitHub Repository Dropdown Implementation

## Overview
Implement functionality to fetch and display the user's GitHub repositories in a dropdown component so they can select from their available repos. This should include repositories from all organizations the user has access to, not just their personal repos.

## Requirements
1. A way to fetch all repositories the authenticated user has access to (personal repos + organization repos)
2. A dropdown/select component that displays these repositories in a user-friendly format
3. The ability to select a repository from this dropdown for use in the PR tracker application
4. Integration with existing Vue.js frontend patterns and terminal/cyberpunk theme

## Task Breakdown

### Phase 1: Backend API Implementation ✅
- [x] **Add GitHub API method to GitHubService**
  - ✅ Added `getUserAccessibleRepositories()` method to fetch repos from `/user/repos` endpoint
  - ✅ Handle pagination (GitHub API returns max 100 items per page)
  - ✅ Filter by appropriate permissions and exclude archived repos
  - ✅ Return standardized format for frontend consumption

- [x] **Create new API endpoint**
  - ✅ Added `GET /api/github/repositories` endpoint in `backend/src/routes/github.ts`
  - ✅ Use `requireAuth` middleware for authentication
  - ✅ Support query parameters for pagination and filtering
  - ✅ Return repositories in format suitable for dropdown display

- [x] **Update shared types**
  - ✅ Added `RepositoryOption` interface to `shared/types/index.ts`
  - ✅ Added `AccessibleRepositoriesResponse` interface
  - ✅ Include fields: id, name, full_name, owner, private, description, language, updated_at, permissions

### Phase 2: Frontend UI Components ✅
- [x] **Create generic Select component**
  - ✅ Installed shadcn-vue select components
  - ✅ Customized `SelectTrigger.vue`, `SelectContent.vue`, `SelectItem.vue` with terminal variant
  - ✅ Use reka-ui for accessibility and headless functionality
  - ✅ Apply terminal/cyberpunk theme consistent with existing components
  - ✅ Support search/filtering functionality

- [x] **Create RepositorySelector component**
  - ✅ Created `frontend/src/components/RepositorySelector.vue`
  - ✅ Use the generic Select component with terminal theme
  - ✅ Fetch repositories from new API endpoint
  - ✅ Display repos in format: "owner/repo-name" with additional context
  - ✅ Handle loading states and errors
  - ✅ Emit selected repository data

### Phase 3: Store and API Integration ✅
- [x] **Update Repository Store**
  - ✅ Added `fetchAvailableRepositories()` method to `frontend/src/stores/repository.ts`
  - ✅ Added separate state management for available vs tracked repositories
  - ✅ Handle loading and error states
  - ✅ Separate from existing `fetchRepositories()` (tracked repos)

- [x] **Update API service**
  - ✅ Uses existing `api.ts` service with new endpoint
  - ✅ Follow existing patterns for error handling and authentication

### Phase 4: UI Integration ✅
- [x] **Update Repositories view**
  - ✅ Modified `frontend/src/views/Repositories.vue`
  - ✅ Replaced manual owner/name input with RepositorySelector dropdown
  - ✅ Keep existing "Add Repository" functionality but improve UX
  - ✅ Added toggle for manual entry as fallback
  - ✅ Show selected repository details in RepositorySelector component
  - ✅ Maintain existing terminal theme and layout

- [x] **Update component imports**
  - ✅ Added RepositorySelector import to Repositories view
  - ✅ Select components auto-exported via shadcn-vue

### Phase 5: Testing and Polish
- [ ] **Error handling and loading states**
  - Add proper error messages for API failures
  - Show loading spinners during repository fetching
  - Handle edge cases (no repositories, network errors)

- [ ] **Accessibility and UX**
  - Ensure keyboard navigation works properly
  - Add proper ARIA labels and descriptions
  - Test with screen readers if possible

- [ ] **Performance optimization**
  - Implement virtual scrolling if user has many repositories
  - Add debounced search functionality
  - Consider caching strategies

## Technical Notes

### GitHub API Strategy
- Use `GET /user/repos` with `affiliation=owner,collaborator,organization_member`
- This covers personal repos, collaborator repos, and organization repos
- Handle pagination with `per_page=100` and `page` parameters
- Sort by `updated` to show most recently active repos first

### Data Structure
```typescript
interface RepositoryOption {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
    type: 'User' | 'Organization'
  }
  private: boolean
  description?: string
  language?: string
  updated_at: string
  permissions?: {
    admin: boolean
    push: boolean
    pull: boolean
  }
}
```

### Component Architecture
```
RepositorySelector.vue (main component)
├── Select.vue (generic select component)
├── SelectContent.vue
├── SelectItem.vue
├── SelectTrigger.vue
└── SelectValue.vue
```

## OAuth Permissions Analysis ✅

**Current GitHub OAuth Scopes**: `['repo', 'user:email', 'read:user']`

✅ **Sufficient for repository dropdown functionality!**

The `repo` scope provides:
- Full access to public and private repositories
- Access to personal repositories (owned by user)
- Access to organization repositories (where user is member)
- Access to collaborator repositories (where user has access)
- Ability to use `/user/repos` endpoint with `affiliation=owner,collaborator,organization_member`

**No OAuth scope changes needed** - we can proceed with current authentication setup.

## Current Status
- **Status**: Implementation Complete ✅
- **Phases Completed**: 1-4 ✅
- **Next Step**: Phase 5 - Testing and Polish
- **Recent Fix**: ✅ Corrected GitHub API parameter conflict (cannot use both `affiliation` and `type` together)

## Dependencies
- Existing GitHubService class and authentication system ✅
- Current OAuth scopes are sufficient ✅
- reka-ui library for headless components
- Existing terminal/cyberpunk theme system
- Current repository management system

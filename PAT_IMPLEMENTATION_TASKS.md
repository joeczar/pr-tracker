# Personal Access Token Implementation Tasks

## 🎯 Goal
Add optional PAT support for GitHub organization access while keeping OAuth as default.

## Phase 1: Cleanup (30 min)
- [ ] Remove GitHub App route from `backend/src/index.ts`
- [ ] Remove GitHub App env vars from `.env`
- [ ] Clean up any remaining GitHub App references

## Phase 2: Database & Backend (1 hour)
- [ ] Add `github_pat_encrypted` column to users table
- [ ] Create PAT encryption utilities
- [ ] Add PAT endpoints: `/api/github/pat/store`, `/validate`, `/remove`
- [ ] Update GitHubService to prefer PAT over OAuth
- [ ] Modify organizations endpoint to use PAT when available

## Phase 3: Frontend (1.5 hours)
- [ ] Create GitHub settings modal for PAT input
- [ ] Add PAT empty state detection in repository picker
- [ ] Add helpful tooltip: "Not seeing orgs? Add PAT for full access"
- [ ] Implement PAT test connection and storage flow

## Phase 4: Polish (1 hour)
- [ ] Add user guide for PAT creation
- [ ] Improve error messages and feedback
- [ ] Test complete flow: OAuth → empty orgs → add PAT → see orgs

**Total: ~4 hours**

## Success Criteria
- Users can optionally add PAT when organizations don't show
- PAT stored securely (encrypted)
- Clear progressive enhancement UX
- OAuth remains the simple default flow

# Sync Service Authentication Issues

## Problem Summary

The SyncService is failing to sync GitHub data due to authentication issues discovered during PR selection implementation work.

## Root Cause Analysis

### Sync Job Failures
- **Error**: `"User undefined not found"`
- **Location**: `SyncService.processJob()` at lines 193-197
- **Cause**: Repository sync requires authenticated GitHub user context, but lookup fails

### Authentication Flow Issues
1. **Missing User Context**: Sync service tries to find repository owner user in database but fails
2. **GitHub API Access**: Review/comment data requires valid GitHub tokens for API calls
3. **Repository Owner Lookup**: `await this.userService.getUserByLogin(repository.owner)` returns null

## Technical Details

### Failed Sync Example
```json
{
  "id": "sync-7-1754649944026-al648m7ij",
  "repositoryId": 7,
  "type": "full", 
  "status": "failed",
  "error": "User undefined not found"
}
```

### Code Flow
1. `SyncService.processJob()` gets repository data
2. Extracts `repository.owner` from repository record
3. Calls `userService.getUserByLogin(repository.owner)` 
4. Returns null → sync fails

### API Endpoints Affected
- `/api/reviews/repository/7/metrics` returns zeros (no review data)
- `/api/pull-requests/repository/7/metrics` returns zeros for comments/reviews
- Repository sync history shows failed sync attempts

## Impact

### User-Visible Issues
- Dashboard charts show "no data" even with PR selection
- Metrics tiles display zeros for comments and reviews
- Repository sync button appears to work but data doesn't populate

### Data Flow
- Pull request counts sync successfully (131-132 PRs)
- Review/comment data fails to sync due to authentication
- GitHub API has the data (verified: PR #3970 has 3 reviews)

## Investigation Status

✅ **Completed**:
- Root cause identified: authentication/user lookup failure
- Confirmed GitHub API has review data available
- Backend service stability issues resolved (separate fix)
- Dashboard UI properly handles zero-data states

❌ **Not Addressed** (Future Work):
- User authentication context for sync operations
- GitHub token management for repository owners
- Background sync authentication flow

## Recommended Solutions

### Option 1: Fix User Lookup
- Investigate why `getUserByLogin()` returns null for repository owners
- Ensure repository records have correct owner information
- Fix user creation/lookup during repository addition

### Option 2: Global Sync Authentication  
- Use app-level GitHub credentials for public repository sync
- Store GitHub App installation tokens
- Background sync with app authentication instead of user tokens

### Option 3: User-Specific Sync
- Only sync repositories for authenticated users
- Require users to authenticate before adding repositories  
- Sync using user's personal GitHub tokens

## Files Involved

### Backend
- `backend/src/services/sync.ts` - Main sync service
- `backend/src/services/user.ts` - User lookup functionality
- `backend/src/services/github.ts` - GitHub API integration
- `backend/src/services/review.ts` - Review data sync

### Frontend  
- `frontend/src/components/repositories/` - Repository sync UI
- Dashboard metrics display (working correctly with zero data)

## Next Steps

1. **Priority**: Investigate user creation/lookup during repository addition
2. **Debug**: Check repository records for correct owner field population
3. **Authentication**: Design proper sync authentication strategy
4. **Testing**: Verify sync works with proper user context

## Notes

- This is a **separate issue** from the PR selection UI work (which is complete)
- Backend services are stable after initialization fixes
- Dashboard correctly handles and displays zero-data states
- Repository basic data (PR counts, merge rates) sync successfully
- Only review/comment data fails due to authentication

---
*Created during PR #4 investigation - Dashboard PR selection implementation*
*Status: Documented for future work - not blocking dashboard functionality*
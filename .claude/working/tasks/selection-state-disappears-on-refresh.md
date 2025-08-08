# Selection Dropdown Disappears on Refresh - Diagnosis

## Issue Summary
The PR selection dropdown works perfectly during a session, but disappears completely when the page is refreshed, requiring users to re-select PRs every time.

## Root Cause Analysis

### 🔍 **Primary Issue: Session Not Persisting**
```bash
$ curl http://localhost:3000/auth/status
{"authenticated":false}

$ curl http://localhost:3000/auth/me  
{"error":"Authentication required"}
```

**The authentication session is lost on refresh**, causing:
1. App redirects to `/login?redirect=/` 
2. Selection state hydration never occurs
3. User must log in again to access their selections

### 🔍 **Secondary Issue: Selection Hydration Dependency**
Looking at the Dashboard.vue hydration logic:
```javascript
// Dashboard.vue onMounted
sel.hydrateFromUrl()
await sel.hydrateFromServer()
```

**Hydration sequence fails when unauthenticated**:
1. `hydrateFromUrl()` - May work for URL params
2. `hydrateFromServer()` - **FAILS** due to auth requirement
3. Selection state remains empty
4. SelectionControls don't render (no `hasSelection`)

## Technical Details

### Authentication Flow Breakdown
1. **Session Creation**: User logs in via GitHub OAuth → gets session cookie
2. **Session Validation**: Each request validates session via middleware  
3. **Session Loss**: Refresh loses session → `/auth/me` returns 401
4. **Redirect**: Auth guard redirects to login page

### Selection State Dependencies
```javascript
// SelectionControls.vue visibility logic
const showControls = computed(() => hasSelection.value || repoId.value != null)

// hasSelection depends on BOTH repository AND PRs
const hasSelection = computed(() => 
  selectedRepositoryId.value != null && 
  selectedPullRequestNumbers.value.length > 0
)
```

**Issue**: `hydrateFromServer()` fails silently when unauthenticated, leaving selection empty.

## Current vs Expected Behavior

### ❌ Current Behavior
1. User selects PRs in repository → Works ✅
2. Navigates to dashboard → Selection visible ✅  
3. **Refreshes page** → Redirected to login ❌
4. Must re-authenticate and re-select PRs ❌

### ✅ Expected Behavior  
1. User selects PRs in repository → Works ✅
2. Navigates to dashboard → Selection visible ✅
3. **Refreshes page** → Stays authenticated ✅
4. Selection persists and dropdown shows ✅

## Potential Solutions

### Solution 1: Fix Session Persistence ⭐ **RECOMMENDED**
**Root cause fix**: Ensure authentication sessions persist across refreshes.

**Investigation needed**:
- Check session cookie configuration (httpOnly, secure, sameSite)
- Verify session storage in backend (database vs memory)
- Check session expiration times
- Ensure cookie is being sent with requests

**Files to check**:
- Backend session configuration
- Session middleware setup
- Cookie settings in OAuth service

### Solution 2: Improve Selection State Fallbacks
**Symptomatic fix**: Make selection state more resilient to auth failures.

**Changes needed**:
```javascript
// Add URL-based persistence as fallback
async function hydrateFromServer() {
  try {
    const res = await selectionsApi.getActive()
    // ... existing logic
  } catch (error) {
    console.warn('Server hydration failed, falling back to URL state')
    // Don't clear local state on auth failure
  }
}
```

### Solution 3: Enhanced URL State Management
**Workaround**: Store complete selection state in URL for persistence.

**Implementation**:
- Encode repository + PR selections in URL params
- Auto-sync to URL on selection changes  
- Hydrate from URL when server fails
- Works even when unauthenticated (for demo mode)

## Recommended Investigation Steps

### 1. Check Backend Session Configuration
```bash
# Look for session configuration in backend
grep -r "session" backend/src/
grep -r "cookie" backend/src/
```

### 2. Test Session Cookie Behavior
```bash
# Test session persistence
curl -c cookies.txt http://localhost:3000/auth/github/login
curl -b cookies.txt http://localhost:3000/auth/me
```

### 3. Check Frontend Cookie Handling
- Inspect browser Network tab during refresh
- Verify session cookies are being sent
- Check if cookies have correct domain/path

## Files to Investigate

### Backend Session Management
- `backend/src/services/auth.ts` - OAuth service  
- `backend/src/services/user.ts` - Session handling
- `backend/src/index.ts` - Session middleware setup
- Backend environment variables for session config

### Frontend State Management  
- `frontend/src/stores/auth.ts` - Auth state management
- `frontend/src/stores/selection.ts` - Selection hydration
- `frontend/src/views/Dashboard.vue` - Hydration sequence

## Priority Assessment

**Priority**: **HIGH** - Poor user experience  
**Effort**: **Medium** - Likely session configuration issue  
**Risk**: **Low** - Isolated to session management  
**User Impact**: **High** - Forces re-login and re-selection

---

**Status**: ACTIVE - Needs session persistence investigation  
**Next Steps**: Check backend session configuration and cookie setup  
**Timeline**: Should be fixed within 1-2 days

*Created: August 8, 2025 - During PR selection dropdown testing*
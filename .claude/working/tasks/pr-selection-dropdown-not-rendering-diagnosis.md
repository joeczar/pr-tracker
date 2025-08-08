# PR Selection Dropdown Not Rendering - Diagnosis

## Issue Summary
The PR selection dropdown that was supposedly fixed in PR #4 is not rendering properly.

## Root Cause Analysis

### 🔍 **Discovered Issues**

#### 1. **DUPLICATE SelectionControls Components**
- ❌ **AppShell.vue:197** - Global fixed overlay `<SelectionControls />`
- ❌ **Dashboard.vue:69** - Header-embedded `<SelectionControls>`

**Conflict**: Both components try to render the same dropdown, potentially causing:
- CSS conflicts (z-index, positioning)
- Event handler conflicts 
- DOM duplication issues

#### 2. **Visibility Logic Dependencies**
```javascript
// SelectionControls.vue line 16
const showControls = computed(() => hasSelection.value || repoId.value != null)

// hasSelection computed (selection store line 157)  
const hasSelection = computed(() => 
  selectedRepositoryId.value != null && 
  selectedPullRequestNumbers.value.length > 0
)
```

**Requirements for dropdown to show**:
- ✅ `selectedRepositoryId` must be set (number)
- ✅ `selectedPullRequestNumbers` must have items (length > 0)

#### 3. **Authentication Context Issues**
The selection store tries to hydrate from server:
```javascript
// Dashboard.vue onMounted
sel.hydrateFromUrl()
await sel.hydrateFromServer()
```

**Potential failure points**:
- ❌ Server hydration fails (auth issues we identified)
- ❌ URL params missing or invalid
- ❌ Selection API calls fail silently

## Debugging Steps Needed

### Step 1: Check Current Selection State
Navigate to Dashboard and inspect:
```javascript
// Browser console
const sel = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps[0].config.globalProperties.$stores?.selection
console.log('Repository ID:', sel?.selectedRepositoryId?.value)
console.log('Selected PR Numbers:', sel?.selectedPullRequestNumbers?.value)  
console.log('Has Selection:', sel?.hasSelection?.value)
```

### Step 2: Check for Component Conflicts
**Expected behavior**:
- Only ONE SelectionControls should render at a time
- AppShell version = global floating overlay
- Dashboard version = inline header component

**Current behavior**:
- Both may try to render simultaneously
- CSS conflicts cause visibility issues

### Step 3: Verify API Connectivity
Check browser network tab:
- ✅ `GET /api/selections/active` - Should return current selection
- ✅ Selection API authentication working?
- ✅ Repository data available?

## Immediate Fixes

### Fix 1: Remove Duplicate SelectionControls ⭐ RECOMMENDED
**Decision needed**: Which SelectionControls should remain?

**Option A**: Keep AppShell (global floating)
```diff
# Dashboard.vue - REMOVE the duplicate
- <SelectionControls ... />
```

**Option B**: Keep Dashboard header (inline)
```diff
# AppShell.vue - REMOVE the duplicate  
- <SelectionControls />
```

**Recommendation**: Keep AppShell (global) since it's designed as a floating overlay that appears when needed across all pages.

### Fix 2: Add Debug Logging
```javascript
// SelectionControls.vue - add debugging
console.log('SelectionControls render check:', {
  hasSelection: hasSelection.value,
  repoId: repoId.value,
  showControls: showControls.value,
  selectedPRNumbers: sel.selectedPullRequestNumbers.value
})
```

### Fix 3: Force Selection State (Testing)
```javascript  
// Browser console - force a selection for testing
sel.setRepository(1)
sel.setSelectedPRNumbers([123, 456])
```

## Expected Resolution

After fixing the duplicate components:
1. ✅ Only one SelectionControls renders (global floating)
2. ✅ Dropdown appears when user has selected PRs
3. ✅ Dropdown shows proper repository context and PR details
4. ✅ All navigation and clear actions work properly

## Files to Modify

### Primary Fix
- `frontend/src/views/Dashboard.vue` - Remove duplicate SelectionControls
- Or `frontend/src/components/layout/AppShell.vue` - Remove global version

### Testing
- Add temporary debug logging to understand current state
- Test with forced selection state
- Verify single dropdown renders properly

---

**Priority**: HIGH - User experience is broken
**Effort**: LOW - Simple duplicate removal  
**Risk**: LOW - Only removing duplicate code

*Diagnosis created: August 8, 2025*
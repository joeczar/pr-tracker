# Fix PR Selection Data Flow Issues in Dashboard

## Overview
The PR Tracker app has several data flow issues between PR selection state and dashboard display. The dashboard shows empty states despite having selected PRs, lacks a dropdown to display selected PRs, and doesn't provide clear navigation back to repository selection. These issues break the core user flow from PR selection to analytics.

**Root Cause Analysis:**
1. Dashboard's SelectionControls component only shows when PRs are selected but lacks visual PR list display
2. Missing dropdown component to show selected PRs with repository context
3. No clear navigation path when selection is empty
4. QuickMetricsSection shows disabled/empty tiles when it should show data for selected PRs
5. Data synchronization between selection store and dashboard metrics queries may have timing issues

## Commit Breakdown

### Commit 1: Add PR Dropdown Component to Dashboard
- **Message:** `feat(dashboard): add PR dropdown component with repo navigation link`
- **Changes:**
  - Create new `PRSelectionDropdown.vue` component in `/frontend/src/components/dashboard/`
  - Display selected PRs with repo name, PR numbers, and titles
  - Add "Go to Repository" link when no PRs selected
  - Include repo context and PR count summary
- **Tests:** 
  - Component renders with and without selection
  - Navigation links work correctly
  - Accessibility attributes are present

### Commit 2: Fix Dashboard SelectionControls Integration
- **Message:** `fix(dashboard): integrate PR dropdown into SelectionControls header`
- **Changes:**
  - Update `SelectionControls.vue` to include new dropdown
  - Replace current simple text summary with interactive dropdown
  - Maintain existing clear/analyze/review functionality
  - Add proper ARIA labeling for dropdown interaction
- **Tests:**
  - Dropdown toggles correctly
  - All existing functionality preserved
  - Screen reader accessibility maintained

### Commit 3: Debug and Fix Metrics Data Flow
- **Message:** `fix(dashboard): resolve metrics data flow for selected PRs`
- **Changes:**
  - Update `QuickMetricsSection.vue` to properly handle selected PR context
  - Fix query enablement logic to trigger when selection exists
  - Add debugging logging for selection state changes
  - Ensure metrics API calls include selected PR numbers in context
- **Tests:**
  - Metrics queries trigger when PRs are selected
  - Data displays correctly for selected PRs
  - Loading states work properly

### Commit 4: Enhance Dashboard State Synchronization  
- **Message:** `fix(dashboard): improve selection store hydration and sync timing`
- **Changes:**
  - Update Dashboard.vue to ensure proper hydration sequence
  - Add watchers for selection state changes to trigger metric refreshes
  - Implement proper error handling for hydration failures
  - Add loading states during selection hydration
- **Tests:**
  - Selection persists across page refreshes
  - Metrics update when selection changes
  - Error states display appropriately

### Commit 5: Add Visual Selection State Indicators
- **Message:** `feat(dashboard): add visual indicators for selection state and data loading`
- **Changes:**
  - Update SelectionControls to show loading states during hydration
  - Add visual feedback when metrics are refreshing due to selection changes
  - Include selection count in dashboard header
  - Add "last updated" timestamp for selection data
- **Tests:**
  - Loading indicators display during state changes
  - Visual feedback is clear and accessible
  - Timestamps update correctly

### Commit 6: Improve Error Handling and Fallbacks
- **Message:** `fix(dashboard): add robust error handling and fallback states for selection data`
- **Changes:**
  - Add error boundaries around selection-dependent components
  - Implement retry mechanisms for failed selection API calls
  - Add fallback states when selection data is corrupted or unavailable
  - Include clear error messages with action buttons
- **Tests:**
  - Error states render correctly
  - Retry functionality works
  - Fallback navigation is available

## Pull Request Strategy

### PR 1: Dashboard PR Selection Dropdown Enhancement
- **Commits:** 1, 2
- **Scope:** Add dropdown component and integrate with SelectionControls
- **Acceptance Criteria:**
  - New dropdown component renders selected PRs with repo context
  - "Go to Repository" link appears when no selection exists
  - Dropdown integrates seamlessly with existing SelectionControls
  - All accessibility requirements met
- **Dependencies:** None
- **Estimated Lines:** ~200 lines

### PR 2: Fix Dashboard Data Flow and Metrics
- **Commits:** 3, 4  
- **Scope:** Resolve data flow issues between selection state and metrics display
- **Acceptance Criteria:**
  - Metrics display correctly when PRs are selected
  - Selection state properly hydrates on dashboard load
  - Data synchronization works across navigation
  - Loading states are appropriate
- **Dependencies:** PR 1 merged
- **Estimated Lines:** ~150 lines

### PR 3: Enhanced UX and Error Handling
- **Commits:** 5, 6
- **Scope:** Add visual feedback, loading states, and error handling
- **Acceptance Criteria:**
  - Visual indicators show selection and loading states clearly
  - Error handling is robust with actionable recovery options
  - User experience is smooth during state transitions
  - Performance is optimized for selection changes
- **Dependencies:** PR 2 merged  
- **Estimated Lines:** ~100 lines

## Integration Notes

### Feature Flags
- No feature flags needed - these are bug fixes and UX improvements to existing functionality
- All changes should be backward compatible

### Database/API Changes
- No backend changes required
- Utilizes existing selections API endpoints
- May need to verify API response timing for large selection sets

### Deployment Considerations
- Changes are frontend-only and can be deployed independently
- No database migrations required
- No breaking changes to existing URLs or functionality

### Testing Strategy
- Unit tests for new dropdown component
- Integration tests for selection data flow
- E2E tests for complete user journey: select PRs → view dashboard → navigate back
- Accessibility testing for dropdown interactions
- Performance testing for large selection sets

### Rollback Strategy
- Each commit can be reverted independently if issues arise
- SelectionControls component maintains existing functionality as fallback
- Dashboard maintains empty state handling if new components fail

## Success Metrics
- Dashboard shows meaningful data when PRs are selected
- Users can easily navigate between repository selection and dashboard
- Selection state persists reliably across navigation
- Loading and error states provide clear user feedback
- Time from PR selection to dashboard analytics view is < 2 seconds

## Risk Assessment
**Low Risk Changes:**
- New dropdown component (isolated)
- Visual indicators and loading states

**Medium Risk Changes:** 
- Metrics data flow modifications
- Selection store hydration timing

**Mitigation:**
- Comprehensive testing of selection state edge cases
- Gradual rollout with monitoring of selection API performance
- Maintain existing fallback states throughout implementation
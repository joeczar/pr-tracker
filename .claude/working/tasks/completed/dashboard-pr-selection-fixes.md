# Dashboard PR Selection Data Flow Fixes

## Problem Statement

The PR Tracker dashboard has several data flow issues with PR selection:

1. Dashboard shows empty states despite having selected PRs
2. No dropdown to view/switch between selected PRs on dashboard
3. Missing navigation context when no PRs are selected
4. Buggy data synchronization between views

## Task Breakdown

### PR 1: Add PR Selection Dropdown Component
**Branch**: `feature/dashboard-pr-selection-dropdown`

#### Commit 1: Create PRSelectionDropdown component
- Create `frontend/src/components/dashboard/PRSelectionDropdown.vue`
- Display selected PRs with repository context
- Include "Go to Repositories" link when empty
- Add PR switching functionality
- Use consistent terminal styling

**Files Changed:**
- `frontend/src/components/dashboard/PRSelectionDropdown.vue` (new)

**Acceptance Criteria:**
- Dropdown shows list of selected PRs with repo/title
- Empty state shows "Go to Repositories" link
- PR switching updates dashboard metrics
- Consistent with app's terminal aesthetic

#### Commit 2: Integrate dropdown with SelectionControls
- Update `frontend/src/components/dashboard/SelectionControls.vue`
- Add dropdown trigger button
- Integrate with existing selection state
- Ensure proper positioning and styling

**Files Changed:**
- `frontend/src/components/dashboard/SelectionControls.vue`

**Acceptance Criteria:**
- Dropdown accessible from dashboard selection area
- Proper integration with existing "Analyze/Review/Clear" buttons
- Maintains responsive design

### PR 2: Fix Dashboard Data Flow
**Branch**: `feature/fix-dashboard-data-flow`

#### Commit 3: Debug and fix QuickMetricsSection data flow
- Investigate `frontend/src/components/dashboard/QuickMetricsSection.vue`
- Fix API query enablement when selections exist
- Ensure proper reactivity to selection changes
- Add debug logging for data flow issues

**Files Changed:**
- `frontend/src/components/dashboard/QuickMetricsSection.vue`
- `frontend/src/lib/api/analytics.ts` (if needed)

**Acceptance Criteria:**
- Metrics update when PRs are selected
- API calls trigger correctly with selection data
- Proper loading and error states

#### Commit 4: Fix selection store hydration and sync
- Review `frontend/src/stores/selection.ts`
- Fix race conditions in state hydration
- Ensure proper sync between views
- Add persistence layer checks

**Files Changed:**
- `frontend/src/stores/selection.ts`
- `frontend/src/views/Dashboard.vue` (if needed)

**Acceptance Criteria:**
- Selection state persists across page navigation
- No race conditions during app initialization
- Proper state synchronization between all views

### PR 3: Polish and Error Handling
**Branch**: `feature/dashboard-selection-polish`

#### Commit 5: Add loading states and visual feedback
- Add skeleton loaders during metric calculations
- Improve visual feedback for PR switching
- Add transition animations for better UX
- Ensure ADHD-friendly immediate feedback

**Files Changed:**
- `frontend/src/components/dashboard/QuickMetricsSection.vue`
- `frontend/src/components/dashboard/PRSelectionDropdown.vue`
- `frontend/src/components/ui/skeleton/` (if needed)

**Acceptance Criteria:**
- Proper loading states during data fetch
- Smooth transitions when switching PRs
- Clear visual feedback for all user actions

#### Commit 6: Add comprehensive error handling and edge cases
- Handle empty selection states gracefully
- Add error boundaries for API failures
- Implement retry mechanisms
- Add user-friendly error messages

**Files Changed:**
- `frontend/src/components/dashboard/QuickMetricsSection.vue`
- `frontend/src/components/dashboard/PRSelectionDropdown.vue`
- `frontend/src/components/error/ErrorBoundary.vue` (if needed)

**Acceptance Criteria:**
- Graceful handling of all error scenarios
- Clear error messages for users
- Retry functionality where appropriate
- No application crashes on edge cases

## Testing Strategy

### Unit Tests
- PRSelectionDropdown component behavior
- Selection store state management
- API integration points

### Integration Tests
- Complete user flow: Repository → PR Selection → Dashboard
- Cross-view state synchronization
- Error handling scenarios

### E2E Tests
- Add test cases to existing `frontend/e2e/specs/` structure
- Test PR selection → dashboard flow
- Test dropdown functionality
- Test error scenarios

## Implementation Notes

### Key Dependencies
- Existing selection store and API structure
- Current SelectionControls component
- Dashboard layout and styling system

### Risk Assessment
**Low Risk**:
- Adding new dropdown component (isolated change)
- Visual/UX improvements

**Medium Risk**:
- Modifying existing SelectionControls
- State store modifications

**High Risk**:
- Core data flow changes in QuickMetricsSection
- API integration modifications

### Breaking Changes
None expected - all changes should be backwards compatible.

## Definition of Done

- [ ] All commits pass TypeScript compilation
- [ ] All existing tests continue to pass
- [ ] New functionality has test coverage
- [ ] UI changes maintain responsive design
- [ ] Accessibility standards maintained
- [ ] ADHD-friendly UX principles followed
- [ ] Code review completed
- [ ] Feature testing completed across all major browsers

## Post-Implementation Validation

1. Select PRs in repository view
2. Navigate to dashboard
3. Verify metrics populate correctly
4. Test dropdown shows selected PRs
5. Test PR switching updates metrics
6. Verify empty state shows repo link
7. Test error handling scenarios
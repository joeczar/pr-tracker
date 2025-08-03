# Console Errors: Repositories, Settings, Analytics — Investigation & Fix Plan

Date: 2025-08-03

Scope: Frontend routes /repositories, /settings, /analytics

Source of truth: Playwright MCP investigation

---

## Findings

1) AppShell auth error (primary)
- Error: TypeError: auth.checkStatus is not a function
- Context: Triggered during AppShell mount hook; cascades into multiple Vue warnings.
- Likely Cause: Mismatch between the intended API and what src/stores/auth.ts or src/lib/api/auth.ts actually exports. AppShell is calling a non-existent method.

2) Composition API misuse
- Warnings:
  - inject() can only be used inside setup() or functional components.
  - onMounted / onBeforeUnmount called when there is no active component instance.
- Likely Cause: Hooks or inject() used outside setup() or inside async setup after the first await.

3) CommandPalette v-model type warning
- Warning: Invalid prop: type check failed for prop "modelValue". Expected Boolean, got Undefined.
- Likely Cause: v-model bound value is undefined (not initialized to boolean).

4) Font decode failures (all routes)
- Failed to decode font: /fonts/fira-code/*.woff2
- OTS parsing error: invalid sfntVersion: 168430090
- Likely Causes:
  - Incorrect file format (e.g., TTF/WOFF mislabeled as WOFF2)
  - Corrupted font files
  - Wrong path or served files not the expected binaries

5) Performance/anti-pattern warning
- Warning: Vue received a Component that was made a reactive object.
- Suggestion: markRaw(component) or use shallowRef when storing component references in reactive state.

---

## Tasks

A. AppShell authentication integration
- [x] Inspect src/stores/auth.ts and src/lib/api/auth.ts to identify the correct status/check function (e.g., getSession/me/isAuthenticated).
- [x] Replace auth.checkStatus() with the correct function or composable usage (e.g., useAuth()).
- [x] Ensure the call is performed in setup() and errors are handled via ErrorBoundary or try/catch to avoid cascading mount failures.
- [ ] Add unit test coverage to verify AppShell does not throw in mount when auth is available/unavailable.
- Changes:
  - frontend/src/components/layout/AppShell.vue: Replaced auth.checkStatus() with auth.bootstrap() guarded by !auth.initialized && !auth.loading.
  - frontend/src/components/layout/AppShell.vue: Fixed v-if to use auth.isAuthenticated getter instead of non-existent authenticated.
- Verification:
  - Navigating to /repositories redirects to /login when unauthenticated; TypeError eliminated.

B. Lifecycle and inject usage
- [x] Audit AppShell.vue (and any children used during its mount) for inject(), onMounted, onBeforeUnmount usage.
- [x] Move all inject()/hooks into setup() or a composable called from setup().
- [ ] If using async setup(), register lifecycle hooks before the first await; move async work into onMounted or an inner async function invoked in onMounted.
- [ ] Add a lightweight test or runtime assertion to catch misuse (optional).
- Targets reviewed:
  - frontend/src/components/ui/command/CommandPalette.vue:
    - Uses onMounted/onBeforeUnmount inside setup() to add/remove keydown listener. This is correct usage.
    - Imports a composable in onMounted; no lifecycle APIs used outside setup.
  - frontend/src/components/layout/AppShell.vue:
    - onMounted/onBeforeUnmount used inside setup(); corrected in Task A already.
  - frontend/src/main.ts / router/index.ts:
    - No misuse of lifecycle APIs.
  - frontend/src/components/ui/form/useFormField.ts:
    - This composable calls inject() and must only be invoked from inside a component's setup(). Calling it outside setup will generate the observed Vue warnings.
- Notes:
  - Remaining Vue lifecycle warnings are most likely from an offending call site of useFormField() being invoked outside setup(). We will add a guard and adjust any call sites if identified.

C. CommandPalette modelValue
- [ ] In AppShell.vue, initialize a boolean ref for palette state:
      const isPaletteOpen = ref(false)
- [ ] Bind with v-model (or :modelValue and @update:modelValue) to ensure a boolean is always passed.
- [ ] Add a simple test to render AppShell and assert no prop type warnings in console (optional).

D. Font assets
- [ ] Verify files exist under frontend/public/fonts/fira-code:
      - FiraCode-Regular.woff2
      - FiraCode-Medium.woff2
      - FiraCode-Bold.woff2
- [ ] Re-download genuine .woff2 files from the Fira Code release if necessary.
- [ ] Ensure references use absolute from public: /fonts/fira-code/FiraCode-*.woff2
- [ ] Validate locally by opening the font URLs directly and confirming proper rendering (no OTS error).

E. markRaw / shallowRef usage
- [ ] Identify where component constructors/objects are stored in reactive state (e.g., in TrendChart / Card wrappers).
- [ ] Wrap such values with markRaw() or store in shallowRef to avoid making components reactive.
- [ ] Re-run and confirm the warning disappears.

F. Form composable guard (new)
- [ ] Add a development guard inside frontend/src/components/ui/form/useFormField.ts to assert it runs within setup():
      import { getCurrentInstance } from 'vue'
      if (!getCurrentInstance()) {
        throw new Error('useFormField must be called within setup()')
      }
- [ ] If this throws during runtime, fix the violating call site(s) by moving the call into the component's setup or <script setup>.

---

## Files to Review/Edit

- frontend/src/components/layout/AppShell.vue
- frontend/src/stores/auth.ts
- frontend/src/lib/api/auth.ts
- frontend/src/components/ui/command/CommandPalette.vue (usage; actual component props)
- frontend/src/components/analytics/TrendChart.vue (and any dynamic component usage)
- frontend/public/fonts/fira-code/* (asset files)
- frontend/src/main.ts (ensure no lifecycle misuse on bootstrap)

---

## Verification Steps

- [ ] Run frontend locally and navigate to:
      /repositories, /settings, /analytics
- [ ] Confirm console no longer shows:
      - TypeError: auth.checkStatus is not a function
      - inject()/onMounted lifecycle warnings
      - CommandPalette modelValue type warning
      - Font decode OTS errors
      - Reactive component warning
- [ ] Optional: Add Playwright step in tests to capture console logs and assert absence of these warnings/errors.

---

## Rollout/Notes

- Prioritize AppShell auth fix first; many warnings are cascading from the mount failure.
- Font fix is independent and can be addressed in parallel.
- Keep changes minimal in AppShell to reduce risk; prefer using existing auth utilities.
- After fixes, consider adding an ErrorBoundary around AppShell content to prevent whole-app disruption on future regressions.

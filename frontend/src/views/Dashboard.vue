<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSelectionStore } from '@/stores/selection'
/* eslint-disable @typescript-eslint/ban-ts-comment */
import SelectionControls from '@/components/dashboard/SelectionControls.vue'
import QuickMetricsSection from '@/components/dashboard/QuickMetricsSection.vue'
import TrendsSection from '@/components/dashboard/TrendsSection.vue'
import GoalsSection from '@/components/dashboard/GoalsSection.vue'
import RecentActivitySection from '@/components/dashboard/RecentActivitySection.vue'
// Note: Vite resolves .vue SFCs; TS plugin warnings can be ignored safely.

/**
 * Step 0 scaffolding (updated PR-centric):
 * - Consume global selection store (repository + selected PRs from RepositoryDetail).
 * - Remove local selector; use guided empty state when no selection.
 * - Keep visuals for other sections as placeholders for now.
 */
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches



/**
 * PR-centric selection: use global store instead of local selector.
 * Fallback: hydrate from URL to be robust on direct navigation.
 */
const sel = useSelectionStore()
onMounted(async () => {
  // attempt hydration from URL and server on load
  sel.hydrateFromUrl()
  await sel.hydrateFromServer()
})
const selectedRepoId = computed<number | null>(() => sel.selectedRepositoryId.value)
const selectedPrIds = computed<number[]>(() => sel.selectedPullRequestNumbers.value)
const hasSelection = computed(() => sel.hasSelection.value)
function navigateToRepoDetail() {
  const q = selectedPrIds.value.map((id) => `pr=${id}`).join('&')
  const id = selectedRepoId.value
  if (id) {
    window.location.href = `/repositories/${id}?${q}`
  }
}

/**
 * Step 1: Quick Metrics tiles
 * - reviews metrics (30d)
 * - pull requests metrics (30d)
 * Tiles:
 *  - Total Comments (30d): reviews.total_comments (if available) else derived
 *  - Avg Comments / PR: reviews.avg_comments_per_pr
 *  - Change-request rate: reviews.change_request_rate (0-1 or 0-100)
 *  - Active Repos: repositories count from reposQuery
 */
/* Section-specific data now lives inside section components */

// Placeholder demo data removed (unused variables cleanup)
</script>

<template>
  <section aria-labelledby="dashboard-title" class="space-y-6">
    <header class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <h1 id="dashboard-title" class="text-xl font-semibold tracking-tight">Dashboard</h1>
        <div class="text-xs text-slate-500">PR-centric</div>
      </div>

        <SelectionControls
        :selected-repo-id="selectedRepoId"
        :selected-pr-ids="selectedPrIds"
        :has-selection="hasSelection"
        @clear="(sel.clearSelection(), sel.syncToUrl({ replace: true }))"
        @review="navigateToRepoDetail"
      />
    </header>

    <!-- Guided empty state when no PRs selected -->
    <div v-if="!hasSelection" class="text-sm text-slate-500 dark:text-slate-400">
      Select PRs in the repository view to populate the dashboard.
      <a href="/repositories" class="underline">Go to Repositories</a>
      <template v-if="selectedRepoId">
        or <a :href="`/repositories/${selectedRepoId}`" class="underline">Review current repository</a>
      </template>.
    </div>

    <!-- Quick Metrics Section -->
    <QuickMetricsSection
      :has-selection="hasSelection"
      :selected-repo-id="selectedRepoId"
      :selected-pr-ids="selectedPrIds"
    />

    <!-- Trends Section -->
    <TrendsSection
      :has-selection="hasSelection"
      :selected-repo-id="selectedRepoId"
      :selected-pr-ids="selectedPrIds"
      :reduced-motion="reducedMotion"
    />

    <!-- Goals Section -->
    <GoalsSection :reduced-motion="reducedMotion" />

    <!-- Recent Activity Section -->
    <RecentActivitySection
      :has-selection="hasSelection"
      :selected-repo-id="selectedRepoId"
      :selected-pr-ids="selectedPrIds"
    />
  </section>
</template>

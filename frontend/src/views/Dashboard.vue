<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { repositoriesApi } from '@/lib/api/repositories'
import { qk } from '@/lib/api/queryKeys'
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
 * Load repositories to support counts and review URL formation
 */
const reposQuery = useQuery({
  queryKey: qk.repositories.list(),
  queryFn: () => repositoriesApi.list(),
})

const repositoryList = computed(() => reposQuery.data?.value ?? [])
const reposPending = computed(() => !!(reposQuery.isPending as any) && repositoryList.value.length === 0)
const reposError = computed(() => !!(reposQuery.isError as any))
const reposEmpty = computed(() => Array.isArray(repositoryList.value) && repositoryList.value.length === 0)

/**
 * Selected repository id:
 * - Start from route query (?repo=)
 * - Fallback to localStorage
 * - Finally fallback to first repo when available
 */
/**
 * PR-centric selection: use global store instead of local selector.
 * Fallback: hydrate from URL to be robust on direct navigation.
 */
const sel = useSelectionStore()
onMounted(() => {
  // attempt hydration from URL once on load
  sel.hydrateFromUrl()
})
const selectedRepoId = computed<number | null>(() => sel.selectedRepositoryId.value)
const selectedPrIds = computed<number[]>(() => sel.selectedPullRequestIds.value)
const hasSelection = computed(() => sel.hasSelection.value)

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

const trendTab = ref<'comments' | 'change' | 'avg'>('comments')
const labels = Array.from({ length: 14 }, (_, i) => `D-${13 - i}`)
const commentsData = Array.from({ length: 14 }, () => Math.floor(10 + Math.random() * 40))
const changeRateData = Array.from({ length: 14 }, () => Math.round(8 + Math.random() * 14))
const avgCommentsData = Array.from({ length: 14 }, () => +(1.5 + Math.random() * 2.5).toFixed(1))

const currentTrend = computed(() => {
  if (trendTab.value === 'comments') {
    return {
      title: 'Comment Volume (last 14 days)',
      description: 'Daily total review comments across tracked repositories.',
      datasets: [{ label: 'Comments', data: commentsData }],
      type: 'line' as const
    }
  }
  if (trendTab.value === 'change') {
    return {
      title: 'Change-request Rate (last 14 days)',
      description: 'Percent of PRs receiving “changes requested”.',
      datasets: [{ label: 'Change %', data: changeRateData, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }],
      type: 'bar' as const
    }
  }
  return {
    title: 'Avg Comments per PR (last 14 days)',
    description: 'Rolling per-day average comments per PR.',
    datasets: [{ label: 'Avg/PR', data: avgCommentsData, backgroundColor: 'rgba(10,189,198,0.15)', borderColor: '#0abdc6' }],
    type: 'line' as const
  }
})

const goals = ref([
  { label: 'Smaller PRs', value: 78, goalLabel: '< 3 comments/PR avg' },
  { label: 'Faster Reviews', value: 61, goalLabel: '< 24h time-to-first-review' }
])
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
        @review="() => { const q = selectedPrIds.map(id => `pr=${id}`).join('&'); if (selectedRepoId) { (window as any).location.href = `/repositories/${selectedRepoId}?${q}` } }"
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

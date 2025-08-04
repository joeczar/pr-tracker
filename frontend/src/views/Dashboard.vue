<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import ProgressRadial from '@/components/analytics/ProgressRadial.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import { repositoriesApi } from '@/lib/api/repositories'
import { reviewsApi } from '@/lib/api/reviews'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { qk } from '@/lib/api/queryKeys'
import { useSelectionStore } from '@/stores/selection'

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

const SELECT_KEY = 'dashboard.repositoryId'

/**
 * Load repositories for selector and determine default selection.
 * We will not yet bind queries to visuals; this is scaffolding only.
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
const DAYS = 30
const enabledHasRepo = computed(() => Number.isFinite(selectedRepoId.value as any))

const reviewsMetricsQuery = useQuery({
  queryKey: computed(() => (enabledHasRepo.value ? qk.reviews.metrics(selectedRepoId.value as number, DAYS) : ['reviews', 'metrics', 'disabled'])),
  queryFn: () => reviewsApi.metricsByRepo(selectedRepoId.value as number, DAYS),
  enabled: enabledHasRepo,
})

const prMetricsQuery = useQuery({
  queryKey: computed(() => (enabledHasRepo.value ? qk.prs.metrics(selectedRepoId.value as number, DAYS) : ['prs', 'metrics', 'disabled'])),
  queryFn: () => pullRequestsApi.metricsByRepo(selectedRepoId.value as number, DAYS),
  enabled: enabledHasRepo,
})

type Numberish = number | string

function asPercent(val: number | undefined | null): string {
  if (val == null || Number.isNaN(Number(val))) return '0%'
  // Accept 0-1 or 0-100 ranges; normalize to 0-100
  const n = Number(val)
  const pct = n <= 1 ? n * 100 : n
  return `${Math.round(pct)}%`
}

function toFixed1(val: number | undefined | null): number {
  if (val == null || Number.isNaN(Number(val))) return 0
  return Number(Number(val).toFixed(1))
}

const reposCount = computed(() => repositoryList.value?.length ?? 0)

const quickMetrics = computed(() => {
  // If no PRs selected, return an empty array to trigger guided state downstream
  if (!hasSelection.value) return []
  const reviews = (reviewsMetricsQuery.data as any)?.value ?? null
  const prs = (prMetricsQuery.data as any)?.value ?? null

  // For now, repository-level proxies; selection-specific aggregation to be added when per-PR data is available.
  const selectedCount = selectedPrIds.value.length
  const totalPRsRepo: number = prs?.total_prs ?? prs?.count ?? prs?.total ?? 0
  const totalPRsSelected = Math.min(selectedCount, totalPRsRepo)

  const avgCommentsPerPR: number = reviews?.avg_comments_per_pr ?? reviews?.avg_comments ?? 0
  const providedTotalComments: number | undefined = reviews?.total_comments
  const totalCommentsRepo: number = typeof providedTotalComments === 'number'
    ? providedTotalComments
    : Math.round(totalPRsRepo * avgCommentsPerPR)
  // Approximate selected subset as proportional to selection size
  const totalCommentsSelected = totalPRsRepo > 0 ? Math.round((totalCommentsRepo * totalPRsSelected) / totalPRsRepo) : 0

  // Change-request rate
  const changeReqRateRaw: number | undefined = reviews?.change_request_rate ?? reviews?.change_requests_rate
  const changeReqRateDisplay: string = asPercent(changeReqRateRaw ?? 0)

  const tiles: { label: string; value: Numberish; delta: number; trend: 'up' | 'down'; helpText: string; ariaDescription?: string }[] = [
    { label: 'Total Comments (30d)', value: totalCommentsSelected, delta: 0, trend: 'up', helpText: 'vs prior 30d' },
    { label: 'Avg Comments / PR', value: toFixed1(avgCommentsPerPR), delta: 0, trend: 'down', helpText: 'vs prior 30d' },
    { label: 'Change-request rate', value: changeReqRateDisplay, delta: 0, trend: 'up', helpText: 'of PRs', ariaDescription: 'Higher is worse' },
    { label: 'Active Repos', value: selectedRepoId.value ? 1 : 0, delta: 0, trend: 'up', helpText: 'tracked' },
  ]
  return tiles
})

const metricsPending = computed(() => {
  const revPending = !!(reviewsMetricsQuery.isPending as any)
  const prPending = !!(prMetricsQuery.isPending as any)
  // pending is only blocking if we have a repo selected but no data yet
  return (revPending || prPending) && !!selectedRepoId.value && hasSelection.value
})

const metricsError = computed(() => !!(reviewsMetricsQuery.isError as any) || !!(prMetricsQuery.isError as any))
const metricsHasAnyData = computed(() => {
  const rev = (reviewsMetricsQuery.data as any)?.value
  const prs = (prMetricsQuery.data as any)?.value
  return !!rev || !!prs
})
const metricsEmpty = computed(() => {
  if (!hasSelection.value) return false
  // If both queries resolved but totals are zero, consider empty
  const rev = (reviewsMetricsQuery.data as any)?.value
  const prs = (prMetricsQuery.data as any)?.value
  if (!rev && !prs) return false
  const totalPRs: number = prs?.total_prs ?? prs?.count ?? prs?.total ?? 0
  const avgCommentsPerPR: number = rev?.avg_comments_per_pr ?? rev?.avg_comments ?? 0
  const providedTotalComments: number | undefined = rev?.total_comments
  const totalComments: number = typeof providedTotalComments === 'number'
    ? providedTotalComments
    : Math.round(totalPRs * avgCommentsPerPR)
  return totalPRs === 0 && totalComments === 0
})

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

      <!-- Selection Controls (visible when there is a selection) -->
      <div class="text-xs">
        <div class="flex items-center gap-2">
          <div class="rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-2 py-1.5">
            <span class="text-xs">
              <template v-if="hasSelection">
                {{ selectedPrIds.length }} PR<span v-if="selectedPrIds.length !== 1">s</span> selected
                <template v-if="selectedRepoId"> • Repo ID: {{ selectedRepoId }}</template>
              </template>
              <template v-else-if="selectedRepoId">
                Repo • ID: {{ selectedRepoId }} • No PRs selected
              </template>
              <template v-else>
                No repository selected
              </template>
            </span>
          </div>
          <button
            v-if="hasSelection"
            class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
            @click="(sel.clearSelection(), sel.syncToUrl({ replace: true }))"
            aria-label="Clear selected pull requests"
            title="Clear selected pull requests"
          >
            Clear Selection
          </button>
          <a
            v-if="hasSelection && selectedRepoId"
            class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            :href="`/repositories/${selectedRepoId}?` + selectedPrIds.map(id => `pr=${id}`).join('&')"
            aria-label="Review selection in repository view"
          >
            Review Selection
          </a>
          <button
            v-if="reposError"
            class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
            @click="reposQuery.refetch()"
            aria-label="Retry loading repositories"
          >
            Retry
          </button>
        </div>
      </div>
    </header>

    <!-- Guided empty state when no PRs selected -->
    <div v-if="!hasSelection" class="text-sm text-slate-500 dark:text-slate-400">
      Select PRs in the repository view to populate the dashboard.
      <a href="/repositories" class="underline">Go to Repositories</a>
      <template v-if="selectedRepoId">
        or <a :href="`/repositories/${selectedRepoId}`" class="underline">Review current repository</a>
      </template>.
    </div>

    <!-- Quick Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <!-- Loading: show placeholders (existing tiles act as placeholders) -->
      <template v-if="metricsPending && !metricsHasAnyData">
        <MetricTile
          v-for="i in 4"
          :key="'skeleton-' + i"
          :label="'Loading...'"
          :value="'—'"
          :delta="0"
          :trend="'up'"
          :help-text="'loading'"
          aria-busy="true"
          aria-live="polite"
        />
      </template>

      <!-- Error: only show when there IS a selection; otherwise prefer the guided empty state -->
      <template v-else-if="metricsError && hasSelection && !metricsHasAnyData">
        <div class="col-span-4 text-sm text-red-600 flex items-center gap-2">
          Failed to load metrics.
          <button
            class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
            @click="(reviewsMetricsQuery as any).refetch() && (prMetricsQuery as any).refetch()"
            aria-label="Retry loading metrics"
          >
            Retry
          </button>
        </div>
      </template>

      <!-- Empty -->
      <template v-else-if="metricsEmpty">
        <div class="col-span-4 text-sm text-slate-500">No metrics available for the last 30 days.</div>
      </template>

      <!-- Data -->
      <template v-else>
        <MetricTile
          v-for="(m, i) in quickMetrics"
          :key="i"
          :label="m.label"
          :value="m.value as any"
          :delta="m.delta as any"
          :trend="m.trend as any"
          :help-text="m.helpText"
          :aria-description="(m as any).ariaDescription"
        />
      </template>
    </div>

    <!-- Trends -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="trends" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <TerminalButton
                :variant="trendTab === 'comments' ? 'primary' : 'ghost'"
                size="sm"
                @click="trendTab = 'comments'"
                aria-label="Show Comments trend"
              >Comments</TerminalButton>
              <TerminalButton
                :variant="trendTab === 'change' ? 'primary' : 'ghost'"
                size="sm"
                @click="trendTab = 'change'"
                aria-label="Show Change-request rate trend"
              >Change Req</TerminalButton>
              <TerminalButton
                :variant="trendTab === 'avg' ? 'primary' : 'ghost'"
                size="sm"
                @click="trendTab = 'avg'"
                aria-label="Show Avg comments per PR trend"
              >Avg/PR</TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>

      <TrendChart
        :type="currentTrend.type"
        :labels="labels"
        :datasets="currentTrend.datasets as any"
        :title="currentTrend.title"
        :description="currentTrend.description"
        :reduced-motion="reducedMotion"
        :aria-summary-id="'trend-summary'"
        :height="260"
      >
        <template #summary>
          {{ currentTrend.title }}. Data points: {{ labels.length }} days.
        </template>
      </TrendChart>
    </TerminalWindow>

    <!-- Progress & Goals -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="goals" />
          </template>
        </TerminalHeader>
      </template>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProgressRadial
          v-for="(g, i) in goals"
          :key="i"
          :value="g.value"
          :label="g.label"
          :goal-label="g.goalLabel"
          :reduced-motion="reducedMotion"
        />
      </div>
    </TerminalWindow>

    <!-- Recent Activity -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="recent-activity" />
          </template>
          <template #actions>
            <TerminalButton size="sm" variant="secondary" aria-label="Refresh activity">Refresh</TerminalButton>
          </template>
        </TerminalHeader>
      </template>
      <div class="space-y-3">
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>
    </TerminalWindow>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import { reviewsApi } from '@/lib/api/reviews'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { qk } from '@/lib/api/queryKeys'

type Numberish = number | string

const props = defineProps<{
  hasSelection: boolean
  selectedRepoId: number | null
  selectedPrIds: number[]
}>()

const DAYS = 30
const enabledHasRepo = computed(() => Number.isFinite(props.selectedRepoId as any))

const reviewsMetricsQuery = useQuery({
  queryKey: computed(() =>
    enabledHasRepo.value
      ? qk.reviews.metrics(props.selectedRepoId as number, DAYS)
      : ['reviews', 'metrics', 'disabled']
  ),
  queryFn: () => reviewsApi.metricsByRepo(props.selectedRepoId as number, DAYS),
  enabled: enabledHasRepo,
})

const prMetricsQuery = useQuery({
  queryKey: computed(() =>
    enabledHasRepo.value
      ? qk.prs.metrics(props.selectedRepoId as number, DAYS)
      : ['prs', 'metrics', 'disabled']
  ),
  queryFn: () => pullRequestsApi.metricsByRepo(props.selectedRepoId as number, DAYS),
  enabled: enabledHasRepo,
})

function asPercent(val: number | undefined | null): string {
  if (val == null || Number.isNaN(Number(val))) return '0%'
  const n = Number(val)
  const pct = n <= 1 ? n * 100 : n
  return `${Math.round(pct)}%`
}
function toFixed1(val: number | undefined | null): number {
  if (val == null || Number.isNaN(Number(val))) return 0
  return Number(Number(val).toFixed(1))
}

const metricsPending = computed(() => {
  const revPending = !!(reviewsMetricsQuery.isPending as any)
  const prPending = !!(prMetricsQuery.isPending as any)
  return (revPending || prPending) && !!props.selectedRepoId && props.hasSelection
})
const metricsError = computed(() => !!(reviewsMetricsQuery.isError as any) || !!(prMetricsQuery.isError as any))
const metricsHasAnyData = computed(() => {
  const rev = (reviewsMetricsQuery.data as any)?.value
  const prs = (prMetricsQuery.data as any)?.value
  return !!rev || !!prs
})
const metricsEmpty = computed(() => {
  if (!props.hasSelection) return false
  const rev = (reviewsMetricsQuery.data as any)?.value
  const prs = (prMetricsQuery.data as any)?.value
  if (!rev && !prs) return false
  const totalPRs: number = prs?.total_prs ?? prs?.count ?? prs?.total ?? 0
  const avgCommentsPerPR: number = rev?.avg_comments_per_pr ?? rev?.avg_comments ?? 0
  const providedTotalComments: number | undefined = rev?.total_comments
  const totalComments: number =
    typeof providedTotalComments === 'number'
      ? providedTotalComments
      : Math.round(totalPRs * avgCommentsPerPR)
  return totalPRs === 0 && totalComments === 0
})

const tiles = computed(() => {
  // Always return 4 tiles so the grid renders consistently.
  // When no selection, show muted placeholders guiding the user.
  if (!props.hasSelection) {
    return [
      { label: 'Total Comments (30d)', value: 0, delta: 0, trend: 'up' as const, helpText: 'Select PRs to populate', ariaDescription: 'No data yet', disabled: true },
      { label: 'Avg Comments / PR', value: 0, delta: 0, trend: 'down' as const, helpText: 'Select PRs to populate', ariaDescription: 'No data yet', disabled: true },
      { label: 'Change-request rate', value: '0%', delta: 0, trend: 'up' as const, helpText: 'Select PRs to populate', ariaDescription: 'Higher is worse • No data yet', disabled: true },
      { label: 'Active Repos', value: 0, delta: 0, trend: 'up' as const, helpText: 'tracked', ariaDescription: 'No data yet', disabled: true },
    ]
  }

  const reviews = (reviewsMetricsQuery.data as any)?.value ?? null
  const prs = (prMetricsQuery.data as any)?.value ?? null

  const selectedCount = props.selectedPrIds.length
  const totalPRsRepo: number = prs?.total_prs ?? prs?.count ?? prs?.total ?? 0
  const totalPRsSelected = Math.min(selectedCount, totalPRsRepo)

  const avgCommentsPerPR: number = reviews?.avg_comments_per_pr ?? reviews?.avg_comments ?? 0
  const providedTotalComments: number | undefined = reviews?.total_comments
  const totalCommentsRepo: number =
    typeof providedTotalComments === 'number'
      ? providedTotalComments
      : Math.round(totalPRsRepo * avgCommentsPerPR)

  const totalCommentsSelected =
    totalPRsRepo > 0 ? Math.round((totalCommentsRepo * totalPRsSelected) / totalPRsRepo) : 0

  const changeReqRateRaw: number | undefined =
    reviews?.change_request_rate ?? reviews?.change_requests_rate
  const changeReqRateDisplay: string = asPercent(changeReqRateRaw ?? 0)

  const data: { label: string; value: Numberish; delta: number; trend: 'up' | 'down'; helpText: string; ariaDescription?: string }[] = [
    { label: 'Total Comments (30d)', value: totalCommentsSelected, delta: 0, trend: 'up', helpText: 'vs prior 30d' },
    { label: 'Avg Comments / PR', value: toFixed1(avgCommentsPerPR), delta: 0, trend: 'down', helpText: 'vs prior 30d' },
    { label: 'Change-request rate', value: changeReqRateDisplay, delta: 0, trend: 'up', helpText: 'of PRs', ariaDescription: 'Higher is worse' },
    { label: 'Active Repos', value: props.selectedRepoId ? 1 : 0, delta: 0, trend: 'up', helpText: 'tracked' },
  ]
  return data
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <!-- Loading -->
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

    <!-- Error -->
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
      <!-- Render styled 'empty' cards with normal 0 and faded style + tooltip message -->
      <div class="contents">
        <div
          v-for="(m, i) in [
            { label: 'Total Comments (30d)', value: 0, delta: 0, trend: 'up', helpText: 'No data in the last 30 days', ariaDescription: 'No data', disabled: true },
            { label: 'Avg Comments / PR', value: 0, delta: 0, trend: 'down', helpText: 'No data in the last 30 days', ariaDescription: 'No data', disabled: true },
            { label: 'Change-request rate', value: '0%', delta: 0, trend: 'up', helpText: 'No data in the last 30 days', ariaDescription: 'Higher is worse • No data', disabled: true },
            { label: 'Active Repos', value: props.selectedRepoId ? 1 : 0, delta: 0, trend: 'up', helpText: 'tracked', ariaDescription: 'No data', disabled: true },
          ]"
          :key="'empty-' + i"
          class="group relative"
        >
          <MetricTile
            :label="m.label"
            :value="m.value as any"
            :delta="m.delta as any"
            :trend="m.trend as any"
            :help-text="m.helpText"
            :aria-description="(m as any).ariaDescription"
            :class="(m as any).disabled ? 'opacity-50 saturate-0 pointer-events-auto' : ''"
          />
          <!-- Simple tooltip -->
          <div
            class="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-mono text-white shadow-md group-hover:block"
            role="tooltip"
          >
            {{ m.helpText }}
          </div>
        </div>
      </div>
    </template>

    <!-- Data -->
    <template v-else>
      <div class="contents">
        <div
          v-for="(m, i) in tiles"
          :key="i"
          class="group relative"
        >
          <MetricTile
            :label="m.label"
            :value="m.value as any"
            :delta="m.delta as any"
            :trend="m.trend as any"
            :help-text="m.helpText"
            :aria-description="(m as any).ariaDescription"
            :class="(m as any).disabled ? 'opacity-50 saturate-0 pointer-events-auto' : ''"
          />
          <!-- Tooltip for disabled/placeholder tiles -->
          <div
            v-if="(m as any).disabled"
            class="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-mono text-white shadow-md group-hover:block"
            role="tooltip"
          >
            {{ (m as any).helpText }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

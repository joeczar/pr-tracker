<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import { analyticsApi } from '@/lib/api/analytics'
import { qk } from '@/lib/api/queryKeys'

const props = defineProps<{
  hasSelection: boolean
  selectedRepoId: number | null
  selectedPrIds: number[]
  reducedMotion: boolean
}>()

const DAYS = 14
const trendTab = ref<'comments' | 'change' | 'avg'>('comments')
const enabledHasRepo = computed(() => Number.isFinite(props.selectedRepoId as any))

// Query live analytics trends
const trendsQuery = useQuery({
  queryKey: computed(() =>
    enabledHasRepo.value ? qk.analytics.trends(props.selectedRepoId as number, DAYS) : ['analytics', 'trends', 'disabled']
  ),
  queryFn: () => analyticsApi.trendsByRepo(props.selectedRepoId as number, DAYS),
  enabled: enabledHasRepo,
})

const labels = computed(() => {
  const data = (trendsQuery.data as any)?.value
  if (Array.isArray(data?.days) && data.days.length) return data.days
  // Fallback to simple D- labels if API lacks explicit days
  return Array.from({ length: DAYS }, (_, i) => `D-${DAYS - 1 - i}`)
})

// Safe accessors with graceful fallbacks
function arr(len = DAYS, fill = 0) {
  return Array.from({ length: len }, () => fill)
}
const base = computed(() => (trendsQuery.data as any)?.value ?? {})
const commentsSeries = computed<number[]>(() => {
  // prefer daily total comments if provided, else zeros
  const series = base.value?.daily_comments ?? base.value?.comments ?? null
  return Array.isArray(series) ? series : arr()
})
const avgCommentsSeries = computed<number[]>(() => {
  const series = base.value?.avg_comments ?? base.value?.avg_comments_per_pr ?? null
  return Array.isArray(series) ? series : arr()
})
const changeRateSeries = computed<number[]>(() => {
  // Attempt to use a 0-1 or 0-100 change-request rate series; derive from avg_reviews if needed
  let series = base.value?.change_request_rate_series ?? base.value?.change_requests_rate_series ?? null
  if (!Array.isArray(series)) {
    const avgReviews = base.value?.avg_reviews
    if (Array.isArray(avgReviews)) {
      // crude proxy: clamp(avgReviews / max(avgReviews), 0..1) then to %
      const max = Math.max(1, ...avgReviews)
      series = avgReviews.map((v: number) => (max ? Math.min(1, v / max) * 100 : 0))
    }
  } else {
    // normalize possible 0..1 values to %
    series = series.map((v: number) => (v <= 1 ? v * 100 : v))
  }
  return Array.isArray(series) ? series : arr()
})

const pending = computed(() => !!(trendsQuery.isPending as any) && enabledHasRepo.value && props.hasSelection)
const error = computed(() => !!(trendsQuery.isError as any))
const hasAny = computed(() => {
  const data = (trendsQuery.data as any)?.value
  return !!data
})
const empty = computed(() => {
  if (!hasAny.value) return false
  const c = commentsSeries.value.reduce((a, b) => a + (Number(b) || 0), 0)
  const a = avgCommentsSeries.value.reduce((x, y) => x + (Number(y) || 0), 0)
  const ch = changeRateSeries.value.reduce((x, y) => x + (Number(y) || 0), 0)
  return c === 0 && a === 0 && ch === 0
})

const currentTrend = computed(() => {
  if (trendTab.value === 'comments') {
    return {
      title: 'Comment Volume (last 14 days)',
      description: 'Daily total review comments across the selected repository.',
      datasets: [{ label: 'Comments', data: commentsSeries.value }],
      type: 'line' as const,
    }
  }
  if (trendTab.value === 'change') {
    return {
      title: 'Change-request Rate (last 14 days)',
      description: 'Percent of PRs receiving “changes requested”.',
      datasets: [{ label: 'Change %', data: changeRateSeries.value, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }],
      type: 'bar' as const,
    }
  }
  return {
    title: 'Avg Comments per PR (last 14 days)',
    description: 'Rolling per-day average comments per PR.',
    datasets: [{ label: 'Avg/PR', data: avgCommentsSeries.value, backgroundColor: 'rgba(10,189,198,0.15)', borderColor: '#0abdc6' }],
    type: 'line' as const,
  }
})
</script>

<template>
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
            >
              Comments
            </TerminalButton>
            <TerminalButton
              :variant="trendTab === 'change' ? 'primary' : 'ghost'"
              size="sm"
              @click="trendTab = 'change'"
              aria-label="Show Change-request rate trend"
            >
              Change Req
            </TerminalButton>
            <TerminalButton
              :variant="trendTab === 'avg' ? 'primary' : 'ghost'"
              size="sm"
              @click="trendTab = 'avg'"
              aria-label="Show Avg comments per PR trend"
            >
              Avg/PR
            </TerminalButton>
          </div>
        </template>
      </TerminalHeader>
    </template>

    <div v-if="!hasSelection" class="text-sm text-slate-500 dark:text-slate-400 p-3">
      Select PRs in the repository view to populate trends.
    </div>

    <!-- Loading -->
    <div v-else-if="pending && !hasAny" class="p-4">
      <div class="h-40 w-full rounded border border-dashed border-slate-300 dark:border-slate-700 animate-pulse"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error && !hasAny" class="p-4 text-sm text-rose-600 flex items-center gap-2">
      Failed to load trends.
      <button
        class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
        @click="(trendsQuery as any).refetch?.()"
        aria-label="Retry loading trends"
      >
        Retry
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="empty" class="p-4 text-sm text-slate-500">
      No trend data available for the last 14 days.
      <TrendChart
        class="mt-3 opacity-60"
        :type="currentTrend.type"
        :labels="labels"
        :datasets="[ { label: currentTrend.datasets[0].label, data: labels.map(() => 0) } ] as any"
        :title="currentTrend.title"
        :description="currentTrend.description"
        :reduced-motion="reducedMotion"
        :aria-summary-id="'trend-summary'"
        :height="260"
      >
        <template #summary>
          {{ currentTrend.title }}. Data points: {{ labels.length }} days. No data.
        </template>
      </TrendChart>
    </div>

    <!-- Data -->
    <TrendChart
      v-else
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
</template>

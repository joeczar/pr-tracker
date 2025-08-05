<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import RepoOverviewTiles from '@/components/repositories/RepoOverviewTiles.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import RepoTrendsPanel from '@/components/repositories/RepoTrendsPanel.vue'
import { repositoriesApi } from '@/lib/api/repositories'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { reviewsApi } from '@/lib/api/reviews'
import { analyticsApi } from '@/lib/api/analytics'
import { syncApi, type RepoSyncHistoryItem } from '@/lib/api/sync'
import { qk } from '@/lib/api/queryKeys'
import ErrorBoundary from "@/components/error/ErrorBoundary.vue"
import { useSelectionStore } from '@/stores/selection'
import PRList from '@/components/repositories/PRList.vue'
import RepoSyncHistory from '@/components/repositories/RepoSyncHistory.vue'

// Basic env
const reducedMotion: boolean =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  !!window.matchMedia('(prefers-reduced-motion: reduce)').matches

const route = useRoute()
const repoId = computed(() => Number(route.params.id))

// Selection store: keep global PR-centric context updated
const sel = useSelectionStore()

// Ensure store repository matches current route param
watch(
  () => repoId.value,
  async (id) => {
    if (Number.isFinite(id)) {
      sel.setRepository(id)
      // Hydrate persisted selection from server for this repo
      await sel.hydrateFromServer()
    } else {
      sel.setRepository(null)
    }
  },
  { immediate: true }
)

// Optional: pre-focus a PR if deep-linked via ?pr=123
/**
 * Deep-linked PRs:
 * - Support single ?pr=123, multiple ?pr=1&pr=2, or comma-separated ?pr=1,2
 */
const deepLinkedPrs = computed<number[]>(() => {
  const raw = route.query.pr
  if (raw == null) return []
  const vals = Array.isArray(raw) ? raw : [raw]
  const ids: number[] = []
  for (const v of vals) {
    String(v)
      .split(',')
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
      .forEach((n) => ids.push(n))
  }
  return Array.from(new Set(ids))
})
const days = ref(30)
const prState = ref<'open' | 'closed' | 'merged' | 'all'>('open')
const prLimit = ref(50)

const qc = useQueryClient()

// Queries
const repoInfo = useQuery({
  queryKey: computed(() => qk.repositories.byId(repoId.value)),
  queryFn: () => repositoriesApi.get(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const prList = useQuery({
  queryKey: computed(() => qk.prs.byRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value })),
  queryFn: () => pullRequestsApi.listByRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

/**
 * Adjust filters based on deep-linked PR after data loads.
 * Vue Query's composition API doesn't accept onSuccess in options typing here,
 * so watch the query result instead.
 */
/**
 * Keep selection in sync with deep-link and data loading.
 * - If deep-linked PRs exist, ensure filters allow visibility (use 'all' and a larger limit)
 * - Write all deep-linked PR ids into selection
 */
watch(
  () => prList.data.value,
  () => {
    if (deepLinkedPrs.value.length > 0) {
      if (prState.value !== 'all') prState.value = 'all'
      if (prLimit.value < 100) prLimit.value = 100
      sel.setSelectedPRNumbers(deepLinkedPrs.value)
      // Optionally keep URL tidy with normalized pr params
      sel.syncToUrl({ replace: true })
    }
  }
)

const prStats = useQuery({
  queryKey: computed(() => qk.prs.stats(repoId.value)),
  queryFn: () => pullRequestsApi.statsByRepo(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const _reviewMetrics = useQuery({
  queryKey: computed(() => qk.reviews.metrics(repoId.value, days.value)),
  queryFn: () => reviewsApi.metricsByRepo(repoId.value, days.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const trends = useQuery({
  queryKey: computed(() => qk.analytics.trends(repoId.value, days.value)),
  queryFn: () => analyticsApi.trendsByRepo(repoId.value, days.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

// Mutation: Sync now
const { mutate: syncNow, status: syncStatus } = useMutation({
  mutationFn: () => pullRequestsApi.syncRepo(repoId.value),
  onSuccess: async () => {
    // Invalidate related queries
    await Promise.all([
      qc.invalidateQueries({ queryKey: qk.prs.byRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }) }),
      qc.invalidateQueries({ queryKey: qk.prs.stats(repoId.value) }),
      qc.invalidateQueries({ queryKey: qk.analytics.trends(repoId.value, days.value) }),
      // Optional: sync history if used
      qc.invalidateQueries({ queryKey: qk.sync.history(repoId.value, 20) }),
    ])
    // toast success (placeholder)
    ;(window as any).__toast?.success?.('Sync queued')
  },
  onError: (err: any) => {
    const msg = err?.payload?.message || err?.message || 'Failed to queue sync'
    ;(window as any).__toast?.error?.(msg)
  },
})

// Derived UI state for overview tiles
const overview = computed(() => {
  const stats = prStats.data.value as any
  // last_sync not defined in types; guard access
  const lastSync = (trends.data.value as any)?.last_sync || null
  return [
    { label: 'Total PRs', value: stats?.total ?? '—', trend: 'flat' as const },
    { label: 'Open', value: stats?.open ?? '—', trend: 'up' as const },
    { label: 'Merged', value: stats?.merged ?? '—', trend: 'up' as const },
    { label: 'Closed', value: stats?.closed ?? '—', trend: 'down' as const },
    { label: 'Merge rate', value: stats?.merge_rate != null ? `${Math.round(stats.merge_rate)}%` : '—', trend: 'flat' as const },
    { label: 'Last sync', value: lastSync ? new Date(lastSync).toLocaleString() : '—', trend: 'flat' as const },
  ]
})

// Trends chart mapping
const trendTab = ref<'comments' | 'change'>('comments')
const labels = computed(() => {
  const trendsArray = (trends.data.value as any)?.trends ?? []
  return trendsArray.map((t: any) => t.date)
})
const commentsData = computed(() => {
  const trendsArray = (trends.data.value as any)?.trends ?? []
  return trendsArray.map((t: any) => t.avg_comments || 0)
})
const changeRateData = computed(() => {
  const trendsArray = (trends.data.value as any)?.trends ?? []
  // Use avg_reviews as a proxy for change request rate (0-100%)
  return trendsArray.map((t: any) => (t.avg_reviews || 0) * 100)
})

const currentTrend = computed(() => {
  if (trendTab.value === 'comments') {
    return {
      title: 'Comments over time',
      description: 'Daily review comments for this repository.',
      type: 'line' as const,
      datasets: [{ label: 'Comments', data: commentsData.value }]
    }
  }
  return {
    title: 'Change-request rate over time',
    description: 'Percent of PRs with changes requested.',
    type: 'bar' as const,
    datasets: [{ label: 'Change %', data: changeRateData.value, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }]
  }
})
/* Optional Sync History wiring */
const historyLimit = ref(10)

const {
  data: syncHistory,
  isPending: historyLoading,
  isError: historyError,
  error: historyErr,
  refetch: refetchHistory,
} = useQuery({
  queryKey: computed(() => qk.sync.history(repoId.value, historyLimit.value)),
  queryFn: async () => {
    try { await fetch('/auth/status', { credentials: 'include' }).catch(() => {}) } catch {}
    return syncApi.repoHistory(repoId.value, historyLimit.value)
  },
  enabled: computed(() => Number.isFinite(repoId.value) && historyLimit.value > 0),
})

</script>

<template>
  <section aria-labelledby="repo-detail-title" class="space-y-6">
    <!-- Sync History Panel -->
    <ErrorBoundary>
      <RepoSyncHistory
        :items="(((syncHistory as unknown) as { id: string; status: string; type?: string; started_at?: string; finished_at?: string; job_id?: string }[]) || []).map(it => ({ id: Number(it.id), status: it.status, type: it.type, started_at: it.started_at, finished_at: it.finished_at, job_id: it.job_id }))"
        :loading="!!historyLoading"
        :error="historyError ? ((historyErr as any)?.message || 'Unknown error') : null"
        :limit="historyLimit"
        @update:limit="(v: number) => { historyLimit = v; refetchHistory() }"
        @refresh="() => refetchHistory()"
      />
    </ErrorBoundary>

    <ErrorBoundary>
      <TerminalWindow>
        <template #title>
          <TerminalHeader>
            <template #title>
              <TerminalTitle command="repository-detail" />
            </template>
            <template #actions>
              <div class="flex items-center gap-2">
                <TerminalButton size="sm" variant="secondary" aria-label="Sync repository" :disabled="syncStatus === 'pending'" @click="syncNow">
                  <span v-if="syncStatus === 'pending'">Syncing…</span>
                  <span v-else>Sync</span>
                </TerminalButton>
              </div>
            </template>
          </TerminalHeader>
        </template>

        <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">
            {{ repoInfo.data?.value?.full_name || repoInfo.data?.value?.name || 'Repository' }} • Repository Details
          </h1>
          <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="secondary" aria-label="Sync repository" :disabled="syncStatus === 'pending'" @click="syncNow">
                <span v-if="syncStatus === 'pending'">Syncing…</span>
                <span v-else>Sync</span>
              </TerminalButton>
          </div>
        </header>

        <!-- Overview tiles -->

        <RepoOverviewTiles
          :metrics="overview as any"
          :loading="!!prStats.isPending.value || !!trends.isPending.value"
          :error="(prStats.isError.value || trends.isError.value) ? 'Failed to load repository overview.' : null"
        />
        </div>
      </TerminalWindow>
    </ErrorBoundary>

    <!-- Trends -->
    <ErrorBoundary>
      <RepoTrendsPanel
        :labels="labels as any"
        :comments="commentsData as any"
        :change-rate="changeRateData as any"
        :loading="!!trends.isPending.value"
        :error="trends.isError.value ? 'Failed to load trends.' : null"
        :reduced-motion="reducedMotion"
      />
    </ErrorBoundary>

    <!-- Filters + PR list -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside aria-label="Filters" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
      </aside>

      <section class="lg:col-span-3">
        <PRList
          :prs="(prList.data?.value || []) as any"
          :selected-numbers="sel.selectedPullRequestNumbers.value"
          :page-size="prLimit"
          :state-filter="prState"
          :loading="!!prList.isPending.value"
          :error="prList.isError.value ? 'Failed to load pull requests.' : null"
          @update:selectedNumbers="async (nums: number[]) => {
            // Diff current vs next and call store add/remove for each change
            const prev = new Set(sel.selectedPullRequestNumbers.value)
            const next = new Set(nums)
            // removals
            for (const n of prev) {
              if (!next.has(n)) await sel.removeSelectedPRNumber(n)
            }
            // additions
            for (const n of next) {
              if (!prev.has(n)) await sel.addSelectedPRNumber(n)
            }
            sel.syncToUrl({ replace: true })
          }"
          @request:selectVisible="() => {
            const visible = (prList.data?.value || []).map((p: any) => p.number)
            sel.setSelectedPRNumbers([...new Set([ ...sel.selectedPullRequestNumbers.value, ...visible ])])
            sel.syncToUrl({ replace: true })
          }"
          @request:clear="() => {
            sel.clearSelection()
            sel.setRepository(repoId as unknown as number)
            sel.syncToUrl({ replace: true })
          }"
          @request:less="() => prLimit = Math.max(25, prLimit - 25)"
          @request:more="() => prLimit = prLimit + 25"
        />
      </section>
    </div>
  </section>
</template>

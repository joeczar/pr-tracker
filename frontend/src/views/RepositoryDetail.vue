<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import { repositoriesApi } from '@/lib/api/repositories'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { reviewsApi } from '@/lib/api/reviews'
import { analyticsApi } from '@/lib/api/analytics'
import { syncApi } from '@/lib/api/sync'
import { qk } from '@/lib/api/queryKeys'

// Basic env
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const route = useRoute()
const repoId = computed(() => Number(route.params.id))
const days = ref(30)
const prState = ref<'open' | 'closed' | 'merged' | 'all'>('open')
const prLimit = ref(50)

const qc = useQueryClient()

// Queries
const repoInfo = useQuery({
  queryKey: qk.repositories.byId(repoId.value),
  queryFn: () => repositoriesApi.get(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const prList = useQuery({
  queryKey: qk.prs.byRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }),
  queryFn: () => pullRequestsApi.listByRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const prStats = useQuery({
  queryKey: qk.prs.stats(repoId.value),
  queryFn: () => pullRequestsApi.statsByRepo(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const reviewMetrics = useQuery({
  queryKey: qk.reviews.metrics(repoId.value, days.value),
  queryFn: () => reviewsApi.metricsByRepo(repoId.value, days.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const trends = useQuery({
  queryKey: qk.analytics.trends(repoId.value, days.value),
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
    { label: 'Merge rate', value: stats?.merge_rate != null ? `${Math.round(stats.merge_rate * 100)}%` : '—', trend: 'flat' as const },
    { label: 'Last sync', value: lastSync ? new Date(lastSync).toLocaleString() : '—', trend: 'flat' as const },
  ]
})

// Trends chart mapping
const trendTab = ref<'comments' | 'change'>('comments')
const labels = computed(() => (trends.data.value as any)?.labels ?? [])
const commentsData = computed(() => (trends.data.value as any)?.comments ?? [])
const changeRateData = computed(() => (trends.data.value as any)?.change_request_rate ?? [])

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
</script>

<template>
  <section aria-labelledby="repo-detail-title" class="space-y-6">
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="repository-detail" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="secondary" aria-label="Sync repository">Sync</TerminalButton>
              <TerminalButton size="sm" variant="ghost" aria-label="Export data">Export</TerminalButton>
              <TerminalButton size="sm" variant="accent" aria-label="Back">Back</TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>

      <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">
            {{ repoInfo.data?.value?.owner }}/{{ repoInfo.data?.value?.name }} • Repository Details
          </h1>
          <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="secondary" aria-label="Sync repository" :disabled="syncStatus === 'pending'" @click="syncNow">
                <span v-if="syncStatus === 'pending'">Syncing…</span>
                <span v-else>Sync</span>
              </TerminalButton>
          </div>
        </header>

        <!-- Overview tiles -->
        <div v-if="prStats.isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="i in 6" :key="i" class="h-24 rounded border border-dashed border-cyber-border animate-pulse"></div>
        </div>
        <div v-else-if="prStats.isError" class="text-sm text-red-600">
          Failed to load repository stats.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricTile
            v-for="(m, i) in overview"
            :key="i"
            :label="m.label"
            :value="m.value as any"
            :trend="m.trend as any"
          />
        </div>
      </div>
    </TerminalWindow>

    <!-- Trends -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="trends" />
          </template>
        </TerminalHeader>
      </template>
      <div class="p-3">
        <div class="mb-3 flex items-center gap-2">
          <TerminalButton
            :variant="trendTab === 'comments' ? 'primary' : 'ghost'"
            size="sm"
            @click="trendTab = 'comments'"
            aria-label="Show comments trend"
          >Comments</TerminalButton>
          <TerminalButton
            :variant="trendTab === 'change' ? 'primary' : 'ghost'"
            size="sm"
            @click="trendTab = 'change'"
            aria-label="Show change-request rate trend"
          >Change Req</TerminalButton>
        </div>
        <div v-if="trends.isLoading" class="h-64 rounded border border-dashed border-cyber-border animate-pulse"></div>
        <div v-else-if="trends.isError" class="text-sm text-red-600">Failed to load trends.</div>
        <TrendChart
          v-else
          :type="currentTrend.type"
          :labels="labels"
          :datasets="currentTrend.datasets as any"
          :title="currentTrend.title"
          :description="currentTrend.description"
          :reduced-motion="reducedMotion"
          :aria-summary-id="'repo-trend-summary'"
          :height="260"
        >
          <template #summary>
            {{ currentTrend.title }}. Points: {{ labels.length }}.
          </template>
        </TrendChart>
      </div>
    </TerminalWindow>

    <!-- Filters + PR list -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside aria-label="Filters" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
      </aside>

      <section aria-label="Pull requests" class="lg:col-span-3 rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
        <template v-if="prList.isLoading">
          <div v-for="i in 3" :key="i" class="h-16 rounded border border-dashed border-cyber-border animate-pulse"></div>
        </template>
        <template v-else-if="prList.isError">
          <div class="text-sm text-red-600">Failed to load pull requests.</div>
        </template>
        <template v-else>
          <div
            v-for="pr in prList.data?.value || []"
            :key="pr.id"
            class="rounded border border-cyber-border bg-cyber-surface/60 p-3"
          >
            <div class="flex items-center justify-between">
              <div class="font-medium">{{ pr.title }}</div>
              <div class="text-xs text-cyber-muted">#{{ pr.number }} • {{ pr.state }}</div>
            </div>
            <div class="text-xs text-cyber-muted">
              {{ pr.author_login }} • {{ pr.created_at ? new Date(pr.created_at).toLocaleDateString() : '' }}
            </div>
          </div>

          <!-- Pagination placeholder -->
          <div class="flex items-center justify-between pt-2">
            <div class="text-xs text-cyber-muted">
              Showing up to {{ prLimit }} {{ prState }} PRs
            </div>
            <div class="flex gap-2">
              <TerminalButton size="sm" variant="ghost" :disabled="prLimit <= 25" @click="prLimit = Math.max(25, prLimit - 25)">Less</TerminalButton>
              <TerminalButton size="sm" variant="ghost" @click="prLimit = prLimit + 25">More</TerminalButton>
            </div>
          </div>
        </template>
      </section>
    </div>
  </section>
</template>

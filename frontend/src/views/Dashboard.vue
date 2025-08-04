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

/**
 * Step 0 scaffolding:
 * - Repository selection state (route/localStorage/default-first)
 * - Do NOT replace visual data yet (keep mocks); just wire selection for later queries.
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
  queryKey: ['repositories', 'list'],
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
const selectedRepoId = ref<number | null>(null)

function readInitialSelectedRepoId(): number | null {
  try {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const fromQuery = params.get('repo')
    if (fromQuery && !Number.isNaN(Number(fromQuery))) {
      return Number(fromQuery)
    }
    const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem(SELECT_KEY) : null
    if (fromStorage && !Number.isNaN(Number(fromStorage))) {
      return Number(fromStorage)
    }
  } catch {
    // ignore
  }
  return null
}

onMounted(() => {
  selectedRepoId.value = readInitialSelectedRepoId()
})

watch(
  () => repositoryList.value,
  (list) => {
    if (!list || !Array.isArray(list) || list.length === 0) return
    if (selectedRepoId.value == null) {
      selectedRepoId.value = list[0].id
    }
  },
  { immediate: true }
)

watch(selectedRepoId, (id) => {
  if (id == null) return
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SELECT_KEY, String(id))
      // also keep URL in sync with ?repo=
      const url = new URL(window.location.href)
      url.searchParams.set('repo', String(id))
      window.history.replaceState({}, '', url.toString())
    }
  } catch {
    // ignore storage/URL errors
  }
})

const quickMetrics = ref([
  { label: 'Total Comments (30d)', value: 482, delta: -12, trend: 'down' as const, helpText: 'vs prior 30d' },
  { label: 'Avg Comments / PR', value: 2.7, delta: -8, trend: 'down' as const, helpText: 'vs prior 30d' },
  { label: 'Change-request rate', value: '18%', delta: 3, trend: 'up' as const, helpText: 'of PRs', ariaDescription: 'Higher is worse' },
  { label: 'Active Repos', value: 7, delta: 1, trend: 'up' as const, helpText: 'last 7 days' }
])

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
        <div class="text-xs text-slate-500">Skeleton view</div>
      </div>

      <!-- Step 0: Repository selector (scaffolding only) -->
      <div class="text-xs">
        <label for="dashboard-repo" class="sr-only">Select repository</label>
        <div class="flex items-center gap-2">
          <div class="rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-2 py-1.5">
            <select
              id="dashboard-repo"
              class="bg-transparent text-xs min-w-[200px] appearance-auto focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-[var(--cyber-accent,#ea00d9)]"
              v-model.number="selectedRepoId"
              :disabled="reposPending && repositoryList.length === 0"
              tabindex="0"
              aria-label="Select repository for dashboard metrics"
            >
              <option :value="null" disabled>Select repository…</option>
              <option
                v-for="r in repositoryList"
                :key="r.id"
                :value="r.id"
              >
                {{ r.owner }}/{{ r.name }}
              </option>
            </select>
          </div>
          <span v-if="reposPending" class="text-slate-500">Loading repos…</span>
          <span v-else-if="reposError && reposEmpty" class="text-red-600">Failed to load repositories</span>
          <span v-else-if="reposEmpty" class="text-slate-500">No repositories found</span>
          <button
            v-if="reposError || reposPending"
            class="ml-2 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
            @click="reposQuery.refetch()"
            aria-label="Retry loading repositories"
          >
            Retry
          </button>
        </div>
      </div>
    </header>

    <!-- Debug (temporary): show repo query status -->
    <div v-if="reposError || reposPending" class="text-[10px] text-slate-500 dark:text-slate-400">
      Repo debug — pending: {{ String(reposPending) }}, error: {{ String(reposError) }}, count: {{ repositoryList.length }}
    </div>

    <!-- Quick Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricTile
        v-for="(m, i) in quickMetrics"
        :key="i"
        :label="m.label"
        :value="m.value"
        :delta="m.delta as any"
        :trend="m.trend as any"
        :help-text="m.helpText"
        :aria-description="(m as any).ariaDescription"
      />
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

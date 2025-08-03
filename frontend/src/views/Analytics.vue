<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { analyticsApi } from '@/lib/api/analytics'
import { repositoriesApi } from '@/lib/api/repositories'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import ErrorBoundary from '@/components/error/ErrorBoundary.vue'

type Timeframe = '7d' | '30d' | '90d'

const timeframe = ref<Timeframe>('7d')
const loading = ref(true)

// Repo selector state
const selectedRepoId = ref<number | null>(null)
const daysMap: Record<Timeframe, number> = { '7d': 7, '30d': 30, '90d': 90 }
const days = computed(() => daysMap[timeframe.value])

// Load repositories for selection
const repos = useQuery({
  queryKey: ['repositories', 'list'],
  queryFn: () => repositoriesApi.list(),
})

// Trends for selected repo
const trendsQuery = useQuery({
  queryKey: ['analytics', 'trends', selectedRepoId, days],
  queryFn: () => analyticsApi.trendsByRepo(selectedRepoId.value as number, days.value),
  enabled: computed(() => Number.isFinite(selectedRepoId.value as number) && !!selectedRepoId.value),
})

// Compare state
const compareIds = ref<number[]>([])
const compareMutation = useMutation({
  mutationFn: () => analyticsApi.compare({ repository_ids: compareIds.value, days: days.value }),
})

// Stub: pretend-fetch analytics for a given timeframe
async function fetchAnalytics(tf: Timeframe) {
  loading.value = true
  try {
    // Placeholder to keep legacy skeletons working alongside real queries
    await new Promise((r) => setTimeout(r, 200))
  } finally {
    loading.value = false
  }
}

// Initial load
onMounted(() => {
  fetchAnalytics(timeframe.value)
})

// Refetch when timeframe changes
watch(timeframe, (tf) => {
  fetchAnalytics(tf)
})
</script>

<template>
  <section aria-labelledby="analytics-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="analytics-title" class="text-xl font-semibold tracking-tight">Analytics</h1>
      <div class="text-xs text-slate-500">Trends and comparison</div>
    </header>

    <!-- Timeframe Tabs -->
    <Tabs v-model="timeframe" class="w-full">
      <TabsList>
        <TabsTrigger value="7d">7d</TabsTrigger>
        <TabsTrigger value="30d">30d</TabsTrigger>
        <TabsTrigger value="90d">90d</TabsTrigger>
      </TabsList>

      <!-- Filters / Controls -->
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <template v-if="repos.isLoading">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-10 w-full" />
        </template>
        <template v-else>
          <div class="h-10 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 flex items-center">
            <label for="repo" class="sr-only">Repository</label>
            <select
              id="repo"
              class="w-full bg-transparent text-sm"
              v-model.number="selectedRepoId"
            >
              <option :value="null">Select repository…</option>
              <option
                v-for="r in (repos.data?.value || [])"
                :key="r.id"
                :value="r.id"
              >
                {{ r.owner }}/{{ r.name }}
              </option>
            </select>
          </div>
          <div class="h-10 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 text-xs flex items-center">
            Days: {{ days }}
          </div>
          <div class="h-10 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 text-xs flex items-center">
            Repos selected for compare: {{ compareIds.length }}
          </div>
          <div class="h-10 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 flex items-center justify-end">
            <button
              class="px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700"
              :disabled="!compareIds.length"
              @click="compareMutation.mutate()"
            >
              Compare
            </button>
          </div>
        </template>
      </div>

      <!-- Charts Grid -->
      <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TabsContent :value="timeframe">
          <ErrorBoundary>
            <section aria-label="Comments trend" class="rounded border border-slate-200 dark:border-slate-800 p-4">
              <template v-if="trendsQuery.isLoading">
                <Skeleton class="h-56 w-full" />
              </template>
              <template v-else-if="trendsQuery.isError || !selectedRepoId">
                <div class="text-xs text-slate-500">Select a repository to view trends.</div>
              </template>
              <TrendChart
                v-else
                :type="'line'"
                :labels="(trendsQuery.data?.value as any)?.labels || []"
                :datasets="[{ label: 'Comments', data: (trendsQuery.data?.value as any)?.comments || [] }]"
                :title="'Comments over time'"
                :description="'Daily review comments for this repository.'"
                :reduced-motion="false"
                :height="220"
              />
            </section>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent :value="timeframe">
          <ErrorBoundary>
            <section aria-label="Compare result" class="rounded border border-slate-200 dark:border-slate-800 p-4">
              <template v-if="compareMutation.isPending">
                <Skeleton class="h-56 w-full" />
              </template>
              <template v-else-if="compareMutation.isError">
                <div class="text-xs text-red-600">Compare failed.</div>
              </template>
              <div v-else class="text-xs text-slate-500">
                <div class="mb-2">Select repositories to compare (UI stub):</div>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="r in (repos.data?.value || [])"
                    :key="r.id"
                    class="inline-flex items-center gap-2 rounded border border-slate-300 dark:border-slate-700 px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      :value="r.id"
                      v-model="compareIds"
                    />
                    {{ r.owner }}/{{ r.name }}
                  </label>
                </div>
                <div class="mt-3">
                  <pre class="text-[10px] whitespace-pre-wrap">{{ JSON.stringify(compareMutation.data?.value, null, 2) }}</pre>
                </div>
              </div>
            </section>
          </ErrorBoundary>
        </TabsContent>
      </div>
    </Tabs>

  </section>
</template>

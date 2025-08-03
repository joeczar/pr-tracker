<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'

/**
 * Temporary mock data; replace with Pinia store wiring when backend is available.
 */
const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const overview = ref([
  { label: 'Total PRs', value: 23, delta: 5, trend: 'up' as const, helpText: 'last 30 days' },
  { label: 'Avg comments', value: 2.4, delta: -9, trend: 'down' as const, helpText: 'vs prior 30d' },
  { label: 'Change-request rate', value: '16%', delta: 2, trend: 'up' as const, helpText: 'of PRs' },
  { label: 'Last sync', value: '5m ago', trend: 'flat' as const }
])

const trendTab = ref<'comments' | 'change'>('comments')
const labels = Array.from({ length: 14 }, (_, i) => `D-${13 - i}`)
const commentsData = Array.from({ length: 14 }, () => Math.floor(5 + Math.random() * 25))
const changeRateData = Array.from({ length: 14 }, () => Math.round(6 + Math.random() * 12))

const currentTrend = computed(() => {
  if (trendTab.value === 'comments') {
    return {
      title: 'Comments over time',
      description: 'Daily review comments for this repository.',
      type: 'line' as const,
      datasets: [{ label: 'Comments', data: commentsData }]
    }
  }
  return {
    title: 'Change-request rate over time',
    description: 'Percent of PRs with changes requested.',
    type: 'bar' as const,
    datasets: [{ label: 'Change %', data: changeRateData, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }]
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
          <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">Repository Details</h1>
          <div class="text-xs text-cyber-muted">Skeleton view</div>
        </header>
        <!-- Overview tiles -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile
            v-for="(m, i) in overview"
            :key="i"
            :label="m.label"
            :value="m.value as any"
            :delta="(m as any).delta"
            :trend="m.trend as any"
            :help-text="(m as any).helpText"
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
        <TrendChart
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
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>

        <!-- Pagination placeholder -->
        <div class="flex items-center justify-between pt-2">
          <div class="h-8 w-28 rounded border border-dashed border-cyber-border"></div>
          <div class="flex gap-2">
            <div class="h-8 w-20 rounded border border-dashed border-cyber-border"></div>
            <div class="h-8 w-20 rounded border border-dashed border-cyber-border"></div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

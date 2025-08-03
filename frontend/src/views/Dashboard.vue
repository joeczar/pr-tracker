<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import MetricTile from '@/components/analytics/MetricTile.vue'
import ProgressRadial from '@/components/analytics/ProgressRadial.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'

/**
 * Mock dashboard data to enable UI composition prior to store wiring.
 * Replace with Pinia stores once backend endpoints are connected.
 */
const reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
    <header class="flex items-center justify-between">
      <h1 id="dashboard-title" class="text-xl font-semibold tracking-tight">Dashboard</h1>
      <div class="text-xs text-slate-500">Skeleton view</div>
    </header>

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

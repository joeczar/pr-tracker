<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'

const props = defineProps<{
  hasSelection: boolean
  selectedRepoId: number | null
  selectedPrIds: number[]
  reducedMotion: boolean
}>()

// Placeholder data until Step 2 wiring to backend analytics
const trendTab = ref<'comments' | 'change' | 'avg'>('comments')
const labels = computed(() => Array.from({ length: 14 }, (_, i) => `D-${13 - i}`))
const commentsData = computed(() => Array.from({ length: 14 }, () => Math.floor(10 + Math.random() * 40)))
const changeRateData = computed(() => Array.from({ length: 14 }, () => Math.round(8 + Math.random() * 14)))
const avgCommentsData = computed(() => Array.from({ length: 14 }, () => +(1.5 + Math.random() * 2.5).toFixed(1)))

const currentTrend = computed(() => {
  if (trendTab.value === 'comments') {
    return {
      title: 'Comment Volume (last 14 days)',
      description: 'Daily total review comments across tracked repositories.',
      datasets: [{ label: 'Comments', data: commentsData.value }],
      type: 'line' as const,
    }
  }
  if (trendTab.value === 'change') {
    return {
      title: 'Change-request Rate (last 14 days)',
      description: 'Percent of PRs receiving “changes requested”.',
      datasets: [{ label: 'Change %', data: changeRateData.value, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }],
      type: 'bar' as const,
    }
  }
  return {
    title: 'Avg Comments per PR (last 14 days)',
    description: 'Rolling per-day average comments per PR.',
    datasets: [{ label: 'Avg/PR', data: avgCommentsData.value, backgroundColor: 'rgba(10,189,198,0.15)', borderColor: '#0abdc6' }],
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

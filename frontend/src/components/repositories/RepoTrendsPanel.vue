<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TrendChart from '@/components/analytics/TrendChart.vue'

const props = defineProps<{
  labels: string[]
  comments: number[]
  changeRate: number[]
  loading?: boolean
  error?: string | null
  reducedMotion?: boolean
}>()

const tab = ref<'comments' | 'change'>('comments')

const current = computed(() => {
  if (tab.value === 'comments') {
    return {
      title: 'Comments over time',
      description: 'Daily review comments for this repository.',
      type: 'line' as const,
      datasets: [{ label: 'Comments', data: props.comments }]
    }
  }
  return {
    title: 'Change-request rate over time',
    description: 'Percent of PRs with changes requested.',
    type: 'bar' as const,
    datasets: [{ label: 'Change %', data: props.changeRate, backgroundColor: 'rgba(234,0,217,0.15)', borderColor: '#ea00d9' }]
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
      </TerminalHeader>
    </template>

    <div class="p-3">
      <div class="mb-3 flex items-center gap-2">
        <TerminalButton
          :variant="tab === 'comments' ? 'primary' : 'ghost'"
          size="sm"
          @click="tab = 'comments'"
          aria-label="Show comments trend"
        >
          Comments
        </TerminalButton>
        <TerminalButton
          :variant="tab === 'change' ? 'primary' : 'ghost'"
          size="sm"
          @click="tab = 'change'"
          aria-label="Show change-request rate trend"
        >
          Change Req
        </TerminalButton>
      </div>

      <div v-if="loading" class="h-64 rounded border border-dashed border-cyber-border animate-pulse"></div>
      <div v-else-if="error" class="text-sm text-rose-600">Failed to load trends: {{ error }}</div>

      <TrendChart
        v-else
        :type="current.type"
        :labels="labels"
        :datasets="current.datasets as any"
        :title="current.title"
        :description="current.description"
        :reduced-motion="!!reducedMotion"
        :aria-summary-id="'repo-trend-summary'"
        :height="260"
      >
        <template #summary>
          {{ current.title }}. Points: {{ labels.length }}.
        </template>
      </TrendChart>
    </div>
  </TerminalWindow>
</template>

<script setup lang="ts">
import MetricTile from '@/components/analytics/MetricTile.vue'
const _MetricTile = MetricTile

type Metric = {
  key?: string
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'flat'
  ariaLabel?: string
}

const _props = defineProps<{
  metrics: Metric[]
  loading?: boolean
  error?: string | null
}>()
</script>



<template>
  <div data-overview-tiles>
    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <div v-for="i in 6" :key="i" class="h-24 rounded border border-dashed border-cyber-border animate-pulse"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-sm text-rose-600">
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <div
        v-for="(m, i) in metrics"
        :key="m.key || m.label || i"
        class="rounded border border-cyber-border/70 bg-cyber-surface/40 p-3"
        :data-metric-key="m.key || m.label || i"
        role="group"
        :aria-label="m.ariaLabel || m.label"
      >
        <div class="text-xs text-muted-foreground" data-metric-label>{{ m.label }}</div>
        <div class="text-2xl font-semibold mt-1" data-metric-value>{{ m.value }}</div>
      </div>
    </div>
  </div>
</template>

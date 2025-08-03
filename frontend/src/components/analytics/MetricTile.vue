<script setup lang="ts">
import { computed } from 'vue'

type Trend = 'up' | 'down' | 'flat'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  delta?: number
  trend?: Trend
  helpText?: string
  ariaDescription?: string
}>(), {
  delta: undefined,
  trend: 'flat',
  helpText: '',
  ariaDescription: undefined
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return '▲'
  if (props.trend === 'down') return '▼'
  return '■'
})

const trendColor = computed(() => {
  if (props.trend === 'up') return 'text-[var(--cyber-primary,#00ff9f)]'
  if (props.trend === 'down') return 'text-[var(--cyber-accent,#ea00d9)]'
  return 'text-[var(--cyber-muted,#9ae8d6)]'
})

const deltaText = computed(() => {
  if (props.delta === undefined || props.delta === null) return ''
  const sign = props.delta > 0 ? '+' : ''
  return `${sign}${props.delta}%`
})

const ariaLabel = computed(() => {
  const base = `${props.label}: ${props.value}.`
  const delta = props.delta !== undefined ? ` ${props.trend === 'up' ? 'Up' : props.trend === 'down' ? 'Down' : 'Flat'} ${Math.abs(props.delta)} percent.` : ''
  const help = props.ariaDescription ? ` ${props.ariaDescription}` : ''
  return `${base}${delta}${help}`
})
</script>

<template>
  <div
    class="rounded-lg border border-[var(--cyber-border,#10223f)] bg-[var(--cyber-surface,#0b1228)] p-4"
    role="group"
    :aria-label="ariaLabel"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-xs font-terminal text-[var(--cyber-muted,#9ae8d6)]">
          {{ label }}
        </p>
        <p class="text-2xl font-mono text-[var(--cyber-text,#d2fff1)] tracking-tight">
          {{ value }}
        </p>
      </div>
      <div class="text-right">
        <div class="flex items-center gap-1 text-sm font-mono">
          <span :class="trendColor" aria-hidden="true">{{ trendIcon }}</span>
          <span :class="trendColor">{{ deltaText }}</span>
        </div>
        <p v-if="helpText" class="mt-1 text-[10px] text-[var(--cyber-muted,#9ae8d6)]">
          {{ helpText }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-terminal { font-family: Fira Code, Cascadia Code, Monaco, monospace; }
</style>

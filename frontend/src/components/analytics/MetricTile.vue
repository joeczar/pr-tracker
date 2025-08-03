<script setup lang="ts">
import { computed } from 'vue'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import Badge from '@/components/ui/badge/Badge.vue'

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

const trendVariant = computed(() => {
  if (props.trend === 'up') return 'default'
  if (props.trend === 'down') return 'destructive'
  return 'secondary'
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
  <Card role="group" :aria-label="ariaLabel">
    <CardContent class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <p class="text-xs font-terminal text-slate-500 dark:text-[var(--cyber-muted,#9ae8d6)]">
            {{ label }}
          </p>
          <p class="text-2xl font-mono text-slate-900 dark:text-[var(--cyber-text,#d2fff1)] tracking-tight">
            {{ value }}
          </p>
        </div>
        <div class="text-right">
          <div class="flex items-center gap-2 text-sm font-mono">
            <Badge :variant="trendVariant">
              <span aria-hidden="true">{{ trendIcon }}</span>
              <span class="ml-1">{{ deltaText }}</span>
            </Badge>
          </div>
          <p v-if="helpText" class="mt-1 text-[10px] text-slate-500 dark:text-[var(--cyber-muted,#9ae8d6)]">
            {{ helpText }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.font-terminal { font-family: Fira Code, Cascadia Code, Monaco, monospace; }
</style>

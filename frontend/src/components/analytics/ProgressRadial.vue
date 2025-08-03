<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value: number    // 0..100
  size?: number    // px
  stroke?: number  // px
  label?: string
  sublabel?: string
  goalLabel?: string
  reducedMotion?: boolean
  ariaDescription?: string
}>(), {
  size: 120,
  stroke: 10,
  label: '',
  sublabel: '',
  goalLabel: '',
  reducedMotion: false,
  ariaDescription: undefined
})

const normalized = computed(() => {
  const v = Number.isFinite(props.value) ? props.value : 0
  return Math.min(100, Math.max(0, v))
})

const radius = computed(() => (props.size - props.stroke) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - normalized.value / 100))

const colorVar = '--cyber-primary'
const trackVar = '--cyber-border'
const textVar = '--cyber-text'

const ariaLabel = computed(() => {
  const base = props.label ? `${props.label}: ` : 'Progress: '
  const pct = `${normalized.value}%`
  const goal = props.goalLabel ? `. Goal: ${props.goalLabel}.` : '.'
  const more = props.ariaDescription ? ` ${props.ariaDescription}` : ''
  return `${base}${pct}${goal}${more}`
})
</script>

<template>
  <div
    class="inline-flex flex-col items-center justify-center select-none"
    role="group"
    :aria-label="ariaLabel"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="block"
      aria-hidden="true"
    >
      <!-- Background track -->
      <circle
        :cx="size/2"
        :cy="size/2"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
        :stroke="`var(${trackVar}, #10223f)`"
        stroke-linecap="round"
        class="opacity-70"
      />
      <!-- Progress arc -->
      <circle
        :cx="size/2"
        :cy="size/2"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
        :stroke="`var(${colorVar}, #00ff9f)`"
        :style="{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: `${dashOffset}`,
          transition: reducedMotion ? 'none' : 'stroke-dashoffset 600ms ease'
        }"
        stroke-linecap="round"
        transform-origin="center"
        :transform="`rotate(-90 ${size/2} ${size/2})`"
      />
      <!-- Glow ring (subtle) -->
      <circle
        :cx="size/2"
        :cy="size/2"
        :r="radius"
        fill="none"
        :stroke="`var(${colorVar}, #00ff9f)`"
        :stroke-width="Math.max(1, stroke/4)"
        class="opacity-20"
        :transform="`rotate(-90 ${size/2} ${size/2})`"
      />
      <!-- Center text -->
      <g :transform="`translate(${size/2}, ${size/2})`">
        <text
          text-anchor="middle"
          dominant-baseline="central"
          class="font-mono"
          :fill="`var(${textVar}, #d2fff1)`"
          :font-size="Math.max(12, size * 0.2)"
        >
          {{ Math.round(normalized) }}%
        </text>
      </g>
    </svg>

    <div class="mt-2 text-center leading-tight">
      <p v-if="label" class="text-sm font-terminal text-[var(--cyber-muted,#9ae8d6)]">
        {{ label }}
      </p>
      <p v-if="sublabel" class="text-xs text-[var(--cyber-text,#d2fff1)]">
        {{ sublabel }}
      </p>
      <p v-if="goalLabel" class="text-[10px] text-[var(--cyber-muted,#9ae8d6)]">
        Goal: {{ goalLabel }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.font-terminal { font-family: Fira Code, Cascadia Code, Monaco, monospace; }
</style>

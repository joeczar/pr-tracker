<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Badge, type BadgeVariants } from '.'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  status?: 'active' | 'inactive' | 'error' | 'warning' | 'success' | 'processing'
  label?: string
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
  showIndicator?: boolean
}>(), {
  status: 'inactive',
  animate: true,
  size: 'md',
  showIndicator: true
})

// Map status to badge variant
const variant = computed((): BadgeVariants['variant'] => {
  return props.status as BadgeVariants['variant']
})

// Size-based styling
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-1.5 py-0.5 text-xs'
    case 'lg':
      return 'px-3 py-1 text-sm'
    default:
      return 'px-2.5 py-0.5 text-xs'
  }
})

// Indicator dot size
const indicatorSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-1.5 h-1.5'
    case 'lg':
      return 'w-3 h-3'
    default:
      return 'w-2 h-2'
  }
})

// Status indicator styling
const indicatorClasses = computed(() => {
  const baseClasses = `rounded-full border transition-all duration-300 ${indicatorSize.value}`
  
  switch (props.status) {
    case 'active':
      return `${baseClasses} bg-primary border-primary shadow-lg shadow-primary/40`
    case 'success':
      return `${baseClasses} bg-success border-success shadow-lg shadow-success/40`
    case 'error':
      return `${baseClasses} bg-destructive border-destructive shadow-lg shadow-destructive/40`
    case 'warning':
      return `${baseClasses} bg-warning border-warning shadow-lg shadow-warning/40`
    case 'processing':
      return `${baseClasses} bg-primary border-primary shadow-lg shadow-primary/60 ${props.animate ? 'animate-pulse' : ''}`
    case 'inactive':
    default:
      return `${baseClasses} bg-muted border-muted`
  }
})
</script>

<template>
  <Badge
    :variant="variant"
    :class="cn(
      'gap-1.5 font-terminal tracking-wide',
      sizeClasses,
      props.class
    )"
  >
    <!-- Status Indicator Dot -->
    <div
      v-if="showIndicator"
      :class="indicatorClasses"
      :aria-hidden="true"
    />
    
    <!-- Label Text -->
    <span v-if="label" class="select-none">
      {{ label }}
    </span>
    
    <!-- Slot for custom content -->
    <slot v-if="!label" />
  </Badge>
</template>
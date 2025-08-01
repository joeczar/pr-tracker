<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: 'default' | 'terminal' | 'command' | 'glow'
  glow?: boolean
}>(), {
  variant: 'default',
  glow: false
})
</script>

<template>
  <div
    :class="
      cn(
        'rounded-xl border bg-card text-card-foreground shadow-lg transition-all duration-300 font-terminal',
        {
          'border border-border shadow-lg shadow-black/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10': variant === 'terminal',
          'bg-background border-2 border-primary/50 shadow-primary/20': variant === 'command',
          'hover:shadow-2xl hover:shadow-primary/30 hover:border-primary/50': variant === 'glow',
          'shadow-primary/40': glow,
          'border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20': variant === 'default'
        },
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

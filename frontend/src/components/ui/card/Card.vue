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
          'terminal-window border-primary/30 shadow-2xl': variant === 'terminal',
          'bg-background border-2 border-primary/50 shadow-primary/20': variant === 'command',
          'hover:shadow-2xl hover:shadow-primary/30 hover:border-primary/50': variant === 'glow',
          'glow-primary': glow,
          'border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/20': variant === 'default'
        },
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

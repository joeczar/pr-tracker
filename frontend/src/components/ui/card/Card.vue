<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: 'default' | 'minimal' | 'glow' | 'terminal'
}>(), {
  variant: 'default'
})
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out',
        {
          'border-border hover:border-primary/30 hover:shadow-md': variant === 'default',
          'border-border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5': variant === 'minimal',
          'border-border hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]': variant === 'glow',
          'border-primary/30 font-mono hover:border-primary/60 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]': variant === 'terminal'
        },
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>

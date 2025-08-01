<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  status?: 'active' | 'inactive' | 'error' | 'warning' | 'success' | 'processing'
  label?: string
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  status: 'inactive',
  animate: true,
  size: 'md'
})
</script>

<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <div
      :class="cn(
        'rounded-full border-2 transition-all duration-300',
        {
          // Size variants
          'w-2 h-2': size === 'sm',
          'w-3 h-3': size === 'md', 
          'w-4 h-4': size === 'lg',
          
          // Status variants
          'bg-primary border-primary shadow-lg': status === 'active',
          'bg-muted border-muted-foreground': status === 'inactive',
          'bg-destructive border-destructive shadow-lg': status === 'error',
          'bg-warning border-warning shadow-lg': status === 'warning',
          'bg-success border-success shadow-lg': status === 'success',
          'bg-secondary border-secondary shadow-lg': status === 'processing',
          
          // Glow effects
          'glow-primary': status === 'active' && animate,
          'shadow-[0_0_10px_hsl(var(--destructive))]': status === 'error' && animate,
          'shadow-[0_0_10px_hsl(var(--warning))]': status === 'warning' && animate,
          'glow-success': status === 'success' && animate,
          'glow-accent': status === 'processing' && animate,
          
          // Pulse animation
          'animate-pulse': status === 'processing' && animate,
        }
      )"
    />
    
    <span 
      v-if="label" 
      :class="cn(
        'font-terminal text-sm',
        {
          'text-primary': status === 'active',
          'text-muted-foreground': status === 'inactive',
          'text-destructive': status === 'error',
          'text-warning': status === 'warning',
          'text-success': status === 'success',
          'text-secondary': status === 'processing',
        }
      )"
    >
      {{ label }}
    </span>
  </div>
</template>
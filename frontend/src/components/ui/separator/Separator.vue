<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { Separator, type SeparatorProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const separatorVariants = cva(
  'shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-border',
        terminal: 'bg-primary/30 shadow-sm',
        cyberpunk: 'bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-lg shadow-primary/20',
        dashed: 'border-border border-dashed bg-transparent',
        dotted: 'border-border border-dotted bg-transparent',
        glow: 'bg-primary/40 shadow-md shadow-primary/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface SeparatorVariantProps extends SeparatorProps {
  variant?: VariantProps<typeof separatorVariants>['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<SeparatorVariantProps>(), {
  orientation: 'horizontal',
  decorative: true,
  variant: 'default',
})

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const getSizeClasses = () => {
  if (props.variant === 'dashed' || props.variant === 'dotted') {
    return props.orientation === 'horizontal' 
      ? 'border-t w-full' 
      : 'border-l h-full'
  }
  return props.orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'
}
</script>

<template>
  <Separator
    v-bind="delegatedProps"
    :class="cn(separatorVariants({ variant }), getSizeClasses(), props.class)"
  />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const progressVariants = cva(
  'relative w-full overflow-hidden transition-all',
  {
    variants: {
      variant: {
        default: 'h-2 rounded-full bg-primary/20',
        terminal: 'h-3 bg-background border border-primary/30 font-terminal shadow-inner',
        cyberpunk: 'h-4 rounded-sm bg-gradient-to-r from-background/50 to-background/20 border border-primary/50 backdrop-blur-sm shadow-lg shadow-primary/10',
        loading: 'h-1 bg-muted/50',
        thick: 'h-6 rounded bg-muted/20 border border-border',
      },
      size: {
        sm: 'h-1',
        md: 'h-2', 
        lg: 'h-4',
      }
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const progressIndicatorVariants = cva(
  'h-full w-full flex-1 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        terminal: 'bg-primary shadow-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer',
        cyberpunk: 'bg-gradient-to-r from-primary to-accent glow-effect shadow-lg shadow-primary/30',
        loading: 'bg-primary/60 animate-pulse',
        thick: 'bg-primary rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ProgressVariantProps extends ProgressRootProps {
  variant?: VariantProps<typeof progressVariants>['variant']
  size?: VariantProps<typeof progressVariants>['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(
  defineProps<ProgressVariantProps>(),
  {
    modelValue: 0,
    variant: 'default',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size')
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :class="cn(progressVariants({ variant, size }), props.class)"
  >
    <ProgressIndicator
      :class="cn(progressIndicatorVariants({ variant }))"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>

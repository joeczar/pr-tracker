<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { reactiveOmit } from '@vueuse/core'
import { TooltipContent, type TooltipContentEmits, type TooltipContentProps, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        terminal: 'bg-background/95 border border-primary/30 text-primary font-terminal backdrop-blur-sm shadow-lg shadow-primary/20',
        cyberpunk: 'bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/50 text-primary font-terminal backdrop-blur-md glow-text',
        info: 'bg-blue-600 text-white font-terminal',
        warning: 'bg-yellow-600 text-black font-terminal',
        error: 'bg-red-600 text-white font-terminal',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

defineOptions({
  inheritAttrs: false,
})

export interface TooltipContentVariantProps extends TooltipContentProps {
  variant?: VariantProps<typeof tooltipVariants>['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<TooltipContentVariantProps>(), {
  sideOffset: 4,
  variant: 'default',
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent v-bind="{ ...forwarded, ...$attrs }" :class="cn(tooltipVariants({ variant }), props.class)">
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>

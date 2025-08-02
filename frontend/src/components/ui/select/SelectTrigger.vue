<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDown } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props extends SelectTriggerProps {
  class?: HTMLAttributes['class']
  variant?: 'default' | 'terminal'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start',
      {
        'border-input bg-transparent px-3 py-2 text-sm focus:ring-ring': variant === 'default',
        'border-primary/30 bg-input px-3 py-2 text-sm font-mono text-primary focus:ring-primary focus:border-primary hover:border-primary/60 hover:shadow-[0_0_10px_hsl(var(--primary)/0.2)] transition-all duration-200': variant === 'terminal'
      },
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown
        :class="cn(
          'w-4 h-4 shrink-0',
          variant === 'terminal' ? 'text-primary/70' : 'opacity-50'
        )"
      />
    </SelectIcon>
  </SelectTrigger>
</template>

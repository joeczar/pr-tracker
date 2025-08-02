<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { type DialogVariants, dialogTitleVariants } from '.'

const props = defineProps<DialogTitleProps & {
  class?: HTMLAttributes['class']
  variant?: DialogVariants['variant']
}>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn(
      dialogTitleVariants({ variant: props.variant }),
      props.class,
    )"
  >
    <slot />
  </DialogTitle>
</template>

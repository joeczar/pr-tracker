<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogDescription, type DialogDescriptionProps, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { type DialogVariants, dialogDescriptionVariants } from '.'

const props = defineProps<DialogDescriptionProps & {
  class?: HTMLAttributes['class']
  variant?: DialogVariants['variant']
}>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogDescription
    v-bind="forwardedProps"
    :class="cn(
      dialogDescriptionVariants({ variant: props.variant }),
      props.class,
    )"
  >
    <slot />
  </DialogDescription>
</template>

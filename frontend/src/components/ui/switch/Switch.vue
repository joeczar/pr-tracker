<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SwitchRoot,
  type SwitchRootEmits,
  type SwitchRootProps,
  SwitchThumb,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { type SwitchVariants, switchVariants, switchThumbVariants } from '.'

const props = defineProps<SwitchRootProps & {
  class?: HTMLAttributes['class']
  variant?: SwitchVariants['variant']
}>()

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="cn(
      switchVariants({ variant: props.variant }),
      props.class,
    )"
  >
    <SwitchThumb
      :class="cn(switchThumbVariants({ variant: props.variant }))"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>

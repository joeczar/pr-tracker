<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  variant?: 'default' | 'terminal' | 'command'
  prompt?: string
}>(), {
  variant: 'default',
  prompt: '$'
})

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <div 
    v-if="variant === 'terminal' || variant === 'command'"
    :class="cn('flex items-center bg-input border border-border rounded-md transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:glow-primary')"
  >
    <span 
      v-if="variant === 'terminal'" 
      class="px-3 py-2 text-primary font-terminal text-sm select-none"
    >
      {{ prompt }}&nbsp;
    </span>
    <input 
      v-model="modelValue" 
      :class="cn(
        'flex h-10 w-full bg-transparent px-3 py-2 text-sm font-terminal transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0',
        {
          'pl-0': variant === 'terminal',
          'text-primary': variant === 'terminal' || variant === 'command'
        },
        props.class
      )"
    >
  </div>
  <input 
    v-else
    v-model="modelValue" 
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm font-terminal shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50',
      props.class
    )"
  >
</template>

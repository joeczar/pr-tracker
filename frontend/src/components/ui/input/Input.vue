<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  variant?: 'default' | 'terminal'
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
    v-if="variant === 'terminal'"
    :class="cn('flex items-center bg-input border border-border rounded-md transition-all duration-200 ease-out focus-within:border-primary focus-within:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]')"
  >
    <span class="px-3 py-2 text-primary font-mono text-sm select-none">
      {{ prompt }}&nbsp;
    </span>
    <input 
      v-model="modelValue" 
      :class="cn(
        'flex h-10 w-full bg-transparent px-0 py-2 text-sm font-mono text-primary transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0',
        props.class
      )"
    >
  </div>
  <input 
    v-else
    v-model="modelValue" 
    :class="cn(
      'flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm font-sans shadow-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_hsl(var(--primary)/0.2)] disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/30',
      props.class
    )"
  >
</template>

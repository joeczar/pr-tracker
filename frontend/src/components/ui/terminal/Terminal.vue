<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  title?: string
  showHeader?: boolean
  variant?: 'default' | 'compact' | 'fullscreen'
}>(), {
  title: 'Terminal',
  showHeader: true,
  variant: 'default'
})
</script>

<template>
  <div
    :class="cn(
      'terminal-window overflow-hidden',
      {
        'h-full': variant === 'fullscreen',
        'min-h-[400px]': variant === 'default',
        'min-h-[200px]': variant === 'compact'
      },
      props.class
    )"
  >
    <!-- Terminal Header -->
    <div v-if="showHeader" class="terminal-header">
      <div class="flex items-center gap-2">
        <div class="terminal-dot terminal-dot-close"></div>
        <div class="terminal-dot terminal-dot-minimize"></div>
        <div class="terminal-dot terminal-dot-maximize"></div>
      </div>
      <div class="flex-1 text-center">
        <span class="text-sm font-terminal text-muted-foreground">{{ title }}</span>
      </div>
      <div class="w-16"></div> <!-- Spacer for centering -->
    </div>

    <!-- Terminal Content -->
    <div class="p-4 h-full overflow-auto bg-background/95 backdrop-blur-sm">
      <slot />
    </div>
  </div>
</template>
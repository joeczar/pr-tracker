<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: 'default' | 'compact' | 'animated'
  text?: string
}>(), {
  variant: 'default',
  text: 'PR TRACKER'
})

const asciiArt = `
 ██████╗ ██████╗     ████████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ 
 ██╔══██╗██╔══██╗    ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
 ██████╔╝██████╔╝       ██║   ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝
 ██╔═══╝ ██╔══██╗       ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
 ██║     ██║  ██║       ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
 ╚═╝     ╚═╝  ╚═╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`

const compactArt = `
 ██████╗ ██████╗     ████████╗██████╗  █████╗  ██████╗██╗  ██╗
 ██╔══██╗██╔══██╗    ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
 ██████╔╝██████╔╝       ██║   ██████╔╝███████║██║     █████╔╝ 
 ██╔═══╝ ██╔══██╗       ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ 
 ██║     ██║  ██║       ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
 ╚═╝     ╚═╝  ╚═╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`
</script>

<template>
  <div 
    :class="cn(
      'text-center font-mono leading-tight select-none',
      {
        'text-xs sm:text-sm': variant === 'compact',
        'text-sm md:text-base': variant === 'default',
        'text-sm md:text-base glitch': variant === 'animated'
      },
      props.class
    )"
    :data-text="text"
  >
    <pre 
      :class="cn(
        'whitespace-pre phosphor-text transition-all duration-500',
        {
          'hover:text-accent cursor-pointer': variant === 'animated',
          'text-primary': variant !== 'animated'
        }
      )"
    >{{ variant === 'compact' ? compactArt : asciiArt }}</pre>
    
    <div 
      v-if="variant === 'animated'" 
      class="mt-2 text-muted-foreground text-xs typing"
    >
      System initialized. Cyberpunk mode: ACTIVE
    </div>
    
    <div 
      v-else-if="variant === 'default'"
      class="mt-2 text-muted-foreground text-sm"
    >
      > Pull Request Progress Tracking System v2.0
    </div>
  </div>
</template>
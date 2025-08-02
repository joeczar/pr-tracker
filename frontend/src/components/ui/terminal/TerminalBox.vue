<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  /** Box title */
  title?: string
  /** Box variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  /** Border style */
  border?: 'solid' | 'dashed' | 'dotted' | 'none'
  /** Padding size */
  padding?: 'none' | 'sm' | 'base' | 'lg'
  /** Whether the box is scrollable */
  scrollable?: boolean
  /** Additional CSS classes */
  class?: string
  /** Header slot content */
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  border: 'solid',
  padding: 'base',
  scrollable: false,
  showHeader: true
})

// Compute border classes
const borderClass = computed(() => {
  if (props.border === 'none') return ''
  
  const borderStyle = props.border === 'solid' ? 'border' : `border-${props.border}`
  
  switch (props.variant) {
    case 'primary': return `${borderStyle} border-primary`
    case 'secondary': return `${borderStyle} border-secondary`
    case 'success': return `${borderStyle} border-success`
    case 'warning': return `${borderStyle} border-warning`
    case 'error': return `${borderStyle} border-destructive`
    default: return `${borderStyle} terminal-border-muted`
  }
})

// Compute padding classes
const paddingClass = computed(() => {
  switch (props.padding) {
    case 'none': return ''
    case 'sm': return 'terminal-p-2'
    case 'base': return 'terminal-p-4'
    case 'lg': return 'terminal-p-6'
    default: return 'terminal-p-4'
  }
})

// Compute background class
const backgroundClass = computed(() => {
  switch (props.variant) {
    case 'primary': return 'bg-primary/5'
    case 'secondary': return 'bg-secondary/5'
    case 'success': return 'bg-success/5'
    case 'warning': return 'bg-warning/5'
    case 'error': return 'bg-destructive/5'
    default: return 'bg-card'
  }
})
</script>

<template>
  <div
    :class="cn(
      'terminal-box',
      borderClass,
      backgroundClass,
      'rounded-sm',
      props.class
    )"
  >
    <!-- Header -->
    <div
      v-if="showHeader && (title || $slots.header)"
      :class="cn(
        'terminal-box-header',
        'flex items-center justify-between',
        'terminal-p-3 border-b',
        borderClass.includes('border-primary') ? 'border-primary/30' : 'border-border',
        'bg-background/50'
      )"
    >
      <div v-if="title" class="terminal-text text-sm font-medium text-foreground">
        {{ title }}
      </div>
      <slot name="header" />
    </div>

    <!-- Content -->
    <div
      :class="cn(
        'terminal-box-content',
        paddingClass,
        {
          'overflow-auto': scrollable,
          'max-h-96': scrollable
        }
      )"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.terminal-box {
  @apply relative;
  
  /* Terminal-style subtle glow effect */
  box-shadow: 
    0 0 0 1px hsl(var(--border)),
    0 2px 8px rgba(0, 0, 0, 0.1);
  
  /* Subtle terminal scanlines effect */
  background-image: 
    linear-gradient(
      transparent 50%,
      rgba(0, 255, 159, 0.01) 50%
    );
  background-size: 100% 2px;
  
  transition: all 0.2s ease;
}

.terminal-box:hover {
  box-shadow: 
    0 0 0 1px hsl(var(--border)),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.terminal-box-header {
  @apply terminal-text;
  backdrop-filter: blur(4px);
}

.terminal-box-content {
  @apply terminal-text;
}

/* Custom scrollbar for scrollable boxes */
.terminal-box-content::-webkit-scrollbar {
  @apply w-2;
}

.terminal-box-content::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.terminal-box-content::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

.terminal-box-content::-webkit-scrollbar-thumb:hover {
  @apply bg-primary/50;
}

/* Firefox scrollbar */
.terminal-box-content {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

/* Variant-specific hover effects */
.terminal-box:has(.border-primary):hover {
  box-shadow: 
    0 0 0 1px hsl(var(--primary) / 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 8px hsl(var(--primary) / 0.1);
}

.terminal-box:has(.border-success):hover {
  box-shadow: 
    0 0 0 1px hsl(var(--success) / 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 8px hsl(var(--success) / 0.1);
}

.terminal-box:has(.border-warning):hover {
  box-shadow: 
    0 0 0 1px hsl(var(--warning) / 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 8px hsl(var(--warning) / 0.1);
}

.terminal-box:has(.border-destructive):hover {
  box-shadow: 
    0 0 0 1px hsl(var(--destructive) / 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 8px hsl(var(--destructive) / 0.1);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .terminal-box {
    background-image: none;
    box-shadow: 0 0 0 2px hsl(var(--foreground));
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .terminal-box {
    transition: none;
    background-image: none;
  }
}
</style>

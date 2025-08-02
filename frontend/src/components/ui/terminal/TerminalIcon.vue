<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  /** Icon content - can be emoji, text, or HTML */
  icon?: string
  /** Icon size variant */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted'
  /** Additional CSS classes */
  class?: string
  /** Fallback icon if main icon is not available */
  fallback?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '⚡',
  size: 'base',
  variant: 'default',
  fallback: '•'
})

// Compute size classes
const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'terminal-icon-xs'
    case 'sm': return 'terminal-icon-sm'
    case 'base': return 'terminal-icon-base'
    case 'lg': return 'terminal-icon-lg'
    case 'xl': return 'terminal-icon-xl'
    default: return 'terminal-icon-base'
  }
})

// Compute color classes
const colorClass = computed(() => {
  switch (props.variant) {
    case 'primary': return 'text-primary'
    case 'secondary': return 'text-secondary'
    case 'success': return 'text-success'
    case 'warning': return 'text-warning'
    case 'error': return 'text-destructive'
    case 'muted': return 'text-muted-foreground'
    default: return 'text-foreground'
  }
})

// Display icon with fallback
const displayIcon = computed(() => {
  return props.icon || props.fallback
})
</script>

<template>
  <span
    :class="cn(
      'terminal-icon',
      sizeClass,
      colorClass,
      'select-none',
      props.class
    )"
    :aria-hidden="true"
  >
    {{ displayIcon }}
  </span>
</template>

<style scoped>
.terminal-icon {
  /* Force consistent sizing - this is crucial for emoji control */
  font-size: inherit !important;
  width: inherit !important;
  height: inherit !important;
  max-width: inherit !important;
  max-height: inherit !important;

  /* Ensure consistent rendering across different fonts */
  font-variant-emoji: text;

  /* Prevent text selection and improve alignment */
  user-select: none;
  text-align: center;

  /* Improve emoji rendering */
  font-feature-settings: 'liga' off;

  /* Ensure proper vertical alignment */
  vertical-align: middle;

  /* Force line height to match container */
  line-height: 1 !important;

  /* Constrain content to container */
  overflow: hidden;
  text-overflow: clip;

  /* Force emoji to respect container size */
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;

  /* Prevent emoji from breaking out of bounds */
  box-sizing: border-box;

  /* Scale emoji down if needed */
  transform-origin: center;
}

/* Force emoji fonts to respect sizing */
.terminal-icon {
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', monospace !important;
}

/* Additional constraint for emoji characters */
.terminal-icon::before {
  content: '';
  display: inline-block;
  width: 0;
  height: 100%;
  vertical-align: middle;
}

/* Accessibility: High contrast mode */
@media (prefers-contrast: high) {
  .terminal-icon {
    filter: contrast(1.2);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .terminal-icon {
    transition: none;
  }
}
</style>

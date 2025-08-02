<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  /** Text element type */
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'code'
  /** Text size */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  /** Text weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  /** Text color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted' | 'accent'
  /** Whether to use monospace font */
  mono?: boolean
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Whether text should truncate */
  truncate?: boolean
  /** Additional CSS classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'span',
  size: 'base',
  weight: 'normal',
  variant: 'default',
  mono: true,
  align: 'left',
  truncate: false
})

// Compute size classes
const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'text-xs'
    case 'sm': return 'text-sm'
    case 'base': return 'text-base'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    case '2xl': return 'text-2xl'
    default: return 'text-base'
  }
})

// Compute weight classes
const weightClass = computed(() => {
  switch (props.weight) {
    case 'normal': return 'font-normal'
    case 'medium': return 'font-medium'
    case 'semibold': return 'font-semibold'
    case 'bold': return 'font-bold'
    default: return 'font-normal'
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
    case 'accent': return 'text-accent'
    default: return 'text-foreground'
  }
})

// Compute font family class
const fontClass = computed(() => {
  return props.mono ? 'terminal-text' : 'font-sans'
})

// Compute alignment class
const alignClass = computed(() => {
  switch (props.align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
  }
})

// Compute truncate class
const truncateClass = computed(() => {
  return props.truncate ? 'truncate' : ''
})

// Compute heading-specific classes
const headingClass = computed(() => {
  if (!props.as.startsWith('h')) return ''
  
  switch (props.as) {
    case 'h1': return 'text-2xl font-bold leading-tight'
    case 'h2': return 'text-xl font-semibold leading-tight'
    case 'h3': return 'text-lg font-semibold leading-snug'
    case 'h4': return 'text-base font-medium leading-snug'
    case 'h5': return 'text-sm font-medium leading-normal'
    case 'h6': return 'text-xs font-medium leading-normal'
    default: return ''
  }
})

// Compute code-specific classes
const codeClass = computed(() => {
  return props.as === 'code' 
    ? 'bg-muted px-1 py-0.5 rounded text-sm terminal-text' 
    : ''
})
</script>

<template>
  <component
    :is="as"
    :class="cn(
      'terminal-text-component',
      fontClass,
      sizeClass,
      weightClass,
      colorClass,
      alignClass,
      truncateClass,
      headingClass,
      codeClass,
      props.class
    )"
  >
    <slot />
  </component>
</template>

<style scoped>
.terminal-text-component {
  /* Ensure proper line height for readability */
  line-height: 1.5;
  
  /* Improve text rendering */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Heading-specific styles */
h1.terminal-text-component,
h2.terminal-text-component,
h3.terminal-text-component,
h4.terminal-text-component,
h5.terminal-text-component,
h6.terminal-text-component {
  /* Terminal-style heading glow effect */
  text-shadow: 0 0 2px currentColor;
  margin-bottom: var(--terminal-space-2);
}

/* Code-specific styles */
code.terminal-text-component {
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0;
}

/* Label-specific styles */
label.terminal-text-component {
  cursor: pointer;
  user-select: none;
}

/* Paragraph spacing */
p.terminal-text-component {
  margin-bottom: var(--terminal-space-3);
}

p.terminal-text-component:last-child {
  margin-bottom: 0;
}

/* Selection styling */
.terminal-text-component::selection {
  background-color: hsl(var(--primary) / 0.3);
  color: hsl(var(--primary-foreground));
}

/* High contrast mode */
@media (prefers-contrast: high) {
  h1.terminal-text-component,
  h2.terminal-text-component,
  h3.terminal-text-component,
  h4.terminal-text-component,
  h5.terminal-text-component,
  h6.terminal-text-component {
    text-shadow: none;
    font-weight: bold;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  h1.terminal-text-component,
  h2.terminal-text-component,
  h3.terminal-text-component,
  h4.terminal-text-component,
  h5.terminal-text-component,
  h6.terminal-text-component {
    text-shadow: none;
  }
}
</style>

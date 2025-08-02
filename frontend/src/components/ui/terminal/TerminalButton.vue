<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline'
  /** Button size */
  size?: 'sm' | 'base' | 'lg'
  /** Whether button is disabled */
  disabled?: boolean
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
  /** Additional CSS classes */
  class?: string
  /** Loading state */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'base',
  disabled: false,
  type: 'button',
  loading: false
})

// Compute size classes
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'terminal-p-2 text-sm min-h-[32px]'
    case 'base': return 'terminal-p-3 text-sm min-h-[40px]'
    case 'lg': return 'terminal-p-4 text-base min-h-[48px]'
    default: return 'terminal-p-3 text-sm min-h-[40px]'
  }
})

// Compute variant classes
const variantClass = computed(() => {
  const base = 'terminal-text font-medium transition-all duration-200'
  
  switch (props.variant) {
    case 'primary':
      return `${base} bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary`
    case 'secondary':
      return `${base} bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary`
    case 'success':
      return `${base} bg-success text-background hover:bg-success/90 focus:ring-success`
    case 'warning':
      return `${base} bg-warning text-background hover:bg-warning/90 focus:ring-warning`
    case 'error':
      return `${base} bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive`
    case 'ghost':
      return `${base} bg-transparent text-foreground hover:bg-muted hover:text-foreground focus:ring-primary`
    case 'outline':
      return `${base} bg-transparent border terminal-border text-foreground hover:bg-muted focus:ring-primary`
    default:
      return `${base} bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground focus:ring-primary`
  }
})

// Compute disabled classes
const disabledClass = computed(() => {
  return props.disabled || props.loading 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="cn(
      'terminal-button',
      'inline-flex items-center justify-center gap-2',
      'rounded-sm border-0 outline-none',
      'focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
      'active:scale-95',
      sizeClass,
      variantClass,
      disabledClass,
      props.class
    )"
  >
    <!-- Loading spinner -->
    <div
      v-if="loading"
      class="terminal-icon-sm animate-spin"
      aria-hidden="true"
    >
      ⟳
    </div>
    
    <!-- Button content -->
    <slot />
  </button>
</template>

<style scoped>
.terminal-button {
  /* Ensure minimum touch target size */
  min-width: 44px;
  
  /* Terminal-style subtle effects */
  position: relative;
  overflow: hidden;
}

/* Terminal glow effect on hover */
.terminal-button:hover:not(:disabled) {
  box-shadow: 
    0 0 8px hsl(var(--primary) / 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Active state */
.terminal-button:active:not(:disabled) {
  transform: translateY(1px);
}

/* Focus state */
.terminal-button:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* Primary variant glow */
.terminal-button:has(.bg-primary):hover:not(:disabled) {
  box-shadow: 
    0 0 12px hsl(var(--primary) / 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Success variant glow */
.terminal-button:has(.bg-success):hover:not(:disabled) {
  box-shadow: 
    0 0 12px hsl(var(--success) / 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Warning variant glow */
.terminal-button:has(.bg-warning):hover:not(:disabled) {
  box-shadow: 
    0 0 12px hsl(var(--warning) / 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Error variant glow */
.terminal-button:has(.bg-destructive):hover:not(:disabled) {
  box-shadow: 
    0 0 12px hsl(var(--destructive) / 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Loading animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .terminal-button {
    border: 2px solid currentColor;
  }
  
  .terminal-button:hover:not(:disabled) {
    box-shadow: none;
    background-color: hsl(var(--foreground));
    color: hsl(var(--background));
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .terminal-button {
    transition: none;
  }
  
  .terminal-button:active:not(:disabled) {
    transform: none;
  }
  
  .animate-spin {
    animation: none;
  }
}

/* Touch devices */
@media (hover: none) {
  .terminal-button:hover {
    box-shadow: none;
  }
}
</style>

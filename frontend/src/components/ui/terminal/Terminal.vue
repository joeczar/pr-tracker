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
    <div class="terminal-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.terminal-window {
  @apply bg-card border border-border rounded-xl shadow-2xl;
  @apply relative overflow-hidden;

  /* Cyberpunk glow effect */
  box-shadow:
    0 0 0 1px hsl(var(--border)),
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 20px hsl(var(--primary) / 0.1);

  /* Terminal scanlines effect (subtle) */
  background-image:
    linear-gradient(
      transparent 50%,
      rgba(0, 255, 159, 0.02) 50%
    );
  background-size: 100% 4px;

  /* Subtle animation */
  transition: all 0.3s ease;
}

.terminal-window:hover {
  box-shadow:
    0 0 0 1px hsl(var(--primary) / 0.3),
    0 8px 30px rgba(0, 0, 0, 0.6),
    0 0 30px hsl(var(--primary) / 0.2);
}

.terminal-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply bg-gradient-to-r from-card/80 to-background/60;
  @apply border-b border-border backdrop-blur-sm;

  /* Terminal header glow */
  background-image: linear-gradient(
    90deg,
    transparent,
    hsl(var(--primary) / 0.05) 50%,
    transparent
  );
}

.terminal-dot {
  @apply w-3 h-3 rounded-full transition-all duration-200;
  @apply cursor-pointer;
}

.terminal-dot:hover {
  @apply scale-110;
  box-shadow: 0 0 8px currentColor;
}

.terminal-dot-close {
  @apply bg-red-500;
}

.terminal-dot-minimize {
  @apply bg-yellow-500;
}

.terminal-dot-maximize {
  @apply bg-green-500;
}

.terminal-content {
  @apply p-4 h-full overflow-auto;
  @apply bg-background/95 backdrop-blur-sm;
  @apply font-mono text-sm leading-relaxed;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.terminal-content::-webkit-scrollbar {
  @apply w-2;
}

.terminal-content::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.terminal-content::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  @apply bg-primary/50;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .terminal-window {
    @apply rounded-lg;
    box-shadow:
      0 0 0 1px hsl(var(--border)),
      0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .terminal-header {
    @apply px-3 py-2;
  }

  .terminal-content {
    @apply p-3 text-xs;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .terminal-window {
    box-shadow: 0 0 0 2px hsl(var(--foreground));
    background-image: none;
  }

  .terminal-header {
    background-image: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .terminal-window,
  .terminal-dot {
    transition: none;
  }

  .terminal-window {
    background-image: none;
  }
}
</style>
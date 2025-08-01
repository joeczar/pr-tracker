<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'

const { theme, isDark, toggleTheme } = useTheme()

// Debug function to handle theme toggle
const handleToggle = () => {
  console.log('Theme toggle clicked, current theme:', theme.value)
  toggleTheme()
  console.log('Theme after toggle:', theme.value)
}

// Theme icon and label based on current theme
const themeIcon = computed(() => {
  return theme.value === 'light' ? '☀️' : '🌙'
})

const themeLabel = computed(() => {
  return theme.value === 'light' ? 'LIGHT_MODE' : 'DARK_MODE'
})

const nextThemeLabel = computed(() => {
  return theme.value === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'
})
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    @click="handleToggle"
    :aria-label="nextThemeLabel"
    :title="nextThemeLabel"
    class="terminal-theme-toggle font-terminal text-xs"
  >
    <span class="theme-icon" aria-hidden="true">{{ themeIcon }}</span>
    <span class="theme-label">{{ themeLabel }}</span>
  </Button>
</template>

<style scoped>
.terminal-theme-toggle {
  @apply border border-border/50 hover:border-primary/50;
  @apply bg-background/50 hover:bg-primary/5;
  @apply text-muted-foreground hover:text-primary;
  @apply transition-all duration-200;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
}

.terminal-theme-toggle:hover {
  box-shadow: 0 0 10px hsl(var(--primary) / 0.2);
}

.theme-icon {
  @apply text-base;
  filter: grayscale(0.3);
  transition: filter 200ms;
}

.terminal-theme-toggle:hover .theme-icon {
  filter: grayscale(0);
}

.theme-label {
  @apply font-mono text-xs tracking-wider;
}

/* Cyberpunk glow effect on hover */
.terminal-theme-toggle:hover {
  text-shadow: 0 0 5px hsl(var(--primary) / 0.5);
}

/* Accessibility: Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .terminal-theme-toggle,
  .theme-icon {
    transition: none;
  }
}
</style>

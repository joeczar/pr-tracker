<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const { theme, toggleTheme } = useTheme()

// Theme state based on current theme
const isDarkMode = computed(() => theme.value === 'dark')

// Handle switch toggle
const handleToggle = (checked: boolean) => {
  console.log('Theme switch toggled, checked:', checked, 'current theme:', theme.value)
  toggleTheme()
  console.log('Theme after toggle:', theme.value)
}

// Theme labels
const themeIcon = computed(() => {
  return theme.value === 'light' ? '☀️' : '🌙'
})

const themeLabel = computed(() => {
  return theme.value === 'light' ? 'Light Mode' : 'Dark Mode'
})
</script>

<template>
  <div class="flex items-center space-x-3 font-terminal">
    <Label
      for="theme-switch"
      class="text-sm text-muted-foreground cursor-pointer select-none"
    >
      <span class="theme-icon mr-2" aria-hidden="true">{{ themeIcon }}</span>
      {{ themeLabel }}
    </Label>
    <Switch
      id="theme-switch"
      variant="terminal"
      :checked="isDarkMode"
      @update:checked="handleToggle"
      :aria-label="`Switch to ${isDarkMode ? 'light' : 'dark'} mode`"
    />
  </div>
</template>

<style scoped>
.theme-icon {
  @apply inline-block;
  filter: grayscale(0.3);
  transition: filter 200ms;
}

/* Accessibility: Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .theme-icon {
    transition: none;
  }
}
</style>
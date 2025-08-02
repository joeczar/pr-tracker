<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'

const { isDark, toggleColorScheme } = useTheme()

// Theme icons and labels
const themeIcon = computed(() => {
  return isDark.value ? '🌙' : '☀️'
})

const themeLabel = computed(() => {
  return isDark.value ? 'Dark' : 'Light'
})
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    @click="toggleColorScheme"
    :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    :title="`Switch to ${isDark ? 'light' : 'dark'} mode`"
    class="transition-all duration-200 border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
  >
    <span class="text-base" aria-hidden="true">{{ themeIcon }}</span>
    <span class="text-xs font-medium">{{ themeLabel }}</span>
  </Button>
</template>


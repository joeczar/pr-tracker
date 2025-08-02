<template>
  <div id="app">
    <!-- Main Router View -->
    <router-view />

    <!-- Global Command Palette -->
    <CommandPalette />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useTheme } from '@/composables/useTheme'
import { CommandPalette } from '@/components/ui/terminal'

const authStore = useAuthStore()

// Initialize keyboard shortcuts
useKeyboardShortcuts()

// Initialize theme system (happens automatically)
useTheme()

// Initialize authentication on app startup
onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.checkAuthStatus()
  }
})
</script>

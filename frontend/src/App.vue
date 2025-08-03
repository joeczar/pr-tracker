<template>
  <AppShell>
    <template #title>
      <h1 class="text-lg md:text-xl font-semibold tracking-tight">
        <span class="sr-only">PR Tracker</span>
      </h1>
    </template>

    <router-view />

    <template #actions>
      <!-- Reserved for per-page actions (e.g., repo selector) -->
    </template>

    <!-- Command palette lives globally -->
    <CommandPalette />
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useTheme } from '@/composables/useTheme'
import AppShell from '@/components/layout/AppShell.vue'
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

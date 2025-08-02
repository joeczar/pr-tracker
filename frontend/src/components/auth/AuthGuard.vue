<template>
  <!-- Loading State -->
  <div v-if="!authStore.isInitialized || authStore.isLoading" class="min-h-screen flex items-center justify-center">
    <Terminal title="pr-tracker@system:~$" class="w-full max-w-md">
      <div class="text-center space-y-4 py-8">
        <div class="flex items-center justify-center gap-4 mb-6">
          <StatusLED status="processing" label="INITIALIZING..." animate />
        </div>
        
        <div class="text-primary font-terminal text-sm">
          > pr-tracker init --auth
        </div>
        
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        
        <div class="text-muted-foreground font-terminal text-xs">
          Checking authentication status...
        </div>
      </div>
    </Terminal>
  </div>

  <!-- Authenticated Content -->
  <div v-else-if="authStore.isAuthenticated">
    <slot />
  </div>

  <!-- Unauthenticated - Show Login -->
  <Login v-else />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Terminal from '@/components/ui/terminal/Terminal.vue'
import StatusLED from '@/components/ui/status/StatusLED.vue'
import Login from '@/views/Login.vue'

const authStore = useAuthStore()

// Check authentication status when component mounts
onMounted(async () => {
  if (!authStore.isInitialized) {
    await authStore.checkAuthStatus()
  }
})
</script>

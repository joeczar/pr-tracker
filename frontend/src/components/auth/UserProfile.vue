<template>
  <div class="flex items-center gap-3">
    <!-- User Avatar -->
    <div class="relative">
      <img
        :src="authStore.user?.avatar_url"
        :alt="`${authStore.user?.login} avatar`"
        class="w-8 h-8 rounded-full border-2 border-primary/30 hover:border-primary transition-colors"
      />
      <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
    </div>

    <!-- User Info -->
    <div class="flex-1 min-w-0">
      <div class="font-terminal text-sm text-foreground truncate">
        {{ authStore.user?.name || authStore.user?.login }}
      </div>
      <div class="font-terminal text-xs text-muted-foreground truncate">
        @{{ authStore.user?.login }}
      </div>
    </div>

    <!-- Logout Button -->
    <Button
      @click="handleLogout"
      :disabled="authStore.isLoading"
      variant="ghost"
      size="sm"
      class="text-muted-foreground hover:text-destructive"
    >
      <div class="flex items-center gap-2">
        <!-- Loading Spinner -->
        <div
          v-if="authStore.isLoading"
          class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
        />
        
        <!-- Logout Icon -->
        <svg
          v-else
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        
        <span class="font-terminal text-xs">
          {{ authStore.isLoading ? 'LOGOUT...' : 'LOGOUT' }}
        </span>
      </div>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>

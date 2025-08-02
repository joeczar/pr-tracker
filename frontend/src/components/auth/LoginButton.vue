<template>
  <div class="flex flex-col items-center justify-center space-y-6">
    <!-- GitHub Login Button -->
    <Button
      @click="handleLogin"
      :disabled="authStore.isLoading"
      variant="terminal"
      size="lg"
      class="w-full max-w-md group relative overflow-hidden"
    >
      <div class="flex items-center gap-3">
        <!-- GitHub Icon -->
        <svg
          class="w-5 h-5 transition-transform group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        
        <!-- Loading Spinner -->
        <div
          v-if="authStore.isLoading"
          class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
        
        <!-- Button Text -->
        <span class="font-terminal">
          {{ authStore.isLoading ? 'CONNECTING...' : 'LOGIN WITH GITHUB' }}
        </span>
      </div>
      
      <!-- Animated Background Effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Button>

    <!-- Permission Info -->
    <div class="text-center space-y-2 max-w-md">
      <div class="text-xs font-terminal text-muted-foreground">
        > REQUIRED PERMISSIONS
      </div>
      <div class="text-xs font-terminal text-muted-foreground bg-muted/10 p-3 rounded border border-border/30">
        <div class="space-y-1">
          <div>• Read repository metadata</div>
          <div>• Access pull requests and reviews</div>
          <div>• Read user profile information</div>
        </div>
      </div>
      <div class="text-xs font-terminal text-muted-foreground/70">
        Your data is processed securely and never shared with third parties.
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="authStore.error"
      class="w-full max-w-md p-4 bg-destructive/10 border border-destructive/30 rounded text-center"
    >
      <div class="text-destructive font-terminal text-sm mb-2">
        ⚠ AUTHENTICATION ERROR
      </div>
      <div class="text-destructive/80 font-terminal text-xs">
        {{ authStore.error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

interface Props {
  redirectUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  redirectUrl: '/dashboard'
})

const authStore = useAuthStore()

const handleLogin = () => {
  authStore.login(props.redirectUrl)
}
</script>

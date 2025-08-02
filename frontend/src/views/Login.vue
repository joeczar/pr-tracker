<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-2xl space-y-8">
      <!-- ASCII Header -->
      <ASCIIHeader variant="animated" class="mb-8" />
      
      <!-- Main Login Terminal -->
      <Terminal title="pr-tracker@auth:~$" class="min-h-[400px]">
        <div class="space-y-6">
          <!-- System Status -->
          <div class="flex items-center gap-4 mb-6">
            <StatusLED status="active" label="SYSTEM ONLINE" />
            <StatusLED status="warning" label="AUTH REQUIRED" />
            <StatusLED status="processing" label="WAITING..." animate />
          </div>

          <!-- Command Prompt -->
          <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
            <div class="text-primary font-terminal text-sm">
              > pr-tracker auth --login
            </div>
            <div class="text-muted-foreground font-terminal text-xs mt-1">
              Initializing GitHub OAuth authentication protocol...
            </div>
          </div>

          <!-- Welcome Message -->
          <div class="text-center space-y-4">
            <div class="phosphor-text text-primary text-lg">
              ◉ AUTHENTICATION REQUIRED
            </div>
            <div class="font-terminal text-muted-foreground text-sm max-w-md mx-auto">
              Access to the PR Progress Tracker requires GitHub authentication.
              Connect your GitHub account to track pull requests across your repositories.
            </div>
          </div>

          <!-- Login Component -->
          <div class="flex justify-center">
            <Button
              size="lg"
              class="terminal-btn primary font-mono tracking-wider px-6 py-3"
              @click="handleLogin"
              :disabled="authStore.isLoading"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {{ authStore.isLoading ? 'Connecting...' : 'Login with GitHub' }}
            </Button>
          </div>

          <!-- Features List -->
          <div class="mt-8 space-y-4">
            <div class="text-center text-primary font-terminal text-sm">
              > SYSTEM FEATURES
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-muted/10 p-4 rounded border border-border/30">
                <div class="text-primary font-terminal text-sm mb-2">
                  ◉ REPOSITORY TRACKING
                </div>
                <div class="text-muted-foreground font-terminal text-xs">
                  Monitor pull requests across multiple repositories with real-time updates.
                </div>
              </div>
              <div class="bg-muted/10 p-4 rounded border border-border/30">
                <div class="text-primary font-terminal text-sm mb-2">
                  ◉ ANALYTICS DASHBOARD
                </div>
                <div class="text-muted-foreground font-terminal text-xs">
                  Visualize PR metrics, merge times, and team collaboration patterns.
                </div>
              </div>
              <div class="bg-muted/10 p-4 rounded border border-border/30">
                <div class="text-primary font-terminal text-sm mb-2">
                  ◉ REVIEW INSIGHTS
                </div>
                <div class="text-muted-foreground font-terminal text-xs">
                  Track review participation, response times, and code quality metrics.
                </div>
              </div>
              <div class="bg-muted/10 p-4 rounded border border-border/30">
                <div class="text-primary font-terminal text-sm mb-2">
                  ◉ SECURE ACCESS
                </div>
                <div class="text-muted-foreground font-terminal text-xs">
                  OAuth-based authentication with encrypted token storage and session management.
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Info -->
          <div class="text-center pt-6 border-t border-border/30">
            <div class="text-xs font-terminal text-muted-foreground/70">
              By logging in, you agree to our secure handling of your GitHub data.
              <br>
              Your repositories and pull request data are processed locally and never shared.
            </div>
          </div>
        </div>
      </Terminal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ASCIIHeader from '@/components/ui/ascii/ASCIIHeader.vue'
import Terminal from '@/components/ui/terminal/Terminal.vue'
import StatusLED from '@/components/ui/status/StatusLED.vue'
import { Button } from '@/components/ui/button'

const route = useRoute()
const authStore = useAuthStore()

// Get redirect URL from query params or default to root (dashboard)
const redirectUrl = computed(() => {
  return (route.query.redirect as string) || '/'
})

// Handle GitHub OAuth login
const handleLogin = () => {
  authStore.login(redirectUrl.value)
}
</script>

<style scoped>
/* Terminal Button Styling */
.terminal-btn {
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.terminal-btn.primary {
  @apply bg-primary/10 text-primary border-primary/30;
  @apply hover:bg-primary/20 hover:border-primary/50;
  @apply focus:ring-primary;
}

.terminal-btn.primary:hover {
  box-shadow: 0 0 20px hsl(var(--primary) / 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .terminal-btn {
    @apply px-6 py-3 text-sm;
  }
}
</style>

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
            <LoginButton :redirect-url="redirectUrl" />
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
import ASCIIHeader from '@/components/ui/ascii/ASCIIHeader.vue'
import Terminal from '@/components/ui/terminal/Terminal.vue'
import StatusLED from '@/components/ui/status/StatusLED.vue'
import LoginButton from '@/components/auth/LoginButton.vue'

const route = useRoute()

// Get redirect URL from query params or default to dashboard
const redirectUrl = computed(() => {
  return (route.query.redirect as string) || '/dashboard'
})
</script>

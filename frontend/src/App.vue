<template>
  <div id="app" class="min-h-screen bg-background">
    <!-- Accessibility Skip Link -->
    <a href="#main-content" class="skip-link">
      Skip to main content
    </a>

    <!-- Modern Minimal Navigation -->
    <nav class="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center">
            <router-link 
              to="/" 
              class="text-xl font-bold text-foreground hover:text-primary transition-colors duration-200 group"
            >
              <span class="text-glow">PR</span>
              <span class="text-primary">Tracker</span>
              <span class="text-mono text-xs text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity">.exe</span>
            </router-link>
          </div>

          <!-- Navigation Links & Actions -->
          <div class="flex items-center space-x-6">
            <!-- Navigation Links (only show when authenticated) -->
            <nav v-if="authStore.isAuthenticated" class="hidden md:flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                as-child
                :class="{ 
                  'text-primary bg-primary/10 border border-primary/30': $route.path === '/',
                  'text-muted-foreground hover:text-foreground': $route.path !== '/' 
                }"
              >
                <router-link to="/" class="font-medium">
                  Dashboard
                </router-link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                as-child
                :class="{ 
                  'text-primary bg-primary/10 border border-primary/30': $route.path === '/repositories',
                  'text-muted-foreground hover:text-foreground': $route.path !== '/repositories' 
                }"
              >
                <router-link to="/repositories" class="font-medium">
                  Repositories
                </router-link>
              </Button>
            </nav>

            <!-- Mobile Navigation (only show when authenticated) -->
            <div v-if="authStore.isAuthenticated" class="md:hidden">
              <Button variant="ghost" size="sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </Button>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-3">
              <!-- Theme Toggle -->
              <ThemeToggle />
              
              <!-- User Profile (only show when authenticated) -->
              <UserProfile v-if="authStore.isAuthenticated" />
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="main-content" class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8" role="main">
      <router-view />
    </main>

    <!-- Optional Subtle Cyberpunk Effects -->
    <div class="fixed inset-0 pointer-events-none z-0 opacity-20">
      <!-- Subtle grid overlay -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme'
import UserProfile from '@/components/auth/UserProfile.vue'
import { useAuthStore } from '@/stores/auth'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useTheme } from '@/composables/useTheme'

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

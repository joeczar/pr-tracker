<template>
  <div id="app" class="min-h-screen bg-background font-terminal">
    <!-- Cyberpunk Navigation -->
    <nav class="terminal-window border-b-0 rounded-none shadow-2xl">
      <div class="terminal-header">
        <div class="flex items-center gap-2">
          <div class="terminal-dot terminal-dot-close"></div>
          <div class="terminal-dot terminal-dot-minimize"></div>
          <div class="terminal-dot terminal-dot-maximize"></div>
        </div>
        <div class="flex-1 text-center">
          <span class="text-sm font-terminal text-muted-foreground">pr-tracker@cyberpunk:~$</span>
        </div>
        <div class="w-16"></div>
      </div>
      
      <div class="bg-background/95 backdrop-blur-sm border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <router-link to="/" class="text-xl font-terminal phosphor-text hover:text-accent transition-colors">
                PR_TRACKER.EXE
              </router-link>
            </div>
            <div class="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                as-child
                :class="{ 'bg-primary/10 text-primary border border-primary/30': $route.path === '/' }"
              >
                <router-link to="/">
                  >> DASHBOARD
                </router-link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                as-child
                :class="{ 'bg-primary/10 text-primary border border-primary/30': $route.path === '/repositories' }"
              >
                <router-link to="/repositories">
                  >> REPOSITORIES
                </router-link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Cyberpunk Background Effects -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <!-- Matrix Background -->
      <div class="matrix-bg opacity-5"></div>
      
      <!-- Scanlines -->
      <div class="scanlines"></div>
      
      <!-- Data Stream -->
      <div class="data-stream"></div>
    </div>

    <main class="relative z-10 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

// Initialize keyboard shortcuts
useKeyboardShortcuts()
</script>

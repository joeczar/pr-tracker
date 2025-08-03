<template>
  <div class="app-shell min-h-screen bg-background text-foreground">
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="sidebar hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/60"
        aria-label="Primary"
      >
        <div class="h-16 flex items-center gap-2 px-4 border-b border-border/60">
          <div class="size-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <span class="text-primary font-semibold">PR</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold tracking-tight">PR Tracker</span>
            <span class="text-xs text-muted-foreground">Review analytics</span>
          </div>
        </div>

        <nav class="flex-1 px-3 py-3 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path.startsWith(item.to) }"
          >
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="mt-auto p-3 border-t border-border/60">
          <div class="flex items-center justify-between">
            <button class="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    @click="toggleTheme"
                    type="button">
              Toggle theme
            </button>
            <button class="kbd-btn" type="button" @click="openPalette" aria-label="Open command palette">
              ⌘K
            </button>
          </div>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top header -->
        <header class="h-16 border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div class="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <!-- Mobile menu (Sheet trigger) -->
              <Sheet v-model:open="mobileOpen">
                <SheetTrigger as-child>
                  <button
                    class="md:hidden p-2 rounded-md border border-border text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Open navigation"
                    type="button"
                  >
                    ☰
                  </button>
                </SheetTrigger>
              </Sheet>
              <slot name="title">
                <h1 class="text-lg md:text-xl font-semibold tracking-tight">Overview</h1>
              </slot>
            </div>
            <div class="flex items-center gap-2">
              <slot name="actions" />
              <button
                class="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                type="button"
                @click="openPalette"
              >
                Command
                <span class="ml-2 hidden sm:inline text-xs text-muted-foreground">⌘K</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Content -->
        <main id="main" class="flex-1 overflow-auto">
          <div class="max-w-screen-2xl mx-auto p-4 md:p-6">
            <slot />
          </div>
        </main>
      </div>
    </div>

    <!-- Mobile drawer using shadcn Sheet -->
    <Sheet v-model:open="mobileOpen">
      <SheetContent side="left" aria-label="Primary navigation" class="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 p-0">
        <div class="h-16 flex items-center gap-2 px-3 border-b border-border/60">
          <div class="size-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
            <span class="text-primary font-semibold">PR</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold tracking-tight">PR Tracker</span>
            <span class="text-xs text-muted-foreground">Review analytics</span>
          </div>
        </div>
        <nav class="flex-1 px-3 py-3 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path.startsWith(item.to) }"
            @click="mobileOpen = false"
          >
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useTheme } from '@/composables/useTheme'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const route = useRoute()
const mobileOpen = ref(false)
const { toggleTheme } = useTheme()
const { open: openPalette } = useCommandPalette()

useKeyboardShortcuts()

type NavItem = { to: string; label: string; icon: string }
const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/repositories', label: 'Repositories', icon: '📁' },
  // { to: '/analytics', label: 'Analytics', icon: '📈' },
  // { to: '/settings', label: 'Settings', icon: '⚙️' },
]
</script>

<style scoped>
.nav-item {
  @apply flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground border border-transparent;
  @apply hover:bg-muted/50 hover:text-foreground transition-colors;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2;
}
.nav-item.active {
  @apply bg-primary/10 text-primary border-primary/30;
}
.nav-icon {
  @apply grid place-items-center size-6 rounded-md bg-muted/60 text-xs border border-border/70;
}
.nav-label {
  @apply truncate;
}

.kbd-btn {
  @apply text-xs px-2 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground;
}

/* transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 150ms; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 150ms; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>

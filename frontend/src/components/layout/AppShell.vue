<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import CommandPalette from '@/components/ui/command/CommandPalette.vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/lib/api/auth'

const showCommandPalette = ref(false)
const auth = useAuthStore()
const router = useRouter()

// Sidebar state for mobile
const sidebarOpen = ref(false)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)

function toggleCommandPalette(next?: boolean) {
  showCommandPalette.value = typeof next === 'boolean' ? next : !showCommandPalette.value
}

function handleGlobalKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl+K toggles command palette
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleCommandPalette()
  }
  // ESC closes palette
  if (e.key === 'Escape' && showCommandPalette.value) {
    e.preventDefault()
    toggleCommandPalette(false)
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeydown)
  // On shell mount, ensure we checked auth at least once
  if (!auth.checked && !auth.loading) {
    await auth.checkStatus()
  }
  // Note: OAuth return handling is centralized in Login.vue. Avoid duplicate handling here.
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <!-- Skip link -->
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-white">
      Skip to content
    </a>

    <!-- Top Nav -->
    <header class="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            class="inline-flex h-9 w-9 items-center justify-center rounded md:hidden border border-slate-200 dark:border-slate-800"
            aria-label="Toggle sidebar"
            @click="toggleSidebar"
          >
            <!-- hamburger -->
            <span class="block h-0.5 w-5 bg-current"></span>
            <span class="block h-0.5 w-5 bg-current mt-1"></span>
            <span class="block h-0.5 w-5 bg-current mt-1"></span>
          </Button>
          <RouterLink to="/" class="font-semibold tracking-tight">
            PR Tracker
            <span class="sr-only">Home</span>
          </RouterLink>
        </div>

        <nav class="hidden md:flex items-center gap-6" aria-label="Primary">
          <RouterLink to="/" class="text-sm hover:underline underline-offset-4">Dashboard</RouterLink>
          <RouterLink to="/repositories" class="text-sm hover:underline underline-offset-4">Repositories</RouterLink>
          <RouterLink to="/analytics" class="text-sm hover:underline underline-offset-4">Analytics</RouterLink>
          <RouterLink to="/settings" class="text-sm hover:underline underline-offset-4">Settings</RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <!-- Command palette shortcut -->
          <Button variant="outline" size="sm" class="hidden md:inline-flex" aria-label="Open command palette" @click="toggleCommandPalette()">
            ⌘K
          </Button>

          <!-- User menu dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="h-8 w-8 rounded-full p-0 border border-slate-200 dark:border-slate-800" aria-label="Open user menu">
                <span class="sr-only">Open user menu</span>
                <div class="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 border border-slate-300/40 dark:border-slate-700/60"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-40" align="end">
              <DropdownMenuLabel class="text-xs">
                <span v-if="auth.user">Signed in as {{ auth.user.login }}</span>
                <span v-else>Not signed in</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <RouterLink to="/settings">Settings</RouterLink>
              </DropdownMenuItem>
              <DropdownMenuItem @click="$router.push('/')">Dashboard</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-red-600 dark:text-red-400"
                @click="async () => { await auth.logout(); router.push('/login') }"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Auth-aware action -->
          <RouterLink
            v-if="!auth.authenticated"
            to="/login"
            class="text-sm hover:underline underline-offset-4 md:hidden"
          >
            Login
          </RouterLink>
          <Button
            v-else
            variant="outline"
            size="sm"
            class="hidden md:inline-flex"
            @click="async () => { await auth.logout(); router.push('/login') }"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="flex-1 flex">
      <!-- Sidebar -->
      <aside
        class="fixed inset-y-14 left-0 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 transform transition-transform duration-200 ease-out md:static md:translate-x-0"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
        aria-label="Sidebar"
      >
        <div class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Navigation</div>
        <ul class="space-y-1">
          <li><RouterLink to="/" class="block rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900">Dashboard</RouterLink></li>
          <li><RouterLink to="/repositories" class="block rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900">Repositories</RouterLink></li>
          <li><RouterLink to="/analytics" class="block rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900">Analytics</RouterLink></li>
          <li><RouterLink to="/settings" class="block rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900">Settings</RouterLink></li>
        </ul>

        <div class="mt-6">
          <div class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Filters</div>
          <!-- Placeholder filters -->
          <div class="space-y-2">
            <div class="h-8 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="h-8 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main id="main" class="flex-1">
        <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer class="border-t border-slate-200 dark:border-slate-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-500">
        Layout skeleton • placeholders only • responsive: mobile-first with md+ sidebar
      </div>
    </footer>
  </div>
  <!-- Command Palette -->
  <CommandPalette
    v-model="showCommandPalette"
    @select="(val: string) => {
      if (val === 'dashboard') $router.push('/');
      else if (val === 'repositories') $router.push('/repositories');
      else if (val === 'analytics') $router.push('/analytics');
      else if (val === 'settings') $router.push('/settings');
    }"
  />
</template>

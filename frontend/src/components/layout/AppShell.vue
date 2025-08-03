<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const showCommandPalette = ref(false)

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

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
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
          <button
            class="inline-flex h-9 w-9 items-center justify-center rounded md:hidden border border-slate-200 dark:border-slate-800"
            aria-label="Toggle sidebar"
            @click="toggleSidebar"
          >
            <!-- hamburger -->
            <span class="block h-0.5 w-5 bg-current"></span>
            <span class="block h-0.5 w-5 bg-current mt-1"></span>
            <span class="block h-0.5 w-5 bg-current mt-1"></span>
          </button>
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
          <!-- Placeholder for user/avatar -->
          <div class="h-8 w-8 rounded-full border border-slate-300 dark:border-slate-700" aria-hidden="true"></div>
          <RouterLink to="/login" class="text-sm hover:underline underline-offset-4">Login</RouterLink>
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
  <!-- Command Palette Mount Point -->
  <Teleport to="body">
    <div
      v-if="showCommandPalette"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      class="fixed inset-0 z-50 flex items-start justify-center p-4"
    >
      <!-- backdrop -->
      <div class="absolute inset-0 bg-black/70" @click="toggleCommandPalette(false)"></div>
      <!-- terminal-styled panel -->
      <div class="relative z-10 w-full max-w-2xl">
        <div class="rounded-lg border border-cyber-border bg-cyber-surface shadow-cyber scanlines">
          <div class="flex items-center justify-between border-b border-cyber-border px-3 py-2">
            <div class="text-cyber-muted text-sm font-terminal">user@pr-tracker:~$</div>
            <div class="text-xs text-cyber-muted"><span class="kbd">Esc</span> to close</div>
          </div>
          <div class="p-3">
            <!-- Lightweight inline input; actual fuzzy list is in CommandPalette.vue if present -->
            <input
              autofocus
              type="text"
              placeholder="Type a command…"
              class="w-full rounded border border-cyber-border bg-black/30 px-3 py-2 font-terminal text-cyber-muted outline-none focus-visible:ring-2 focus-visible:ring-cyber-accent"
              @keydown.escape.prevent="toggleCommandPalette(false)"
            />
            <div class="mt-2 text-xs text-cyber-muted">
              Try: dashboard, repositories, settings…
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

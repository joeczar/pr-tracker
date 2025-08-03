<script setup lang="ts">
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
</script>

<template>
  <section aria-labelledby="repos-title" class="space-y-6">
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="repositories" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search repos..."
                aria-label="Search repositories"
                class="h-9 w-56 rounded border border-cyber-border bg-black/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyber-accent"
              />
              <TerminalButton size="md" variant="primary" aria-label="Add repository">+ Add Repository</TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>

      <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repos-title" class="text-xl font-semibold tracking-tight">Repositories</h1>
          <div class="text-xs text-cyber-muted">Skeleton view</div>
        </header>
        <!-- Repo cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <section aria-label="Repository card" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-4">
            <div class="h-6 w-2/3 rounded border border-dashed border-cyber-border"></div>
            <div class="grid grid-cols-3 gap-3">
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
            </div>
            <div class="flex gap-2">
              <div class="h-9 w-28 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
            </div>
          </section>

          <section aria-label="Repository card" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-4">
            <div class="h-6 w-2/3 rounded border border-dashed border-cyber-border"></div>
            <div class="grid grid-cols-3 gap-3">
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
            </div>
            <div class="flex gap-2">
              <div class="h-9 w-28 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
            </div>
          </section>

          <section aria-label="Repository card" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-4">
            <div class="h-6 w-2/3 rounded border border-dashed border-cyber-border"></div>
            <div class="grid grid-cols-3 gap-3">
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
              <div class="h-14 rounded border border-dashed border-cyber-border"></div>
            </div>
            <div class="flex gap-2">
              <div class="h-9 w-28 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
              <div class="h-9 w-24 rounded border border-dashed border-cyber-border"></div>
            </div>
          </section>
        </div>
      </div>
    </TerminalWindow>

    <!-- Repo cards grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <section aria-label="Repository card" class="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div class="h-6 w-2/3 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="grid grid-cols-3 gap-3">
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-9 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Repository card" class="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div class="h-6 w-2/3 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="grid grid-cols-3 gap-3">
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-9 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Repository card" class="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div class="h-6 w-2/3 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="grid grid-cols-3 gap-3">
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-14 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-9 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>
    </div>
  </section>
</template>

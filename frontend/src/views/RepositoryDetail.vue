<script setup lang="ts">
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
</script>

<template>
  <section aria-labelledby="repo-detail-title" class="space-y-6">
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="repository-detail" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="secondary" aria-label="Sync repository">Sync</TerminalButton>
              <TerminalButton size="sm" variant="ghost" aria-label="Export data">Export</TerminalButton>
              <TerminalButton size="sm" variant="accent" aria-label="Back">Back</TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>

      <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">Repository Details</h1>
          <div class="text-xs text-cyber-muted">Skeleton view</div>
        </header>
        <!-- Overview tiles -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="h-20 rounded border border-dashed border-cyber-border bg-cyber-surface/40"></div>
          <div class="h-20 rounded border border-dashed border-cyber-border bg-cyber-surface/40"></div>
          <div class="h-20 rounded border border-dashed border-cyber-border bg-cyber-surface/40"></div>
          <div class="h-20 rounded border border-dashed border-cyber-border bg-cyber-surface/40"></div>
        </div>
      </div>
    </TerminalWindow>

    <!-- Overview tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </div>

    <!-- Trends -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="trends" />
          </template>
        </TerminalHeader>
      </template>
      <div class="p-3">
        <div class="h-56 rounded border border-dashed border-cyber-border bg-cyber-surface/40"></div>
      </div>
    </TerminalWindow>

    <!-- Filters + PR list -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside aria-label="Filters" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
        <div class="h-9 w-full rounded border border-dashed border-cyber-border"></div>
      </aside>

      <section aria-label="Pull requests" class="lg:col-span-3 rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>
        <div class="h-16 rounded border border-dashed border-cyber-border"></div>

        <!-- Pagination placeholder -->
        <div class="flex items-center justify-between pt-2">
          <div class="h-8 w-28 rounded border border-dashed border-cyber-border"></div>
          <div class="flex gap-2">
            <div class="h-8 w-20 rounded border border-dashed border-cyber-border"></div>
            <div class="h-8 w-20 rounded border border-dashed border-cyber-border"></div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

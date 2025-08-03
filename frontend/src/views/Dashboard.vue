<script setup lang="ts">
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
</script>

<template>
  <section aria-labelledby="dashboard-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="dashboard-title" class="text-xl font-semibold tracking-tight">Dashboard</h1>
      <div class="text-xs text-slate-500">Skeleton view</div>
    </header>

    <!-- Quick Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="h-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </div>

    <!-- Trends -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="trends" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="ghost" aria-label="Previous range">Prev</TerminalButton>
              <TerminalButton size="sm" variant="ghost" aria-label="Next range">Next</TerminalButton>
              <TerminalButton size="sm" variant="primary" aria-label="View data table">View Data</TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>
      <div class="scanlines">
        <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>
    </TerminalWindow>

    <!-- Recent Activity -->
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="recent-activity" />
          </template>
          <template #actions>
            <TerminalButton size="sm" variant="secondary" aria-label="Refresh activity">Refresh</TerminalButton>
          </template>
        </TerminalHeader>
      </template>
      <div class="space-y-3">
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>
    </TerminalWindow>
  </section>
</template>

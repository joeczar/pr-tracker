<script setup lang="ts"></script>

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
    <section aria-label="Trends" class="rounded border border-slate-200 dark:border-slate-800 p-4">
      <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </section>

    <!-- Recent Activity -->
    <section aria-label="Recent activity" class="rounded border border-slate-200 dark:border-slate-800 p-4">
      <div class="space-y-3">
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts"></script>

<template>
  <section aria-labelledby="analytics-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="analytics-title" class="text-xl font-semibold tracking-tight">Analytics</h1>
      <div class="text-xs text-slate-500">Skeleton view</div>
    </header>

    <!-- Filters / Controls -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-10 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section aria-label="Comments trend" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </section>
      <section aria-label="Change-request rate" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </section>
      <section aria-label="Average comments per PR" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </section>
      <section aria-label="Streaks" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts"></script>

<template>
  <section aria-labelledby="repo-detail-title" class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">Repository Details</h1>
        <p class="text-sm text-slate-500">Skeleton view</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-24 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </div>
    </header>

    <!-- Overview tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      <div class="h-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </div>

    <!-- Trends -->
    <section aria-label="Repository trends" class="rounded border border-slate-200 dark:border-slate-800 p-4">
      <div class="h-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
    </section>

    <!-- Filters + PR list -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside aria-label="Filters" class="rounded border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div class="h-9 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-9 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
      </aside>

      <section aria-label="Pull requests" class="lg:col-span-3 rounded border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>

        <!-- Pagination placeholder -->
        <div class="flex items-center justify-between pt-2">
          <div class="h-8 w-28 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="flex gap-2">
            <div class="h-8 w-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
            <div class="h-8 w-20 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

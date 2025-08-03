<script setup lang="ts"></script>

<template>
  <section aria-labelledby="repos-title" class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 id="repos-title" class="text-xl font-semibold tracking-tight">Repositories</h1>
        <p class="text-sm text-slate-500">Skeleton view</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="h-10 w-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        <button
          type="button"
          class="h-10 px-3 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
          aria-label="Add repository (placeholder)"
        >
          + Add Repository
        </button>
      </div>
    </header>

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

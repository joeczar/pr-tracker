<script setup lang="ts"></script>

<template>
  <section aria-labelledby="settings-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="settings-title" class="text-xl font-semibold tracking-tight">Settings</h1>
      <div class="text-xs text-slate-500">Skeleton view</div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section aria-label="Profile" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <h2 class="text-sm font-semibold mb-3">Profile</h2>
        <div class="space-y-2">
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 w-40 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Preferences" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <h2 class="text-sm font-semibold mb-3">Preferences</h2>
        <div class="space-y-2">
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 w-48 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Notifications" class="rounded border border-slate-200 dark:border-slate-800 p-4">
        <h2 class="text-sm font-semibold mb-3">Notifications</h2>
        <div class="space-y-2">
          <div class="h-10 w-full rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-10 w-56 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Integrations" class="rounded border border-slate-200 dark:border-slate-800 p-4 lg:col-span-2">
        <h2 class="text-sm font-semibold mb-3">Integrations</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
          <div class="h-16 rounded border border-dashed border-slate-300 dark:border-slate-700"></div>
        </div>
      </section>

      <section aria-label="Danger Zone" class="rounded border border-rose-200 dark:border-rose-800 p-4">
        <h2 class="text-sm font-semibold mb-3">Danger Zone</h2>
        <div class="space-y-2">
          <div class="h-10 w-full rounded border border-dashed border-rose-300 dark:border-rose-700"></div>
          <div class="h-10 w-48 rounded border border-dashed border-rose-300 dark:border-rose-700"></div>
        </div>
      </section>
    </div>
  </section>
</template>

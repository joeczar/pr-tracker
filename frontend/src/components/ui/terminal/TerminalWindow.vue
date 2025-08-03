<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section class="rounded border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
    <header class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
      <span class="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
      <div class="ml-2 text-xs font-mono text-slate-600 dark:text-slate-400">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div class="ml-auto">
        <slot name="actions" />
      </div>
    </header>
    <div class="p-4">
      <slot />
    </div>
  </section>
</template>

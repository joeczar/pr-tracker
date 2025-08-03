<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="rounded border border-slate-200 dark:border-slate-800 p-4">
    <header v-if="$slots.title || title" class="mb-2">
      <h3 class="text-sm font-mono text-slate-600 dark:text-slate-400">
        <slot name="title">{{ title }}</slot>
      </h3>
      <p v-if="$slots.description || description" class="text-xs text-slate-500">
        <slot name="description">{{ description }}</slot>
      </p>
    </header>
    <div>
      <slot />
    </div>
  </div>
</template>

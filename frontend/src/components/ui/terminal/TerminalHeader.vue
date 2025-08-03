<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between border-b border-cyber-border px-2 py-2">
    <!-- left: traffic lights + single title source -->

     
      <!-- Render EITHER slot OR prop prompt, never both -->
      <div class=" text-sm font-normal">
        <template v-if="$slots.title">
          <slot name="title" />
        </template>
        <template v-else-if="title">
          <span class="font-mono">
            <span class="text-slate-500 dark:text-cyber-muted">user</span>
            <span class="text-slate-400 dark:text-cyber-muted">@</span>
            <span class="text-slate-500 dark:text-cyber-muted">pr-tracker</span>
            <span class="text-slate-400">:~$</span>
            <span class="text-cyber-muted">{{ title }}</span>
          </span>
        </template>

    </div>

    <!-- right: actions -->
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

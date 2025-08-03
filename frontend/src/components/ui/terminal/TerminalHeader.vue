<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between border-b border-cyber-border px-3 py-2">
    <!-- traffic light dots -->
    <div class="flex items-center gap-2">
      <span class="h-3 w-3 rounded-full bg-red-500/80 shadow-[0_0_6px_#ef4444]"></span>
      <span class="h-3 w-3 rounded-full bg-yellow-500/80 shadow-[0_0_6px_#eab308]"></span>
      <span class="h-3 w-3 rounded-full bg-green-500/80 shadow-[0_0_6px_#22c55e]"></span>
      <div v-if="title" class="ml-3 text-cyber-muted text-sm font-normal">
        {{ title }}
      </div>
      <slot name="title" />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

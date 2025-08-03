<script setup lang="ts">
import TerminalTitle from './TerminalTitle.vue'

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
          <TerminalTitle :command="title" />
        </template>

    </div>

    <!-- right: actions -->
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

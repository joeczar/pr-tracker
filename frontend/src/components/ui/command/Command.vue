<script setup lang="ts">
defineOptions({ name: 'UiCommand' })
</script>

<template>
  <div class="bg-background text-foreground rounded-md border border-border shadow-sm">
    <slot />
  </div>
</template>

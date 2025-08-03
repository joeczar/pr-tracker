<script setup lang="ts">
defineOptions({ name: 'UiCommandEmpty' })
</script>

<template>
  <div class="p-4 text-sm text-muted-foreground">
    <slot>No results found.</slot>
  </div>
</template>

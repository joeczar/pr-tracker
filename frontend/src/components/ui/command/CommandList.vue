<script setup lang="ts">
defineOptions({ name: 'UiCommandList' })
</script>

<template>
  <div class="max-h-[60vh] overflow-auto">
    <ul class="p-2">
      <slot />
    </ul>
  </div>
</template>

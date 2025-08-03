<script setup lang="ts">
defineOptions({ name: 'UiCommandGroup' })
const props = defineProps<{
  heading?: string
}>()
</script>

<template>
  <li class="mb-2">
    <p v-if="props.heading" class="px-2 pb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
      {{ props.heading }}
    </p>
    <ul class="space-y-1">
      <slot />
    </ul>
  </li>
</template>

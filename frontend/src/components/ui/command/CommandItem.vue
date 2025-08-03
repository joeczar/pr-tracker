<script setup lang="ts">
const props = withDefaults(defineProps<{
  value?: string
}>(), {
  value: ''
})

const emit = defineEmits<{
  (e: 'select', value: string): void
}>()

function onActivate() {
  emit('select', props.value)
}
</script>

<template>
  <li>
    <button
      type="button"
      class="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="onActivate"
      @keydown.enter.prevent="onActivate"
      @keydown.space.prevent="onActivate"
    >
      <slot />
    </button>
  </li>
</template>

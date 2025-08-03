<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: 'Type a command...'
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const value = ref(props.modelValue)
watch(() => props.modelValue, v => value.value = v)
watch(value, v => emit('update:modelValue', v))
</script>

<template>
  <div class="border-b border-border p-2">
    <input
      v-model="value"
      type="text"
      :placeholder="placeholder"
      class="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
    />
  </div>
</template>

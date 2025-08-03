<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './index'

const props = withDefaults(defineProps<{
  modelValue?: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', value: string): void
}>()

const open = ref(!!props.modelValue)
watch(
  () => props.modelValue,
  (v) => (open.value = v)
)
watch(open, (v) => emit('update:modelValue', v))

function close() {
  open.value = false
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    close()
  }
}

onMounted(() => window.addEventListener('keydown', handleGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalKeydown))

/**
 * Wire with composable if available to allow external control and dynamic items
 * Fallback to static items when composable not present.
 */
let composable: { isOpen: { value: boolean }; results: { value: Array<{ id: string; name: string; group?: string }> } } | null = null

// Initialize composable synchronously during setup
try {
  const { useCommandPalette } = require('@/composables/useCommandPalette')
  composable = useCommandPalette() ?? null
  
  if (composable?.isOpen) {
    // Sync external open state -> local
    watch(
      () => composable!.isOpen.value,
      (v: boolean) => (open.value = v),
      { immediate: true }
    )
    // Sync local -> external
    watch(open, (v) => (composable!.isOpen.value = v))
  }
} catch {
  // ignore; fallback to local state
}


const items = computed(() => {
  const fromComposable = composable?.results?.value
  if (fromComposable && Array.isArray(fromComposable) && fromComposable.length) {
    return fromComposable.map(cmd => ({
      group: cmd.group || 'Commands',
      value: cmd.id,
      label: cmd.name
    }))
  }
  return [
    { group: 'Navigation', value: 'dashboard', label: 'Go to Dashboard' },
    { group: 'Navigation', value: 'repositories', label: 'Open Repositories' },
    { group: 'Navigation', value: 'analytics', label: 'Open Analytics' },
    { group: 'Navigation', value: 'settings', label: 'Open Settings' },
  ]
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div class="absolute inset-0 bg-black/70" @click="close" />
      <div class="relative z-10 w-full max-w-xl">
        <Command class="rounded-lg border border-border bg-background shadow-lg">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem
                v-for="it in items.filter(i => i.group === 'Navigation')"
                :key="it.value"
                :value="it.value"
                @select="emit('select', it.value); close()"
              >
                {{ it.label }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  </Teleport>
</template>

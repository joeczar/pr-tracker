<script setup lang="ts">
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'

const props = defineProps<{
  selectedCount: number
  filterState: 'open' | 'closed' | 'merged' | 'all'
  showFilterHint?: boolean
}>()

const emit = defineEmits<{
  (e: 'selectVisible'): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between text-xs text-cyber-muted">
    <div>
      {{ selectedCount }} selected
      <span
        v-if="showFilterHint && filterState !== 'all'"
        class="ml-2 opacity-80"
      >
        (Some selected PRs may be hidden by filters)
      </span>
    </div>
    <div class="flex items-center gap-2">
      <TerminalButton
        size="sm"
        variant="ghost"
        aria-label="Select all visible PRs"
        @click="$emit('selectVisible')"
      >
        Select visible
      </TerminalButton>
      <TerminalButton
        size="sm"
        variant="ghost"
        aria-label="Clear selected PRs"
        @click="$emit('clear')"
      >
        Clear
      </TerminalButton>
    </div>
  </div>
</template>

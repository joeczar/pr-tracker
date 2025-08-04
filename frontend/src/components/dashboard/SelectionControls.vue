<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  selectedRepoId: number | null
  selectedPrIds: number[]
  hasSelection: boolean
}>()

const emit = defineEmits<{
  (e: 'clear'): void
  (e: 'review'): void
}>()

const summary = computed(() => {
  if (props.hasSelection) {
    const count = props.selectedPrIds.length
    const repo = props.selectedRepoId != null ? ` • Repo ID: ${props.selectedRepoId}` : ''
    return `${count} PR${count !== 1 ? 's' : ''} selected${repo}`
  }
  if (props.selectedRepoId != null) {
    return `Repo • ID: ${props.selectedRepoId} • No PRs selected`
  }
  return 'No repository selected'
})
</script>

<template>
  <div class="text-xs">
    <div class="flex items-center gap-2">
      <div class="rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-2 py-1.5">
        <span class="text-xs">{{ summary }}</span>
      </div>
      <button
        v-if="hasSelection"
        class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
        @click="$emit('clear')"
        aria-label="Clear selected pull requests"
        title="Clear selected pull requests"
      >
        Clear Selection
      </button>
      <button
        v-if="hasSelection && selectedRepoId"
        class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        @click="$emit('review')"
        aria-label="Review selection in repository view"
      >
        Review Selection
      </button>
    </div>
  </div>
</template>

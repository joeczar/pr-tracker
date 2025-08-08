<script setup lang="ts">
import { computed } from 'vue'

import { useRouter } from 'vue-router'
import { useSelectionStore } from '@/stores/selection'
import PRSelectionDropdown from './PRSelectionDropdown.vue'

const router = useRouter()
const sel = useSelectionStore()

const hasSelection = computed(() => sel.hasSelection.value)
const count = computed(() => sel.selectedPullRequestNumbers.value.length)
const repoId = computed(() => sel.selectedRepositoryId.value)

// Show controls if we have selection OR if we have a repository context (even without PRs)
const showControls = computed(() => hasSelection.value || repoId.value != null)

const summary = computed(() => {
  if (hasSelection.value) {
    const repo = repoId.value != null ? ` • Repo ID: ${repoId.value}` : ''
    return `${count.value} PR${count.value !== 1 ? 's' : ''} selected${repo}`
  }
  if (repoId.value != null) {
    return `Repo • ID: ${repoId.value} • No PRs selected`
  }
  return 'No repository selected'
})

function clearAll() {
  sel.clearSelection()
}

function reviewSelection() {
  if (repoId.value != null) {
    // Navigate back to repository detail to adjust selection
    router.push({ name: 'repository-detail', params: { id: repoId.value } })
  }
}

function analyzeSelection() {
  // Navigate to dashboard/analytics; dashboard should consume the selection store
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
    <div
      v-if="showControls"
      class="flex items-center gap-3 rounded border border-cyber-border bg-cyber-surface/90 backdrop-blur px-3 py-2 shadow-lg"
      role="region"
      aria-label="Selection controls"
    >
      <!-- PR Selection Dropdown -->
      <PRSelectionDropdown />

      <!-- Summary info (when selection exists) -->
      <div 
        v-if="hasSelection"
        class="rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-2 py-1.5"
      >
        <span class="text-xs">{{ summary }}</span>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <button
          v-if="hasSelection"
          class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="analyzeSelection"
          aria-label="Analyze selected pull requests"
          title="Analyze selected pull requests"
        >
          Analyze
        </button>

        <button
          v-if="repoId"
          class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="reviewSelection"
          aria-label="Review selection in repository view"
          title="Review selection in repository view"
        >
          Review
        </button>

        <button
          v-if="hasSelection"
          class="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-destructive hover:text-destructive-foreground"
          @click="clearAll"
          aria-label="Clear selected pull requests"
          title="Clear selected pull requests"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

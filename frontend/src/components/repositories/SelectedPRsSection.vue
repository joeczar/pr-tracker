<script setup lang="ts">
import { computed } from 'vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Button from '@/components/ui/button/Button.vue'
import Badge from '@/components/ui/badge/Badge.vue'

type PR = {
  id: number
  number: number
  title: string
  state: string
  author_login?: string
  branch?: string
  created_at?: string
  comments?: number
}

const props = defineProps<{
  selectedPRs: PR[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'deselect', prNumber: number): void
  (e: 'clear'): void
}>()

const hasSelection = computed(() => props.selectedPRs.length > 0)

function deselect(pr: PR) {
  emit('deselect', pr.number)
}

function clearAll() {
  emit('clear')
}

function getStateColor(state: string) {
  switch (state) {
    case 'open': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'merged': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-cyber-muted/20 text-cyber-muted border-cyber-border'
  }
}
</script>

<template>
  <section 
    v-if="hasSelection" 
    role="region" 
    aria-label="Selected pull requests" 
    class="rounded border border-cyber-accent/50 bg-cyber-accent/5 p-4 space-y-3"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></div>
          <h3 class="font-medium text-cyber-accent">
            Selected PRs ({{ selectedPRs.length }})
          </h3>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="clearAll"
        class="text-xs text-cyber-muted hover:text-cyber-accent"
      >
        Clear all
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center gap-2 text-cyber-muted text-sm">
      <div class="w-4 h-4 border-2 border-cyber-accent/30 border-t-cyber-accent rounded-full animate-spin"></div>
      Loading selected PRs...
    </div>

    <!-- Selected PRs list -->
    <div v-else class="space-y-2">
      <div
        v-for="pr in selectedPRs"
        :key="pr.id"
        class="flex items-center justify-between gap-3 p-3 rounded border border-cyber-accent/30 bg-cyber-surface/40"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <!-- Deselect checkbox -->
          <Checkbox
            :checked="true"
            :aria-label="`Deselect PR #${pr.number}`"
            class="h-4 w-4 rounded-sm data-[state=checked]:bg-[var(--cyber-accent,#ea00d9)] border-cyber-accent focus-visible:ring-[var(--cyber-accent,#ea00d9)]"
            @update:checked="() => deselect(pr)"
          />
          
          <!-- PR info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ pr.title }}</div>
            <div class="flex items-center gap-2 text-xs text-cyber-muted mt-1">
              <span>#{{ pr.number }}</span>
              <Badge :class="getStateColor(pr.state)" class="text-xs px-1.5 py-0.5">
                {{ pr.state }}
              </Badge>
              <span v-if="pr.author_login">by {{ pr.author_login }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Helper text -->
    <div class="text-xs text-cyber-muted/70 border-t border-cyber-accent/20 pt-2">
      Selected PRs are highlighted in the list below. Uncheck to deselect.
    </div>
  </section>
</template>

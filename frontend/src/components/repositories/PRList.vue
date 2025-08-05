<script setup lang="ts">
import { computed } from 'vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'

type PR = {
  id: number
  number: number
  title: string
  state: string
  author_login?: string
  created_at?: string
  comments?: number
}

const props = defineProps<{
  prs: PR[]
  selectable?: boolean
  selectedNumbers: number[]
  loading?: boolean
  error?: string | null
  pageSize: number
  stateFilter: 'open' | 'closed' | 'merged' | 'all'
}>()

const emit = defineEmits<{
  (e: 'update:selectedNumbers', numbers: number[]): void
  (e: 'request:selectVisible'): void
  (e: 'request:clear'): void
  (e: 'request:less'): void
  (e: 'request:more'): void
}>()

const selectable = computed(() => props.selectable ?? true)
const hasSelection = computed(() => (props.selectedNumbers?.length ?? 0) > 0)

function toggle(pr: PR, checked: boolean) {
  const set = new Set(props.selectedNumbers || [])
  if (checked) set.add(pr.number)
  else set.delete(pr.number)
  emit('update:selectedNumbers', Array.from(set))
}

function selectVisible() {
  emit('request:selectVisible')
}
function clearSelection() {
  emit('request:clear')
}
function less() {
  emit('request:less')
}
function more() {
  emit('request:more')
}
</script>

<template>
  <section role="region" aria-label="Pull requests" class="rounded border border-cyber-border bg-cyber-surface/40 p-4 space-y-3">
    <!-- Loading -->
    <template v-if="loading">
      <div v-for="i in 3" :key="i" class="h-16 rounded border border-dashed border-cyber-border animate-pulse"></div>
    </template>

    <!-- Error -->
    <template v-else-if="error">
      <div class="text-sm text-rose-600">Failed to load pull requests: {{ error }}</div>
    </template>

    <!-- Content -->
    <template v-else>
      <!-- Header toolbar (selection) -->
      <div
        v-if="hasSelection"
        class="flex items-center justify-between text-xs text-cyber-muted"
      >
        <div>
          {{ selectedNumbers.length }} selected
          <span v-if="stateFilter !== 'all'" class="ml-2 opacity-80">(Some selected PRs may be hidden by filters)</span>
        </div>
        <div class="flex items-center gap-2">
          <TerminalButton size="sm" variant="ghost" aria-label="Select all visible PRs" @click="selectVisible">Select visible</TerminalButton>
          <TerminalButton size="sm" variant="ghost" aria-label="Clear selected PRs" @click="clearSelection">Clear</TerminalButton>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!prs || prs.length === 0" class="text-xs text-cyber-muted">
        No pull requests match the current filters.
      </div>

      <!-- List -->
      <div
        v-for="pr in prs"
        :key="pr.id"
        class="rounded border border-cyber-border bg-cyber-surface/60 p-3"
        :class="selectedNumbers.includes(pr.number) ? 'ring-2 ring-cyber-accent' : ''"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <input
              v-if="selectable"
              type="checkbox"
              class="h-4 w-4 accent-[var(--cyber-accent,#ea00d9)]"
              :aria-label="`Select PR #${pr.number}`"
              :checked="selectedNumbers.includes(pr.number)"
              @change="(e: Event) => toggle(pr, (e.target as HTMLInputElement).checked)"
            />
            <div class="font-medium">{{ pr.title }}</div>
          </div>
          <div class="text-xs text-cyber-muted">#{{ pr.number }} • {{ pr.state }}</div>
        </div>
        <div class="text-xs text-cyber-muted mt-0.5">
          <span>{{ pr.author_login }}</span>
          <span v-if="pr.created_at"> • {{ new Date(pr.created_at).toLocaleDateString() }}</span>
          <span v-if="typeof pr.comments !== 'undefined'"> • 💬 {{ pr.comments }}</span>
        </div>
        <slot name="row-meta" :pr="pr" />
      </div>

      <!-- Pagination controls -->
      <div class="flex items-center justify-between pt-2">
        <div class="text-xs text-cyber-muted">
          Showing up to {{ pageSize }} {{ stateFilter }} PRs
        </div>
        <div class="flex gap-2">
          <TerminalButton size="sm" variant="ghost" :disabled="pageSize <= 25" @click="less">Less</TerminalButton>
          <TerminalButton size="sm" variant="ghost" @click="more">More</TerminalButton>
        </div>
      </div>
    </template>
  </section>
</template>

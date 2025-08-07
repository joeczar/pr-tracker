<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { qk } from '@/lib/api/queryKeys'

const props = defineProps<{
  hasSelection: boolean
  selectedRepoId: number | null
  selectedPrIds: number[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const enabledHasRepo = computed(() => Number.isFinite(props.selectedRepoId as any))

// Fetch a larger set to ensure selected PRs are included, or fetch all PRs if selection is small
const LIMIT = computed(() => props.selectedPrIds.length > 0 ? Math.max(100, props.selectedPrIds.length * 2) : 50)
const prListQuery = useQuery({
  // Types for state exclude 'all'; pass undefined to mean all states.
  queryKey: computed(() => enabledHasRepo.value ? qk.prs.byRepo(props.selectedRepoId as number, { state: undefined, limit: LIMIT.value }) : ['prs', 'byRepo', 'disabled']),
  queryFn: () => pullRequestsApi.listByRepo(props.selectedRepoId as number, { state: undefined, limit: LIMIT.value }),
  enabled: enabledHasRepo,
})

const pending = computed(() => !!(prListQuery.isPending as any))
const error = computed(() => !!(prListQuery.isError as any))
const items = computed<any[]>(() => (prListQuery.data?.value as any[]) || [])
const filtered = computed(() => {
  if (!props.hasSelection) return []
  const sel = new Set(props.selectedPrIds)
  return items.value.filter((pr) => sel.has(pr.number))
})
const isEmptySelection = computed(() => props.hasSelection && props.selectedPrIds.length === 0)
const isEmptyFiltered = computed(() => props.hasSelection && props.selectedPrIds.length > 0 && filtered.value.length === 0 && !pending.value && !error.value)

function refresh() {
  (prListQuery as any).refetch?.()
  emit('refresh')
}
</script>

<template>
  <TerminalWindow>
    <template #title>
      <TerminalHeader>
        <template #title>
          <TerminalTitle command="recent-activity" />
        </template>
        <template #actions>
          <TerminalButton size="sm" variant="secondary" aria-label="Refresh activity" @click="refresh">Refresh</TerminalButton>
        </template>
      </TerminalHeader>
    </template>

    <!-- Guided states -->
    <div v-if="!hasSelection" class="text-sm text-slate-500 dark:text-slate-400">
      Select PRs in the repository view to see recent activity here.
    </div>

    <div v-else-if="pending" class="space-y-3">
      <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700 animate-pulse"></div>
      <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700 animate-pulse"></div>
      <div class="h-12 rounded border border-dashed border-slate-300 dark:border-slate-700 animate-pulse"></div>
    </div>

    <div v-else-if="error" class="text-sm text-rose-600">
      Failed to load recent activity.
      <button class="ml-2 underline" @click="refresh">Retry</button>
    </div>

    <div v-else-if="isEmptySelection" class="text-sm text-slate-500">
      No PRs selected. Select PRs in the repository view to see recent activity here.
    </div>

    <div v-else-if="isEmptyFiltered" class="text-sm text-slate-500">
      No recent activity for the selected PRs within the fetched range.
      <div class="mt-2 text-xs text-slate-400">
        Tip: Click Refresh or widen the time window in future iterations to include more history.
      </div>
    </div>

    <ul v-else class="space-y-2" role="list">
      <li
        v-for="pr in filtered"
        :key="pr.id"
        class="flex items-center justify-between rounded border px-3 py-2
               border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-800/30"
      >
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono"
            :class="{
              'text-emerald-600 dark:text-emerald-300': pr.state === 'merged',
              'text-cyan-700 dark:text-cyan-300': pr.state === 'open' || pr.state === 'review',
              'text-slate-600 dark:text-slate-300': pr.state === 'draft',
              'text-rose-700 dark:text-rose-300': pr.state === 'closed',
            }"
            aria-hidden="true"
          >#{{ pr.id }}</span>
          <span class="text-sm font-mono text-slate-900 dark:text-slate-100">{{ pr.title }}</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span aria-label="State">{{ pr.state }}</span>
          <span aria-label="Updated">
            {{ pr.updatedAt || pr.updated_at ? new Date(pr.updatedAt || pr.updated_at).toLocaleString() : 'Unknown' }}
          </span>
        </div>
      </li>
    </ul>
  </TerminalWindow>
</template>

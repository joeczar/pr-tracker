<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import RepoOverviewTiles from '@/components/repositories/RepoOverviewTiles.vue'
import { repositoriesApi } from '@/lib/api/repositories'
import { pullRequestsApi } from '@/lib/api/pullRequests'

import { syncApi } from '@/lib/api/sync'
import { qk } from '@/lib/api/queryKeys'
import ErrorBoundary from "@/components/error/ErrorBoundary.vue"
import { useSelectionStore } from '@/stores/selection'
import PRList from '@/components/repositories/PRList.vue'
import RepoSyncHistory from '@/components/repositories/RepoSyncHistory.vue'
import SelectedPRsSection from '@/components/repositories/SelectedPRsSection.vue'



const route = useRoute()
const repoId = computed(() => Number(route.params.id))

// Selection store: keep global PR-centric context updated
const sel = useSelectionStore()

// Ensure store repository matches current route param
watch(
  () => repoId.value,
  async (id) => {
    if (Number.isFinite(id)) {
      sel.setRepository(id)
      // Hydrate persisted selection from server for this repo
      await sel.hydrateFromServer()
    } else {
      sel.setRepository(null)
    }
  },
  { immediate: true }
)

// Optional: pre-focus a PR if deep-linked via ?pr=123
/**
 * Deep-linked PRs:
 * - Support single ?pr=123, multiple ?pr=1&pr=2, or comma-separated ?pr=1,2
 */
const deepLinkedPrs = computed<number[]>(() => {
  const raw = route.query.pr
  if (raw == null) return []
  const vals = Array.isArray(raw) ? raw : [raw]
  const ids: number[] = []
  for (const v of vals) {
    String(v)
      .split(',')
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
      .forEach((n) => ids.push(n))
  }
  return Array.from(new Set(ids))
})
const days = ref(30)
const prState = ref<'open' | 'closed' | 'merged' | 'all'>('open')
const prLimit = ref(50)

const qc = useQueryClient()

// Queries
const repoInfo = useQuery({
  queryKey: computed(() => qk.repositories.byId(repoId.value)),
  queryFn: () => repositoriesApi.get(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

const prList = useQuery({
  queryKey: computed(() => qk.prs.byRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value })),
  queryFn: () => pullRequestsApi.listByRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }),
  enabled: computed(() => Number.isFinite(repoId.value)),
})

// Compute selected PRs from the main PR list for better reactivity
const selectedPRsFromList = computed(() => {
  const allPRs = (prList.data?.value || []) as any[]
  const selectedNumbers = sel.selectedPullRequestNumbers.value
  return allPRs.filter((pr: any) => selectedNumbers.includes(pr.number))
})

// Fetch additional selected PRs that might not be in the main list (e.g., merged PRs when filtering by open)
const additionalSelectedPRs = useQuery({
  queryKey: computed(() => ['additional-selected-prs', repoId.value, sel.selectedPullRequestNumbers.value]),
  queryFn: async () => {
    if (!sel.selectedPullRequestNumbers.value.length) return []
    const allPRs = (prList.data?.value || []) as any[]
    const visiblePRNumbers = new Set(allPRs.map((pr: any) => pr.number))
    const missingNumbers = sel.selectedPullRequestNumbers.value.filter(num => !visiblePRNumbers.has(num))

    if (missingNumbers.length === 0) return []

    // Fetch all PRs to find the missing selected ones
    const allPRsFromAPI = await pullRequestsApi.listByRepo(repoId.value, { limit: 1000 })
    return allPRsFromAPI.filter((pr: any) => missingNumbers.includes(pr.number))
  },
  enabled: computed(() => Number.isFinite(repoId.value) && sel.selectedPullRequestNumbers.value.length > 0),
})

// Combine selected PRs from both sources; guard against stale additional data when empty
const selectedPRs = computed(() => {
  if (sel.selectedPullRequestNumbers.value.length === 0) return [] as any[]
  const fromList = selectedPRsFromList.value
  const additional = (additionalSelectedPRs.data?.value || []) as any[]
  return [...fromList, ...additional]
})

// Reactive selected numbers for the PRList component
const selectedNumbers = computed(() => sel.selectedPullRequestNumbers.value)

/**
 * Adjust filters based on deep-linked PR after data loads.
 * Vue Query's composition API doesn't accept onSuccess in options typing here,
 * so watch the query result instead.
 */
/**
 * Apply deep-linked PR ids on first load only if local selection is empty.
 */
const appliedDeepLink = ref(false)
watch(
  () => prList.data.value,
  () => {
    if (appliedDeepLink.value) return
    if (deepLinkedPrs.value.length > 0 && sel.selectedPullRequestNumbers.value.length === 0) {
      if (prState.value !== 'all') prState.value = 'all'
      if (prLimit.value < 100) prLimit.value = 100
      sel.setSelectedPRNumbers(deepLinkedPrs.value)
      sel.syncToUrl({ replace: true })
      appliedDeepLink.value = true
    }
  }
)

const prStats = useQuery({
  queryKey: computed(() => qk.prs.stats(repoId.value)),
  queryFn: () => pullRequestsApi.statsByRepo(repoId.value),
  enabled: computed(() => Number.isFinite(repoId.value)),
})



// Mutation: Sync now
const { mutate: syncNow, status: syncStatus } = useMutation({
  mutationFn: () => pullRequestsApi.syncRepo(repoId.value),
  onSuccess: async () => {
    // Invalidate related queries
    await Promise.all([
      qc.invalidateQueries({ queryKey: qk.prs.byRepo(repoId.value, { state: prState.value === 'all' ? undefined : prState.value, limit: prLimit.value }) }),
      qc.invalidateQueries({ queryKey: qk.prs.stats(repoId.value) }),
      qc.invalidateQueries({ queryKey: qk.analytics.trends(repoId.value, days.value) }),
      // Optional: sync history if used
      qc.invalidateQueries({ queryKey: qk.sync.history(repoId.value, 20) }),
    ])
    // toast success (placeholder)
    ;(window as any).__toast?.success?.('Sync queued')
  },
  onError: (err: any) => {
    const msg = err?.payload?.message || err?.message || 'Failed to queue sync'
    ;(window as any).__toast?.error?.(msg)
  },
})

// Derived UI state for overview tiles
const overview = computed(() => {
  const stats = prStats.data.value as any
  return [
    { label: 'Total PRs', value: stats?.total ?? '—', trend: 'flat' as const },
    { label: 'Open', value: stats?.open ?? '—', trend: 'up' as const },
    { label: 'Merged', value: stats?.merged ?? '—', trend: 'up' as const },
    { label: 'Closed', value: stats?.closed ?? '—', trend: 'down' as const },
    { label: 'Merge rate', value: stats?.merge_rate != null ? `${Math.round(stats.merge_rate)}%` : '—', trend: 'flat' as const },
    { label: 'Last sync', value: '—', trend: 'flat' as const },
  ]
})


/* Optional Sync History wiring */
const historyLimit = ref(10)

const {
  data: syncHistory,
  isPending: historyLoading,
  isError: historyError,
  error: historyErr,
  refetch: refetchHistory,
} = useQuery({
  queryKey: computed(() => qk.sync.history(repoId.value, historyLimit.value)),
  queryFn: async () => {
    try { await fetch('/auth/status', { credentials: 'include' }).catch(() => {}) } catch (_e) { /* ignore */ }
    return syncApi.repoHistory(repoId.value, historyLimit.value)
  },
  enabled: computed(() => Number.isFinite(repoId.value) && historyLimit.value > 0),
})

</script>

<template>
  <section aria-labelledby="repo-detail-title" class="space-y-6">
    <!-- Sync History Panel -->
    <ErrorBoundary>
      <RepoSyncHistory
        :items="(((syncHistory as unknown) as { id: string; status: string; type?: string; started_at?: string; finished_at?: string; job_id?: string }[]) || []).map(it => ({ id: Number(it.id), status: it.status, type: it.type, started_at: it.started_at, finished_at: it.finished_at, job_id: it.job_id }))"
        :loading="!!historyLoading"
        :error="historyError ? ((historyErr as any)?.message || 'Unknown error') : null"
        :limit="historyLimit"
        @update:limit="(v: number) => { historyLimit = v; refetchHistory() }"
        @refresh="() => refetchHistory()"
      />
    </ErrorBoundary>

    <ErrorBoundary>
      <TerminalWindow>
        <template #title>
          <TerminalHeader>
            <template #title>
              <TerminalTitle command="repository-detail" />
            </template>
            <template #actions>
              <div class="flex items-center gap-2">
                <TerminalButton size="sm" variant="secondary" aria-label="Sync repository" :disabled="syncStatus === 'pending'" @click="syncNow">
                  <span v-if="syncStatus === 'pending'">Syncing…</span>
                  <span v-else>Sync</span>
                </TerminalButton>
              </div>
            </template>
          </TerminalHeader>
        </template>

        <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repo-detail-title" class="text-xl font-semibold tracking-tight">
            {{ repoInfo.data?.value?.full_name || repoInfo.data?.value?.name || 'Repository' }} • Repository Details
          </h1>
          <div class="flex items-center gap-2">
              <TerminalButton size="sm" variant="secondary" aria-label="Sync repository" :disabled="syncStatus === 'pending'" @click="syncNow">
                <span v-if="syncStatus === 'pending'">Syncing…</span>
                <span v-else>Sync</span>
              </TerminalButton>
          </div>
        </header>

        <!-- Overview tiles -->

        <RepoOverviewTiles
          :metrics="overview as any"
          :loading="!!prStats.isPending.value"
          :error="prStats.isError.value ? 'Failed to load repository overview.' : null"
        />
        </div>
      </TerminalWindow>
    </ErrorBoundary>



    <!-- Selected PRs Section -->
    <ErrorBoundary>
      <SelectedPRsSection
        :selected-p-rs="selectedPRs as any"
        :loading="!!additionalSelectedPRs.isPending.value"
        @deselect="async (prNumber: number) => {
          await sel.removeSelectedPRNumber(prNumber)
          await sel.hydrateFromServer()
          sel.syncToUrl({ replace: true })
        }"
        @clear="async () => {
          await sel.clearRepositorySelection(repoId as unknown as number)
          await sel.hydrateFromServer()
          sel.syncToUrl({ replace: true })
        }"
      />
    </ErrorBoundary>

    <!-- PR list -->
    <section>
      <PRList
        :repo-id="repoId as unknown as number"
        :prs="(prList.data?.value || []) as any"
        :selectable="true"
        :selected-numbers="selectedNumbers"
        :page-size="prLimit"
        :state-filter="prState"
        :loading="!!prList.isPending.value"
        :error="prList.isError.value ? 'Failed to load pull requests.' : null"
        @update:selectedNumbers="async (nums: number[]) => {
          await sel.setSelectedPRNumbersPersisted(repoId as unknown as number, nums)
          sel.syncToUrl({ replace: true })
        }"
        @request:selectVisible="async () => {
          const visible = (prList.data?.value || []).map((p: any) => p.number)
          const current = sel.selectedPullRequestNumbers.value || []
          const next = Array.from(new Set([ ...current, ...visible ]))
          await sel.setSelectedPRNumbersPersisted(repoId as unknown as number, next)
          sel.syncToUrl({ replace: true })
        }"
        @request:clear="async () => {
          await sel.clearRepositorySelection(repoId as unknown as number)
          await sel.hydrateFromServer()
          sel.syncToUrl({ replace: true })
        }"
        @request:less="() => prLimit = Math.max(25, prLimit - 25)"
        @request:more="() => prLimit = prLimit + 25"
        @request:updateState="(next) => { prState = next }"
      />
    </section>
  </section>
</template>

import { ref, computed } from 'vue'

/**
 * Global selection store for PR-centric dashboard context.
 * Source of truth is RepositoryDetail (and Repositories flow).
 * Dashboard consumes this selection. Optional URL hydration is provided.
 */

const selectedRepositoryId = ref<number | null>(null)
const selectedPullRequestIds = ref<number[]>([])

function setRepository(id: number | null) {
  selectedRepositoryId.value = Number.isFinite(id as any) ? (id as number) : null
  // If repository changes, clear PR selection (cannot assume same PR ids are valid)
  if (id == null) {
    selectedPullRequestIds.value = []
  }
}

function setSelectedPRs(ids: number[]) {
  // Normalize to unique numeric IDs
  const uniq = Array.from(new Set((ids || []).map((n) => Number(n)).filter((n) => Number.isFinite(n))))
  selectedPullRequestIds.value = uniq
}

function addSelectedPR(id: number) {
  if (!Number.isFinite(id)) return
  const set = new Set(selectedPullRequestIds.value)
  set.add(Number(id))
  selectedPullRequestIds.value = Array.from(set)
}

function removeSelectedPR(id: number) {
  const set = new Set(selectedPullRequestIds.value)
  set.delete(Number(id))
  selectedPullRequestIds.value = Array.from(set)
}

function clearSelection() {
  selectedRepositoryId.value = null
  selectedPullRequestIds.value = []
}

const hasSelection = computed(() => selectedRepositoryId.value != null && selectedPullRequestIds.value.length > 0)

/**
 * Optional URL hydration for robustness:
 * - repo from ?repo
 * - pr(s) from ?pr (single) or repeated ?pr= (multiple)
 */
function hydrateFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const repoRaw = url.searchParams.get('repo')
    if (repoRaw != null) {
      const repoId = Number(repoRaw)
      if (Number.isFinite(repoId)) {
        selectedRepositoryId.value = repoId
      }
    }
    // Support multiple ?pr params or comma-separated
    const prParams = url.searchParams.getAll('pr')
    let prIds: number[] = []
    if (prParams.length > 0) {
      for (const p of prParams) {
        const parts = String(p).split(',').map((x) => Number(x)).filter((n) => Number.isFinite(n))
        prIds.push(...parts)
      }
    }
    if (prIds.length > 0) {
      setSelectedPRs(prIds)
    }
  } catch {
    // ignore
  }
}

/**
 * Optional URL sync for sharing context; disabled by default.
 */
function syncToUrl({ replace = true }: { replace?: boolean } = {}) {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (selectedRepositoryId.value != null) {
      url.searchParams.set('repo', String(selectedRepositoryId.value))
    } else {
      url.searchParams.delete('repo')
    }
    url.searchParams.delete('pr')
    for (const id of selectedPullRequestIds.value) {
      url.searchParams.append('pr', String(id))
    }
    if (replace) {
      window.history.replaceState({}, '', url.toString())
    } else {
      window.history.pushState({}, '', url.toString())
    }
  } catch {
    // ignore
  }
}

export function useSelectionStore() {
  return {
    // state
    selectedRepositoryId,
    selectedPullRequestIds,
    hasSelection,
    // actions
    setRepository,
    setSelectedPRs,
    addSelectedPR,
    removeSelectedPR,
    clearSelection,
    // helpers
    hydrateFromUrl,
    syncToUrl,
  }
}

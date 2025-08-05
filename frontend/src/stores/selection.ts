import { ref, computed } from 'vue'
import { selectionsApi } from '@/lib/api/selections'

/**
 * Global selection store for PR-centric dashboard context.
 * Source of truth is RepositoryDetail (and Repositories flow).
 * Dashboard consumes this selection. Optional URL hydration is provided.
 */

const selectedRepositoryId = ref<number | null>(null)
/**
 * IMPORTANT: Track PR selection by PR NUMBER (not internal id) to align with backend API
 * which expects { repository_id, pr_number }.
 */
const selectedPullRequestNumbers = ref<number[]>([])

function setRepository(id: number | null) {
  selectedRepositoryId.value = Number.isFinite(id as any) ? (id as number) : null
  // If repository changes, clear PR selection (cannot assume same PR ids are valid)
  if (id == null) {
    selectedPullRequestNumbers.value = []
  }
}

function setSelectedPRNumbers(numbers: number[]) {
  // Normalize to unique numeric PR numbers
  const uniq = Array.from(new Set((numbers || []).map((n) => Number(n)).filter((n) => Number.isFinite(n))))
  selectedPullRequestNumbers.value = uniq
}

async function addSelectedPRNumber(prNumber: number) {
  if (!Number.isFinite(prNumber)) return
  const set = new Set(selectedPullRequestNumbers.value)
  if (set.has(prNumber)) return

  // Update UI immediately (local-first)
  set.add(Number(prNumber))
  selectedPullRequestNumbers.value = Array.from(set)

  // Sync to server in background (don't block UI)
  if (Number.isFinite(selectedRepositoryId.value as any)) {
    selectionsApi.addItems([{ repository_id: selectedRepositoryId.value as number, pr_number: prNumber }])
      .catch((error) => {
        console.warn('Failed to sync selection to server:', error)
        // Keep local state - don't rollback for better UX
      })
  }
}

async function removeSelectedPRNumber(prNumber: number) {
  const set = new Set(selectedPullRequestNumbers.value)
  if (!set.has(prNumber)) return

  // Update UI immediately (local-first)
  set.delete(Number(prNumber))
  selectedPullRequestNumbers.value = Array.from(set)

  // Sync to server in background (don't block UI)
  if (Number.isFinite(selectedRepositoryId.value as any)) {
    selectionsApi.removeItems([{ repository_id: selectedRepositoryId.value as number, pr_number: prNumber }])
      .catch((error) => {
        console.warn('Failed to sync deselection to server:', error)
        // Keep local state - don't rollback for better UX
      })
  }
}

async function clearSelection() {
  // Clear local state immediately (local-first)
  selectedRepositoryId.value = null
  selectedPullRequestNumbers.value = []

  // Sync to server in background (don't block UI)
  selectionsApi.clearActive()
    .catch((error) => {
      console.warn('Failed to sync clear selection to server:', error)
      // Keep local state - don't rollback for better UX
    })
}

const hasSelection = computed(() => selectedRepositoryId.value != null && selectedPullRequestNumbers.value.length > 0)

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
    const prIds: number[] = []
    if (prParams.length > 0) {
      for (const p of prParams) {
        const parts = String(p).split(',').map((x) => Number(x)).filter((n) => Number.isFinite(n))
        prIds.push(...parts)
      }
    }
    if (prIds.length > 0) {
      setSelectedPRNumbers(prIds)
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
    for (const num of selectedPullRequestNumbers.value) {
      url.searchParams.append('pr', String(num))
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

/**
 * Hydrate from server: fetch active selection and reflect PR numbers for current repo (if any).
 * Call this on app boot or when entering RepositoryDetail.
 */
async function hydrateFromServer() {
  try {
    const res = await selectionsApi.getActive()
    if (!res?.items) return
    if (!Number.isFinite(selectedRepositoryId.value as any)) return
    const nums = res.items
      .filter((it) => it.repository_id === (selectedRepositoryId.value as number))
      .map((it) => it.pr_number)
    setSelectedPRNumbers(nums)
  } catch {
    // ignore
  }
}

export function useSelectionStore() {
  return {
    // state
    selectedRepositoryId,
    selectedPullRequestNumbers,
    hasSelection,
    // actions
    setRepository,
    setSelectedPRNumbers,
    addSelectedPRNumber,
    removeSelectedPRNumber,
    clearSelection,
    // helpers
    hydrateFromUrl,
    hydrateFromServer,
    syncToUrl,
  }
}

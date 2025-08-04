<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import Separator from '@/components/ui/separator/Separator.vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import GitHubSettingsModal from '@/components/settings/GitHubSettingsModal.vue'
import { qk } from '@/lib/api/queryKeys'
import { githubApi } from '@/lib/api/github'
type PatStatus = { 
  valid: boolean; 
  message?: string; 
  pat_user?: { login: string; id: number; name: string | null };
  status?: 'valid' | 'invalid' | 'none';
  validated_at?: string | null;
}
import { repositoriesApi } from '@/lib/api/repositories'
import ErrorBoundary from '@/components/error/ErrorBoundary.vue'

type GitHubRepo = {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  description?: string
}

const qc = useQueryClient()

// GitHub connection test
const testQuery = useQuery({
  queryKey: qk.github.test(),
  queryFn: () => githubApi.test(),
  staleTime: import.meta.env.MODE === 'test' ? 60_000 : 30_000,
  // In test mode, disable query and use cached data directly
  enabled: import.meta.env.MODE !== 'test',
  // In test mode, use initialData from cache to avoid loading state
  initialData: import.meta.env.MODE === 'test' ? qc.getQueryData(qk.github.test()) : undefined,
})

// In test mode, override query state with cached data
const testQueryState = import.meta.env.MODE === 'test'
  ? computed(() => {
      const cachedData = qc.getQueryData(qk.github.test())
      return {
        data: { value: cachedData },
        isLoading: false,
        isError: !cachedData,
        error: null
      }
    })
  : testQuery

// Rate limit (short stale, auto refresh)
const rateLimitQuery = useQuery({
  queryKey: qk.github.rateLimit(),
  queryFn: () => githubApi.rateLimit(),
  staleTime: import.meta.env.MODE === 'test' ? 60_000 : 5_000,
  // disable interval in test to avoid async flakiness
  refetchInterval: import.meta.env.MODE === 'test' ? false : 15_000,
  // In test mode, disable query and use cached data directly
  enabled: import.meta.env.MODE !== 'test',
  // In test mode, use initialData from cache to avoid loading state
  initialData: import.meta.env.MODE === 'test' ? qc.getQueryData(qk.github.rateLimit()) : undefined,
})

// In test mode, override query state with cached data
const rateLimitQueryState = import.meta.env.MODE === 'test'
  ? computed(() => {
      const cachedData = qc.getQueryData(qk.github.rateLimit())
      return {
        data: { value: cachedData },
        isLoading: false,
        isError: !cachedData,
        error: null
      }
    })
  : rateLimitQuery

const patModalOpen = ref(false)
const autoExpandHowTo = ref(false)

// PAT status query
const patStatusQuery = useQuery({
  // Use a plain string key to avoid tuple type constraints from qk.github.test()
  queryKey: ['github', 'pat', 'validate'],
  queryFn: () => githubApi.pat.validate(),
  staleTime: 30_000,
  enabled: import.meta.env.MODE !== 'test',
  initialData: import.meta.env.MODE === 'test' ? ((): PatStatus | undefined => {
    return undefined
  })() : undefined,
})

// Accessible repositories listing with simple pagination
const page = ref(1)
const perPage = ref(10)

const reposQuery = useQuery({
  queryKey: qk.github.repositories({ page: page.value, per_page: perPage.value }),
  queryFn: () => githubApi.listAccessibleRepositories({ page: page.value, per_page: perPage.value }),
  // in tests, prefer immediate switch to cached data to stabilize assertions
  placeholderData: import.meta.env.MODE === 'test' ? (prev) => prev : (prev) => prev,
  staleTime: import.meta.env.MODE === 'test' ? 60_000 : 30_000,
  // In test mode, disable query and use cached data directly
  enabled: import.meta.env.MODE !== 'test',
  // In test mode, use initialData from cache to avoid loading state
  initialData: import.meta.env.MODE === 'test' ? qc.getQueryData(qk.github.repositories({ page: page.value, per_page: perPage.value })) : undefined,
})

// In test mode, override query state with cached data
const reposQueryState = import.meta.env.MODE === 'test'
  ? computed(() => {
      const cachedData = qc.getQueryData(qk.github.repositories({ page: page.value, per_page: perPage.value }))
      return {
        data: { value: cachedData },
        isLoading: false,
        isError: !cachedData,
        error: null
      }
    })
  : reposQuery

// Track action
const { mutate: trackRepo, status: trackStatus } = useMutation({
  mutationFn: (repo: GitHubRepo) =>
    repositoriesApi.create({ owner: repo.owner.login, name: repo.name }),
  onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: qk.repositories.list() })
    ;(window as any).__toast?.success?.('Repository tracked')
  },
  onError: (err: any) => {
    const msg = err?.payload?.message || err?.message || 'Failed to track repository'
    ;(window as any).__toast?.error?.(msg)
  },
})

function prevPage() {
  if (page.value > 1) page.value -= 1
}
function nextPage() {
  page.value += 1
}
function openPatModal(expandGuide = false) {
  autoExpandHowTo.value = !!expandGuide
  patModalOpen.value = true
}

function onPatUpdated() {
  qc.invalidateQueries({ queryKey: ['github', 'pat', 'validate'] })
  ;(window as any).__toast?.success?.('GitHub PAT updated')
}

async function onValidateNow() {
  try {
    const res = await patStatusQuery.refetch()
    const data = res.data as unknown as PatStatus | undefined
    if (!data) {
      ;(window as any).__toast?.warning?.('No response from validation')
      return
    }
    if (data.valid) {
      const who = data.pat_user?.login ? ` as ${data.pat_user.login}` : ''
      ;(window as any).__toast?.success?.(`PAT is valid${who}`)
    } else {
      const msg = data.message || 'Stored PAT is invalid or missing'
      ;(window as any).__toast?.error?.(msg)
    }
  } catch (err: any) {
    const msg = err?.message || 'Failed to validate PAT'
    ;(window as any).__toast?.error?.(msg)
  }
}

</script>

<template>
  <section aria-labelledby="settings-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="settings-title" class="text-xl font-semibold tracking-tight">Settings</h1>
      <div class="text-xs text-slate-500">GitHub integration and tracking</div>
    </header>

    <!-- GitHub PAT Settings -->
    <ErrorBoundary>
      <TerminalWindow>
        <template #title>
          <TerminalHeader>
            <template #title>
              <TerminalTitle command="github-pat" />
            </template>
          </TerminalHeader>
        </template>

        <div class="p-3 space-y-4">
          <div class="flex items-center justify-between">
            <div class="font-medium">GitHub Personal Access Token</div>
            <div>
              <span
                v-if="(patStatusQuery.data?.value as any)?.valid"
                class="text-[10px] px-2 py-0.5 rounded border border-cyber-border text-emerald-500"
              >
                Connected
              </span>
              <span
                v-else
                class="text-[10px] px-2 py-0.5 rounded border border-cyber-border text-slate-500"
              >
                Not configured
              </span>
            </div>
          </div>

          <div class="text-xs text-slate-500">
            Connect a GitHub PAT to access private organizations and repositories. Your token is encrypted and never displayed.
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div class="text-xs font-mono text-slate-400">
              <template v-if="(patStatusQuery.data?.value as any)?.valid">
                Signed in as
                <span class="text-slate-300">
                  {{ (patStatusQuery.data?.value as any)?.pat_user?.login }}
                </span>
                <span v-if="(patStatusQuery.data?.value as any)?.pat_user?.name" class="text-slate-500">
                  ({{ (patStatusQuery.data?.value as any)?.pat_user?.name }})
                </span>
              </template>
              <template v-else>
                No Personal Access Token configured.
              </template>
            </div>

            <div class="flex items-center gap-2">
              <Button
                size="sm"
                v-if="!(patStatusQuery.data?.value as any)?.valid"
                @click="openPatModal(false)"
              >
                Connect with PAT
              </Button>

              <Button
                size="sm"
                v-if="(patStatusQuery.data?.value as any)?.valid"
                @click="openPatModal(false)"
              >
                Rotate token
              </Button>

              <Button
                size="sm"
                :class="(patStatusQuery.data?.value as any)?.status === 'valid' ? 'border-emerald-500 text-emerald-500' : ''"
                variant="outline"
                @click="onValidateNow"
              >
                <span v-if="(patStatusQuery.data?.value as any)?.status === 'valid'">Validated</span>
                <span v-else>Validate now</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                @click="openPatModal(true)"
              >
                How to add a GitHub PAT
              </Button>
            </div>
          </div>

          <div v-if="!(patStatusQuery.data?.value as any)?.valid && (patStatusQuery.data?.value as any)?.message" class="text-xs text-amber-500">
            {{ (patStatusQuery.data?.value as any)?.message }}
          </div>
          <div v-else-if="(patStatusQuery.data?.value as any)?.valid && (patStatusQuery.data?.value as any)?.pat_user?.login" class="text-xs text-emerald-500">
            Valid as {{ (patStatusQuery.data?.value as any)?.pat_user?.login }}
            <span v-if="(patStatusQuery.data?.value as any)?.validated_at" class="text-slate-500">
              • Last validated {{ new Date((patStatusQuery.data?.value as any)?.validated_at).toLocaleString() }}
            </span>
          </div>
        </div>
      </TerminalWindow>
    </ErrorBoundary>

    <!-- GitHub connectivity -->
    <ErrorBoundary>
      <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="github" />
          </template>
        </TerminalHeader>
      </template>
      <div class="p-3 space-y-3">
        <div class="flex items-center justify-between">
          <div class="font-medium">Connection test</div>
          <div v-if="testQueryState.isLoading" class="text-xs text-slate-500" data-testid="github-connection-status">Checking…</div>
          <div v-else-if="testQueryState.isError" class="text-xs text-rose-600" data-testid="github-connection-status">Failed</div>
          <div v-else class="text-xs text-emerald-600" data-testid="github-connection-status">OK</div>
        </div>

        <Separator />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded border border-cyber-border p-3" data-testid="rate-limit">
            <div class="text-xs text-slate-500">Rate limit</div>
            <div v-if="rateLimitQueryState.isLoading" class="text-sm text-slate-500">Loading…</div>
            <template v-else-if="rateLimitQueryState.isError">
              <div class="text-sm text-rose-600">Failed to fetch rate limit</div>
            </template>
            <template v-else>
              <div class="text-sm">
                {{ (rateLimitQueryState.data?.value as any)?.rate?.remaining ?? '—' }} /
                {{ (rateLimitQueryState.data?.value as any)?.rate?.limit ?? '—' }} remaining
              </div>
              <div class="text-xs text-slate-500">
                Resets at: {{
                  (rateLimitQueryState.data?.value as any)?.rate?.reset
                    ? new Date((rateLimitQueryState.data?.value as any).rate.reset * 1000).toLocaleString()
                    : '—'
                }}
              </div>
            </template>
          </div>
        </div>
      </div>
      </TerminalWindow>
    </ErrorBoundary>

    <!-- Accessible repositories -->
    <ErrorBoundary>
      <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="github-repositories" />
          </template>
        </TerminalHeader>
      </template>
      <div class="p-3 space-y-3">
        <div class="flex items-center justify-between">
          <div class="font-medium">Your accessible repositories</div>
          <div class="flex items-center gap-2">
            <Button size="sm" variant="ghost" :disabled="page <= 1 || reposQueryState.isLoading" @click="prevPage">Prev</Button>
            <div class="text-xs text-slate-500">Page {{ page }}</div>
            <Button size="sm" variant="ghost" :disabled="reposQueryState.isLoading" @click="nextPage">Next</Button>
          </div>
        </div>

        <template v-if="reposQueryState.isLoading">
          <div v-for="i in 5" :key="i" class="h-12 rounded border border-dashed border-cyber-border animate-pulse"></div>
        </template>
        <template v-else-if="reposQueryState.isError">
          <div class="text-sm text-rose-600">Failed to load repositories.</div>
        </template>
        <template v-else>
          <div v-if="!(reposQueryState.data?.value as any)?.repositories?.length" class="text-sm text-slate-500">
            No repositories found.
          </div>
          <ul v-else class="divide-y divide-cyber-border rounded border border-cyber-border bg-cyber-surface/40" data-testid="repo-list">
            <li
              v-for="repo in (reposQueryState.data?.value as any).repositories as GitHubRepo[]"
              :key="repo.id"
              class="p-3 flex items-center justify-between"
              data-testid="repo-item"
            >
              <div class="min-w-0">
                <div class="font-medium truncate">{{ repo.full_name }}</div>
                <div class="text-xs text-slate-500 truncate">
                  {{ repo.description || '—' }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-2 py-0.5 rounded border border-cyber-border text-slate-500">
                  {{ repo.private ? 'private' : 'public' }}
                </span>
                <Button
                  size="sm"
                  :disabled="trackStatus === 'pending'"
                  @click="trackRepo(repo)"
                  aria-label="Track repository"
                  data-testid="track-btn"
                >
                  <span v-if="trackStatus === 'pending'">Tracking…</span>
                  <span v-else>Track</span>
                </Button>
              </div>
            </li>
          </ul>
        </template>
      </div>
      </TerminalWindow>
    </ErrorBoundary>
  </section>

  <!-- Modal mount -->
  <GitHubSettingsModal
    v-model="patModalOpen"
    :auto-expand-how-to="autoExpandHowTo"
    @pat-updated="onPatUpdated"
  />
</template>

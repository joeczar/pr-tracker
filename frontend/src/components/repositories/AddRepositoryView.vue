<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount as _onBeforeUnmount, computed } from 'vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'

import Command from '../ui/command/Command.vue'
import CommandInput from '../ui/command/CommandInput.vue'
import CommandList from '../ui/command/CommandList.vue'
import CommandEmpty from '../ui/command/CommandEmpty.vue'
import CommandGroup from '../ui/command/CommandGroup.vue'
import CommandItem from '../ui/command/CommandItem.vue'

import type { GitHubRepo as RepositoryOption, GitHubPull as GitHubPullRequest } from '@/lib/api/github'
import { githubApi } from '@/lib/api/github'
import { repositoriesApi } from '@/lib/api/repositories'

const emit = defineEmits<{
  (e: 'submit', payload: { owner: string; name: string; url?: string; prNumber?: number }): void
  (e: 'cancel'): void
}>()

type Step = 'repo' | 'pr'
const step = ref<Step>('repo')

/**
 * Scope toggle and organizations
 */
const scope = ref<'personal' | 'org'>('personal')
const orgs = ref<{ login: string; id: number; avatar_url?: string }[]>([])
const orgsError = ref<string | null>(null)
const loadingOrgs = ref(false)
const selectedOrg = ref<string | null>(null)

/**
 * Load organizations helper (idempotent)
 */
async function loadOrgsIfNeeded(force = false) {
  if (loadingOrgs.value) return
  if (!force && orgs.value.length > 0) return
  try {
    loadingOrgs.value = true
    orgsError.value = null
    console.debug('[repo-picker] fetching organizations…')
    const res = await githubApi.listOrganizations()
    orgs.value = res.organizations ?? []
    console.debug('[repo-picker] organizations loaded:', orgs.value.length)
  } catch (e: any) {
    console.error('Failed to load organizations', e)
    orgsError.value = e?.message ?? 'Failed to load organizations'
  } finally {
    loadingOrgs.value = false
  }
}

/**
 * Repository list (paged) + filtering + states
 */
const repos = ref<RepositoryOption[]>([])
const repoPage = ref(1)
const perPage = 50
const hasMoreRepos = ref(true)
const loadingRepos = ref(false)
const repoSearch = ref('')
const reposError = ref<string | null>(null)

const filteredRepos = computed(() => {
  const q = repoSearch.value.trim().toLowerCase()
  if (!q) return repos.value
  return repos.value.filter((r: RepositoryOption) =>
    r.full_name.toLowerCase().includes(q) ||
    (r.description ?? '').toLowerCase().includes(q)
  )
})

async function loadRepos(reset = false) {
  if (loadingRepos.value) return
  loadingRepos.value = true
  reposError.value = null
  try {
    if (reset) {
      repoPage.value = 1
      repos.value = []
      hasMoreRepos.value = true
    }
    let items: RepositoryOption[] = []
    if (scope.value === 'org' && selectedOrg.value) {
      const resp = await githubApi.listOrgRepos(selectedOrg.value, {
        page: repoPage.value,
        per_page: perPage,
        sort: 'updated',
        direction: 'desc',
        type: 'all',
      })
      items = Array.isArray(resp.repositories) ? resp.repositories : []
    } else {
      const resp = await githubApi.listAccessibleRepositories({
        page: repoPage.value,
        per_page: perPage,
        sort: 'updated',
        affiliation: 'owner,collaborator,organization_member',
        visibility: 'all',
      })
      items = Array.isArray(resp.repositories) ? resp.repositories : []
    }
    if (items.length < perPage) {
      hasMoreRepos.value = false
    }
    repos.value = [...repos.value, ...items]
    repoPage.value += 1
  } catch (e: any) {
    console.error('Failed to load repositories', e)
    // Normalize error for user-friendly messaging
    const status = e?.status ?? e?.response?.status
    const payloadMsg = e?.payload?.message ?? e?.response?.data?.message
    if (status === 403 && /rate limit/i.test(String(payloadMsg ?? e?.message ?? ''))) {
      reposError.value = 'GitHub rate limit reached. Please wait a minute and try again.'
    } else if (status === 401) {
      reposError.value = 'Authentication required. Please re-login and try again.'
    } else {
      reposError.value = payloadMsg ?? e?.message ?? 'Failed to load repositories'
    }
    hasMoreRepos.value = false
  } finally {
    loadingRepos.value = false
  }
}

/**
 * Selected repository
 */
const selectedRepo = ref<RepositoryOption | null>(null)

/**
 * Pull requests for the selected repo + states
 */
const pulls = ref<GitHubPullRequest[]>([])
const pullsState = ref<'open' | 'all'>('open')
const loadingPulls = ref(false)
const pullsPage = ref(1)
const pullsPerPage = 50
const hasMorePulls = ref(true)
const pullSearch = ref('')
const pullsError = ref<string | null>(null)

const filteredPulls = computed(() => {
  const q = pullSearch.value.trim().toLowerCase()
  if (!q) return pulls.value
  return pulls.value.filter((p: GitHubPullRequest) =>
    p.title.toLowerCase().includes(q) ||
    String(p.number).includes(q)
  )
})

async function loadPulls(reset = false) {
  if (!selectedRepo.value) return
  if (loadingPulls.value) return
  loadingPulls.value = true
  pullsError.value = null
  try {
    if (reset) {
      pullsPage.value = 1
      pulls.value = []
      hasMorePulls.value = true
    }
    const batch = await githubApi.listPulls(
      selectedRepo.value.owner.login,
      selectedRepo.value.name,
      { state: pullsState.value, page: pullsPage.value, per_page: pullsPerPage }
    )
    if (batch.length < pullsPerPage) {
      hasMorePulls.value = false
    }
    pulls.value = [...pulls.value, ...batch]
    pullsPage.value += 1
  } catch (e: any) {
    console.error('Failed to load pull requests', e)
    // Normalize error for user-friendly messaging
    const status = e?.status ?? e?.response?.status
    const payloadMsg = e?.payload?.message ?? e?.response?.data?.message
    if (status === 403 && /rate limit/i.test(String(payloadMsg ?? e?.message ?? ''))) {
      pullsError.value = 'GitHub rate limit reached. Please wait a minute and try again.'
    } else if (status === 401) {
      pullsError.value = 'Authentication required. Please re-login and try again.'
    } else {
      pullsError.value = payloadMsg ?? e?.message ?? 'Failed to load pull requests'
    }
    hasMorePulls.value = false
  } finally {
    loadingPulls.value = false
  }
}

/**
 * Selected pull request
 */
const selectedPull = ref<GitHubPullRequest | null>(null)

/**
 * Track if the selected repo is already tracked locally, and capture add errors
 */
const trackedRepoNames = ref<Set<string>>(new Set())
const isTrackedRepo = ref(false)
const addError = ref<string | null>(null)

async function preloadTrackedRepos() {
  try {
    const repos = await repositoriesApi.list().catch(() => [])
    const names = new Set<string>()
    for (const r of repos) {
      const fullName = (r as any).full_name || (r.owner && r.name ? `${(r as any).owner}/${(r as any).name}` : null)
      if (fullName) names.add(fullName)
    }
    trackedRepoNames.value = names
  } catch {
    trackedRepoNames.value = new Set()
  }
}

watch(selectedRepo, (repo) => {
  addError.value = null
  if (!repo) {
    isTrackedRepo.value = false
    return
  }
  const fullName = repo.full_name
  isTrackedRepo.value = trackedRepoNames.value.has(fullName)
})

/**
 * Step navigation
 */
function goNext() {
  if (step.value === 'repo' && selectedRepo.value) {
    step.value = 'pr'
    void loadPulls(true)
  }
}

function goBack() {
  if (step.value === 'pr') {
    step.value = 'repo'
    selectedPull.value = null
  }
}

/**
 * Submit selection
 */
async function submit() {
  if (!selectedRepo.value) return
  addError.value = null
  const owner = selectedRepo.value.owner.login
  const name = selectedRepo.value.name
  const url = `https://github.com/${owner}/${name}`
  const prNumber = selectedPull.value?.number

  // If already tracked, prevent submit and show inline message
  if (isTrackedRepo.value) {
    addError.value = 'Repository is already tracked.'
    return
  }

  try {
    emit('submit', { owner, name, url, prNumber })
    // On success, optimistically mark as tracked so button disables if user returns
    trackedRepoNames.value.add(`${owner}/${name}`)
    isTrackedRepo.value = true
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status
    const msg = e?.payload?.error ?? e?.response?.data?.error ?? e?.message
    if (status === 409 || /already.*tracked/i.test(String(msg ?? ''))) {
      addError.value = msg || 'Repository is already tracked.'
      isTrackedRepo.value = true
    } else {
      addError.value = msg || 'Failed to add repository.'
    }
  }
}

/**
 * Cancel and go back to repository list
 */
function cancel() {
  emit('cancel')
}

/**
 * Initialize on mount
 */
onMounted(async () => {
  step.value = 'repo'
  selectedRepo.value = null
  selectedPull.value = null
  scope.value = 'personal'
  selectedOrg.value = null
  orgs.value = []
  orgsError.value = null
  repoSearch.value = ''
  pullSearch.value = ''
  pullsState.value = 'open'
  reposError.value = null
  pullsError.value = null
  addError.value = null
  await preloadTrackedRepos()
  void loadRepos(true)
  // Preload orgs (best effort, safe if unauth or missing scope; also logged)
  void loadOrgsIfNeeded(true)
})

watch(pullsState, () => {
  if (step.value === 'pr') {
    void loadPulls(true)
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="text-xs font-mono text-slate-400">
        Step {{ step === 'repo' ? 1 : 2 }} of 2 — {{ step === 'repo' ? 'Select Repository' : 'Select Pull Request' }}
      </div>
      <TerminalButton variant="ghost" @click="cancel">
        ← Back to Repositories
      </TerminalButton>
    </div>

    <!-- Error banners -->
    <div v-if="reposError && step === 'repo'" class="border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono px-3 py-2 rounded">
      {{ reposError }}
    </div>
    <div v-if="pullsError && step === 'pr'" class="border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono px-3 py-2 rounded">
      {{ pullsError }}
    </div>
    <div v-if="addError && step === 'pr'" class="border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono px-3 py-2 rounded">
      {{ addError }}
    </div>

    <!-- Step: Repository selection -->
    <div v-if="step === 'repo'" class="space-y-4">
      <!-- Scope toggle + org selector -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs font-mono" role="group" aria-label="Repository scope">
          <span class="text-slate-400">Scope:</span>
          <button
            class="px-2 py-1 rounded border border-cyber-border"
            :class="scope === 'personal' ? 'bg-cyber-accent/20 text-cyber-accent' : 'text-slate-300'"
            @click="() => { if (scope !== 'personal') { scope = 'personal'; selectedOrg = null; void loadRepos(true); } }"
            type="button"
            aria-pressed="true"
            aria-label="Personal scope"
          >
            Personal
          </button>
          <button
            class="px-2 py-1 rounded border border-cyber-border"
            :class="scope === 'org' ? 'bg-cyber-accent/20 text-cyber-accent' : 'text-slate-300'"
            @click="() => { 
              if (scope !== 'org') { 
                scope = 'org'; 
                void loadOrgsIfNeeded(true); 
                void loadRepos(true); 
              } 
            }"
            type="button"
            :aria-pressed="scope === 'org'"
            aria-label="Organization scope"
          >
            Organization
          </button>
        </div>

        <div v-if="scope === 'org'" class="min-w-[240px]" aria-label="Organization selector">
          <Command>
            <CommandInput
              id="org-search"
              :placeholder="loadingOrgs ? 'Loading organizations…' : 'Filter organizations…'"
              class="font-mono"
              aria-label="Search organizations"
            />
            <CommandList>
              <CommandEmpty class="text-sm font-mono text-slate-400 p-3">
                <template v-if="loadingOrgs">Loading organizations…</template>
                <template v-else>No organizations</template>
              </CommandEmpty>
              <CommandGroup heading="Organizations">
                <template v-if="orgsError">
                  <div class="text-xs text-amber-400 px-3 py-2">Failed to load orgs; try again later.</div>
                </template>
                <CommandItem
                  v-for="org in orgs"
                  :key="org.id"
                  :value="org.login"
                  @select="() => { selectedOrg = org.login; void loadRepos(true); }"
                  :aria-selected="selectedOrg === org.login"
                  :class="selectedOrg === org.login ? 'bg-cyber-accent/20 border-cyber-accent/50 border' : ''"
                >
                  <div class="flex items-center justify-between w-full">
                    <span class="text-sm font-mono" :class="selectedOrg === org.login ? 'text-cyber-accent font-semibold' : 'text-slate-200'">{{ org.login }}</span>
                    <div v-if="selectedOrg === org.login" class="ml-3 text-cyber-accent">
                      ✓
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
          <div class="mt-1 text-[11px] text-slate-400 font-mono" v-if="selectedOrg">
            Org: {{ selectedOrg }}
          </div>
        </div>
      </div>

      <Command>
        <CommandInput
          id="repo-search"
          v-model="repoSearch"
          placeholder="Search repositories…"
          class="font-mono"
        />
        <CommandList class="max-h-96">
          <CommandEmpty class="text-sm font-mono text-slate-400 p-3">
            <template v-if="loadingRepos">Loading repositories…</template>
            <template v-else>No repositories found.</template>
          </CommandEmpty>
          <CommandGroup heading="Repositories">
            <!-- Skeletons -->
            <template v-if="loadingRepos && !repos.length">
              <div v-for="i in 6" :key="i" class="px-3 py-2">
                <div class="h-4 w-2/3 bg-slate-700/40 rounded animate-pulse mb-1"></div>
                <div class="h-3 w-1/2 bg-slate-700/30 rounded animate-pulse"></div>
              </div>
            </template>
            <!-- Results -->
            <template v-else>
              <CommandItem
                v-for="repo in filteredRepos"
                :key="repo.id"
                :value="repo.full_name"
                @select="selectedRepo = repo"
                :aria-selected="selectedRepo?.id === repo.id"
                :class="selectedRepo?.id === repo.id ? 'bg-cyber-accent/20 border-cyber-accent/50 border' : ''"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex flex-col gap-0.5 flex-1">
                    <div class="text-sm font-mono" :class="selectedRepo?.id === repo.id ? 'text-cyber-accent font-semibold' : 'text-slate-200'">
                      {{ repo.full_name }}
                      <span v-if="repo.private" class="ml-2 text-xs text-amber-400">private</span>
                    </div>
                    <div v-if="repo.description" class="text-xs text-slate-400">
                      {{ repo.description }}
                    </div>
                  </div>
                  <div v-if="selectedRepo?.id === repo.id" class="ml-3 text-cyber-accent">
                    ✓
                  </div>
                </div>
              </CommandItem>
            </template>
          </CommandGroup>
        </CommandList>
      </Command>

      <!-- Bottom action bar for repo step -->
      <div class="flex items-center justify-between pt-4 border-t border-cyber-border">
        <div class="text-xs font-mono text-slate-400">
          {{ filteredRepos.length }} shown
        </div>
        <div class="flex items-center gap-2">
          <TerminalButton
            variant="secondary"
            :disabled="loadingRepos || !hasMoreRepos"
            @click="loadRepos(false)"
          >
            {{ loadingRepos ? 'Loading…' : (hasMoreRepos ? 'Load more' : 'No more') }}
          </TerminalButton>
          <TerminalButton
            variant="primary"
            :disabled="!selectedRepo"
            @click="goNext"
          >
            Next
          </TerminalButton>
        </div>
      </div>
    </div>

    <!-- Step: Pull Request selection -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-mono text-slate-300">
          Repository: <span class="text-slate-100">{{ selectedRepo?.full_name }}</span>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-mono text-slate-400">Show</label>
          <select
            class="bg-transparent border border-cyber-border text-xs font-mono px-2 py-1 rounded"
            v-model="pullsState"
          >
            <option value="open">Open</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <Command>
        <CommandInput
          id="pr-search"
          v-model="pullSearch"
          placeholder="Search pull requests…"
          class="font-mono"
        />
        <CommandList class="max-h-96">
          <CommandEmpty class="text-sm font-mono text-slate-400 p-3">
            <template v-if="loadingPulls">Loading pull requests…</template>
            <template v-else>No pull requests found.</template>
          </CommandEmpty>
          <CommandGroup heading="Pull Requests">
            <!-- Skeletons -->
            <template v-if="loadingPulls && !pulls.length">
              <div v-for="i in 6" :key="i" class="px-3 py-2">
                <div class="h-4 w-2/3 bg-slate-700/40 rounded animate-pulse mb-1"></div>
                <div class="h-3 w-1/2 bg-slate-700/30 rounded animate-pulse"></div>
              </div>
            </template>
            <!-- Results -->
            <template v-else>
              <CommandItem
                v-for="pr in filteredPulls"
                :key="pr.id"
                :value="String(pr.number)"
                @select="selectedPull = pr"
                :aria-selected="selectedPull?.id === pr.id"
                :class="(selectedPull && selectedPull.id === pr.id) ? 'bg-cyber-accent/20 border-cyber-accent/50 border' : ''"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex flex-col gap-0.5 flex-1">
                    <div class="text-sm font-mono" :class="(selectedPull && selectedPull.id === pr.id) ? 'text-cyber-accent font-semibold' : 'text-slate-200'">
                      #{{ pr.number }} — {{ pr.title }}
                      <span class="ml-2 text-xs" :class="pr.state === 'open' ? 'text-emerald-400' : 'text-slate-400'">
                        {{ pr.state }}
                      </span>
                    </div>
                    <div class="text-xs text-slate-400">
                      {{ pr.user?.login ?? 'unknown' }}
                    </div>
                    <div v-if="selectedPull && selectedPull.id === pr.id" class="mt-2 flex items-center gap-2">
                      <span class="text-[11px] text-cyber-accent font-mono px-1.5 py-0.5 border border-cyber-accent/50 rounded">
                        Selected
                      </span>
                      <button
                        type="button"
                        class="text-[11px] font-mono text-slate-300 hover:text-slate-100 underline decoration-slate-500"
                        :aria-label="`Deselect pull request #${pr.number}`"
                        @click.stop.prevent="selectedPull = null"
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                  <div v-if="selectedPull && selectedPull.id === pr.id" class="ml-3 text-cyber-accent">
                    ✓
                  </div>
                </div>
              </CommandItem>
            </template>
          </CommandGroup>
        </CommandList>
      </Command>

      <!-- Bottom action bar for PR step -->
      <div class="flex items-center justify-between pt-4 border-t border-cyber-border">
        <div class="text-xs font-mono text-slate-400">
          {{ filteredPulls.length }} shown
        </div>
        <div class="flex items-center gap-2">
          <TerminalButton
            variant="secondary"
            :disabled="loadingPulls || !hasMorePulls"
            @click="loadPulls(false)"
          >
            {{ loadingPulls ? 'Loading…' : (hasMorePulls ? 'Load more' : 'No more') }}
          </TerminalButton>
          <div class="flex items-center gap-2">
            <TerminalButton variant="ghost" @click="goBack">Back</TerminalButton>
            <TerminalButton
              variant="primary"
              :disabled="!selectedRepo || isTrackedRepo"
              :title="isTrackedRepo ? 'Repository already tracked' : undefined"
              @click="submit"
            >
              Add
            </TerminalButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

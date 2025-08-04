<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'

import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'

import Command from '../ui/command/Command.vue'
import CommandInput from '../ui/command/CommandInput.vue'
import CommandList from '../ui/command/CommandList.vue'
import CommandEmpty from '../ui/command/CommandEmpty.vue'
import CommandGroup from '../ui/command/CommandGroup.vue'
import CommandItem from '../ui/command/CommandItem.vue'

import type { GitHubRepo as RepositoryOption, GitHubPull as GitHubPullRequest } from '@/lib/api/github'
import { githubApi } from '@/lib/api/github'
import GitHubSettingsModal from '@/components/settings/GitHubSettingsModal.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: { owner: string; name: string; url?: string; prNumber?: number }): void
}>()

const open = ref(props.modelValue)
watch(() => props.modelValue, v => open.value = v)
watch(open, v => emit('update:modelValue', v))

type Step = 'repo' | 'pr'
const step = ref<Step>('repo')

const dialogEl = ref<HTMLElement | null>(null)
const contentEl = ref<HTMLElement | null>(null) // actual DOM element inside DialogContent
const windowMax = ref('60vh')
const bodyMax = ref('calc(60vh - 4rem)')
const headerApprox = 56 // px (terminal header height)
const footerApprox = 72 // px (space for sticky action bar)

function computeCaps() {
  const h = window.innerHeight
  const cap = Math.max(320, Math.floor(h * 0.6)) // 60% of viewport, min 320px
  const capPx = `${cap}px`
  windowMax.value = capPx
  // Reserve explicit header/footer space to avoid body overlapping footer
  bodyMax.value = `calc(${capPx} - ${headerApprox + footerApprox}px)`
}

/**
 * Scope toggle and organizations
 */
const scope = ref<'personal' | 'org'>('personal')
const orgs = ref<{ login: string; id: number; avatar_url?: string }[]>([])
const orgsError = ref<string | null>(null)
const loadingOrgs = ref(false)
const selectedOrg = ref<string | null>(null)
const showGitHubSettings = ref(false)

/**
 * Load organizations helper (idempotent)
 */
async function loadOrgsIfNeeded(force = false) {
  if (loadingOrgs.value) return
  if (!force && orgs.value.length > 0) return
  try {
    loadingOrgs.value = true
    orgsError.value = null
    console.debug('[repo-picker] fetching organizations via OAuth…')

    // Use OAuth API to get organizations you belong to
    const response = await githubApi.listOrganizations()
    orgs.value = response.organizations.map(org => ({
      login: org.login,
      id: org.id,
      avatar_url: org.avatar_url
    }))

    console.debug('[repo-picker] organizations loaded (via OAuth):', orgs.value.length)
  } catch (e: any) {
    console.error('Failed to load organizations via OAuth', e)
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
    const ownerLogin = selectedRepo.value.owner.login
    const batch = await githubApi.listPulls(
      ownerLogin,
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
 * Keyboard handling (preserve Esc behavior)
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    close()
  }
}

function close() {
  open.value = false
}

/**
 * Handle PAT updates from settings modal
 */
function onPATUpdated() {
  // Reload organizations after PAT is updated
  void loadOrgsIfNeeded(true)
  void loadRepos(true)
}

/**
 * Step navigation
 */
function goNext() {
  if (step.value === 'repo' && selectedRepo.value) {
    step.value = 'pr'
    void loadPulls(true)
    requestAnimationFrame(() => {
      const root = contentEl.value instanceof HTMLElement ? contentEl.value : (dialogEl.value as HTMLElement | null)
      const el = root?.querySelector<HTMLInputElement>('#pr-search')
      el?.focus()
    })
  }
}

function goBack() {
  if (step.value === 'pr') {
    step.value = 'repo'
    selectedPull.value = null
    requestAnimationFrame(() => {
      const root = contentEl.value instanceof HTMLElement ? contentEl.value : (dialogEl.value as HTMLElement | null)
      const el = root?.querySelector<HTMLInputElement>('#repo-search')
      el?.focus()
    })
    // removed duplicate focus block to fix stray v-else and template structure issues
  }
}

/**
 * Submit selection
 */
function submit() {
  if (!selectedRepo.value) return
  const owner = selectedRepo.value.owner.login
  const name = selectedRepo.value.name
  const url = `https://github.com/${owner}/${name}`
  const prNumber = selectedPull.value?.number

  emit('submit', { owner, name, url, prNumber })
  close()
}

/**
 * Open watcher to prime lists and autofocus
 */
watch(open, v => {
  if (v) {
    computeCaps()
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
    // Load orgs and repos
    void loadOrgsIfNeeded(true)
    void loadRepos(true)
    requestAnimationFrame(() => {
      const root = contentEl.value instanceof HTMLElement ? contentEl.value : (dialogEl.value as HTMLElement | null)
      const el = root?.querySelector<HTMLInputElement>('#repo-search')
      el?.focus()
    })
  }
}, { immediate: true })

watch(pullsState, () => {
  if (step.value === 'pr') {
    void loadPulls(true)
  }
})

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  computeCaps()
  window.addEventListener('resize', computeCaps)
  // Preload orgs (best effort)
  void loadOrgsIfNeeded(true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', computeCaps)
})
</script>

<template>
  <Dialog :open="open" @update:open="val => open = val">
    <!-- Hard-cap height to stay well below viewport; remove padding so inner layout controls scroll -->
    <!-- Bind runtime maxHeight via style on an inner div to avoid passing unknown attrs to DialogContent -->
    <DialogContent ref="dialogEl" class="max-w-[720px] overflow-hidden p-0">
      <div ref="contentEl" :style="{ maxHeight: windowMax }">
        <DialogHeader class="p-0">
        <DialogTitle id="add-repo-title" class="sr-only">Add Repository</DialogTitle>
        <TerminalWindow class="shadow-cyber h-full flex flex-col" :style="{ maxHeight: 'inherit' }">
          <template #title>
            <TerminalHeader>
              <template #title>
                <TerminalTitle command="add-repository" />
              </template>
            </TerminalHeader>
          </template>
          <!-- Body scrolls; extra bottom padding so fixed bar never overlaps last items -->
          <div class="p-4 pb-28 space-y-4 overflow-y-auto flex-1 min-h-0" :style="{ maxHeight: bodyMax }">
            <div class="text-xs font-mono text-slate-400">
              Step {{ step === 'repo' ? 1 : 2 }} of 2 — {{ step === 'repo' ? 'Select Repository' : 'Select Pull Request' }}
            </div>

            <!-- Error banners -->
            <div v-if="reposError && step === 'repo'" class="border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono px-3 py-2 rounded">
              {{ reposError }}
            </div>
            <div v-if="pullsError && step === 'pr'" class="border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-mono px-3 py-2 rounded">
              {{ pullsError }}
            </div>

            <!-- Step: Repository selection -->
            <div v-if="step === 'repo'" class="space-y-3">
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
                        <template v-else>
                          <div class="space-y-2">
                            <div>No organizations</div>
                            <div class="text-xs text-slate-500">
                              If your orgs are private, add a Personal Access Token with read:org.
                              <button
                                @click="showGitHubSettings = true"
                                class="text-cyber-accent hover:underline focus:underline ml-1"
                                type="button"
                              >
                                Add PAT
                              </button>
                            </div>
                          </div>
                        </template>
                      </CommandEmpty>
                      <div class="flex items-center justify-between px-2 pb-1 mb-2">
                        <span class="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Organizations</span>
                        <div class="flex items-center gap-2">
                          <button
                            @click="() => { selectedOrg = null; orgsError = null; void loadOrgsIfNeeded(true) }"
                            class="text-[11px] text-slate-400 hover:text-slate-200 underline"
                            type="button"
                            title="Refresh organizations"
                          >
                            Refresh
                          </button>
                          <button
                            @click="showGitHubSettings = true"
                            class="text-xs text-cyber-accent hover:text-cyan-300 underline"
                            type="button"
                            title="Configure GitHub settings"
                          >
                            Settings
                          </button>
                        </div>
                      </div>
                      <CommandGroup>
                        <template v-if="orgsError">
                          <div class="text-xs text-amber-400 px-3 py-2">Failed to load orgs; try again later.</div>
                        </template>
                        <CommandItem
                          v-for="org in orgs"
                          :key="org.id"
                          :value="org.login"
                          @select="() => { selectedOrg = org.login; void loadRepos(true); }"
                          :aria-selected="selectedOrg === org.login"
                        >
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-mono text-slate-200">{{ org.login }}</span>
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
                <CommandList>
                  <CommandEmpty class="text-sm font-mono text-slate-400 p-3">
                    <template v-if="loadingRepos">Loading repositories…</template>
                    <template v-else>No repositories found.</template>
                  </CommandEmpty>
                  <CommandGroup heading="Repositories">
                    <!-- Empty state for organizations -->
                    <template v-if="scope === 'org' && !selectedOrg && !loadingOrgs && orgs.length === 0">
                      <div class="px-3 py-3 space-y-2 border border-amber-500/30 bg-amber-500/5 rounded">
                        <div class="text-xs text-amber-300">
                          No organizations found.
                        </div>
                        <div class="text-xs text-slate-400 space-y-1">
                          <p>You may not belong to any GitHub organizations, or they may be private.</p>
                          <p>
                            If organizations are private, add a
                            <button 
                              @click="showGitHubSettings = true"
                              class="text-cyber-accent hover:underline focus:underline"
                              type="button"
                            >
                              Personal Access Token
                            </button>
                            with read:org to see them.
                          </p>
                          <div>
                            <button
                              @click="() => { orgsError = null; void loadOrgsIfNeeded(true) }"
                              type="button"
                              class="text-xs text-slate-300 hover:underline"
                            >
                              Try loading organizations again
                            </button>
                          </div>
                        </div>
                      </div>
                    </template>
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
                      >
                        <div class="flex flex-col gap-0.5">
                          <div class="text-sm font-mono text-slate-200">
                            {{ repo.full_name }}
                            <span v-if="repo.private" class="ml-2 text-xs text-amber-400">private</span>
                          </div>
                          <div v-if="repo.description" class="text-xs text-slate-400">
                            {{ repo.description }}
                          </div>
                        </div>
                      </CommandItem>
                    </template>
                  </CommandGroup>
                </CommandList>
              </Command>

              <!-- Docked fixed bottom action bar for repo step (inside dialog bounds using sticky) -->
              <div class="sticky bottom-0 z-50 -mx-4 px-4 py-3 bg-black/90 supports-[backdrop-filter]:bg-black/50 backdrop-blur border-t border-cyber-border">
                <div class="flex items-center justify-between">
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
            </div>

            <!-- Step: Pull Request selection -->
            <div v-else class="space-y-3">
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
                <CommandList>
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
                      >
                        <div class="flex flex-col gap-0.5">
                          <div class="text-sm font-mono text-slate-200">
                            #{{ pr.number }} — {{ pr.title }}
                            <span class="ml-2 text-xs" :class="pr.state === 'open' ? 'text-emerald-400' : 'text-slate-400'">
                              {{ pr.state }}
                            </span>
                          </div>
                          <div class="text-xs text-slate-400">
                            {{ pr.user?.login ?? 'unknown' }}
                          </div>
                        </div>
                      </CommandItem>
                    </template>
                  </CommandGroup>
                </CommandList>
              </Command>

              <!-- Docked fixed bottom action bar for PR step (inside dialog bounds using sticky) -->
              <div class="sticky bottom-0 z-50 -mx-4 px-4 py-3 bg-black/90 supports-[backdrop-filter]:bg-black/50 backdrop-blur border-t border-cyber-border">
                <div class="flex items-center justify-between">
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
                      <TerminalButton variant="primary" :disabled="!selectedRepo" @click="submit">
                        Add
                      </TerminalButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remove footer; sticky bars above handle actions -->
            <DialogFooter class="hidden"></DialogFooter>
          </div>
        </TerminalWindow>
        </DialogHeader>
      </div>
    </DialogContent>
    
    <!-- GitHub Settings Modal -->
    <GitHubSettingsModal 
      v-model="showGitHubSettings" 
      @pat-updated="onPATUpdated"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import { Command, CommandInput } from '@/components/ui/command'
import Select from '@/components/ui/select/Select.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'
import Fuse from 'fuse.js'
import { pullRequestsApi } from '@/lib/api/pullRequests'
import { onMounted, watchEffect } from 'vue'

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
  repoId: number
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
  (e: 'request:updateState', next: 'open' | 'closed' | 'merged' | 'all'): void
}>()

const selectable = computed(() => props.selectable ?? true)
const hasSelection = computed(() => (props.selectedNumbers?.length ?? 0) > 0)

const search = ref('')
const debouncedSearch = ref('')
const selectedAuthors = ref<string[]>([])
const q = computed(() => debouncedSearch.value.trim().toLowerCase())

// debounce search for smoother UX
let debounceT: number | undefined
watch(search, (v) => {
  if (debounceT) window.clearTimeout(debounceT)
  debounceT = window.setTimeout(() => {
    debouncedSearch.value = v
  }, 250)
}, { immediate: true })
const authors = ref<string[]>([])
const authorsLoading = ref(false)
const authorsError = ref<string | null>(null)

async function fetchAuthors() {
  if (!props.repoId) return
  authorsLoading.value = true
  authorsError.value = null
  try {
    const { authors: list } = await pullRequestsApi.authorsByRepo(
      props.repoId,
      props.stateFilter === 'all' ? undefined : props.stateFilter
    )
    authors.value = list
    // Ensure selected author still valid after refresh
    if (selectedAuthors.value.length && !authors.value.includes(selectedAuthors.value[0])) {
      selectedAuthors.value = []
    }
  } catch (e: any) {
    authorsError.value = e?.message || 'Failed to load authors'
  } finally {
    authorsLoading.value = false
  }
}

onMounted(fetchAuthors)
watch(() => props.stateFilter, () => { fetchAuthors() })
const filtered = computed(() => {
  let base = props.prs
  if (selectedAuthors.value.length) {
    const set = new Set(selectedAuthors.value)
    base = base.filter(p => p.author_login && set.has(p.author_login))
  }
  if (!q.value) return base
  const fuse = new Fuse(base, {
    includeScore: false,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'author_login', weight: 0.25 },
      { name: 'branch', weight: 0.15 },
      { name: 'number', weight: 0.1 }
    ]
  })
  return fuse.search(q.value).map((r: any) => r.item)
})

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
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Search -->
      <div class="min-w-[260px] flex-1">
        <label for="pr-search" class="sr-only">Search PRs</label>
        <Command class="w-full rounded border border-cyber-border bg-cyber-surface/60">
          <div class="relative">
            <svg aria-hidden="true" class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-muted" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.9 14.32a8 8 0 1 1 1.414-1.414l3.387 3.387a1 1 0 0 1-1.414 1.414l-3.387-3.387ZM14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" clip-rule="evenodd" />
            </svg>
            <CommandInput
              id="pr-search"
              v-model="search"
              placeholder="Search title, branch, author or #number"
              aria-label="Search pull requests"
              class="pl-8"
            />
            <button
              v-if="search"
              type="button"
              aria-label="Clear search"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-foreground"
              @click="search = ''"
            >
              ×
            </button>
          </div>
        </Command>
      </div>

      <!-- State toggle: Open / Closed / Merged / All -->
      <div class="shrink-0">
        <div class="flex items-center gap-1" role="group" aria-label="Filter by state">
          <Button
            size="sm"
            :variant="stateFilter === 'open' ? 'default' : 'ghost'"
            aria-pressed="stateFilter === 'open'"
            @click="$emit('request:updateState', 'open')"
          >
            Open
          </Button>
          <Button
            size="sm"
            :variant="stateFilter === 'closed' ? 'default' : 'ghost'"
            aria-pressed="stateFilter === 'closed'"
            @click="$emit('request:updateState', 'closed')"
          >
            Closed
          </Button>
          <Button
            size="sm"
            :variant="stateFilter === 'merged' ? 'default' : 'ghost'"
            aria-pressed="stateFilter === 'merged'"
            @click="$emit('request:updateState', 'merged')"
          >
            Merged
          </Button>
          <Button
            size="sm"
            :variant="stateFilter === 'all' ? 'default' : 'ghost'"
            aria-pressed="stateFilter === 'all'"
            @click="$emit('request:updateState', 'all')"
          >
            All
          </Button>
        </div>
      </div>

      <!-- Author filter -->
      <div class="min-w-[220px] flex-1">
        <label for="author-filter" class="sr-only">Filter by author</label>
        <Select
          :disabled="authorsLoading || (!!authorsError && !authors.length)"
          :model-value="selectedAuthors[0] ?? '__any__'"
          @update:modelValue="(v: unknown) => {
            const s = (v ?? '') as string
            selectedAuthors = !s || s === '__any__' ? [] : [s]
          }"
        >
          <SelectTrigger id="author-filter" class="h-8">
            <div class="flex items-center gap-2 w-full">
              <span class="truncate" v-if="selectedAuthors.length === 0">Author: Any author</span>
              <span class="truncate" v-else>Author: {{ selectedAuthors[0] }}</span>
              <button
                v-if="selectedAuthors.length"
                type="button"
                aria-label="Clear author filter"
                class="ml-auto text-cyber-muted hover:text-foreground"
                @click.stop="selectedAuthors = []"
              >
                ×
              </button>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Any author</SelectItem>
            <template v-if="authorsLoading">
              <SelectItem value="__loading__" disabled>Loading…</SelectItem>
            </template>
            <template v-else-if="authorsError && !authors.length">
              <SelectItem value="__error__" disabled>Failed to load authors</SelectItem>
            </template>
            <SelectItem v-for="a in authors" :key="a" :value="a">{{ a }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Active filter summary -->
    <div v-if="q || selectedAuthors.length" class="flex items-center gap-2 flex-wrap text-xs">
      <span class="text-cyber-muted">Filters:</span>
      <Badge v-if="q" variant="secondary" class="flex items-center gap-1">
        <span>Search: "{{ debouncedSearch }}"</span>
        <button aria-label="Remove search filter" class="ml-1 -mr-1" @click="search = ''">×</button>
      </Badge>
      <Badge v-if="selectedAuthors.length" variant="secondary" class="flex items-center gap-1">
        <span>Author: {{ selectedAuthors[0] }}</span>
        <button aria-label="Remove author filter" class="ml-1 -mr-1" @click="selectedAuthors = []">×</button>
      </Badge>
      <Button size="xs" variant="ghost" class="ml-1" @click="() => { search = ''; selectedAuthors = [] }">Reset</Button>
    </div>

    <template v-if="loading">
      <div v-for="i in 3" :key="i" class="h-16 rounded border border-dashed border-cyber-border animate-pulse"></div>
    </template>

    <template v-else-if="error">
      <div class="text-sm text-rose-600">Failed to load pull requests: {{ error }}</div>
    </template>

    <template v-else>
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

      <div v-if="!filtered || filtered.length === 0" class="text-xs text-cyber-muted flex items-center gap-2">
        <span>
          No pull requests match
          <template v-if="q"> search "{{ debouncedSearch }}"</template>
          <template v-if="selectedAuthors.length">
            <template v-if="q"> and</template>
            author "{{ selectedAuthors[0] }}"
          </template>.
        </span>
        <Button v-if="q || selectedAuthors.length" size="xs" variant="ghost" @click="() => { search = ''; selectedAuthors = [] }">
          Reset filters
        </Button>
      </div>

      <div
        v-for="pr in filtered"
        :key="pr.id"
        class="rounded border border-cyber-border bg-cyber-surface/60 p-3"
        :class="selectedNumbers.includes(pr.number) ? 'ring-2 ring-cyber-accent' : ''"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Checkbox
              v-if="selectable"
              :checked="selectedNumbers.includes(pr.number)"
              :aria-label="`Select PR #${pr.number}`"
              class="h-4 w-4 rounded-sm data-[state=checked]:bg-[var(--cyber-accent,#ea00d9)] border-cyber-border focus-visible:ring-[var(--cyber-accent,#ea00d9)]"
              @update:checked="(val: boolean) => toggle(pr, val)"
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

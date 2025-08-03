<script setup lang="ts">
import { ref, computed } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import RepositoryCard from '@/components/repositories/RepositoryCard.vue'
import AddRepositoryDialog from '@/components/repositories/AddRepositoryDialog.vue'

const search = ref('')
const showAdd = ref(false)

// Mock repositories until store wiring
const repos = ref([
  {
    owner: 'joeczar',
    name: 'frontend',
    description: 'Frontend Repository',
    stats: { prs: 23, avgCommentsPerPR: 2.1, changeRequestRate: 16, lastSync: '5m' },
    status: 'ok',
    recent: [
      { id: 156, title: 'feat: add dashboard', state: 'merged' as const, comments: 3, updatedAt: '2h ago' },
      { id: 155, title: 'fix: auth redirect', state: 'review' as const, comments: 1, updatedAt: '6h ago' }
    ]
  },
  {
    owner: 'joeczar',
    name: 'backend-api',
    description: 'Backend API',
    stats: { prs: 15, avgCommentsPerPR: 3.2, changeRequestRate: 24, lastSync: '12m' },
    status: 'idle',
    recent: [
      { id: 89, title: 'feat: add auth routes', state: 'open' as const, comments: 2, updatedAt: '1d ago' }
    ]
  },
  {
    owner: 'utils',
    name: 'library',
    description: 'Utility Library',
    stats: { prs: 9, avgCommentsPerPR: 1.4, changeRequestRate: 8, lastSync: '1h' },
    status: 'syncing',
    recent: [
      { id: 23, title: 'feat: add date helpers', state: 'draft' as const, comments: 0, updatedAt: '3d ago' }
    ]
  }
])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return repos.value
  return repos.value.filter(r =>
    `${r.owner}/${r.name}`.toLowerCase().includes(q) ||
    (r.description?.toLowerCase().includes(q))
  )
})

function handleAddSubmit(payload: { owner: string; name: string; url?: string }) {
  // optimistic add with placeholder stats
  repos.value.unshift({
    owner: payload.owner,
    name: payload.name,
    description: 'Newly added repository',
    stats: { prs: 0, avgCommentsPerPR: 0, changeRequestRate: 0, lastSync: '—' },
    status: 'idle',
    recent: []
  })
  showAdd.value = false
}
</script>

<template>
  <section aria-labelledby="repos-title" class="space-y-6">
    <TerminalWindow>
      <template #title>
        <TerminalHeader>
          <template #title>
            <TerminalTitle command="repositories" />
          </template>
          <template #actions>
            <div class="flex items-center gap-2">
              <input
                v-model="search"
                type="text"
                placeholder="Search repos..."
                aria-label="Search repositories"
                class="h-9 w-56 rounded border border-cyber-border bg-black/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyber-accent"
              />
              <TerminalButton size="md" variant="primary" aria-label="Add repository" @click="showAdd = true">
                + Add Repository
              </TerminalButton>
            </div>
          </template>
        </TerminalHeader>
      </template>

      <div class="p-3 space-y-6">
        <header class="flex items-center justify-between">
          <h1 id="repos-title" class="text-xl font-semibold tracking-tight">Repositories</h1>
          <div class="text-xs text-cyber-muted">Skeleton view</div>
        </header>
        <!-- Repo cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <RepositoryCard
            v-for="r in filtered"
            :key="`${r.owner}/${r.name}`"
            :owner="r.owner"
            :name="r.name"
            :description="r.description"
            :stats="r.stats"
            :recent="r.recent"
            :status="r.status as any"
            @view="$router.push({ name: 'repository-detail', params: { id: `${r.owner}/${r.name}` } })"
            @sync="r.status = 'syncing'"
            @remove="repos = repos.filter(x => `${x.owner}/${x.name}` !== `${r.owner}/${r.name}`)"
          />
          <div v-if="filtered.length === 0" class="col-span-full text-sm font-mono text-slate-400">
            No repositories match “{{ search }}”.
          </div>
        </div>
      </div>
    </TerminalWindow>

    <AddRepositoryDialog v-model="showAdd" @submit="handleAddSubmit" />
  </section>
</template>

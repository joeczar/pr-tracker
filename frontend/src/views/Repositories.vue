<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import RepositoryCard from '@/components/repositories/RepositoryCard.vue'
import AddRepositoryDialog from '@/components/repositories/AddRepositoryDialog.vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'
import { useToast } from '@/components/ui/toast'

const search = ref('')
const showAdd = ref(false)
const loading = ref(true)
const showDelete = ref(false)
const toDelete = ref<{ owner: string; name: string } | null>(null)
const { toast } = useToast?.() ?? { toast: (args: any) => console.log('[toast]', args) }

// Simulate initial load; replace with real fetch wiring
setTimeout(() => {
  loading.value = false
}, 600)

// Mock repositories until store wiring
const repos = ref([
  {
    owner: 'joeczar',
    name: 'frontend',
    description: 'Frontend Repository',
    stats: { prs: 23, avgCommentsPerPR: 2.1, changeRequestRate: 16, lastSync: '5m' },
    status: 'ok',
    progress: 100,
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
    progress: 0,
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
    progress: 35,
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
  const id = `${payload.owner}/${payload.name}`
  const exists = repos.value.some(r => `${r.owner}/${r.name}`.toLowerCase() === id.toLowerCase())
  if (exists) {
    toast?.({
      title: 'Add failed',
      description: `Repository ${id} already exists.`,
    })
    return
  }

  repos.value.unshift({
    owner: payload.owner,
    name: payload.name,
    description: 'Newly added repository',
    stats: { prs: 0, avgCommentsPerPR: 0, changeRequestRate: 0, lastSync: '—' },
    status: 'idle',
    progress: 0,
    recent: []
  })
  showAdd.value = false

  toast?.({
    title: 'Repository added',
    description: id
  })
}

function openRepo(r: { owner: string; name: string }) {
  const inst = getCurrentInstance()
  const router = inst?.proxy?.$router as any | undefined
  if (router) {
    router.push({ name: 'repository-detail', params: { id: `${r.owner}/${r.name}` } })
  }
}

function syncRepo(r: { status: string; owner?: string; name?: string; progress?: number }) {
  r.status = 'syncing'
  r.progress = 0
  toast?.({
    title: 'Sync started',
    description: r.owner && r.name ? `${r.owner}/${r.name} is syncing…` : 'Repository sync started.',
  })
  // Simulated progress; replace with real service events
  const step = () => {
    if (r.status !== 'syncing') return
    r.progress = Math.min(100, (r.progress ?? 0) + Math.floor(Math.random() * 20) + 10)
    if ((r.progress ?? 0) >= 100) {
      r.status = 'ok'
      toast?.({
        title: 'Sync completed',
        description: r.owner && r.name ? `${r.owner}/${r.name} is up to date.` : 'Repository sync completed.',
      })
      return
    }
    setTimeout(step, 500 + Math.random() * 700)
  }
  setTimeout(step, 500)
}

function requestDeleteRepo(r: { owner: string; name: string }) {
  toDelete.value = { owner: r.owner, name: r.name }
  showDelete.value = true
}

function confirmDeleteRepo() {
  if (!toDelete.value) return
  const id = `${toDelete.value.owner}/${toDelete.value.name}`
  repos.value = repos.value.filter(x => `${x.owner}/${x.name}` !== id)
  // Some toast implementations use variant enums; fall back to styling via title/description only.
  toast?.({
    title: 'Repository deleted',
    description: id
  })
  toDelete.value = null
  showDelete.value = false
}

function cancelDeleteRepo() {
  if (toDelete.value) {
    toast?.({
      title: 'Deletion canceled',
      description: `${toDelete.value.owner}/${toDelete.value.name}`
    })
  }
  toDelete.value = null
  showDelete.value = false
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
          <div class="text-xs text-cyber-muted">Search and manage repositories</div>
        </header>
        <!-- Repo cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <template v-if="loading">
            <div v-for="i in 6" :key="i" class="space-y-3">
              <Skeleton class="h-40 w-full" />
              <div class="flex items-center gap-2">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-4 w-12" />
              </div>
              <Skeleton class="h-4 w-3/4" />
            </div>
          </template>
          <template v-else>
            <div v-for="r in filtered" :key="`${r.owner}/${r.name}`" class="relative group">
              <!-- Actions dropdown -->
              <div class="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button size="sm" variant="outline" class="h-8 px-2">
                      •••
                      <span class="sr-only">Open actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-40">
                    <DropdownMenuLabel class="text-xs">{{ r.owner }}/{{ r.name }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openRepo(r)">Open</DropdownMenuItem>
                    <DropdownMenuItem @click="syncRepo(r)">Sync Now</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-red-600 dark:text-red-400" @click="requestDeleteRepo(r)">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <RepositoryCard
                :owner="r.owner"
                :name="r.name"
                :description="r.description"
                :stats="r.stats"
                :recent="r.recent"
                :status="r.status as any"
                @view="openRepo(r)"
                @sync="syncRepo(r)"
                @remove="requestDeleteRepo(r)"
              />
            </div>
            <div v-if="filtered.length === 0" class="col-span-full text-sm font-mono text-slate-400">
              No repositories match “{{ search }}”.
            </div>
          </template>
        </div>
      </div>
    </TerminalWindow>

    <AddRepositoryDialog v-model="showAdd" @submit="handleAddSubmit" />

    <!-- Delete confirmation dialog -->
    <Dialog :open="showDelete" @update:open="val => showDelete = val">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete repository</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently remove
            <span class="font-mono">{{ toDelete ? `${toDelete.owner}/${toDelete.name}` : '' }}</span>
            from this list.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <TerminalButton variant="ghost" @click="cancelDeleteRepo">Cancel</TerminalButton>
          </DialogClose>
          <!-- Use a supported variant and add destructive styling via classes -->
          <TerminalButton variant="primary" class="bg-red-600 hover:bg-red-700 text-white" @click="confirmDeleteRepo">
            Delete
          </TerminalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

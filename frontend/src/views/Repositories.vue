<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
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
import { repositoriesApi, type Repository } from '@/lib/api/repositories'
import { qk } from '@/lib/api/queryKeys'

const search = ref('')
const showAdd = ref(false)
const showDelete = ref(false)
const toDelete = ref<{ id?: number; owner: string; name: string } | null>(null)
const { toast } = useToast?.() ?? { toast: (args: any) => console.log('[toast]', args) }

const qc = useQueryClient()

// Query: repositories list
const { data, isLoading, isError, error } = useQuery({
  queryKey: qk.repositories.list(),
  queryFn: () => repositoriesApi.list(),
  staleTime: 30_000,
  retry: (failureCount, err: any) => {
    // avoid retrying on 401
    if (err?.status === 401) return false
    return failureCount < 2
  },
})

// Mutations
const createRepo = useMutation({
  mutationFn: (input: { owner: string; name: string }) => repositoriesApi.create(input),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: qk.repositories.list() })
    showAdd.value = false
    toast?.({ title: 'Repository added' })
  },
  onError: (e: any) => {
    const msg = e?.payload?.message || e?.message || 'Failed to add repository'
    toast?.({ title: 'Add failed', description: msg })
  },
})

const deleteRepo = useMutation({
  mutationFn: (id: number) => repositoriesApi.remove(id),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: qk.repositories.list() })
    toast?.({ title: 'Repository deleted' })
    toDelete.value = null
    showDelete.value = false
  },
  onError: (e: any) => {
    const msg = e?.payload?.message || e?.message || 'Failed to delete repository'
    toast?.({ title: 'Delete failed', description: msg })
  },
})

const repos = computed<Repository[]>(() => data?.value ?? [])

const filtered = computed(() => {
  const list = repos.value
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(r =>
    `${r.owner}/${r.name}`.toLowerCase().includes(q)
  )
})

function handleAddSubmit(payload: { owner: string; name: string; url?: string }) {
  createRepo.mutate({ owner: payload.owner, name: payload.name })
}

function openRepo(r: { owner: string; name: string }) {
  const inst = getCurrentInstance()
  const router = inst?.proxy?.$router as any | undefined
  if (router) {
    // Note: backend repository detail route expects numeric id; here we navigate by owner/name string as placeholder
    router.push({ name: 'repository-detail', params: { id: `${r.owner}/${r.name}` } })
  }
}

function syncRepo(_r: { owner?: string; name?: string }) {
  // Placeholder; will be wired in RepositoryDetail via pullRequestsApi.syncRepo
  toast?.({
    title: 'Sync queued',
    description: _r.owner && _r.name ? `${_r.owner}/${_r.name}` : 'Repository sync requested.',
  })
}

function requestDeleteRepo(r: Repository) {
  toDelete.value = { id: r.id, owner: r.owner, name: r.name }
  showDelete.value = true
}

function confirmDeleteRepo() {
  if (!toDelete.value?.id) return
  deleteRepo.mutate(toDelete.value.id)
}

function cancelDeleteRepo() {
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
          <template v-if="isLoading">
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
            <div v-if="isError" class="col-span-full text-sm font-mono text-red-600">
              Failed to load repositories: {{ (error as any)?.message || 'Unknown error' }}
            </div>
            <div v-for="r in filtered" :key="r.id ?? `${r.owner}/${r.name}`" class="relative group">
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
                    <DropdownMenuItem class="text-red-600 dark:text-red-400" @click="requestDeleteRepo(r as any)">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <RepositoryCard
                :owner="r.owner"
                :name="r.name"
                :description="(r as any).description"
                :stats="(r as any).stats"
                :recent="(r as any).recent"
                :status="'ok'"
                @view="openRepo(r)"
                @sync="syncRepo(r)"
                @remove="requestDeleteRepo(r as any)"
              />
            </div>
            <div v-if="filtered.length === 0" class="col-span-full text-sm font-mono text-slate-400">
              No repositories match “{{ search }}”.
            </div>
          </template>
        </div>
      </div>
    </TerminalWindow>

    <AddRepositoryDialog v-model="showAdd" @submit="handleAddSubmit" :loading="createRepo.isPending" />

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
          <TerminalButton
            :disabled="deleteRepo.isPending.value"
            variant="primary"
            class="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            @click="confirmDeleteRepo"
          >
            <span v-if="deleteRepo.isPending">Deleting…</span>
            <span v-else>Delete</span>
          </TerminalButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

<template>
  <section aria-labelledby="repo-title" class="space-y-6 content-grid">
    <!-- Loading State -->
    <Card v-if="loading" class="max-w-md mx-auto glass-panel card-cyber">
      <CardContent class="p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center ring-neon">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Loading">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-foreground mb-2">Loading Repository</h3>
        <p class="text-muted-foreground font-mono text-sm">
          Analyzing repository {{ repositoryId }}...
        </p>
      </CardContent>
    </Card>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive" class="glass-panel">
      <AlertTitle>Repository Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Repository Content -->
    <div v-else-if="repository" class="space-y-6">
      <!-- Repository Header -->
      <Card class="card-cyber glass-panel border-primary/30">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="inline-flex size-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
              <div>
                <CardTitle id="repo-title" class="neon text-xl">{{ repository.full_name }}</CardTitle>
                <CardDescription class="font-mono text-xs">
                  > init_date: {{ formatDate(repository.created_at) }}
                </CardDescription>
              </div>
            </div>
            <Button
              @click="syncPullRequests"
              :disabled="syncing"
              variant="outline"
              class="btn-neo min-w-[150px]"
            >
              {{ syncing ? '>> SYNCING...' : '>> SYNC_PRS' }}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <!-- Metrics Overview -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold neon">Metrics</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total PRs -->
          <Card class="card-cyber glass-panel group hover:border-primary/60 transition-all">
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center">
                  <span class="text-blue-400 text-sm font-mono">#</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-mono text-muted-foreground">TOTAL_PRS</p>
                  <p class="text-lg font-mono text-primary">{{ metrics?.total_prs || 0 }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Avg Merge Time -->
          <Card class="card-cyber glass-panel group hover:border-primary/60 transition-all">
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded flex items-center justify-center">
                  <span class="text-green-400 text-sm font-mono">⏱</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-mono text-muted-foreground">AVG_MERGE_TIME</p>
                  <p class="text-lg font-mono text-primary">{{ formatHours(metrics?.avg_merge_time_hours || 0) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Avg Lines Added -->
          <Card class="card-cyber glass-panel group hover:border-primary/60 transition-all">
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                  <span class="text-yellow-400 text-sm font-mono">+</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-mono text-muted-foreground">AVG_LINES_ADDED</p>
                  <p class="text-lg font-mono text-primary">{{ Math.round(metrics?.avg_lines_added || 0) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Avg Files Changed -->
          <Card class="card-cyber glass-panel group hover:border-primary/60 transition-all">
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded flex items-center justify-center">
                  <span class="text-purple-400 text-sm font-mono">📁</span>
                </div>
                <div class="flex-1">
                  <p class="text-xs font-mono text-muted-foreground">AVG_FILES_CHANGED</p>
                  <p class="text-lg font-mono text-primary">{{ Math.round(metrics?.avg_files_changed || 0) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Pull Requests List -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold neon">Recent Pull Requests</h2>
        <Card class="card-cyber glass-panel border-primary/30">
          <CardHeader>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex size-2 rounded-full"
                :class="pullRequests.length > 0 ? 'bg-success' : 'bg-warning'"
                aria-hidden="true"
              />
              <CardTitle class="font-mono">RECENT PULL REQUESTS [{{ pullRequests.length }}]</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="pullRequests.length === 0" class="text-center py-12">
              <div class="space-y-4">
                <div class="text-muted-foreground mb-4 text-lg font-mono">
                  [ NO DATA ]
                </div>
                <p class="text-muted-foreground font-mono text-sm">
                  No pull requests found. Execute sync command to fetch data from GitHub.
                </p>
                <Button
                  @click="syncPullRequests"
                  :disabled="syncing"
                  variant="outline"
                  size="sm"
                  class="mt-4 btn-neo"
                >
                  {{ syncing ? '>> SYNCING...' : '>> SYNC_NOW' }}
                </Button>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(pr, index) in pullRequests"
                :key="pr.id"
                class="group"
              >
                <Card class="card-cyber border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                  <CardContent class="p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <Badge variant="outline" class="font-mono">
                            {{ pr.state.toUpperCase() }}
                          </Badge>
                          <span class="text-muted-foreground font-mono text-xs">
                            #{{ pr.number }}
                          </span>
                        </div>
                        <h3 class="text-sm font-mono text-foreground group-hover:text-primary transition-colors mb-2">
                          {{ pr.title }}
                        </h3>
                        <div class="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                          <span class="flex items-center gap-1">
                            <span class="text-green-400">+{{ pr.lines_added }}</span>
                            <span>/</span>
                            <span class="text-red-400">-{{ pr.lines_deleted }}</span>
                          </span>
                          <span>{{ pr.files_changed }} files</span>
                          <span>{{ formatDate(pr.created_at) }}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator
                  v-if="index < pullRequests.length - 1"
                  class="my-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRepositoryStore } from '../stores/repository'
import { usePullRequestStore } from '../stores/pull-request'
import { format } from 'date-fns'
import type { Repository, RepositoryMetrics } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const repositoryStore = useRepositoryStore()
const pullRequestStore = usePullRequestStore()

const repositoryId = computed(() => parseInt(route.params.id as string))
const repository = ref<Repository | null>(null)
const metrics = ref<RepositoryMetrics | null>(null)
const loading = ref(true)
const error = ref('')
const syncing = ref(false)

const pullRequests = computed(() => pullRequestStore.pullRequests)

onMounted(async () => {
  await loadRepositoryData()
})

const loadRepositoryData = async () => {
  loading.value = true
  error.value = ''
  try {
    await repositoryStore.fetchRepositories()
    repository.value = repositoryStore.getRepositoryById(repositoryId.value) || null
    if (!repository.value) {
      error.value = 'Repository not found'
      return
    }
    await Promise.all([
      pullRequestStore.fetchMetrics(repositoryId.value),
      pullRequestStore.fetchPullRequests(repositoryId.value)
    ])
    metrics.value = pullRequestStore.metrics
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load repository data'
  } finally {
    loading.value = false
  }
}

const syncPullRequests = async () => {
  syncing.value = true
  try {
    await pullRequestStore.syncPullRequests(repositoryId.value)
    await loadRepositoryData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to sync pull requests'
  } finally {
    syncing.value = false
  }
}

const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy')

const formatHours = (hours: number) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}
</script>

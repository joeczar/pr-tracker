<template>
  <TooltipProvider>
    <div class="space-y-4">
    <!-- Loading State -->
    <Terminal v-if="loading" title="pr-tracker@repository-detail:~$" class="min-h-[400px]">
      <div class="space-y-4">
        <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
          <div class="text-primary font-terminal text-sm">
            > pr-tracker repo --analyze {{ repositoryId }}
          </div>
          <div class="text-muted-foreground font-terminal text-xs mt-1">
            Loading repository analysis...
          </div>
        </div>
        
        <div class="flex items-center justify-center py-12">
          <div class="flex items-center gap-4">
            <StatusLED status="processing" label="SCANNING..." animate />
            <Progress variant="terminal" :model-value="65" class="w-48" />
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-muted-foreground font-terminal text-sm">Analyzing repository data...</p>
        </div>
      </div>
    </Terminal>
    
    <!-- Error State -->
    <Terminal v-else-if="error" title="pr-tracker@repository-detail:~$" class="min-h-[300px]">
      <div class="space-y-4">
        <Alert variant="error" class="mb-4">
          <AlertTitle class="flex items-center gap-2">
            ⚠ REPOSITORY ERROR
          </AlertTitle>
          <AlertDescription class="mt-2">
            {{ error }}
          </AlertDescription>
        </Alert>
      </div>
    </Terminal>
    
    <!-- Repository Content -->
    <div v-else-if="repository" class="space-y-4">
      <!-- Repository Header -->
      <Terminal :title="`pr-tracker@${repository.full_name}:~$`" class="min-h-[fit]">
        <div class="space-y-4">
          <!-- Command Prompt -->
          <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
            <div class="text-primary font-terminal text-sm">
              > pr-tracker repo --details {{ repository.full_name }}
            </div>
            <div class="text-muted-foreground font-terminal text-xs mt-1">
              Repository analysis complete. {{ metrics?.total_prs || 0 }} PRs tracked.
            </div>
          </div>

          <!-- Repository Info -->
          <Card variant="terminal" class="border-primary/30">
            <CardHeader>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <StatusLED status="success" size="sm" />
                  <div>
                    <CardTitle class="phosphor-text text-xl">{{ repository.full_name }}</CardTitle>
                    <CardDescription class="font-terminal text-xs">
                      > init_date: {{ formatDate(repository.created_at) }}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  @click="syncPullRequests"
                  :disabled="syncing"
                  variant="terminal"
                  size="terminal"
                  class="min-w-[150px]"
                >
                  {{ syncing ? '>> SYNCING...' : '>> SYNC_PRS' }}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </Terminal>

      <!-- Metrics Overview -->
      <Terminal title="pr-tracker@metrics:~$" class="min-h-[fit]">
        <div class="space-y-4">
          <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
            <div class="text-primary font-terminal text-sm">
              > pr-tracker metrics --overview
            </div>
            <div class="text-muted-foreground font-terminal text-xs mt-1">
              Displaying PR analytics and performance metrics...
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Total PRs -->
            <Card variant="command" class="group hover:border-primary/60 transition-all">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center">
                    <span class="text-blue-400 text-sm font-terminal">#</span>
                  </div>
                  <div class="flex-1">
                    <Tooltip variant="terminal">
                      <TooltipTrigger as-child>
                        <div class="cursor-help">
                          <p class="text-xs font-terminal text-muted-foreground">TOTAL_PRS</p>
                          <p class="text-lg font-terminal text-primary">{{ metrics?.total_prs || 0 }}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent variant="terminal">
                        Total number of pull requests tracked for this repository
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Avg Merge Time -->
            <Card variant="command" class="group hover:border-primary/60 transition-all">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded flex items-center justify-center">
                    <span class="text-green-400 text-sm font-terminal">⏱</span>
                  </div>
                  <div class="flex-1">
                    <Tooltip variant="terminal">
                      <TooltipTrigger as-child>
                        <div class="cursor-help">
                          <p class="text-xs font-terminal text-muted-foreground">AVG_MERGE_TIME</p>
                          <p class="text-lg font-terminal text-primary">{{ formatHours(metrics?.avg_merge_time_hours || 0) }}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent variant="terminal">
                        Average time from PR creation to merge
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Avg Lines Added -->
            <Card variant="command" class="group hover:border-primary/60 transition-all">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-yellow-500/20 border border-yellow-500/30 rounded flex items-center justify-center">
                    <span class="text-yellow-400 text-sm font-terminal">+</span>
                  </div>
                  <div class="flex-1">
                    <Tooltip variant="terminal">
                      <TooltipTrigger as-child>
                        <div class="cursor-help">
                          <p class="text-xs font-terminal text-muted-foreground">AVG_LINES_ADDED</p>
                          <p class="text-lg font-terminal text-primary">{{ Math.round(metrics?.avg_lines_added || 0) }}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent variant="terminal">
                        Average number of lines added per pull request
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Avg Files Changed -->
            <Card variant="command" class="group hover:border-primary/60 transition-all">
              <CardContent class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded flex items-center justify-center">
                    <span class="text-purple-400 text-sm font-terminal">📁</span>
                  </div>
                  <div class="flex-1">
                    <Tooltip variant="terminal">
                      <TooltipTrigger as-child>
                        <div class="cursor-help">
                          <p class="text-xs font-terminal text-muted-foreground">AVG_FILES_CHANGED</p>
                          <p class="text-lg font-terminal text-primary">{{ Math.round(metrics?.avg_files_changed || 0) }}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent variant="terminal">
                        Average number of files modified per pull request
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Terminal>

      <!-- Pull Requests List -->
      <Terminal title="pr-tracker@pull-requests:~$" class="min-h-[fit]">
        <div class="space-y-4">
          <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
            <div class="text-primary font-terminal text-sm">
              > pr-tracker list --recent
            </div>
            <div class="text-muted-foreground font-terminal text-xs mt-1">
              Displaying recent pull request activity...
            </div>
          </div>

          <Card variant="terminal" class="border-primary/30">
            <CardHeader>
              <div class="flex items-center gap-3">
                <StatusLED :status="pullRequests.length > 0 ? 'success' : 'warning'" size="sm" />
                <CardTitle class="phosphor-text">RECENT PULL REQUESTS [{{ pullRequests.length }}]</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="pullRequests.length === 0" class="text-center py-12">
                <div class="space-y-4">
                  <div class="phosphor-text text-muted-foreground mb-4 text-lg">
                    [ NO DATA ]
                  </div>
                  <p class="text-muted-foreground font-terminal text-sm">
                    No pull requests found. Execute sync command to fetch data from GitHub.
                  </p>
                  <Button
                    @click="syncPullRequests"
                    :disabled="syncing"
                    variant="terminal"
                    size="sm"
                    class="mt-4"
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
                  <Card variant="command" class="border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                    <CardContent class="p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2">
                            <StatusBadge :status="getStatusFromState(pr.state)" :label="pr.state.toUpperCase()" />
                            <span class="text-muted-foreground font-terminal text-xs">
                              #{{ pr.number }}
                            </span>
                          </div>
                          <h3 class="text-sm font-terminal text-foreground group-hover:text-primary transition-colors mb-2">
                            {{ pr.title }}
                          </h3>
                          <div class="flex items-center gap-4 text-xs font-terminal text-muted-foreground">
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
                  
                  <!-- Add separator between PRs, but not after the last one -->
                  <Separator 
                    v-if="index < pullRequests.length - 1" 
                    variant="terminal" 
                    class="my-3" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Terminal>
    </div>
  </TooltipProvider>
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
import { Terminal } from '@/components/ui/terminal'
import { StatusLED } from '@/components/ui/status'
import { StatusBadge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const route = useRoute()
const repositoryStore = useRepositoryStore()
const pullRequestStore = usePullRequestStore()

const repositoryId = computed(() => parseInt(route.params.id as string))
const repository = ref<Repository | null>(null)
const metrics = ref<RepositoryMetrics | null>(null)
const loading = ref(true)
const error = ref('')
const syncing = ref(false)

const { pullRequests } = pullRequestStore

onMounted(async () => {
  await loadRepositoryData()
})

const loadRepositoryData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Load repository details
    await repositoryStore.fetchRepositories()
    repository.value = repositoryStore.getRepositoryById(repositoryId.value) || null
    
    if (!repository.value) {
      error.value = 'Repository not found'
      return
    }

    // Load metrics and pull requests
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
    await loadRepositoryData() // Refresh data after sync
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to sync pull requests'
  } finally {
    syncing.value = false
  }
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}

const formatHours = (hours: number) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

const getStatusFromState = (state: string) => {
  switch (state) {
    case 'open': return 'success'
    case 'merged': return 'active'
    case 'closed': return 'error'
    default: return 'inactive'
  }
}
</script>

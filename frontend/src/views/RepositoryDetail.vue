<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Loading repository details...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <p class="text-red-600">{{ error }}</p>
    </div>
    
    <div v-else-if="repository" class="space-y-6">
      <!-- Repository Header -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                {{ repository.full_name }}
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                Added {{ formatDate(repository.created_at) }}
              </p>
            </div>
            <button
              @click="syncPullRequests"
              :disabled="syncing"
              class="btn-primary"
            >
              {{ syncing ? 'Syncing...' : 'Sync PRs' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Metrics Overview -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm font-medium">#</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total PRs
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ metrics?.total_prs || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm font-medium">⏱</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Avg Merge Time
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ formatHours(metrics?.avg_merge_time_hours || 0) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm font-medium">+</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Avg Lines Added
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ Math.round(metrics?.avg_lines_added || 0) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span class="text-white text-sm font-medium">📁</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Avg Files Changed
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ Math.round(metrics?.avg_files_changed || 0) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pull Requests List -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">
            Recent Pull Requests
          </h2>
          
          <div v-if="pullRequests.length === 0" class="text-center py-8">
            <p class="text-gray-500">No pull requests found. Try syncing to fetch data from GitHub.</p>
          </div>
          
          <div v-else class="space-y-4">
            <div 
              v-for="pr in pullRequests" 
              :key="pr.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900">
                    #{{ pr.number }} - {{ pr.title }}
                  </h3>
                  <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span :class="getStateColor(pr.state)">
                      {{ pr.state.toUpperCase() }}
                    </span>
                    <span>{{ pr.lines_added }}+ / {{ pr.lines_deleted }}-</span>
                    <span>{{ pr.files_changed }} files</span>
                    <span>{{ formatDate(pr.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRepositoryStore } from '../stores/repository'
import { usePullRequestStore } from '../stores/pull-request'
import { format } from 'date-fns'
import type { Repository, RepositoryMetrics } from '@shared/types'

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

const getStateColor = (state: string) => {
  switch (state) {
    case 'open': return 'text-green-600'
    case 'merged': return 'text-purple-600'
    case 'closed': return 'text-red-600'
    default: return 'text-gray-600'
  }
}
</script>

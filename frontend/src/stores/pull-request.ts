import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PullRequest, RepositoryMetrics, SyncResult } from '@shared/types'
import { api } from '../services/api'

export const usePullRequestStore = defineStore('pullRequest', () => {
  const pullRequests = ref<PullRequest[]>([])
  const metrics = ref<RepositoryMetrics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPullRequests = async (repositoryId: number, filters?: {
    state?: 'open' | 'closed' | 'merged'
    limit?: number
    offset?: number
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const params = new URLSearchParams()
      if (filters?.state) params.append('state', filters.state)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())
      
      const queryString = params.toString()
      const url = `/api/pull-requests/repository/${repositoryId}${queryString ? `?${queryString}` : ''}`
      
      const response = await api.get<PullRequest[]>(url)
      pullRequests.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch pull requests'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchMetrics = async (repositoryId: number, days: number = 30) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get<RepositoryMetrics>(
        `/api/pull-requests/repository/${repositoryId}/metrics?days=${days}`
      )
      metrics.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch metrics'
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncPullRequests = async (repositoryId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post<SyncResult>(
        `/api/pull-requests/repository/${repositoryId}/sync`
      )
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sync pull requests'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPullRequestById = (id: number): PullRequest | undefined => {
    return pullRequests.value.find(pr => pr.id === id)
  }

  const clearPullRequests = () => {
    pullRequests.value = []
    metrics.value = null
  }

  return {
    pullRequests,
    metrics,
    loading,
    error,
    fetchPullRequests,
    fetchMetrics,
    syncPullRequests,
    getPullRequestById,
    clearPullRequests,
  }
})

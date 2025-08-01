import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Repository } from '@shared/types'
import { api } from '../services/api'

export const useRepositoryStore = defineStore('repository', () => {
  const repositories = ref<Repository[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchRepositories = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get<Repository[]>('/api/repositories')
      repositories.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch repositories'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addRepository = async (owner: string, name: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post<Repository>('/api/repositories', { owner, name })
      repositories.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add repository'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRepository = async (id: number) => {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(`/api/repositories/${id}`)
      repositories.value = repositories.value.filter(repo => repo.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete repository'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getRepositoryById = (id: number): Repository | undefined => {
    return repositories.value.find(repo => repo.id === id)
  }

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    addRepository,
    deleteRepository,
    getRepositoryById,
  }
})

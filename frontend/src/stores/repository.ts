import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Repository, RepositoryOption, AccessibleRepositoriesResponse } from '@shared/types'
import { api } from '../services/api'

export const useRepositoryStore = defineStore('repository', () => {
  const repositories = ref<Repository[]>([])
  const availableRepositories = ref<RepositoryOption[]>([])
  const loading = ref(false)
  const availableLoading = ref(false)
  const error = ref<string | null>(null)
  const availableError = ref<string | null>(null)

  const fetchRepositories = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get<Repository[]>('/api/repositories')
      repositories.value = response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repositories'
      error.value = errorMessage
      
      // For expected configuration errors, don't throw - just log the error
      if (errorMessage.includes('GITHUB_TOKEN') || errorMessage.includes('500')) {
        console.warn('Repository fetch failed:', errorMessage)
        return
      }
      
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

  const fetchAvailableRepositories = async (options: {
    page?: number
    per_page?: number
    sort?: string
    affiliation?: string
    visibility?: string
  } = {}) => {
    availableLoading.value = true
    availableError.value = null

    try {
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.per_page) params.append('per_page', options.per_page.toString())
      if (options.sort) params.append('sort', options.sort)
      if (options.affiliation) params.append('affiliation', options.affiliation)
      if (options.visibility) params.append('visibility', options.visibility)

      const queryString = params.toString()
      const url = `/api/github/repositories${queryString ? `?${queryString}` : ''}`

      const response = await api.get<AccessibleRepositoriesResponse>(url)
      availableRepositories.value = response.data.repositories
      return response.data.repositories
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch available repositories'
      availableError.value = errorMessage

      // For expected configuration errors, don't throw - just log the error
      if (errorMessage.includes('GITHUB_TOKEN') || errorMessage.includes('500')) {
        console.warn('Available repositories fetch failed:', errorMessage)
        return []
      }

      throw err
    } finally {
      availableLoading.value = false
    }
  }

  const getRepositoryById = (id: number): Repository | undefined => {
    return repositories.value.find(repo => repo.id === id)
  }

  const getAvailableRepositoryByFullName = (fullName: string): RepositoryOption | undefined => {
    return availableRepositories.value.find(repo => repo.full_name === fullName)
  }

  return {
    repositories,
    availableRepositories,
    loading,
    availableLoading,
    error,
    availableError,
    fetchRepositories,
    fetchAvailableRepositories,
    addRepository,
    deleteRepository,
    getRepositoryById,
    getAvailableRepositoryByFullName,
  }
})

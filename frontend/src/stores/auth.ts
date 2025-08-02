import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthenticatedUser, AuthStatusResponse, AuthMeResponse } from '@shared/types'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthenticatedUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const setUser = (userData: AuthenticatedUser | null) => {
    user.value = userData
  }

  const clearAuth = () => {
    user.value = null
    error.value = null
  }

  /**
   * Check authentication status on app initialization
   */
  const checkAuthStatus = async (): Promise<boolean> => {
    if (isInitialized.value) {
      return isAuthenticated.value
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.get<AuthStatusResponse>('/auth/status')
      
      if (response.data.authenticated && response.data.user) {
        setUser(response.data.user)
        isInitialized.value = true
        return true
      } else {
        clearAuth()
        isInitialized.value = true
        return false
      }
    } catch (err) {
      console.warn('Auth status check failed:', err)
      clearAuth()
      isInitialized.value = true
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get current user information (requires authentication)
   */
  const fetchCurrentUser = async (): Promise<AuthenticatedUser | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<AuthMeResponse>('/auth/me')
      setUser(response.data.user)
      return response.data.user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user information'
      setError(errorMessage)
      
      // If unauthorized, clear auth state
      if (errorMessage.includes('401') || errorMessage.includes('Authentication required')) {
        clearAuth()
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Initiate GitHub OAuth login
   */
  const login = (redirectUrl?: string) => {
    setLoading(true)
    setError(null)

    // Build login URL with optional redirect
    const loginUrl = new URL('/auth/github/login', api.defaults.baseURL)
    if (redirectUrl) {
      loginUrl.searchParams.set('redirect', redirectUrl)
    }

    // Redirect to OAuth login
    window.location.href = loginUrl.toString()
  }

  /**
   * Logout user and clear session
   */
  const logout = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await api.post('/auth/logout')
      clearAuth()
      
      // Redirect to home page after logout
      window.location.href = '/'
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      
      // Even if logout request fails, clear local auth state
      clearAuth()
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Refresh authentication token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      await api.post('/auth/refresh')
      return true
    } catch (err) {
      console.warn('Token refresh failed:', err)
      clearAuth()
      return false
    }
  }

  /**
   * Handle authentication errors from API responses
   */
  const handleAuthError = (error: any) => {
    if (error?.response?.status === 401) {
      clearAuth()
      setError('Your session has expired. Please log in again.')
    }
  }

  return {
    // State
    user,
    isLoading,
    error,
    isInitialized,
    
    // Computed
    isAuthenticated,
    
    // Actions
    setLoading,
    setError,
    setUser,
    clearAuth,
    checkAuthStatus,
    fetchCurrentUser,
    login,
    logout,
    refreshToken,
    handleAuthError,
  }
})

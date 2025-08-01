<template>
  <div class="space-y-6">
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          Repositories
        </h1>
        
        <form @submit.prevent="addRepository" class="mb-6">
          <div class="flex gap-4">
            <div class="flex-1">
              <label for="owner" class="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <input
                id="owner"
                v-model="newRepo.owner"
                type="text"
                placeholder="e.g., facebook"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div class="flex-1">
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Repository Name
              </label>
              <input
                id="name"
                v-model="newRepo.name"
                type="text"
                placeholder="e.g., react"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                :disabled="loading"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {{ loading ? 'Adding...' : 'Add Repository' }}
              </button>
            </div>
          </div>
        </form>

        <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Tracked Repositories
        </h2>
        
        <div v-if="repositories.length === 0" class="text-center py-8">
          <p class="text-gray-500">No repositories added yet.</p>
        </div>
        
        <div v-else class="space-y-4">
          <div 
            v-for="repo in repositories" 
            :key="repo.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ repo.full_name }}
              </h3>
              <p class="text-sm text-gray-600">
                Added {{ formatDate(repo.created_at) }}
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <router-link 
                :to="`/repositories/${repo.id}`"
                class="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View Details
              </router-link>
              <button
                @click="deleteRepository(repo.id)"
                class="text-red-600 hover:text-red-500 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'

const repositoryStore = useRepositoryStore()
const { repositories } = repositoryStore

const newRepo = ref({
  owner: '',
  name: ''
})

const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const addRepository = async () => {
  if (!newRepo.value.owner || !newRepo.value.name) return
  
  loading.value = true
  error.value = ''
  
  try {
    await repositoryStore.addRepository(newRepo.value.owner, newRepo.value.name)
    newRepo.value = { owner: '', name: '' }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to add repository'
  } finally {
    loading.value = false
  }
}

const deleteRepository = async (id: number) => {
  if (confirm('Are you sure you want to delete this repository?')) {
    try {
      await repositoryStore.deleteRepository(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete repository'
    }
  }
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>

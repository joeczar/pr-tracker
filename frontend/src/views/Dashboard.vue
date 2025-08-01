<template>
  <div class="space-y-6">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          PR Progress Dashboard
        </h1>
        <p class="text-gray-600">
          Track your pull request metrics and improve your code review process.
        </p>
      </div>
    </div>

    <div v-if="repositories.length === 0" class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6 text-center">
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          No repositories tracked yet
        </h3>
        <p class="text-gray-600 mb-4">
          Add a repository to start tracking your PR metrics.
        </p>
        <router-link 
          to="/repositories"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Repository
        </router-link>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="repo in repositories" 
        :key="repo.id"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            {{ repo.full_name }}
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            Added {{ formatDate(repo.created_at) }}
          </p>
          <router-link 
            :to="`/repositories/${repo.id}`"
            class="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View Details →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'

const repositoryStore = useRepositoryStore()
const { repositories } = repositoryStore

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>

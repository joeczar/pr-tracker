<template>
  <div class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">PR Progress Dashboard</CardTitle>
        <CardDescription>
          Track your pull request metrics and improve your code review process.
        </CardDescription>
      </CardHeader>
    </Card>

    <Card v-if="repositories.length === 0">
      <CardContent class="text-center pt-6">
        <CardTitle class="text-lg mb-2">No repositories tracked yet</CardTitle>
        <CardDescription class="mb-4">
          Add a repository to start tracking your PR metrics.
        </CardDescription>
        <Button as-child>
          <router-link to="/repositories">
            Add Repository
          </router-link>
        </Button>
      </CardContent>
    </Card>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="repo in repositories" :key="repo.id">
        <CardHeader>
          <CardTitle class="text-lg">{{ repo.full_name }}</CardTitle>
          <CardDescription>
            Added {{ formatDate(repo.created_at) }}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" as-child>
            <router-link :to="`/repositories/${repo.id}`">
              View Details →
            </router-link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const repositoryStore = useRepositoryStore()
const { repositories } = repositoryStore

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-foreground mb-2">Repository Management</h1>
      <p class="text-muted-foreground text-lg">Add and manage repositories to track pull requests</p>
      <div class="mt-4 flex items-center justify-center gap-2">
        <div class="w-2 h-2 bg-success rounded-full pulse-glow"></div>
        <span class="text-sm text-muted-foreground">{{ repositories.length }} repositories tracked</span>
      </div>
    </div>

    <!-- Add Repository Form -->
    <Card variant="glow" class="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle class="text-xl text-foreground flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add New Repository
        </CardTitle>
        <CardDescription>
          Enter the GitHub repository owner and name to start tracking pull requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="addRepository" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <Label for="owner" class="text-sm font-medium">
                Repository Owner
              </Label>
              <Input
                id="owner"
                v-model="newRepo.owner"
                placeholder="facebook"
                required
              />
              <p class="text-xs text-muted-foreground">GitHub username or organization</p>
            </div>
            <div class="space-y-2">
              <Label for="name" class="text-sm font-medium">
                Repository Name
              </Label>
              <Input
                id="name"
                v-model="newRepo.name"
                placeholder="react"
                required
              />
              <p class="text-xs text-muted-foreground">Repository name</p>
            </div>
          </div>
          
          <div class="flex justify-end pt-4">
            <Button
              type="submit"
              :disabled="loading"
              class="min-w-[200px] glow-primary"
            >
              {{ loading ? 'Adding Repository...' : 'Add Repository' }}
            </Button>
          </div>
        </form>

        <!-- Error Display -->
        <div v-if="error" class="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-destructive mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h4 class="text-sm font-medium text-destructive">Error adding repository</h4>
              <p class="text-sm text-destructive/80 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>

        <div v-if="storeError && storeError.includes('GITHUB_TOKEN')" class="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-destructive mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h4 class="text-sm font-medium text-destructive">Configuration Error</h4>
              <p class="text-sm text-destructive/80 mt-1">GitHub token is required for backend functionality</p>
              <code class="text-xs text-mono bg-muted/50 px-2 py-1 rounded mt-2 block text-primary">
                export GITHUB_TOKEN=your_github_token_here
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Repository List -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-foreground">Tracked Repositories</h2>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-success rounded-full"></div>
          <span class="text-sm text-muted-foreground">{{ repositories.length }} active</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="repositories.length === 0" class="text-center py-16">
        <Card class="max-w-md mx-auto" variant="minimal">
          <div class="p-8">
            <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-foreground mb-2">No repositories yet</h3>
            <p class="text-muted-foreground">
              Add your first repository above to start tracking pull requests and collaboration metrics.
            </p>
          </div>
        </Card>
      </div>
      
      <!-- Repository Grid -->
      <div v-else class="content-grid">
        <Card 
          v-for="repo in repositories" 
          :key="repo.id"
          variant="glow"
          class="group cursor-pointer"
          @click="$router.push(`/repositories/${repo.id}`)"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <CardTitle class="text-lg text-foreground group-hover:text-primary transition-colors">
                    {{ repo.full_name }}
                  </CardTitle>
                  <CardDescription class="text-mono text-xs">
                    Added {{ formatDate(repo.created_at) }}
                  </CardDescription>
                </div>
              </div>
              <svg class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </CardHeader>
          <CardFooter>
            <div class="flex items-center gap-3 w-full">
              <Button
                variant="terminal"
                size="sm"
                class="flex-1"
                @click.stop="$router.push(`/repositories/${repo.id}`)"
              >
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click.stop="deleteRepository(repo.id)"
                class="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Remove
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const repositoryStore = useRepositoryStore()
const { repositories, error: storeError } = repositoryStore

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

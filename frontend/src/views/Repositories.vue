<template>
  <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <!-- ASCII Header -->
    <div class="mb-6">
      <ASCIIArt
        text="REPOSITORIES"
        variant="glow"
        color="primary"
        size="md"
        :animate="true"
        class="mb-3"
      />
      <div class="text-center">
        <div class="font-mono text-primary text-sm">
          > user@pr-tracker:~$ repositories --list --count={{ repositories.length }}
        </div>
        <div class="font-mono text-muted-foreground text-xs mt-1">
          Repository management system initialized. Status: ONLINE
        </div>
      </div>
    </div>

    <!-- Add Repository Card (shadcn) -->
    <Card class="mb-6 card-cyber glass-panel">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-xl neon">Add Repository</CardTitle>
            <CardDescription>Select from your repos or enter details manually.</CardDescription>
          </div>
          <div class="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span class="font-mono">repo-manager add --interactive</span>
          </div>
        </div>
      </CardHeader>
      <CardContent class="card-cyber glass-panel">
        <form @submit.prevent="addRepository" class="space-y-6">
          <div class="space-y-4">
            <!-- Repository Selector -->
            <div class="space-y-2">
              <label for="repo-selector" class="text-sm font-medium">Repository</label>
              <RepositorySelector
                id="repo-selector"
                v-model="selectedRepoFullName"
                placeholder="Choose from your accessible repositories..."
                @select="handleRepositorySelect"
                :disabled="loading"
              />
            </div>

            <!-- Manual Entry Toggle -->
            <div class="flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="showManualEntry = !showManualEntry"
                class="text-xs"
              >
                {{ showManualEntry ? 'Use Repository Selector' : 'Enter Manually' }}
              </Button>
            </div>

            <!-- Manual Entry (fallback) -->
            <div v-if="showManualEntry" class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="space-y-2">
                <label for="owner" class="text-sm font-medium">Owner</label>
                <Input
                  id="owner"
                  v-model="newRepo.owner"
                  placeholder="facebook"
                  required
                />
              </div>
              <div class="space-y-2">
                <label for="name" class="text-sm font-medium">Repository Name</label>
                <Input
                  id="name"
                  v-model="newRepo.name"
                  placeholder="react"
                  required
                />
              </div>
            </div>
          </div>
          <CardFooter class="px-0">
            <div class="w-full flex items-center justify-center">
              <Button
                type="submit"
                :disabled="loading"
                :variant="loading ? 'secondary' : 'default'"
                class="btn-neo"
              >
                {{ loading ? 'Adding...' : 'Add Repository' }}
              </Button>
            </div>
          </CardFooter>
        </form>

        <!-- Error Display -->
        <div v-if="error" class="mt-4">
          <Alert variant="destructive" role="alert">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </div>

        <div v-if="storeError && storeError.includes('GITHUB_TOKEN')" class="mt-4">
          <Alert variant="destructive" role="alert">
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              GitHub token is missing. Set GITHUB_TOKEN in your environment to enable repository access.
            </AlertDescription>
          </Alert>
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
          class="group cursor-pointer repo-card"
          @click="$router.push(`/repositories/${repo.id}`)"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="repo-icon">
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
              <svg class="repo-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </CardHeader>
          <CardFooter>
            <div class="flex items-center gap-3 w-full">
              <Button
                variant="default"
                size="sm"
                class="flex-1 btn-neo"
                @click.stop="$router.push(`/repositories/${repo.id}`)"
              >
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click.stop="deleteRepository(repo.id)"
                class="btn-neo border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
import type { RepositoryOption } from '@shared/types'
import { Button } from '@/components/ui/button'
/* Use named exports that exist in this codebase's card index */
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ASCIIArt } from '@/components/ui/ascii'
import { Terminal } from '@/components/ui/terminal'
import RepositorySelector from '@/components/RepositorySelector.vue'

const repositoryStore = useRepositoryStore()
const { repositories, error: storeError } = repositoryStore

const newRepo = ref({
  owner: '',
  name: ''
})

const selectedRepoFullName = ref('')
const selectedRepository = ref<RepositoryOption | null>(null)
const showManualEntry = ref(false)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const handleRepositorySelect = (repository: RepositoryOption) => {
  selectedRepository.value = repository
  // Parse owner and name from full_name for the existing addRepository function
  const [owner, name] = repository.full_name.split('/')
  newRepo.value = { owner, name }
}

const addRepository = async () => {
  // Check if we have repository data from either selector or manual entry
  const owner = newRepo.value.owner
  const name = newRepo.value.name

  if (!owner || !name) {
    error.value = 'Please select a repository or enter owner and name manually'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await repositoryStore.addRepository(owner, name)
    // Reset form
    newRepo.value = { owner: '', name: '' }
    selectedRepoFullName.value = ''
    selectedRepository.value = null
    showManualEntry.value = false
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

<style scoped>
/* Repository Card Styling */
.repo-terminal-card {
  @apply bg-card/50 border border-border/50 rounded-lg p-4;
  @apply hover:border-primary/30 hover:bg-card/80;
  @apply transition-all duration-200;
  @apply cursor-pointer;
}

.repo-terminal-card:hover {
  box-shadow: 0 0 20px hsl(var(--primary) / 0.1);
}
</style>

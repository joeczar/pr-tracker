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

    <!-- Add Repository Terminal -->
    <Terminal title="repository-manager@add:~$" class="mb-6">
      <div class="space-y-4">
        <!-- Command Header -->
        <div class="border-l-2 border-primary pl-3 py-2 bg-primary/5 rounded-r">
          <div class="text-primary font-mono text-sm">
            > repo-manager add --interactive
          </div>
          <div class="text-muted-foreground font-mono text-xs mt-1">
            Enter GitHub repository details to initialize tracking...
          </div>
        </div>
        <!-- Terminal Form -->
        <form @submit.prevent="addRepository" class="space-y-6">
          <div class="space-y-4">
            <!-- Repository Selector -->
            <div class="terminal-input-group">
              <div class="terminal-prompt">
                <span class="text-primary font-mono">select@repo:</span>
                <span class="text-muted-foreground font-mono">~$</span>
              </div>
              <div class="flex-1">
                <RepositorySelector
                  v-model="selectedRepoFullName"
                  placeholder="Choose from your accessible repositories..."
                  @select="handleRepositorySelect"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- Manual Entry Toggle -->
            <div class="flex items-center justify-center">
              <button
                type="button"
                @click="showManualEntry = !showManualEntry"
                class="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
              >
                {{ showManualEntry ? '◀ Use Repository Selector' : '▶ Enter Manually' }}
              </button>
            </div>

            <!-- Manual Entry (fallback) -->
            <div v-if="showManualEntry" class="space-y-4 border-t border-primary/20 pt-4">
              <!-- Owner Input -->
              <div class="terminal-input-group">
                <div class="terminal-prompt">
                  <span class="text-primary font-mono">owner@github:</span>
                  <span class="text-muted-foreground font-mono">~$</span>
                </div>
                <Input
                  id="owner"
                  v-model="newRepo.owner"
                  placeholder="facebook"
                  required
                  class="terminal-input"
                />
              </div>

              <!-- Name Input -->
              <div class="terminal-input-group">
                <div class="terminal-prompt">
                  <span class="text-primary font-mono">repo@name:</span>
                  <span class="text-muted-foreground font-mono">~$</span>
                </div>
                <Input
                  id="name"
                  v-model="newRepo.name"
                  placeholder="react"
                  required
                  class="terminal-input"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-center pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="terminal-btn primary compact"
            >
              {{ loading ? 'Adding...' : 'Add Repository' }}
            </button>
          </div>
        </form>

        <!-- Terminal Error Display -->
        <div v-if="error" class="terminal-error">
          <div class="text-destructive font-mono text-sm">
            ERROR: {{ error }}
          </div>
        </div>

        <div v-if="storeError && storeError.includes('GITHUB_TOKEN')" class="terminal-error">
          <div class="text-destructive font-mono text-sm">
            FATAL: GitHub token configuration required
          </div>
          <div class="text-muted-foreground font-mono text-xs mt-2">
            > export GITHUB_TOKEN=your_github_token_here
          </div>
        </div>
      </div>
    </Terminal>

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
import type { RepositoryOption } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
/* Terminal Input Styling */
.terminal-input-group {
  @apply flex items-center gap-3 bg-muted/20 border border-border/50 rounded-lg p-3;
  @apply transition-all duration-200;
}

.terminal-input-group:focus-within {
  @apply border-primary/50 bg-primary/5;
}

.terminal-prompt {
  @apply flex-shrink-0 text-sm;
}

.terminal-input {
  @apply bg-transparent border-none outline-none flex-1;
  @apply font-mono text-sm text-foreground;
  @apply placeholder:text-muted-foreground;
}

.terminal-input:focus {
  @apply ring-0 border-none outline-none;
}

/* Terminal Button Styling */
.terminal-btn {
  @apply px-4 py-2 font-mono text-sm font-medium;
  @apply border border-border rounded-md;
  @apply transition-all duration-200;
  @apply flex items-center gap-1.5;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  letter-spacing: 0.025em;
}

.terminal-btn.compact {
  @apply px-3 py-1.5 text-xs;
  @apply gap-1;
}

.terminal-btn.primary {
  @apply bg-primary/10 text-primary border-primary/30;
  @apply hover:bg-primary/20 hover:border-primary/50;
  @apply focus:ring-primary;
}

.terminal-btn.primary:hover {
  box-shadow: 0 0 15px hsl(var(--primary) / 0.4);
}

/* Terminal Error Styling */
.terminal-error {
  @apply mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg;
  @apply border-l-4 border-l-destructive;
}

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

/* Responsive Design */
@media (max-width: 768px) {
  .terminal-input-group {
    @apply flex-col items-start gap-2;
  }

  .terminal-prompt {
    @apply text-xs;
  }

  .terminal-input {
    @apply w-full;
  }
}
</style>

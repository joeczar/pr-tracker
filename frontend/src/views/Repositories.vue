<template>
  <div class="space-y-6">
    <!-- Terminal Header -->
    <Terminal title="pr-tracker@repositories:~$" class="min-h-[700px]">
      <div class="space-y-6">
        <!-- Command Prompt Header -->
        <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
          <div class="text-primary font-terminal text-sm">
            > pr-tracker repo --manage
          </div>
          <div class="text-muted-foreground font-terminal text-xs mt-1">
            Repository management interface initialized...
          </div>
        </div>

        <!-- Add Repository Form -->
        <Card variant="terminal" class="border-primary/30">
          <CardHeader>
            <CardTitle class="phosphor-text flex items-center gap-2">
              <StatusLED status="processing" size="sm" />
              ADD NEW REPOSITORY
            </CardTitle>
            <CardDescription class="font-terminal text-xs">
              > Initialize new repository tracking module
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="addRepository" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="owner" class="block text-sm font-terminal text-primary mb-2">
                    >> OWNER:
                  </label>
                  <Input
                    id="owner"
                    v-model="newRepo.owner"
                    variant="terminal"
                    prompt="owner$"
                    placeholder="facebook"
                    required
                  />
                </div>
                <div>
                  <label for="name" class="block text-sm font-terminal text-primary mb-2">
                    >> REPOSITORY:
                  </label>
                  <Input
                    id="name"
                    v-model="newRepo.name"
                    variant="terminal" 
                    prompt="repo$"
                    placeholder="react"
                    required
                  />
                </div>
              </div>
              
              <div class="flex justify-end pt-4">
                <Button
                  type="submit"
                  :disabled="loading"
                  variant="terminal"
                  size="terminal"
                  class="min-w-[200px]"
                >
                  {{ loading ? '>> INITIALIZING...' : '>> EXECUTE_ADD' }}
                </Button>
              </div>
            </form>

            <div v-if="error" class="mt-4 p-3 bg-error border border-destructive/50 rounded-md">
              <div class="flex items-center gap-2">
                <StatusLED status="error" size="sm" />
                <p class="text-sm font-terminal text-destructive">ERROR: {{ error }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Repository List -->
        <Card variant="command" class="border-border/50">
          <CardHeader>
            <CardTitle class="phosphor-text flex items-center gap-2">
              <StatusLED :status="repositories.length > 0 ? 'success' : 'inactive'" size="sm" />
              TRACKED REPOSITORIES [{{ repositories.length }}]
            </CardTitle>
            <CardDescription class="font-terminal text-xs">
              > Active repository monitoring status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="repositories.length === 0" class="text-center py-12">
              <div class="phosphor-text text-muted-foreground mb-4 text-lg">
                [ EMPTY ]
              </div>
              <p class="text-muted-foreground font-terminal text-sm">
                No repositories in tracking database...
              </p>
            </div>
            
            <div v-else class="space-y-3">
              <div 
                v-for="repo in repositories" 
                :key="repo.id"
                class="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
              >
                <div class="flex items-center gap-3">
                  <StatusLED status="success" size="sm" />
                  <div>
                    <h3 class="text-base font-terminal text-foreground group-hover:text-primary transition-colors">
                      {{ repo.full_name }}
                    </h3>
                    <p class="text-xs font-terminal text-muted-foreground">
                      > init: {{ formatDate(repo.created_at) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    variant="command"
                    size="sm"
                    as-child
                  >
                    <router-link :to="`/repositories/${repo.id}`">
                      >> ACCESS
                    </router-link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    @click="deleteRepository(repo.id)"
                    class="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    >> DELETE
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Terminal Footer -->
        <div class="pt-4 border-t border-border/30">
          <div class="text-muted-foreground font-terminal text-xs flex justify-between">
            <span>pr-tracker repository-manager v2.0</span>
            <span>tracked: {{ repositories.length }} | status: OPERATIONAL</span>
          </div>
        </div>
      </div>
    </Terminal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Terminal } from '@/components/ui/terminal'
import { StatusLED } from '@/components/ui/status'

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

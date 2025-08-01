<template>
  <div class="space-y-4">
    <!-- ASCII Header -->
    <ASCIIHeader variant="animated" class="mb-4" />
    
    <!-- Main Terminal Window -->
    <Terminal title="pr-tracker@dashboard:~$" class="min-h-[fit]">
      <div class="space-y-4">
        <!-- System Status -->
        <div class="flex items-center gap-4 mb-6">
          <StatusLED status="active" label="SYSTEM ONLINE" />
          <StatusLED 
            :status="repositoryStore.repositories.length > 0 ? 'success' : 'warning'" 
            :label="`${repositoryStore.repositories.length} REPOS TRACKED`" 
          />
          <StatusLED status="processing" label="SCANNING..." animate />
        </div>

        <!-- Command Prompt -->
        <div class="border-l-2 border-primary pl-4 py-2 bg-primary/5">
          <div class="text-primary font-terminal text-sm">
            > pr-tracker status --dashboard
          </div>
          <div class="text-muted-foreground font-terminal text-xs mt-1">
            Initializing cyberpunk terminal interface...
          </div>
        </div>

        <!-- Error Display -->
        <Card v-if="repositoryStore.error" variant="terminal" class="border-destructive/30">
          <CardContent class="text-center pt-6">
            <div class="phosphor-text text-destructive mb-4">
              ⚠ CONFIGURATION ERROR
            </div>
            <CardDescription class="mb-4 font-terminal">
              {{ repositoryStore.error }}
            </CardDescription>
            <div v-if="repositoryStore.error && repositoryStore.error.includes('GITHUB_TOKEN')" class="text-xs font-terminal text-muted-foreground bg-muted/20 p-3 rounded border">
              > export GITHUB_TOKEN=your_github_token_here<br>
              > pnpm run dev:backend
            </div>
          </CardContent>
        </Card>

        <!-- Repository Cards -->
        <Card v-else-if="repositoryStore.repositories.length === 0 && !repositoryStore.loading" variant="terminal" class="border-warning/30">
          <CardContent class="text-center pt-6">
            <div class="phosphor-text text-warning mb-4">
              ⚠ NO REPOSITORIES DETECTED
            </div>
            <CardDescription class="mb-4 font-terminal">
              Initialize repository tracking to begin PR analysis...
            </CardDescription>
            <Button variant="terminal" size="terminal" as-child>
              <router-link to="/repositories">
                >> ADD_REPOSITORY
              </router-link>
            </Button>
          </CardContent>
        </Card>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card 
            v-for="repo in repositoryStore.repositories" 
            :key="repo.id" 
            variant="glow"
            class="group hover:border-primary/60 transition-all duration-300"
          >
            <CardHeader>
              <div class="flex items-center gap-2 mb-2">
                <StatusLED status="success" size="sm" />
                <CardTitle class="text-lg phosphor-text">{{ repo.full_name }}</CardTitle>
              </div>
              <CardDescription class="font-terminal text-xs">
                > init_date: {{ formatDate(repo.created_at) }}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant="command" 
                size="sm" 
                as-child 
                class="w-full group-hover:border-primary group-hover:text-primary"
              >
                <router-link :to="`/repositories/${repo.id}`">
                  >> ACCESS_REPO
                </router-link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <!-- Terminal Footer -->
        <div class="mt-8 pt-4 border-t border-border/30">
          <div class="text-muted-foreground font-terminal text-xs">
            pr-tracker v2.0 | cyberpunk-mode: ENABLED | repositories: {{ repositoryStore.repositories.length }}
          </div>
        </div>
      </div>
    </Terminal>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal } from '@/components/ui/terminal'
import { StatusLED } from '@/components/ui/status'
import { ASCIIHeader } from '@/components/ui/ascii'

const repositoryStore = useRepositoryStore()

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>

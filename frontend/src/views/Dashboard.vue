<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <div class="text-center py-12">
      <h1 class="text-4xl font-bold text-foreground mb-4">
        <span class="text-glow">PR</span>
        <span class="text-primary">Tracker</span>
      </h1>
      <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
        Monitor pull requests, track collaboration metrics, and optimize your development workflow
      </p>
    </div>

    <!-- Status Bar -->
    <div class="flex items-center justify-center gap-8 py-4">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-success rounded-full pulse-glow"></div>
        <span class="text-sm text-muted-foreground">System Online</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-primary rounded-full"></div>
        <span class="text-sm text-muted-foreground">{{ repositoryStore.repositories.length }} Repositories</span>
      </div>
    </div>

    <!-- Error Display -->
    <Alert v-if="repositoryStore.error" variant="destructive" class="max-w-2xl mx-auto">
      <AlertTitle class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Configuration Error
      </AlertTitle>
      <AlertDescription class="mt-2">
        {{ repositoryStore.error }}
      </AlertDescription>
      <div v-if="repositoryStore.error && repositoryStore.error.includes('GITHUB_TOKEN')" class="mt-4 p-3 bg-muted/50 rounded-md border border-muted">
        <p class="text-sm text-mono text-muted-foreground">Backend configuration required:</p>
        <code class="text-xs text-mono block mt-1 text-primary">export GITHUB_TOKEN=your_github_token_here</code>
      </div>
    </Alert>

    <!-- Empty State -->
    <div v-else-if="repositoryStore.repositories.length === 0 && !repositoryStore.loading" 
         class="text-center py-16">
      <Card class="max-w-md mx-auto" variant="minimal">
        <div class="p-8">
          <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-foreground mb-2">Ready to Start</h3>
          <p class="text-muted-foreground mb-6">
            Add your first repository to begin tracking pull requests and analyzing collaboration metrics.
          </p>
          <Button as-child class="glow-primary">
            <router-link to="/repositories">
              Add Repository
            </router-link>
          </Button>
        </div>
      </Card>
    </div>

    <!-- Repository Grid -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-foreground">Your Repositories</h2>
        <Button variant="outline" as-child>
          <router-link to="/repositories">
            Manage All
          </router-link>
        </Button>
      </div>
      
      <div class="content-grid">
        <Card 
          v-for="repo in repositoryStore.repositories" 
          :key="repo.id" 
          variant="glow"
          class="group cursor-pointer"
          @click="$router.push(`/repositories/${repo.id}`)"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-success rounded-full"></div>
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
            <Button 
              variant="terminal" 
              size="sm" 
              class="w-full"
            >
              View Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const repositoryStore = useRepositoryStore()

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy')
}
</script>

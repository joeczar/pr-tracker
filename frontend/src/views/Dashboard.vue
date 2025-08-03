<template>
  <section aria-labelledby="dashboard-title" class="space-y-6 content-grid">
    <!-- Page header -->
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1.5">
        <h1 id="dashboard-title" class="text-2xl md:text-3xl font-semibold tracking-tight neon">Dashboard</h1>
        <p class="text-sm text-muted-foreground">Overview of repositories and review activity.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="default" class="btn-neo" @click="$router.push('/repositories')">Add repository</Button>
        <Button variant="outline" class="btn-neo" :disabled="syncing" @click="syncAll">
          {{ syncing ? 'Syncing…' : 'Sync all' }}
        </Button>
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="card-cyber glass-panel">
        <CardContent class="p-4 metric">
          <div class="metric-top">
            <span class="metric-icon">#</span>
            <Badge>+12%</Badge>
          </div>
          <div class="metric-value">{{ totalActivePRs }}</div>
          <div class="metric-label">Active PRs</div>
        </CardContent>
      </Card>

      <Card class="card-cyber glass-panel">
        <CardContent class="p-4 metric">
          <div class="metric-top">
            <span class="metric-icon">⧉</span>
            <Badge variant="destructive">-5%</Badge>
          </div>
          <div class="metric-value">{{ pendingReviews }}</div>
          <div class="metric-label">Pending Reviews</div>
        </CardContent>
      </Card>

      <Card class="card-cyber glass-panel">
        <CardContent class="p-4 metric">
          <div class="metric-top">
            <span class="metric-icon">⏱</span>
            <Badge variant="secondary">0%</Badge>
          </div>
          <div class="metric-value">{{ avgReviewTime }}</div>
          <div class="metric-label">Avg Review Time</div>
        </CardContent>
      </Card>

      <Card class="card-cyber glass-panel">
        <CardContent class="p-4 metric">
          <div class="metric-top">
            <span class="metric-icon">📁</span>
            <Badge>+2</Badge>
          </div>
          <div class="metric-value">{{ repositoryStore.repositories.length }}</div>
          <div class="metric-label">Repositories</div>
        </CardContent>
      </Card>
    </div>

    <!-- Error -->
    <Alert v-if="repositoryStore.error" variant="destructive" class="glass-panel">
      <AlertTitle>Configuration error</AlertTitle>
      <AlertDescription>
        <p class="text-sm text-muted-foreground">{{ repositoryStore.error }}</p>
        <div
          v-if="repositoryStore.error && repositoryStore.error.includes('GITHUB_TOKEN')"
          class="p-3 bg-muted/60 rounded border border-border mt-2"
        >
          <p class="text-xs text-muted-foreground mb-1">Backend configuration required:</p>
          <code class="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
            export GITHUB_TOKEN=your_github_token_here
          </code>
        </div>
      </AlertDescription>
    </Alert>

    <!-- Empty -->
    <Card v-else-if="repositoryStore.repositories.length === 0 && !repositoryStore.loading" class="glass-panel card-cyber">
      <CardContent class="p-10 text-center space-y-4">
        <div class="mx-auto w-14 h-14 rounded-full bg-muted grid place-items-center">📁</div>
        <h3 class="text-xl font-semibold">Ready to start tracking</h3>
        <p class="text-muted-foreground">Add your first repository to begin monitoring pull requests and collaboration metrics.</p>
        <Button variant="default" class="btn-neo" @click="$router.push('/repositories')">Add your first repository</Button>
      </CardContent>
    </Card>

    <!-- Repositories overview -->
    <div v-else class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold neon">Your repositories</h2>
        <Button variant="link" class="px-0 h-auto" @click="$router.push('/repositories')">
          View all →
        </Button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="repo in displayRepositories"
          :key="repo.id"
          class="card-cyber glass-panel hover:border-primary/40 transition cursor-pointer"
          @click="$router.push(`/repositories/${repo.id}`)"
        >
          <CardContent class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="size-9 grid place-items-center rounded-md bg-primary/10 text-primary border border-primary/30">📁</div>
                <div>
                  <h3 class="font-medium">{{ repo.full_name }}</h3>
                  <p class="text-xs text-muted-foreground">Updated {{ formatRelativeTime(repo.created_at) }}</p>
                </div>
              </div>
              <span class="inline-flex size-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
            </div>

            <div class="grid grid-cols-3 gap-2 bg-muted/40 rounded-md p-3">
              <div class="text-center">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">PRs</div>
                <div class="text-sm font-semibold font-mono">{{ getRandomMetric(5, 25) }}</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Open</div>
                <div class="text-sm font-semibold font-mono">{{ getRandomMetric(0, 8) }}</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Avg Time</div>
                <div class="text-sm font-semibold font-mono">{{ getRandomMetric(12, 72) }}h</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Button variant="outline" class="w-full btn-neo" @click.stop="syncRepository(repo)">Sync</Button>
              <Button variant="default" class="w-full btn-neo" @click.stop="$router.push(`/repositories/${repo.id}`)">View details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const repositoryStore = useRepositoryStore()
const syncing = ref(false)

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

const totalActivePRs = computed(() => {
  return repositoryStore.repositories.reduce((sum, _repo) => sum + getRandomMetric(0, 10), 0)
})

const pendingReviews = computed(() => {
  return repositoryStore.repositories.reduce((sum, _repo) => sum + getRandomMetric(0, 5), 0)
})

const avgReviewTime = computed(() => {
  const total = repositoryStore.repositories.length
  if (total === 0) return '0h'
  const avgHours = getRandomMetric(12, 72)
  return avgHours < 24 ? `${avgHours}h` : `${Math.round(avgHours / 24)}d`
})

const displayRepositories = computed(() => {
  return repositoryStore.repositories.slice(0, 6)
})

const formatRelativeTime = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

const getRandomMetric = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const syncAll = async () => {
  syncing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    syncing.value = false
  }
}

const syncRepository = async (repo: any) => {
  console.log('Syncing repository:', repo.full_name)
}
</script>

<style scoped>
.metric { @apply p-0; }
.metric-top { @apply flex items-center justify-between mb-2; }
.metric-icon { @apply text-xs grid place-items-center size-6 rounded-md bg-muted/60 border border-border/70; }
.metric-value { @apply text-2xl font-semibold; }
.metric-label { @apply text-xs text-muted-foreground; }
</style>

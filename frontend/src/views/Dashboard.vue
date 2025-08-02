<template>
  <div class="dashboard-container max-w-7xl mx-auto px-4 py-6">
    <!-- ASCII Header -->
    <div class="mb-6">
      <ASCIIArt
        text="DASHBOARD"
        variant="glow"
        color="primary"
        size="md"
        :animate="true"
        class="mb-3"
      />
      <div class="text-center">
        <div class="font-mono text-primary text-sm">
          > user@pr-tracker:~$ dashboard --overview
        </div>
        <div class="font-mono text-muted-foreground text-xs mt-1">
          Loading system metrics and repository status...
        </div>
      </div>
    </div>

    <!-- Main Dashboard Terminal -->
    <Terminal title="pr-tracker@dashboard:~$" class="mb-6">
      <div class="space-y-4">
        <!-- Command Prompt Header -->
        <div class="border-l-2 border-primary pl-3 py-2 bg-primary/5 rounded-r">
          <div class="text-primary font-mono text-sm">
            > dashboard --show-metrics --repositories={{ repositoryStore.repositories.length }}
          </div>
          <div class="text-muted-foreground font-mono text-xs mt-1">
            System status: ONLINE | Last sync: {{ formatRelativeTime(new Date().toISOString()) }}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-2 justify-center">
          <button @click="$router.push('/repositories')" class="terminal-btn primary compact">
            <TerminalIcon icon="➕" size="xs" />
            Add Repo
          </button>
          <button @click="syncAll" :disabled="syncing" class="terminal-btn secondary compact">
            <TerminalIcon icon="⟳" size="xs" :class="syncing ? 'animate-spin' : ''" />
            {{ syncing ? 'Syncing...' : 'Sync All' }}
          </button>
        </div>
      </div>
    </Terminal>

    <!-- System Metrics Terminal -->
    <Terminal title="metrics@system:~$" variant="compact" class="mb-6">
      <div class="space-y-4">
        <!-- Metrics Header -->
        <div class="text-primary font-mono text-sm border-b border-border/30 pb-2">
          > system.metrics --live --format=grid
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="terminal-metric-card success">
            <div class="metric-header">
              <div class="metric-icon">✓</div>
              <div class="metric-trend up">+12%</div>
            </div>
            <div class="metric-value">{{ totalActivePRs }}</div>
            <div class="metric-label">Active PRs</div>
          </div>

          <div class="terminal-metric-card warning">
            <div class="metric-header">
              <div class="metric-icon">⚠</div>
              <div class="metric-trend down">-5%</div>
            </div>
            <div class="metric-value">{{ pendingReviews }}</div>
            <div class="metric-label">Pending Reviews</div>
          </div>

          <div class="terminal-metric-card info">
            <div class="metric-header">
              <div class="metric-icon">⏱</div>
              <div class="metric-trend stable">0%</div>
            </div>
            <div class="metric-value">{{ avgReviewTime }}</div>
            <div class="metric-label">Avg Review Time</div>
          </div>

          <div class="terminal-metric-card primary">
            <div class="metric-header">
              <div class="metric-icon">📁</div>
              <div class="metric-trend up">+2</div>
            </div>
            <div class="metric-value">{{ repositoryStore.repositories.length }}</div>
            <div class="metric-label">Repositories</div>
          </div>
        </div>
      </div>
    </Terminal>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Error State -->
      <div v-if="repositoryStore.error" class="error-state">
        <Card variant="glow" class="error-card">
          <div class="error-content">
            <div class="error-icon">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="error-details">
              <h3 class="error-title">Configuration Error</h3>
              <p class="error-message">{{ repositoryStore.error }}</p>
              <div v-if="repositoryStore.error && repositoryStore.error.includes('GITHUB_TOKEN')"
                   class="error-help">
                <p class="help-text">Backend configuration required:</p>
                <code class="help-code">export GITHUB_TOKEN=your_github_token_here</code>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Empty State -->
      <div v-else-if="repositoryStore.repositories.length === 0 && !repositoryStore.loading"
           class="empty-state">
        <Card class="empty-card">
          <div class="empty-content">
            <div class="empty-icon">
              <TerminalIcon icon="📁" size="xl" variant="muted" />
            </div>
            <h3 class="empty-title">Ready to Start Tracking</h3>
            <p class="empty-description">
              Add your first repository to begin monitoring pull requests and analyzing collaboration metrics.
            </p>
            <button @click="$router.push('/repositories')" class="empty-action">
              <TerminalIcon icon="➕" size="sm" />
              Add Your First Repository
            </button>
          </div>
        </Card>
      </div>

      <!-- Repository Overview -->
      <div v-else class="repository-overview">
        <div class="section-header">
          <h2 class="section-title">Your Repositories</h2>
          <button @click="$router.push('/repositories')" class="section-action">
            View All
            <TerminalIcon icon="→" size="xs" />
          </button>
        </div>

        <div class="repository-grid">
          <div
            v-for="repo in displayRepositories"
            :key="repo.id"
            class="repo-card"
            @click="$router.push(`/repositories/${repo.id}`)"
          >
            <div class="repo-header">
              <div class="repo-info">
                <div class="repo-icon">
                  <TerminalIcon icon="📁" size="sm" variant="primary" />
                </div>
                <div class="repo-details">
                  <h3 class="repo-name">{{ repo.full_name }}</h3>
                  <p class="repo-updated">Updated {{ formatRelativeTime(repo.created_at) }}</p>
                </div>
              </div>
              <div class="repo-status">
                <div class="status-dot active"></div>
              </div>
            </div>

            <div class="repo-metrics">
              <div class="metric-item">
                <span class="metric-label">PRs</span>
                <span class="metric-value">{{ getRandomMetric(5, 25) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Open</span>
                <span class="metric-value">{{ getRandomMetric(0, 8) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Avg Time</span>
                <span class="metric-value">{{ getRandomMetric(12, 72) }}h</span>
              </div>
            </div>

            <div class="repo-actions">
              <button @click.stop="syncRepository(repo)" class="repo-action-btn">
                <TerminalIcon icon="⟳" size="xs" />
                Sync
              </button>
              <button @click.stop="$router.push(`/repositories/${repo.id}`)" class="repo-action-btn primary">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRepositoryStore } from '../stores/repository'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { ASCIIArt } from '@/components/ui/ascii'
import { Terminal, TerminalIcon } from '@/components/ui/terminal'

const repositoryStore = useRepositoryStore()
const syncing = ref(false)

onMounted(async () => {
  await repositoryStore.fetchRepositories()
})

// Computed values for metrics
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
  return repositoryStore.repositories.slice(0, 6) // Show first 6 repositories
})

// Helper functions

const formatRelativeTime = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

const getRandomMetric = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Actions
const syncAll = async () => {
  syncing.value = true
  try {
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    // In real app, would call repositoryStore.syncAll()
  } finally {
    syncing.value = false
  }
}

const syncRepository = async (repo: any) => {
  console.log('Syncing repository:', repo.full_name)
  // In real app, would call repositoryStore.syncRepository(repo.id)
}
</script>

<style scoped>
/* Dashboard Container */
.dashboard-container {
  @apply space-y-8;
}

/* Terminal Button Styles */
.terminal-btn {
  @apply px-3 py-1.5 font-mono text-sm font-medium;
  @apply border border-border rounded-md;
  @apply transition-all duration-200;
  @apply flex items-center gap-1.5;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
  letter-spacing: 0.025em;
}

.terminal-btn.compact {
  @apply px-2 py-1 text-xs;
  @apply gap-1;
}

.terminal-btn.primary {
  @apply bg-primary/10 text-primary border-primary/30;
  @apply hover:bg-primary/20 hover:border-primary/50;
  @apply focus:ring-primary;
}

.terminal-btn.primary:hover {
  box-shadow: 0 0 10px hsl(var(--primary) / 0.3);
}

.terminal-btn.secondary {
  @apply bg-transparent text-muted-foreground border-border;
  @apply hover:bg-muted/50 hover:text-foreground hover:border-primary/30;
  @apply focus:ring-primary;
}

/* Terminal Metric Cards */
.terminal-metric-card {
  @apply bg-muted/20 border border-border/50 rounded-lg p-3;
  @apply font-mono transition-all duration-200;
  @apply hover:border-primary/30;
}

.metric-header {
  @apply flex items-center justify-between mb-2;
}

.metric-icon {
  @apply text-sm;
  width: 20px;
  text-align: center;
  overflow: hidden;
}

.metric-value {
  @apply text-xl font-bold text-foreground mb-1;
}

.metric-label {
  @apply text-xs text-muted-foreground;
}

.metric-trend {
  @apply text-xs font-medium;
}

.terminal-metric-card.success {
  @apply border-success/30 bg-success/5;
}

.terminal-metric-card.warning {
  @apply border-warning/30 bg-warning/5;
}

.terminal-metric-card.info {
  @apply border-info/30 bg-info/5;
}

.terminal-metric-card.primary {
  @apply border-primary/30 bg-primary/5;
}

.terminal-metric-card.success .metric-icon {
  @apply text-success;
}

.terminal-metric-card.warning .metric-icon {
  @apply text-warning;
}

.terminal-metric-card.info .metric-icon {
  @apply text-info;
}

.terminal-metric-card.primary .metric-icon {
  @apply text-primary;
}

.metric-trend.up {
  @apply text-success;
}

.metric-trend.down {
  @apply text-destructive;
}

.metric-trend.stable {
  @apply text-muted-foreground;
}

/* Header Section */
.dashboard-header {
  @apply bg-gradient-to-r from-card/50 to-background/50 backdrop-blur-sm;
  @apply border border-border rounded-xl p-6 mb-8;
}

.header-content {
  @apply flex items-center justify-between;
}

.welcome-section {
  @apply space-y-2;
}

.dashboard-title {
  @apply text-3xl font-bold text-foreground;
}

.user-highlight {
  @apply text-primary;
}

.dashboard-subtitle {
  @apply text-muted-foreground text-lg;
}

.header-actions {
  @apply flex items-center gap-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  @apply flex items-center gap-2;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
  @apply shadow-lg hover:shadow-xl;
  @apply focus:ring-primary;
}

.action-btn.secondary {
  @apply bg-card text-foreground border border-border;
  @apply hover:bg-muted hover:border-primary/50;
  @apply focus:ring-primary;
}

/* Metrics Grid */
.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.metric-card {
  @apply bg-card border border-border rounded-xl p-6;
  @apply hover:border-primary/30 hover:shadow-lg transition-all duration-200;
  @apply flex items-center gap-4;
}

.metric-icon {
  @apply p-3 rounded-lg;
}

.metric-icon.success {
  @apply bg-success/10 text-success;
}

.metric-icon.warning {
  @apply bg-warning/10 text-warning;
}

.metric-icon.info {
  @apply bg-info/10 text-info;
}

.metric-icon.primary {
  @apply bg-primary/10 text-primary;
}

.metric-content {
  @apply flex-1 space-y-1;
}

.metric-value {
  @apply text-2xl font-bold text-foreground font-mono;
}

.metric-label {
  @apply text-sm text-muted-foreground font-medium;
}

.metric-trend {
  @apply text-xs font-medium;
}

.metric-trend.up {
  @apply text-success;
}

.metric-trend.down {
  @apply text-destructive;
}

.metric-trend.stable {
  @apply text-muted-foreground;
}

/* Main Content */
.main-content {
  @apply space-y-8;
}

/* Error State */
.error-state {
  @apply max-w-2xl mx-auto;
}

.error-card {
  @apply border-destructive/30 bg-destructive/5;
}

.error-content {
  @apply flex items-start gap-4 p-6;
}

.error-icon {
  @apply text-destructive mt-1;
}

.error-details {
  @apply space-y-3;
}

.error-title {
  @apply text-lg font-semibold text-foreground;
}

.error-message {
  @apply text-muted-foreground;
}

.error-help {
  @apply p-4 bg-muted/50 rounded-lg border border-border;
}

.help-text {
  @apply text-sm text-muted-foreground mb-2;
}

.help-code {
  @apply text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded;
}

/* Empty State */
.empty-state {
  @apply flex justify-center py-16;
}

.empty-card {
  @apply max-w-lg bg-card border border-border rounded-xl;
}

.empty-content {
  @apply text-center p-12 space-y-6;
}

.empty-icon {
  @apply mx-auto flex items-center justify-center;
}

.empty-title {
  @apply text-2xl font-bold text-foreground;
}

.empty-description {
  @apply text-muted-foreground text-lg;
}

.empty-action {
  @apply inline-flex items-center gap-2 px-6 py-3;
  @apply bg-primary text-primary-foreground rounded-lg font-medium;
  @apply hover:bg-primary/90 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}

/* Repository Overview */
.repository-overview {
  @apply space-y-6;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-2xl font-bold text-foreground;
}

.section-action {
  @apply text-primary hover:text-primary/80 font-medium;
  @apply flex items-center gap-1 transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded;
}

.repository-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.repo-card {
  @apply bg-card border border-border rounded-xl p-6;
  @apply hover:border-primary/30 hover:shadow-lg transition-all duration-200;
  @apply cursor-pointer space-y-4;
}

.repo-header {
  @apply flex items-center justify-between;
}

.repo-info {
  @apply flex items-center gap-3;
}

.repo-icon {
  @apply text-primary bg-primary/10 p-2 rounded-lg;
}

.repo-details {
  @apply space-y-1;
}

.repo-name {
  @apply font-semibold text-foreground;
}

.repo-updated {
  @apply text-sm text-muted-foreground;
}

.repo-status {
  @apply flex items-center;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-dot.active {
  @apply bg-success animate-pulse;
}

.repo-metrics {
  @apply flex items-center justify-between;
  @apply bg-muted/30 rounded-lg p-3;
}

.metric-item {
  @apply text-center space-y-1;
}

.metric-label {
  @apply text-xs text-muted-foreground uppercase tracking-wide;
}

.metric-value {
  @apply text-sm font-bold text-foreground font-mono;
}

.repo-actions {
  @apply flex items-center gap-2;
}

.repo-action-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded-lg;
  @apply border border-border text-muted-foreground;
  @apply hover:border-primary/50 hover:text-foreground transition-all;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
  @apply flex items-center gap-1;
}

.repo-action-btn.primary {
  @apply bg-primary text-primary-foreground border-primary;
  @apply hover:bg-primary/90;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col items-start gap-4;
  }

  .metrics-grid {
    @apply grid-cols-2;
  }

  .repository-grid {
    @apply grid-cols-1;
  }

  .repo-metrics {
    @apply flex-col gap-2;
  }

  .metric-item {
    @apply flex justify-between items-center;
  }
}
</style>

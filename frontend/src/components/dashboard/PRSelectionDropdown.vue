<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'

import { useSelectionStore } from '@/stores/selection'
import { pullRequestsApi, type PullRequest } from '@/lib/api/pullRequests'
import { repositoriesApi, type Repository } from '@/lib/api/repositories'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const router = useRouter()
const sel = useSelectionStore()

const isOpen = ref(false)

const hasSelection = computed(() => sel.hasSelection.value)
const selectedCount = computed(() => sel.selectedPullRequestNumbers.value.length)
const repositoryId = computed(() => sel.selectedRepositoryId.value)

// Fetch repository details when we have a selected repository
const { data: repository } = useQuery({
  queryKey: ['repository', repositoryId],
  queryFn: () => repositoryId.value ? repositoriesApi.get(repositoryId.value) : null,
  enabled: computed(() => repositoryId.value != null),
})

// Fetch selected PRs details when we have selections
const { data: selectedPRs, isLoading: isLoadingPRs } = useQuery({
  queryKey: ['repository-prs-selected', repositoryId, sel.selectedPullRequestNumbers],
  queryFn: async (): Promise<PullRequest[]> => {
    if (!repositoryId.value || sel.selectedPullRequestNumbers.value.length === 0) return []
    
    try {
      // Fetch all PRs for the repository and filter to selected ones
      const allPRs = await pullRequestsApi.listByRepo(repositoryId.value, { limit: 100 })
      const selectedNumbers = new Set(sel.selectedPullRequestNumbers.value)
      return allPRs.filter(pr => selectedNumbers.has(pr.number))
    } catch (error) {
      console.warn('Failed to fetch selected PR details:', error)
      return []
    }
  },
  enabled: computed(() => hasSelection.value),
})

const dropdownLabel = computed(() => {
  if (!hasSelection.value) {
    return 'No PRs Selected'
  }
  if (selectedCount.value === 1) {
    return '1 PR Selected'
  }
  return `${selectedCount.value} PRs Selected`
})

const repositoryName = computed(() => {
  return repository.value?.full_name || repository.value?.name || 'Repository'
})

function goToRepositories() {
  isOpen.value = false
  router.push({ name: 'repositories' })
}

function goToRepository() {
  if (repositoryId.value) {
    isOpen.value = false
    router.push({ 
      name: 'repository-detail', 
      params: { id: repositoryId.value } 
    })
  }
}

function switchToPR(prNumber: number) {
  if (repositoryId.value) {
    isOpen.value = false
    router.push({ 
      name: 'repository-detail', 
      params: { id: repositoryId.value },
      query: { pr: prNumber }
    })
  }
}

function clearSelection() {
  sel.clearSelection()
  isOpen.value = false
}

// Format PR state for display
function formatPRState(state: string): string {
  switch (state) {
    case 'merged': return '✓'
    case 'closed': return '✕'
    case 'open': return '○'
    default: return '?'
  }
}

// Get state color class
function getStateColorClass(state: string): string {
  switch (state) {
    case 'merged': return 'text-green-600 dark:text-green-400'
    case 'closed': return 'text-red-600 dark:text-red-400'
    case 'open': return 'text-blue-600 dark:text-blue-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs font-mono"
        :class="hasSelection ? 'border-cyber-accent text-cyber-accent' : 'border-muted-foreground/20'"
      >
        <span class="mr-1">▼</span>
        {{ dropdownLabel }}
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent 
      align="start" 
      class="w-80 font-mono text-xs"
      side="bottom"
    >
      <!-- Header with terminal prompt -->
      <DropdownMenuLabel class="font-mono text-xs">
        <div class="flex items-center gap-1 text-muted-foreground">
          <span class="text-cyber-accent">joeczar</span>
          <span>@</span>
          <span class="text-cyber-accent">pr-tracker</span>
          <span>:</span>
          <span>~</span>
          <span>$</span>
          <span class="text-foreground">pr-selection</span>
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <!-- Empty state -->
      <template v-if="!hasSelection">
        <DropdownMenuItem class="flex-col items-start gap-1 py-3">
          <div class="text-muted-foreground">No PRs currently selected</div>
          <div class="text-xs text-muted-foreground/70">
            Select PRs in a repository to populate dashboard metrics
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem @click="goToRepositories" class="cursor-pointer">
          <span class="mr-2">→</span>
          Go to Repositories
        </DropdownMenuItem>
      </template>

      <!-- Selected PRs state -->
      <template v-else>
        <!-- Repository context -->
        <DropdownMenuLabel class="py-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">Repository:</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-auto p-0 text-xs text-cyber-accent hover:text-cyber-accent/80"
              @click="goToRepository"
            >
              {{ repositoryName }}
            </Button>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <!-- Selected PRs list -->
        <DropdownMenuGroup>
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Selected PRs ({{ selectedCount }})
          </DropdownMenuLabel>
          
          <!-- Loading state -->
          <template v-if="isLoadingPRs">
            <DropdownMenuItem disabled class="py-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
                <span class="text-muted-foreground">Loading PR details...</span>
              </div>
            </DropdownMenuItem>
          </template>

          <!-- PR list -->
          <template v-else-if="selectedPRs && selectedPRs.length > 0">
            <DropdownMenuItem
              v-for="pr in selectedPRs.slice(0, 10)"
              :key="pr.id"
              @click="switchToPR(pr.number)"
              class="cursor-pointer py-2 px-3"
            >
              <div class="flex items-start gap-2 w-full min-w-0">
                <span :class="getStateColorClass(pr.state)" class="shrink-0 mt-0.5">
                  {{ formatPRState(pr.state) }}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1">
                    <span class="text-cyber-accent font-medium">#{{ pr.number }}</span>
                    <span class="text-muted-foreground">•</span>
                    <span class="text-xs text-muted-foreground capitalize">{{ pr.state }}</span>
                  </div>
                  <div class="text-xs text-foreground truncate mt-0.5" :title="pr.title">
                    {{ pr.title }}
                  </div>
                  <div class="text-xs text-muted-foreground/70 mt-0.5" v-if="pr.author_login">
                    by {{ pr.author_login }}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>

            <!-- Show more indicator if there are additional PRs -->
            <DropdownMenuItem 
              v-if="selectedPRs.length > 10" 
              disabled 
              class="py-1 text-center text-muted-foreground/70"
            >
              ... and {{ selectedPRs.length - 10 }} more
            </DropdownMenuItem>
          </template>

          <!-- Fallback for selected numbers without PR details -->
          <template v-else-if="sel.selectedPullRequestNumbers.value.length > 0">
            <DropdownMenuItem
              v-for="prNumber in sel.selectedPullRequestNumbers.value.slice(0, 10)"
              :key="prNumber"
              @click="switchToPR(prNumber)"
              class="cursor-pointer py-2"
            >
              <span class="text-cyber-accent">#{{ prNumber }}</span>
              <span class="text-muted-foreground ml-2 text-xs">(details loading...)</span>
            </DropdownMenuItem>
          </template>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <!-- Actions -->
        <DropdownMenuGroup>
          <DropdownMenuItem @click="goToRepository" class="cursor-pointer">
            <span class="mr-2">→</span>
            Manage Selection
          </DropdownMenuItem>
          <DropdownMenuItem @click="clearSelection" class="cursor-pointer text-destructive">
            <span class="mr-2">✕</span>
            Clear All
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
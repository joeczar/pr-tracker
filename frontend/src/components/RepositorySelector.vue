<template>
  <div class="space-y-2">
    <Label v-if="label" :for="selectId" class="text-sm font-medium text-primary">
      {{ label }}
    </Label>
    
    <Select 
      :model-value="selectedValue" 
      @update:model-value="handleSelectionChange"
      :disabled="loading || disabled"
    >
      <SelectTrigger 
        :id="selectId"
        variant="terminal" 
        :class="cn('w-full', triggerClass)"
      >
        <SelectValue 
          :placeholder="loading ? 'Loading repositories...' : placeholder" 
        />
      </SelectTrigger>
      
      <SelectContent variant="terminal" class="max-h-[300px]">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-4">
          <div class="text-primary/70 font-mono text-sm">
            <span class="animate-pulse">◉</span> Loading repositories...
          </div>
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="flex items-center justify-center py-4">
          <div class="text-destructive font-mono text-sm">
            ⚠ {{ error }}
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="!repositories.length" class="flex items-center justify-center py-4">
          <div class="text-muted-foreground font-mono text-sm">
            No repositories found
          </div>
        </div>
        
        <!-- Repository list -->
        <template v-else>
          <!-- Search input if searchable -->
          <div v-if="searchable" class="p-2 border-b border-primary/20">
            <Input
              v-model="searchQuery"
              placeholder="Search repositories..."
              variant="terminal"
              class="h-8 text-xs"
            />
          </div>
          
          <!-- Repository items -->
          <SelectItem
            v-for="repo in filteredRepositories"
            :key="repo.id"
            :value="repo.full_name"
            variant="terminal"
            class="cursor-pointer"
          >
            <div class="flex items-center justify-between w-full">
              <div class="flex-1 min-w-0">
                <div class="font-mono text-sm text-primary truncate">
                  {{ repo.full_name }}
                </div>
                <div v-if="repo.description" class="text-xs text-muted-foreground truncate mt-0.5">
                  {{ repo.description }}
                </div>
              </div>
              <div class="flex items-center gap-2 ml-2 flex-shrink-0">
                <span v-if="repo.language" class="text-xs text-primary/60 font-mono">
                  {{ repo.language }}
                </span>
                <span v-if="repo.private" class="text-xs text-warning">🔒</span>
                <span v-else class="text-xs text-success">📖</span>
              </div>
            </div>
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
    
    <!-- Selected repository details -->
    <div v-if="selectedRepository" class="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
      <div class="text-sm font-mono text-primary">
        Selected: {{ selectedRepository.full_name }}
      </div>
      <div v-if="selectedRepository.description" class="text-xs text-muted-foreground mt-1">
        {{ selectedRepository.description }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-xs text-primary/70">
        <span>{{ selectedRepository.private ? 'Private' : 'Public' }}</span>
        <span v-if="selectedRepository.language">{{ selectedRepository.language }}</span>
        <span>Updated {{ formatDate(selectedRepository.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRepositoryStore } from '@/stores/repository'
import type { RepositoryOption } from '@shared/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  triggerClass?: string
  autoLoad?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', repository: RepositoryOption): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select a repository...',
  disabled: false,
  searchable: true,
  autoLoad: true
})

const emit = defineEmits<Emits>()

// Generate unique ID for accessibility
const selectId = `repository-select-${Math.random().toString(36).substr(2, 9)}`

// Repository store
const repositoryStore = useRepositoryStore()

// Local state
const repositories = ref<RepositoryOption[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedValue = ref(props.modelValue || '')

// Computed
const filteredRepositories = computed(() => {
  if (!searchQuery.value) return repositories.value
  
  const query = searchQuery.value.toLowerCase()
  return repositories.value.filter(repo => 
    repo.full_name.toLowerCase().includes(query) ||
    repo.description?.toLowerCase().includes(query) ||
    repo.language?.toLowerCase().includes(query)
  )
})

const selectedRepository = computed(() => {
  return repositories.value.find(repo => repo.full_name === selectedValue.value)
})

// Methods
const fetchRepositories = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await repositoryStore.fetchAvailableRepositories()
    repositories.value = response || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch repositories'
    console.error('Failed to fetch repositories:', err)
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (value: string) => {
  selectedValue.value = value
  emit('update:modelValue', value)
  
  const repository = repositories.value.find(repo => repo.full_name === value)
  if (repository) {
    emit('select', repository)
  }
}

const formatDate = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedValue.value = newValue || ''
})

// Lifecycle
onMounted(() => {
  if (props.autoLoad) {
    fetchRepositories()
  }
})

// Expose methods for parent components
defineExpose({
  fetchRepositories,
  refresh: fetchRepositories
})
</script>

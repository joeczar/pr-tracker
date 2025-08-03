<script setup lang="ts">
import { computed } from 'vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
/**
 * shadcn-vue card primitives
 */
import Card from '@/components/ui/card/Card.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
/**
 * shadcn-vue badge
 */
import Badge from '@/components/ui/badge/Badge.vue'
/**
 * shadcn-vue dropdown menu primitives
 */
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type RepoStatus = 'idle' | 'syncing' | 'error' | 'ok'

interface RecentPR {
  id: number | string
  title: string
  state: 'open' | 'merged' | 'closed' | 'draft' | 'review'
  comments: number
  updatedAt: string
}

const props = defineProps<{
  owner: string
  name: string
  description?: string
  stats: {
    prs: number
    avgCommentsPerPR: number
    changeRequestRate: number // percent 0-100
    lastSync: string
  }
  recent?: RecentPR[]
  status?: RepoStatus
}>()

const emit = defineEmits<{
  (e: 'view'): void
  (e: 'sync'): void
  (e: 'remove'): void
}>()

const repoFullName = computed(() => `${props.owner}/${props.name}`)
const statusLabel = computed(() => {
  switch (props.status) {
    case 'syncing':
      return 'Syncing…'
    case 'error':
      return 'Error'
    case 'ok':
      return 'Up to date'
    default:
      return 'Idle'
  }
})
</script>

<template>
  <Card class="p-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <CardHeader class="p-0">
            <CardTitle class="text-lg font-mono font-semibold text-cyan-700 dark:text-cyan-300">
              {{ repoFullName }}
            </CardTitle>
          </CardHeader>
          <!-- Status badge -->
          <Badge
            :variant="status === 'error' ? 'destructive' : status === 'syncing' ? 'secondary' : status === 'ok' ? 'default' : 'outline'"
            :aria-label="statusLabel"
            :title="statusLabel"
          >
            {{ statusLabel }}
          </Badge>
        </div>

        <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">
          {{ description }}
        </p>

        <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Card class="rounded p-2 border-slate-200 bg-white/60 dark:border-cyan-900/40 dark:bg-cyan-900/10">
            <div class="text-slate-600 dark:text-cyan-300 font-mono">PRs</div>
            <div class="font-mono text-slate-900 dark:text-cyan-100 text-base">{{ stats.prs }}</div>
          </Card>
          <Card class="rounded p-2 border-slate-200 bg-white/60 dark:border-fuchsia-900/40 dark:bg-fuchsia-900/10">
            <div class="text-slate-600 dark:text-fuchsia-300 font-mono">Avg Cmt/PR</div>
            <div class="font-mono text-slate-900 dark:text-fuchsia-100 text-base">{{ stats.avgCommentsPerPR.toFixed(1) }}</div>
          </Card>
          <Card class="rounded p-2 border-slate-200 bg-white/60 dark:border-emerald-900/40 dark:bg-emerald-900/10">
            <div class="text-slate-600 dark:text-emerald-300 font-mono">CR Rate</div>
            <div class="font-mono text-slate-900 dark:text-emerald-100 text-base">{{ stats.changeRequestRate }}%</div>
          </Card>
          <Card class="rounded p-2 border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-800/30">
            <div class="text-slate-600 dark:text-slate-300 font-mono">Last Sync</div>
            <div class="font-mono text-slate-900 dark:text-slate-100 text-base">{{ stats.lastSync }}</div>
          </Card>
        </div>
      </div>

      <!-- Actions: shadcn dropdown for consistent menu patterns -->
      <div class="sm:justify-end flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger class="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-mono cursor-pointer
                   bg-white text-slate-700 border-slate-300 hover:bg-slate-50
                   dark:bg-transparent dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800/40"
            aria-label="Repository actions menu"
          >
            Actions ▾
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44 font-mono text-xs">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              :disabled="status === 'syncing'"
              @click="emit('sync')"
              class="cursor-pointer"
            >
              <span v-if="status === 'syncing'" class="inline-flex items-center gap-1">
                <span class="animate-spin" aria-hidden="true">⏳</span> Syncing…
              </span>
              <span v-else>Sync</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('view')" class="cursor-pointer">
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              @click="emit('remove')"
              aria-label="Remove repository"
              title="Remove repository"
              class="text-rose-700 dark:text-rose-300 focus:text-rose-700 dark:focus:text-rose-300 cursor-pointer"
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div v-if="recent?.length" class="mt-4">
      <h4 class="text-sm font-mono text-slate-600 dark:text-slate-300 mb-2">Recent PRs</h4>
      <ul class="space-y-1" role="list">
        <li
          v-for="pr in recent"
          :key="pr.id"
          class="flex items-center justify-between rounded border px-3 py-2
                 border-slate-200 bg-white/70 hover:bg-slate-50
                 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono"
              :class="{
                'text-emerald-600 dark:text-emerald-300': pr.state === 'merged',
                'text-cyan-700 dark:text-cyan-300': pr.state === 'open' || pr.state === 'review',
                'text-slate-600 dark:text-slate-300': pr.state === 'draft',
                'text-rose-700 dark:text-rose-300': pr.state === 'closed',
              }"
              aria-hidden="true"
            >#{{ pr.id }}</span>
            <span class="text-sm font-mono text-slate-900 dark:text-slate-100">{{ pr.title }}</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
            <span aria-label="Comments">💬 {{ pr.comments }}</span>
            <span aria-label="Updated">{{ pr.updatedAt }}</span>
          </div>
        </li>
      </ul>
    </div>
  </Card>
</template>

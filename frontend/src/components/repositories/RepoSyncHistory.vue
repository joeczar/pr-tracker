<script setup lang="ts">
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'

type HistoryItem = {
  id: number
  status: 'queued' | 'running' | 'completed' | 'failed' | string
  type?: string
  started_at?: string
  finished_at?: string
  job_id?: string
}

const _props = defineProps<{
  items: HistoryItem[]
  loading?: boolean
  error?: string | null
  limit: number
}>()

const _emit = defineEmits<{
  (e: 'update:limit', value: number): void
  (e: 'refresh'): void
}>()
</script>

<template>
  <TerminalWindow>
    <template #title>
      <TerminalHeader>
        <template #title>
          <TerminalTitle command="sync-history" />
        </template>
        <template #actions>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500" for="history-limit">Limit</label>
            <select
              id="history-limit"
              class="border rounded px-2 py-1 text-sm bg-background"
              :value="limit"
              @change="$emit('update:limit', Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <TerminalButton size="sm" variant="ghost" aria-label="Refresh sync history" @click="$emit('refresh')">
              Refresh
            </TerminalButton>
          </div>
        </template>
      </TerminalHeader>
    </template>

    <div class="p-3">
      <div v-if="loading" class="text-sm text-slate-500">Loading history…</div>
      <div v-else-if="error" class="text-sm text-rose-600">
        {{ error }}
      </div>
      <div v-else>
        <div v-if="!items || items.length === 0" class="text-sm text-slate-500">
          No sync events yet.
        </div>
        <ul v-else class="divide-y divide-slate-200 dark:divide-slate-800 rounded border border-slate-200 dark:border-slate-800">
          <li v-for="item in items" :key="item.id" class="p-3 flex items-center justify-between text-sm">
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs opacity-70">#{{ item.id }}</span>
              <span class="font-medium">{{ item.type || 'incremental' }}</span>
              <span
                class="text-xs px-2 py-0.5 rounded border"
                :class="item.status === 'completed' ? 'border-emerald-400 text-emerald-600' :
                        item.status === 'queued' ? 'border-amber-400 text-amber-600' :
                        item.status === 'running' ? 'border-sky-400 text-sky-600' :
                        'border-rose-400 text-rose-600'"
              >
                {{ item.status }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-500">
              <span>{{ new Date(item.started_at || item.finished_at || new Date().toISOString()).toLocaleString() }}</span>
              <a
                v-if="item.job_id"
                class="underline hover:no-underline"
                :href="`/api/sync/job/${item.job_id}`"
                target="_blank"
                rel="noreferrer"
              >
                Job {{ item.job_id }}
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </TerminalWindow>
</template>

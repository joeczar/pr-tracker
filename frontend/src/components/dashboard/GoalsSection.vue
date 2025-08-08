<script setup lang="ts">
import { computed, ref } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import ProgressRadial from '@/components/analytics/ProgressRadial.vue'
import { useSelectionStore } from '@/stores/selection'

const _props = defineProps<{
  reducedMotion: boolean
}>()

const sel = useSelectionStore()
const hasSelection = computed(() => sel.hasSelection.value)

// Placeholder goals until Step 3 wiring derives values from metrics
const goals = ref([
  { label: 'Smaller PRs', value: 78, goalLabel: '< 3 comments/PR avg' },
  { label: 'Faster Reviews', value: 61, goalLabel: '< 24h time-to-first-review' },
])

const emptyGoals = computed(() => ([
  { label: 'Smaller PRs', value: 0, goalLabel: '< 3 comments/PR avg', disabled: true, helpText: 'Select PRs to populate goals' },
  { label: 'Faster Reviews', value: 0, goalLabel: '< 24h time-to-first-review', disabled: true, helpText: 'Select PRs to populate goals' },
]))
</script>

<template>
  <TerminalWindow>
    <template #title>
      <TerminalHeader>
        <template #title>
          <TerminalTitle command="goals" />
        </template>
      </TerminalHeader>
    </template>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Empty state: show disabled/faded radials with tooltip and stable layout -->
      <template v-if="!hasSelection">
        <div
          v-for="(g, i) in emptyGoals"
          :key="'empty-goal-' + i"
          class="group relative opacity-60 saturate-0 flex items-center justify-center"
        >
          <div class="relative inline-flex">
            <ProgressRadial
              :value="g.value"
              :label="g.label"
              :goal-label="g.goalLabel"
              :reduced-motion="_props.reducedMotion"
              aria-description="No data yet"
            />
            <div
              class="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-mono text-white shadow-md group-hover:block"
              role="tooltip"
            >
              {{ g.helpText }}
            </div>
          </div>
        </div>
      </template>

      <!-- Data (placeholder values until Step 3 derivation) -->
      <template v-else>
        <div
          v-for="(g, i) in goals"
          :key="i"
          class="flex items-center justify-center"
        >
          <ProgressRadial
            :value="g.value"
            :label="g.label"
            :goal-label="g.goalLabel"
            :reduced-motion="_props.reducedMotion"
          />
        </div>
      </template>
    </div>
  </TerminalWindow>
</template>

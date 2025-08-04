<script setup lang="ts">
import { ref } from 'vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import ProgressRadial from '@/components/analytics/ProgressRadial.vue'

const props = defineProps<{
  reducedMotion: boolean
}>()

// Placeholder goals until Step 3 wiring derives values from metrics
const goals = ref([
  { label: 'Smaller PRs', value: 78, goalLabel: '< 3 comments/PR avg' },
  { label: 'Faster Reviews', value: 61, goalLabel: '< 24h time-to-first-review' },
])
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
      <ProgressRadial
        v-for="(g, i) in goals"
        :key="i"
        :value="g.value"
        :label="g.label"
        :goal-label="g.goalLabel"
        :reduced-motion="reducedMotion"
      />
    </div>
  </TerminalWindow>
</template>

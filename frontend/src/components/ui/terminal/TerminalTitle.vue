<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

defineProps<{
  path?: string
  command?: string
}>()

const auth = useAuthStore()
</script>

<template>
  <div class="text-xs font-mono text-slate-600 dark:text-slate-400">
    <span class="text-cyber-secondary">{{ auth.user?.login || 'user' }}</span
    ><span class="text-slate-500">@</span
    ><span class="text-cyber-accent">pr-tracker</span
    >:<span class="text-cyber-primary">~</span
    ><span class="text-slate-500">$</span>
    <span v-if="command">&nbsp;{{ command }}</span>
    <span v-else-if="path">&nbsp;cd {{ path }}</span>
    <slot />
    <!-- <span class="ml-0.5 animate-[blink_1s_step-end_infinite] border-r-2 border-cyber-primary" aria-hidden="true"></span> -->
  </div>
</template>

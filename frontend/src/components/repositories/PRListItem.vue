<script setup lang="ts">
type PR = {
  id: number
  number: number
  title: string
  state: string
  author_login?: string
  created_at?: string
  comments?: number
}

const props = defineProps<{
  pr: PR
  checked: boolean
  selectable?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', prNumber: number, nextChecked: boolean): void
}>()

function onChange(e: Event) {
  const next = (e.target as HTMLInputElement).checked
  emit('toggle', props.pr.number, next)
}
</script>

<template>
  <div
    class="rounded border border-cyber-border bg-cyber-surface/60 p-3"
    :class="checked ? 'ring-2 ring-cyber-accent' : ''"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <input
          v-if="selectable !== false"
          type="checkbox"
          class="h-4 w-4 accent-[var(--cyber-accent,#ea00d9)]"
          :aria-label="`Select PR #${pr.number}`"
          :checked="checked"
          @change="onChange"
        />
        <div class="font-medium">{{ pr.title }}</div>
      </div>
      <div class="text-xs text-cyber-muted">#{{ pr.number }} • {{ pr.state }}</div>
    </div>
    <div class="text-xs text-cyber-muted mt-0.5">
      <span>{{ pr.author_login }}</span>
      <span v-if="pr.created_at"> • {{ new Date(pr.created_at).toLocaleDateString() }}</span>
      <span v-if="typeof pr.comments !== 'undefined'"> • 💬 {{ pr.comments }}</span>
    </div>
    <slot />
  </div>
</template>

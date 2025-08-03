<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watchEffect } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'polite' | 'assertive'
  message?: string
  as?: string
  // When true, briefly clears then re-announces same text so SRs re-read identical messages
  reannounceOnSame?: boolean
}>(), {
  mode: 'polite',
  message: '',
  as: 'div',
  reannounceOnSame: true
})

const liveText = ref<string>('')

// For cases where same message should be re-announced (e.g., repeated sync updates)
let lastAnnounced = ''
let reannounceTimer: number | undefined

watchEffect(() => {
  const msg = props.message ?? ''
  if (!props.reannounceOnSame) {
    liveText.value = msg
    lastAnnounced = msg
    return
  }
  if (msg === lastAnnounced && msg) {
    // Clear then set again on next tick to force SRs to re-read
    liveText.value = ''
    // small timeout to ensure DOM update is processed
    window.clearTimeout(reannounceTimer)
    reannounceTimer = window.setTimeout(() => {
      liveText.value = msg
      lastAnnounced = msg
    }, 35)
  } else {
    liveText.value = msg
    lastAnnounced = msg
  }
})

onBeforeUnmount(() => {
  if (reannounceTimer) window.clearTimeout(reannounceTimer)
})
</script>

<template>
  <!-- Render as chosen tag for flexibility (div by default).
       Hidden visually but exposed to screen readers. -->
  <component
    :is="as"
    :aria-live="mode"
    aria-atomic="true"
    class="sr-only"
  >
    {{ liveText }}
  </component>
</template>

<style scoped>
/* Ensure element is visually hidden but accessible to SRs */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
</style>

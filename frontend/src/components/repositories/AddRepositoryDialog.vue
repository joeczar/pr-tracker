<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { z } from 'zod'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'

/**
 * shadcn-vue dialog primitives
 */
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import DialogClose from '@/components/ui/dialog/DialogClose.vue'

/**
 * shadcn-vue input/label + form primitives
 */
import Input from '@/components/ui/input/Input.vue'
import { Label } from '@/components/ui/label'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: { owner: string; name: string; url?: string }): void
}>()

const open = ref(props.modelValue)
watch(() => props.modelValue, v => open.value = v)
watch(open, v => emit('update:modelValue', v))

/**
 * Form state
 */
const input = ref('')
const owner = ref('')
const name = ref('')
const derivedUrl = ref<string | undefined>(undefined)
const dialogEl = ref<HTMLElement | null>(null)

/**
 * Validation with Zod
 */
const schema = z.object({
  input: z.string()
    .min(1, 'Enter owner/repository or a GitHub URL')
    .refine((val) => {
      const trimmed = val.trim()
      if (!trimmed) return false
      const githubMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+).*$/i)
      if (githubMatch) return true
      const simple = trimmed.match(/^([^/\s]+)\/([^/\s#?]+)$/)
      return !!simple
    }, 'Enter as owner/repository or a valid GitHub URL')
})

const zodError = ref<string | null>(null)
const isValid = computed(() => !zodError.value && !!owner.value && !!name.value)

/**
 * Parse input + set derived fields
 */
function parseAndValidate(val: string) {
  zodError.value = null
  owner.value = ''
  name.value = ''
  derivedUrl.value = undefined

  const check = schema.safeParse({ input: val })
  if (!check.success) {
    zodError.value = check.error.issues[0]?.message ?? 'Invalid value'
    return
  }

  const trimmed = val.trim()
  const githubMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+).*$/i)
  if (githubMatch) {
    owner.value = githubMatch[1]
    name.value = githubMatch[2]
    derivedUrl.value = `https://github.com/${owner.value}/${name.value}`
    return
  }

  const simple = trimmed.match(/^([^/\s]+)\/([^/\s#?]+)$/)
  if (simple) {
    owner.value = simple[1]
    name.value = simple[2]
    derivedUrl.value = `https://github.com/${owner.value}/${name.value}`
    return
  }

  // fallback (shouldn't hit due to refine)
  zodError.value = 'Enter as owner/repository or a valid GitHub URL'
}

watch(input, parseAndValidate, { immediate: true })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation()
    close()
  }
}

function close() {
  open.value = false
}

function submit() {
  parseAndValidate(input.value)
  if (!isValid.value) {
    return
  }
  emit('submit', { owner: owner.value, name: name.value, url: derivedUrl.value })
  close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  // autofocus handled after open via RAF for input
  watch(open, v => {
    if (v) {
      requestAnimationFrame(() => {
        if (dialogEl.value && typeof dialogEl.value.querySelector === 'function') {
          const el = dialogEl.value.querySelector<HTMLInputElement>('#repo-input')
          el?.focus()
        }
      })
    }
  }, { immediate: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<script lang="ts">
/**
 * Non-reactive script block to compute viewport-based caps at runtime.
 * This ensures late DOM/content changes cannot grow the dialog beyond our limit.
 */
import { onMounted as onMountedRaw, onBeforeUnmount as onBeforeUnmountRaw, ref as vueRef } from 'vue'

const windowMax = vueRef('60vh') // default
const bodyMax = vueRef('calc(60vh - 4rem)')

function computeCaps() {
  // Use smaller of: 60vh (desktop) or 68vh (tiny heights), but prefer 60vh.
  const h = window.innerHeight
  // For very small heights, keep some breathing room and avoid 100%:
  const cap = Math.max(320, Math.floor(h * 0.6)) // px
  const capPx = `${cap}px`
  windowMax.value = capPx
  // Subtract approx header/footer/padding (64px) to size scroll area
  bodyMax.value = `calc(${capPx} - 4rem)`
}

let ro: ResizeObserver | null = null

onMountedRaw(() => {
  computeCaps()
  window.addEventListener('resize', computeCaps)
  // If any async content changes size, recompute cap to keep within viewport
  ro = new ResizeObserver(() => computeCaps())
  const root = document.documentElement
  ro.observe(root)
})

onBeforeUnmountRaw(() => {
  window.removeEventListener('resize', computeCaps)
  ro?.disconnect()
  ro = null
})
</script>

<template>
  <Dialog :open="open" @update:open="val => open = val">
    <!-- Hard cap enforced via explicit inline style to avoid growth after async content loads -->
    <DialogContent
      ref="dialogEl"
      class="max-w-[680px] overflow-hidden p-0"
      :style="{ maxHeight: windowMax }"
    >
      <DialogHeader>
        <DialogTitle id="add-repo-title" class="sr-only">Add Repository</DialogTitle>
        <!-- Preserve terminal-styled header inside content -->
        <TerminalWindow class="shadow-cyber h-full flex flex-col" :style="{ maxHeight: 'inherit' }">
          <template #title>
            <TerminalHeader>
              <template #title>
                <TerminalTitle command="add-repository" />
              </template>
              <template #actions>
                <DialogClose as-child>
                  <TerminalButton size="sm" variant="ghost" aria-label="Close">Esc</TerminalButton>
                </DialogClose>
              </template>
            </TerminalHeader>
          </template>

          <!-- Make only the body scrollable to keep actions visible -->
          <!-- Body scroll area sized against computed cap; min-h-0 prevents flex overflow -->
          <div class="p-4 space-y-4 overflow-y-auto flex-1 min-h-0" :style="{ maxHeight: bodyMax }">
            <div class="space-y-2">
              <Label for="repo-input" class="block text-sm font-mono text-slate-300">
                Repository URL or Owner/Name
              </Label>
              <Input
                id="repo-input"
                v-model="input"
                type="text"
                placeholder="e.g. joeczar/pr-tracker or https://github.com/joeczar/pr-tracker"
                class="font-mono"
                aria-describedby="repo-examples repo-error"
                :aria-invalid="!!zodError"
              />
              <p id="repo-examples" class="text-xs text-slate-400 font-mono">
                Examples: owner/repository or full GitHub URL
              </p>
              <p v-if="zodError" id="repo-error" class="text-xs font-mono text-rose-400">
                {{ zodError }}
              </p>
            </div>

            <div class="rounded border border-cyber-border bg-black/20 p-3">
              <div class="text-sm font-mono text-slate-300 mb-2">Repository Info (preview)</div>
              <div v-if="owner && name" class="text-xs font-mono text-slate-200 flex items-center justify-between">
                <div class="flex flex-col">
                  <span>📊 {{ owner }}/{{ name }}</span>
                  <span v-if="derivedUrl" class="text-slate-400">{{ derivedUrl }}</span>
                </div>
                <TerminalButton size="sm" variant="secondary" :as="'a'" :href="derivedUrl" target="_blank" rel="noopener noreferrer" aria-label="Open repository on GitHub">
                  Open on GitHub
                </TerminalButton>
              </div>
              <div v-else class="text-xs font-mono text-slate-500">
                Enter a valid repository to preview
              </div>
            </div>

            <!-- Keep footer visible and not pushed out of viewport -->
            <DialogFooter class="flex items-center justify-end gap-2 sticky bottom-0 bg-black/60 supports-[backdrop-filter]:bg-black/30 backdrop-blur border-t border-cyber-border p-3 mt-2">
              <DialogClose as-child>
                <TerminalButton variant="ghost">Cancel</TerminalButton>
              </DialogClose>
              <TerminalButton variant="primary" :disabled="!isValid" @click="submit">Add Repository</TerminalButton>
            </DialogFooter>
          </div>
        </TerminalWindow>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

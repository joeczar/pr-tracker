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

<template>
  <Dialog :open="open" @update:open="val => open = val">
    <DialogContent ref="dialogEl" class="max-w-[680px]">
      <DialogHeader>
        <DialogTitle id="add-repo-title" class="sr-only">Add Repository</DialogTitle>
        <!-- Preserve terminal-styled header inside content -->
        <TerminalWindow class="shadow-cyber">
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

          <div class="p-4 space-y-4">
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

            <DialogFooter class="flex items-center justify-end gap-2">
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

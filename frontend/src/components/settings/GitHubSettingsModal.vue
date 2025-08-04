
<script setup lang="ts">
import { ref, computed } from 'vue'
import { githubApi } from '@/lib/api/github'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import DialogFooter from '@/components/ui/dialog/DialogFooter.vue'
import TerminalButton from '@/components/ui/terminal/TerminalButton.vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import Input from '@/components/ui/input/Input.vue'
import Label from '@/components/ui/label/Label.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  autoExpandHowTo?: boolean
}>(), {
  modelValue: false,
  autoExpandHowTo: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'pat-updated'): void
}>()

const open = ref(props.modelValue)
const patToken = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const currentPAT = ref<{ valid: boolean; pat_user?: { login: string; name: string | null } } | null>(null)
const showHowTo = ref(false)

// Computed for dialog state management
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Load current PAT status when modal opens
const loadPATStatus = async () => {
  try {
    const response = await githubApi.pat.validate()
    currentPAT.value = response
  } catch (err) {
    console.error('Failed to check PAT status:', err)
    currentPAT.value = { valid: false }
  }
}

// Store PAT
const storePAT = async () => {
  if (!patToken.value.trim()) {
    error.value = 'Please enter a Personal Access Token'
    return
  }

  if (!patToken.value.startsWith('ghp_')) {
    error.value = 'Invalid PAT format. Personal Access Tokens should start with "ghp_"'
    return
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    await githubApi.pat.store(patToken.value.trim())
    success.value = 'Personal Access Token stored successfully!'
    patToken.value = ''
    await loadPATStatus()
    emit('pat-updated')
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      if (success.value) {
        isOpen.value = false
      }
    }, 2000)
  } catch (err: any) {
    error.value = err?.message || 'Failed to store Personal Access Token'
  } finally {
    loading.value = false
  }
}

// Remove PAT
const removePAT = async () => {
  loading.value = true
  error.value = null
  success.value = null

  try {
    await githubApi.pat.remove()
    success.value = 'Personal Access Token removed successfully!'
    await loadPATStatus()
    emit('pat-updated')
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      if (success.value) {
        isOpen.value = false
      }
    }, 2000)
  } catch (err: any) {
    error.value = err?.message || 'Failed to remove Personal Access Token'
  } finally {
    loading.value = false
  }
}

// Reset form when modal opens/closes
const onOpenChange = (newOpen: boolean) => {
  isOpen.value = newOpen
  if (newOpen) {
    patToken.value = ''
    error.value = null
    success.value = null
    showHowTo.value = props.autoExpandHowTo ?? false
    loadPATStatus()
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogContent class="max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="sr-only">GitHub Settings</DialogTitle>
        <TerminalWindow class="shadow-cyber">
          <template #title>
            <TerminalHeader>
              <template #title>
                <TerminalTitle command="github-settings" />
              </template>
            </TerminalHeader>
          </template>
          
          <div class="p-6 space-y-4">
            <!-- Current PAT Status -->
            <div class="space-y-2">
              <h3 class="text-sm font-mono text-slate-200">Personal Access Token Status</h3>
              <div class="p-3 border border-cyber-border rounded-md bg-slate-900/50">
                <div v-if="currentPAT?.valid" class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span class="text-sm font-mono text-emerald-400">Active</span>
                  <span v-if="currentPAT.pat_user" class="text-sm font-mono text-slate-300 ml-auto">
                    {{ currentPAT.pat_user.login }}
                    {{ currentPAT.pat_user.name ? `(${currentPAT.pat_user.name})` : '' }}
                  </span>
                </div>
                <div v-else class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-slate-500 rounded-full"></div>
                  <span class="text-sm font-mono text-slate-400">Not configured</span>
                </div>
              </div>
            </div>

            <!-- Add/Update PAT Section -->
            <div class="space-y-3" v-if="!currentPAT?.valid">
              <div class="space-y-2">
                <h3 class="text-sm font-mono text-slate-200">Add Personal Access Token</h3>
                <p class="text-xs text-slate-400 font-mono">
                  Add a GitHub Personal Access Token to access private organizations and repositories.
                  <br />
                  <span>
                    Need help? 
                    <a 
                      href="https://docs.github.com/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token" 
                      target="_blank" 
                      rel="noopener" 
                      class="text-cyber-accent hover:underline"
                    >
                      How to create a GitHub PAT
                    </a>
                  </span>
                </p>
              </div>

              <div class="space-y-2">
                <Label for="pat-input" class="text-xs font-mono text-slate-300">
                  Personal Access Token
                </Label>
                <Input
                  id="pat-input"
                  v-model="patToken"
                  type="password"
                  placeholder="ghp_..."
                  class="font-mono"
                  :disabled="loading"
                />
                <div class="text-xs text-slate-400 space-y-1">
                  <p>• Token should start with "ghp_"</p>
                  <p>• Ensure it has the "read:org" and "repo" scopes</p>
                  <p>• <a href="https://github.com/settings/tokens" target="_blank" class="text-cyber-accent hover:underline">Create a token →</a></p>
                </div>
              </div>
            </div>

            <!-- How to: Collapsible Guide -->
            <div class="space-y-2">
              <button
                type="button"
                class="text-xs font-mono text-cyber-accent hover:underline"
                @click="showHowTo = !showHowTo"
                :aria-expanded="showHowTo"
              >
                {{ showHowTo ? 'Hide guide' : 'How to add a GitHub PAT' }}
              </button>

              <div v-if="showHowTo" class="p-3 border border-cyber-border rounded-md bg-slate-900/40 space-y-3">
                <div>
                  <h4 class="text-xs font-mono text-slate-200">What is a GitHub Personal Access Token?</h4>
                  <p class="text-xs text-slate-400 font-mono">
                    A PAT is like a password for GitHub used by apps/scripts. PR Tracker uses it to access private organizations and repositories and to improve reliability when OAuth scopes are insufficient or rate limits are hit.
                  </p>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">When should I add a PAT?</h4>
                  <ul class="text-xs text-slate-400 font-mono list-disc pl-4 space-y-1">
                    <li>You need to see or sync private organizations and repositories.</li>
                    <li>Organization lists look incomplete.</li>
                    <li>You frequently hit GitHub API rate limits.</li>
                  </ul>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">Where do I create a PAT?</h4>
                  <p class="text-xs text-slate-400 font-mono">
                    Create/manage at
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener" class="text-cyber-accent hover:underline">
                      https://github.com/settings/tokens
                    </a>.
                    You can use a Classic token for a simpler setup.
                  </p>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">Required scopes</h4>
                  <ul class="text-xs text-slate-400 font-mono list-disc pl-4 space-y-1">
                    <li><span class="text-slate-200">repo</span>: read private repositories.</li>
                    <li><span class="text-slate-200">read:org</span>: list organization memberships and repos.</li>
                  </ul>
                  <p class="text-[11px] text-slate-500 font-mono mt-1">
                    Classic tokens: “repo” includes private repo read; add “read:org” explicitly.
                  </p>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">Security and storage</h4>
                  <ul class="text-xs text-slate-400 font-mono list-disc pl-4 space-y-1">
                    <li>Your token is encrypted at rest and never displayed again.</li>
                    <li>You can remove your PAT any time from Settings.</li>
                    <li>Treat your PAT like a password.</li>
                  </ul>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">Troubleshooting</h4>
                  <ul class="text-xs text-slate-400 font-mono list-disc pl-4 space-y-1">
                    <li>Invalid format: tokens should start with <span class="text-slate-200">ghp_</span> (Classic tokens).</li>
                    <li>Unable to authenticate: ensure token is active, has required scopes, and isn’t expired/revoked.</li>
                    <li>Orgs missing: confirm <span class="text-slate-200">read:org</span> scope and active org membership.</li>
                    <li>Private repos missing: confirm <span class="text-slate-200">repo</span> scope.</li>
                  </ul>
                </div>

                <div>
                  <h4 class="text-xs font-mono text-slate-200">Quick checklist before saving</h4>
                  <ul class="text-xs text-slate-400 font-mono list-disc pl-4 space-y-1">
                    <li>Token starts with <span class="text-slate-200">ghp_</span>.</li>
                    <li>Scopes include <span class="text-slate-200">repo</span> and <span class="text-slate-200">read:org</span>.</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div v-if="success" class="p-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-sm font-mono rounded-md">
              {{ success }}
            </div>
            <div v-if="error" class="p-3 border border-red-500/40 bg-red-500/10 text-red-300 text-sm font-mono rounded-md">
              {{ error }}
            </div>
          </div>

          <DialogFooter class="p-6 pt-0">
            <div class="flex items-center justify-between w-full">
              <div class="text-xs font-mono text-slate-400">
                Token is encrypted and stored securely
              </div>
              <div class="flex items-center gap-2">
                <TerminalButton
                  variant="ghost"
                  @click="isOpen = false"
                  :disabled="loading"
                >
                  Cancel
                </TerminalButton>
                
                <TerminalButton
                  v-if="currentPAT?.valid"
                  variant="secondary"
                  @click="removePAT"
                  :disabled="loading"
                >
                  {{ loading ? 'Removing...' : 'Remove PAT' }}
                </TerminalButton>
                
                <TerminalButton
                  v-else
                  variant="primary"
                  @click="storePAT"
                  :disabled="loading || !patToken.trim()"
                >
                  {{ loading ? 'Storing...' : 'Store PAT' }}
                </TerminalButton>
              </div>
            </div>
          </DialogFooter>
        </TerminalWindow>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>

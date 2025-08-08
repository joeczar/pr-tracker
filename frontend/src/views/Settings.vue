<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import TerminalWindow from '@/components/ui/terminal/TerminalWindow.vue'
import TerminalHeader from '@/components/ui/terminal/TerminalHeader.vue'
import TerminalTitle from '@/components/ui/terminal/TerminalTitle.vue'
import { ref, onMounted } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import GitHubSettingsModal from '@/components/settings/GitHubSettingsModal.vue'
import { qk } from '@/lib/api/queryKeys'
import { githubApi } from '@/lib/api/github'
type PatStatus = { 
  valid: boolean; 
  message?: string; 
  pat_user?: { login: string; id: number; name: string | null };
  status?: 'valid' | 'invalid' | 'none';
  validated_at?: string | null;
}
// import { repositoriesApi } from '@/lib/api/repositories'
import ErrorBoundary from '@/components/error/ErrorBoundary.vue'

// type GitHubRepo = {
//   id: number
//   name: string
//   full_name: string
//   owner: { login: string }
//   private: boolean
//   description?: string
// }

const qc = useQueryClient()

// Theme handling
type ThemeMode = 'light' | 'dark' | 'system'
const theme = ref<ThemeMode>('system')

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldDark = mode === 'dark' || (mode === 'system' && prefersDark)
  root.classList.toggle('dark', shouldDark)
}

function setTheme(mode: ThemeMode) {
  theme.value = mode
  localStorage.setItem('theme', mode)
  applyTheme(mode)
}

onMounted(() => {
  const saved = (localStorage.getItem('theme') as ThemeMode | null) ?? 'system'
  theme.value = saved
  applyTheme(saved)
})

// Keep in sync with OS changes if system is selected
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (theme.value === 'system') applyTheme('system')
  }
  try {
    mql.addEventListener?.('change', onChange)
  } catch {
    mql.addListener?.(onChange)
  }
}

// GitHub connection test
useQuery({
  queryKey: qk.github.test(),
  queryFn: () => githubApi.test(),
  staleTime: import.meta.env.MODE === 'test' ? 60_000 : 30_000,
  // In test mode, disable query and use cached data directly
  enabled: import.meta.env.MODE !== 'test',
  // In test mode, use initialData from cache to avoid loading state
  initialData: import.meta.env.MODE === 'test' ? qc.getQueryData(qk.github.test()) : undefined,
})

// In test mode, override query state with cached data
// const testQueryState = import.meta.env.MODE === 'test'
//   ? computed(() => {
//       const cachedData = qc.getQueryData(qk.github.test())
//       return {
//         data: { value: cachedData },
//         isLoading: false,
//         isError: !cachedData,
//         error: null
//       }
//     })
//   : testQuery


const patModalOpen = ref(false)
const autoExpandHowTo = ref(false)

// PAT status query
const patStatusQuery = useQuery({
  // Use a plain string key to avoid tuple type constraints from qk.github.test()
  queryKey: ['github', 'pat', 'validate'],
  queryFn: () => githubApi.pat.validate(),
  staleTime: 30_000,
  enabled: import.meta.env.MODE !== 'test',
  initialData: import.meta.env.MODE === 'test' ? ((): PatStatus | undefined => {
    return undefined
  })() : undefined,
})

function openPatModal(expandGuide = false) {
  autoExpandHowTo.value = !!expandGuide
  patModalOpen.value = true
}

function onPatUpdated() {
  qc.invalidateQueries({ queryKey: ['github', 'pat', 'validate'] })
  ;(window as unknown as { __toast?: { success?: (m: string) => void } }).__toast?.success?.('GitHub PAT updated')
}

async function onValidateNow() {
  try {
    const res = await patStatusQuery.refetch()
    const data = res.data as unknown as PatStatus | undefined
    if (!data) {
      ;(window as unknown as { __toast?: { warning?: (m: string) => void } }).__toast?.warning?.('No response from validation')
      return
    }
    if (data.valid) {
      const who = data.pat_user?.login ? ` as ${data.pat_user.login}` : ''
      ;(window as unknown as { __toast?: { success?: (m: string) => void } }).__toast?.success?.(`PAT is valid${who}`)
    } else {
      const msg = data.message || 'Stored PAT is invalid or missing'
      ;(window as unknown as { __toast?: { error?: (m: string) => void } }).__toast?.error?.(msg)
    }
  } catch (err: unknown) {
    const e = err as { message?: string } | undefined
    const msg = e?.message || 'Failed to validate PAT'
    ;(window as unknown as { __toast?: { error?: (m: string) => void } }).__toast?.error?.(msg)
  }
}

</script>

<template>
  <section aria-labelledby="settings-title" class="space-y-6">
    <header class="flex items-center justify-between">
      <h1 id="settings-title" class="text-xl font-semibold tracking-tight">Settings</h1>
      <div class="text-xs text-slate-500">GitHub integration and tracking</div>
    </header>

    <!-- Appearance / Theme -->
    <ErrorBoundary>
      <TerminalWindow>
        <template #title>
          <TerminalHeader>
            <template #title>
              <TerminalTitle command="appearance" />
            </template>
          </TerminalHeader>
        </template>

        <div class="p-3 space-y-4">
          <div class="flex items-center justify-between">
            <div class="font-medium">Appearance</div>
            <div class="text-xs text-slate-500">Choose your theme</div>
          </div>

          <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Theme selection">
            <Button
              size="sm"
              :variant="theme === 'light' ? 'default' : 'outline'"
              @click="setTheme('light')"
            >
              Light
            </Button>
            <Button
              size="sm"
              :variant="theme === 'dark' ? 'default' : 'outline'"
              @click="setTheme('dark')"
            >
              Dark
            </Button>
            <Button
              size="sm"
              :variant="theme === 'system' ? 'default' : 'outline'"
              @click="setTheme('system')"
            >
              System
            </Button>
          </div>

          <div class="text-xs text-slate-500">
            Current: <span class="font-mono text-slate-700 dark:text-slate-300">{{ theme }}</span>
          </div>
        </div>
      </TerminalWindow>
    </ErrorBoundary>

    <!-- GitHub PAT Settings -->
    <ErrorBoundary>
      <TerminalWindow>
        <template #title>
          <TerminalHeader>
            <template #title>
              <TerminalTitle command="github-pat" />
            </template>
          </TerminalHeader>
        </template>

        <div class="p-3 space-y-4">
          <div class="flex items-center justify-between">
            <div class="font-medium">GitHub Personal Access Token</div>
            <div>
              <span
                v-if="(patStatusQuery.data?.value as any)?.valid"
                class="text-[10px] px-2 py-0.5 rounded border border-cyber-border text-emerald-500"
              >
                Connected
              </span>
              <span
                v-else
                class="text-[10px] px-2 py-0.5 rounded border border-cyber-border text-slate-500"
              >
                Not configured
              </span>
            </div>
          </div>

          <div class="text-xs text-slate-500">
            Connect a GitHub PAT to access private organizations and repositories. Your token is encrypted and never displayed.
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div class="text-xs font-mono text-slate-400">
              <template v-if="(patStatusQuery.data?.value as any)?.valid">
                Signed in as
                <span class="text-slate-300">
                  {{ (patStatusQuery.data?.value as any)?.pat_user?.login }}
                </span>
                <span v-if="(patStatusQuery.data?.value as any)?.pat_user?.name" class="text-slate-500">
                  ({{ (patStatusQuery.data?.value as any)?.pat_user?.name }})
                </span>
              </template>
              <template v-else>
                No Personal Access Token configured.
              </template>
            </div>

            <div class="flex items-center gap-2">
              <Button
                size="sm"
                v-if="!(patStatusQuery.data?.value as any)?.valid"
                @click="openPatModal(false)"
              >
                Connect with PAT
              </Button>

              <Button
                size="sm"
                v-if="(patStatusQuery.data?.value as any)?.valid"
                @click="openPatModal(false)"
              >
                Rotate token
              </Button>

              <Button
                size="sm"
                :class="(patStatusQuery.data?.value as any)?.status === 'valid' ? 'border-emerald-500 text-emerald-500' : ''"
                variant="outline"
                @click="onValidateNow"
              >
                <span v-if="(patStatusQuery.data?.value as any)?.status === 'valid'">Validated</span>
                <span v-else>Validate now</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                @click="openPatModal(true)"
              >
                How to add a GitHub PAT
              </Button>
            </div>
          </div>

          <div v-if="!(patStatusQuery.data?.value as any)?.valid && (patStatusQuery.data?.value as any)?.message" class="text-xs text-amber-500">
            {{ (patStatusQuery.data?.value as any)?.message }}
          </div>
          <div v-else-if="(patStatusQuery.data?.value as any)?.valid && (patStatusQuery.data?.value as any)?.pat_user?.login" class="text-xs text-emerald-500">
            Valid as {{ (patStatusQuery.data?.value as any)?.pat_user?.login }}
            <span v-if="(patStatusQuery.data?.value as any)?.validated_at" class="text-slate-500">
              • Last validated {{ new Date((patStatusQuery.data?.value as any)?.validated_at).toLocaleString() }}
            </span>
          </div>
        </div>
      </TerminalWindow>
    </ErrorBoundary>


  </section>

  <!-- Modal mount -->
  <GitHubSettingsModal
    v-model="patModalOpen"
    :auto-expand-how-to="autoExpandHowTo"
    @pat-updated="onPatUpdated"
  />
</template>

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Fuse from 'fuse.js'
import { useRouter } from 'vue-router'

export type Command = {
  id: string
  name: string
  icon?: string
  keywords?: string[]
  // Allow navigation promises from vue-router (which can resolve to NavigationFailure|undefined)
  action: () => void | Promise<void | unknown>
  group?: string
}

type Options = {
  initialOpen?: boolean
  enableGlobalHotkey?: boolean // Cmd/Ctrl+K
}

export function useCommandPalette(allCommands?: Command[], opts: Options = {}) {
  const router = useRouter()

  const isOpen = ref<boolean>(!!opts.initialOpen)
  const query = ref<string>('')
  const selectedIndex = ref<number>(0)

  // Default navigation commands to ensure utility out of the box
  const baseCommands: Command[] = [
    { id: 'nav:dashboard', name: 'Go to Dashboard', icon: '📊', keywords: ['home', 'main'], action: () => void router.push('/'), group: 'Navigation' },
    { id: 'nav:repositories', name: 'Go to Repositories', icon: '📁', keywords: ['repos'], action: () => void router.push('/repositories'), group: 'Navigation' },
    { id: 'nav:analytics', name: 'Open Analytics', icon: '📈', action: () => void router.push('/analytics'), group: 'Navigation' },
    { id: 'nav:settings', name: 'Open Settings', icon: '⚙️', action: () => void router.push('/settings'), group: 'Navigation' }
  ]

  const commands = computed<Command[]>(() => {
    const user = allCommands ?? []
    // Deduplicate by id with user commands taking precedence
    const map = new Map(user.map(c => [c.id, c]))
    for (const c of baseCommands) {
      if (!map.has(c.id)) map.set(c.id, c)
    }
    return Array.from(map.values())
  })

  const fuse = computed(() => {
    return new Fuse(commands.value, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'id', weight: 0.2 },
        { name: 'keywords', weight: 0.1 }
      ],
      threshold: 0.3,
      ignoreLocation: true
    })
  })

  const results = computed<Command[]>(() => {
    const q = query.value.trim()
    if (!q) return commands.value
    return fuse.value.search(q).map(r => r.item)
  })

  function open() {
    isOpen.value = true
    // reset selection on open
    selectedIndex.value = 0
  }

  function close() {
    isOpen.value = false
    query.value = ''
    selectedIndex.value = 0
  }

  async function execute(cmd?: Command) {
    const target = cmd ?? results.value[selectedIndex.value]
    if (!target) return
    await Promise.resolve(target.action())
    close()
  }

  function move(delta: number) {
    const len = results.value.length
    if (!len) return
    selectedIndex.value = (selectedIndex.value + delta + len) % len
  }

  // Global hotkey: Cmd/Ctrl + K
  function onKeydown(e: KeyboardEvent) {
    if (!opts.enableGlobalHotkey) return
    const isCmdK = (e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k')
    if (isCmdK) {
      e.preventDefault()
      isOpen.value ? close() : open()
    }
    if (!isOpen.value) return

    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      execute()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    // state
    isOpen,
    query,
    selectedIndex,
    results,
    // actions
    open,
    close,
    execute,
    move
  }
}

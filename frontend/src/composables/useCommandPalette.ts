import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Fuse from 'fuse.js'

export interface Command {
  id: string
  name: string
  description?: string
  icon?: string
  category?: string
  keywords?: string[]
  action: () => void | Promise<void>
  shortcut?: string
}

export function useCommandPalette() {
  const router = useRouter()
  const isOpen = ref(false)
  const searchQuery = ref('')
  const selectedIndex = ref(0)
  const isLoading = ref(false)

  // Default commands
  const defaultCommands = ref<Command[]>([
    {
      id: 'dashboard',
      name: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: '📊',
      category: 'Navigation',
      keywords: ['home', 'main', 'overview'],
      action: () => router.push('/'),
      shortcut: 'Ctrl+D'
    },
    {
      id: 'repositories',
      name: 'Go to Repositories',
      description: 'View all tracked repositories',
      icon: '📁',
      category: 'Navigation',
      keywords: ['repos', 'projects'],
      action: () => router.push('/repositories'),
      shortcut: 'Ctrl+R'
    },
    {
      id: 'add-repository',
      name: 'Add Repository',
      description: 'Add a new repository to track',
      icon: '➕',
      category: 'Actions',
      keywords: ['new', 'create', 'track'],
      action: () => {
        router.push('/repositories')
        // TODO: Open add repository dialog
      }
    },
    {
      id: 'toggle-theme',
      name: 'Toggle Theme',
      description: 'Switch between light and dark themes',
      icon: '🌙',
      category: 'Settings',
      keywords: ['dark', 'light', 'appearance'],
      action: () => {
        // TODO: Implement theme toggle
        console.log('Toggle theme')
      },
      shortcut: 'Ctrl+Shift+T'
    },
    {
      id: 'help',
      name: 'Show Help',
      description: 'View keyboard shortcuts and help',
      icon: '❓',
      category: 'Help',
      keywords: ['shortcuts', 'guide', 'documentation'],
      action: () => {
        // TODO: Open help dialog
        console.log('Show help')
      },
      shortcut: 'Ctrl+?'
    },
    {
      id: 'logout',
      name: 'Logout',
      description: 'Sign out of your account',
      icon: '🚪',
      category: 'Account',
      keywords: ['sign out', 'exit'],
      action: () => {
        // TODO: Implement logout
        console.log('Logout')
      }
    }
  ])

  // Additional commands that can be added dynamically
  const additionalCommands = ref<Command[]>([])

  // All available commands
  const allCommands = computed(() => [
    ...defaultCommands.value,
    ...additionalCommands.value
  ])

  // Fuse.js instance for fuzzy search
  const fuse = computed(() => new Fuse(allCommands.value, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'keywords', weight: 0.2 },
      { name: 'category', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true
  }))

  // Filtered commands based on search query
  const filteredCommands = computed(() => {
    if (!searchQuery.value.trim()) {
      return allCommands.value.map(command => ({ item: command, score: 0 }))
    }

    return fuse.value.search(searchQuery.value)
  })

  // Currently selected command
  const selectedCommand = computed(() => {
    const commands = filteredCommands.value
    if (commands.length === 0) return null
    return commands[selectedIndex.value]?.item || null
  })

  // Open the command palette
  const open = () => {
    isOpen.value = true
    searchQuery.value = ''
    selectedIndex.value = 0
  }

  // Close the command palette
  const close = () => {
    isOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
  }

  // Toggle the command palette
  const toggle = () => {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Navigate selection up
  const selectPrevious = () => {
    const maxIndex = filteredCommands.value.length - 1
    selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : maxIndex
  }

  // Navigate selection down
  const selectNext = () => {
    const maxIndex = filteredCommands.value.length - 1
    selectedIndex.value = selectedIndex.value < maxIndex ? selectedIndex.value + 1 : 0
  }

  // Execute the selected command
  const executeSelected = async () => {
    const command = selectedCommand.value
    if (!command) return

    isLoading.value = true
    try {
      await command.action()
      close()
    } catch (error) {
      console.error('Failed to execute command:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Execute a specific command by ID
  const executeCommand = async (commandId: string) => {
    const command = allCommands.value.find(cmd => cmd.id === commandId)
    if (!command) return

    isLoading.value = true
    try {
      await command.action()
    } catch (error) {
      console.error('Failed to execute command:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Add a new command
  const addCommand = (command: Command) => {
    additionalCommands.value.push(command)
  }

  // Remove a command
  const removeCommand = (commandId: string) => {
    additionalCommands.value = additionalCommands.value.filter(cmd => cmd.id !== commandId)
  }

  // Keyboard event handler
  const handleKeydown = (event: KeyboardEvent) => {
    // Open command palette with Ctrl/Cmd + K
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      toggle()
      return
    }

    // Handle navigation when palette is open
    if (isOpen.value) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          close()
          break
        case 'ArrowUp':
          event.preventDefault()
          selectPrevious()
          break
        case 'ArrowDown':
          event.preventDefault()
          selectNext()
          break
        case 'Enter':
          event.preventDefault()
          executeSelected()
          break
      }
    }
  }

  // Set up keyboard listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    // State
    isOpen,
    searchQuery,
    selectedIndex,
    isLoading,
    
    // Computed
    allCommands,
    filteredCommands,
    selectedCommand,
    
    // Actions
    open,
    close,
    toggle,
    selectPrevious,
    selectNext,
    executeSelected,
    executeCommand,
    addCommand,
    removeCommand
  }
}

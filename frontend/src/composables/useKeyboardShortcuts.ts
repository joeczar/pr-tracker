import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useKeyboardShortcuts() {
  const router = useRouter()

  const handleKeyPress = (event: KeyboardEvent) => {
    // Check for terminal-style shortcuts (Ctrl/Cmd + key)
    const isModifierPressed = event.ctrlKey || event.metaKey
    
    if (!isModifierPressed) return

    switch (event.key.toLowerCase()) {
      case 'd':
        event.preventDefault()
        router.push('/')
        showTerminalMessage('>> Navigating to Dashboard...')
        break
        
      case 'r':
        event.preventDefault()
        router.push('/repositories')
        showTerminalMessage('>> Accessing Repository Manager...')
        break
        
      case 'h':
        event.preventDefault()
        showHelpDialog()
        break
        
      case '`':
      case '~':
        event.preventDefault()
        toggleConsole()
        break
    }

    // Handle Alt + key combinations for quick actions
    if (event.altKey) {
      switch (event.key.toLowerCase()) {
        case 'c':
          event.preventDefault()
          showTerminalMessage('>> Command palette activated (feature coming soon...)')
          break
      }
    }
  }

  const showTerminalMessage = (message: string) => {
    // Create a temporary notification in terminal style
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-card border border-primary/30 text-primary font-terminal text-sm px-4 py-2 rounded-md shadow-lg z-50 animate-pulse'
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 2000)
  }

  const showHelpDialog = () => {
    const helpContent = `
CYBERPUNK TERMINAL SHORTCUTS:

Navigation:
  Ctrl/Cmd + D     >> Dashboard
  Ctrl/Cmd + R     >> Repositories
  Ctrl/Cmd + H     >> Help (this dialog)
  Ctrl/Cmd + ~     >> Toggle Console

Quick Actions:
  Alt + C          >> Command Palette (coming soon)
  Esc              >> Close dialogs/modals

Terminal Features:
  Tab              >> Auto-complete (in inputs)
  Enter            >> Execute commands
  Up/Down Arrows   >> Command history (coming soon)
    `

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="terminal-window max-w-2xl w-full mx-4">
        <div class="terminal-header">
          <div class="flex items-center gap-2">
            <div class="terminal-dot terminal-dot-close cursor-pointer" onclick="this.closest('.fixed').remove()"></div>
            <div class="terminal-dot terminal-dot-minimize"></div>
            <div class="terminal-dot terminal-dot-maximize"></div>
          </div>
          <div class="flex-1 text-center">
            <span class="text-sm font-terminal text-muted-foreground">help@pr-tracker:~$</span>
          </div>
          <div class="w-16"></div>
        </div>
        <div class="p-6 bg-background/95">
          <pre class="text-primary font-terminal text-sm whitespace-pre-wrap">${helpContent}</pre>
          <div class="mt-4 text-center">
            <button onclick="this.closest('.fixed').remove()" class="bg-primary text-primary-foreground px-4 py-2 rounded font-terminal text-sm hover:bg-primary/90 transition-colors">
              >> CLOSE
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Close on escape or click outside
    const closeHandler = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') {
        modal.remove()
        document.removeEventListener('keydown', closeHandler)
        document.removeEventListener('click', closeHandler)
      } else if (e instanceof MouseEvent && e.target === modal) {
        modal.remove()
        document.removeEventListener('keydown', closeHandler)
        document.removeEventListener('click', closeHandler)
      }
    }
    
    document.addEventListener('keydown', closeHandler)
    document.addEventListener('click', closeHandler)
  }

  const toggleConsole = () => {
    let console = document.getElementById('cyberpunk-console')
    
    if (console) {
      console.remove()
      return
    }

    console = document.createElement('div')
    console.id = 'cyberpunk-console'
    console.className = 'fixed bottom-0 left-0 right-0 h-64 terminal-window rounded-none border-b-0 z-40 transform translate-y-full animate-slide-up'
    console.innerHTML = `
      <div class="terminal-header">
        <div class="flex items-center gap-2">
          <div class="terminal-dot terminal-dot-close cursor-pointer" onclick="document.getElementById('cyberpunk-console').remove()"></div>
          <div class="terminal-dot terminal-dot-minimize"></div>
          <div class="terminal-dot terminal-dot-maximize"></div>
        </div>
        <div class="flex-1 text-center">
          <span class="text-sm font-terminal text-muted-foreground">console@pr-tracker:~$</span>
        </div>
        <div class="w-16"></div>
      </div>
      <div class="p-4 bg-background/95 h-full overflow-auto">
        <div class="text-primary font-terminal text-sm mb-2">
          > PR Tracker Console v2.0 - Cyberpunk Edition
        </div>
        <div class="text-muted-foreground font-terminal text-xs mb-4">
          Type 'help' for available commands...
        </div>
        <div class="flex items-center gap-2">
          <span class="text-primary font-terminal text-sm">$</span>
          <input 
            type="text" 
            class="flex-1 bg-transparent border-none outline-none text-primary font-terminal text-sm"
            placeholder="Enter command..."
            onkeydown="if(event.key==='Enter') { this.value='Command not implemented yet...'; setTimeout(() => this.value='', 1500) }"
          />
        </div>
      </div>
    `
    
    document.body.appendChild(console)
    
    // Add slide animation
    requestAnimationFrame(() => {
      console!.style.transform = 'translateY(0)'
    })
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyPress)
    
    // Add custom CSS for animations
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .animate-slide-up {
        animation: slide-up 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyPress)
  })

  return {
    showTerminalMessage,
    showHelpDialog,
    toggleConsole
  }
}
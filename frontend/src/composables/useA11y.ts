import { ref } from 'vue'

/**
 * Accessibility helpers:
 * - announce: send messages to a shared aria-live LiveRegion
 * - focusTrap: minimal focus trap utilities for dialogs
 * - hotkey: simple key binding with cleanup
 */
export function useA11y() {
  const liveMessage = ref<string>('')

  function announce(message: string) {
    // Consumers can bind this ref to <LiveRegion :message="liveMessage" />
    liveMessage.value = message
  }

  // Minimal focus trap utilities (opt-in; for complex cases, use focus-trap-vue)
  function trapFocus(container: HTMLElement) {
    const focusable = getFocusable(container)
    if (focusable.length) {
      focusable[0].focus()
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const list = getFocusable(container)
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    container.addEventListener('keydown', onKeydown)
    return () => container.removeEventListener('keydown', onKeydown)
  }

  function getFocusable(root: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]',
      'area[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])'
    ]
    return Array.from(root.querySelectorAll<HTMLElement>(selectors.join(',')))
      .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
  }

  // Simple hotkey binder that auto prevents default and returns cleanup
  function hotkey(keys: (e: KeyboardEvent) => boolean, handler: (e: KeyboardEvent) => void) {
    const onKey = (e: KeyboardEvent) => {
      if (keys(e)) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }

  return {
    liveMessage,
    announce,
    trapFocus,
    hotkey
  }
}

import { ref, computed, readonly } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'pr-tracker-theme'

// Reactive theme state - simplified to just light/dark
const theme = ref<Theme>('dark')

// Check if dark mode is active
const isDark = computed(() => theme.value === 'dark')

/**
 * Apply theme to document
 */
function applyTheme(newTheme: Theme) {
  console.log('Applying theme:', newTheme)
  const root = document.documentElement

  // Remove existing theme classes
  root.classList.remove('light', 'dark')

  // Add new theme class
  root.classList.add(newTheme)

  console.log('Document classes after theme application:', root.classList.toString())

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    const themeColor = newTheme === 'dark' ? '#001122' : '#091833'
    metaThemeColor.setAttribute('content', themeColor)
  }
}

/**
 * Set theme preference
 */
function setTheme(newTheme: Theme) {
  console.log('Setting theme to:', newTheme)
  theme.value = newTheme
  localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  applyTheme(newTheme)
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  console.log('Toggling theme from:', theme.value)
  const newTheme = theme.value === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

/**
 * Initialize theme system
 */
function initializeTheme() {
  console.log('Initializing theme system')

  // Get saved theme preference
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  console.log('Saved theme from localStorage:', savedTheme)

  if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    theme.value = savedTheme
  }

  console.log('Initial theme set to:', theme.value)
  applyTheme(theme.value)
}

// Initialize theme system immediately
let isInitialized = false

/**
 * Composable for theme management
 */
export function useTheme() {
  // Initialize theme system once
  if (!isInitialized && typeof window !== 'undefined') {
    initializeTheme()
    isInitialized = true
  }

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    setTheme,
    toggleTheme
  }
}

// Export for use in other composables
export { theme, isDark }

import { ref, computed, readonly } from 'vue'

export type ColorScheme = 'light' | 'dark'
export type ThemeStyle = 'clean' | 'cyberpunk'

const COLOR_SCHEME_STORAGE_KEY = 'pr-tracker-color-scheme'
const THEME_STYLE_STORAGE_KEY = 'pr-tracker-theme-style'

// Reactive theme state
const colorScheme = ref<ColorScheme>('light')
const themeStyle = ref<ThemeStyle>('clean')

// Computed properties
const isDark = computed(() => colorScheme.value === 'dark')
const isCyberpunk = computed(() => themeStyle.value === 'cyberpunk')

/**
 * Apply theme to document
 */
function applyTheme(scheme: ColorScheme, style: ThemeStyle) {
  console.log('Applying theme:', { scheme, style })
  const root = document.documentElement
  const body = document.body

  // Remove existing theme classes
  root.classList.remove('light', 'dark')
  root.removeAttribute('data-theme')
  body.removeAttribute('data-theme')

  // Add new theme classes
  root.classList.add(scheme)
  
  // Set theme style data attribute if cyberpunk
  if (style === 'cyberpunk') {
    root.setAttribute('data-theme', 'cyberpunk')
    body.setAttribute('data-theme', 'cyberpunk')
  }

  console.log('Document classes after theme application:', root.classList.toString())

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    let themeColor = '#ffffff' // clean light default
    
    if (style === 'cyberpunk') {
      themeColor = scheme === 'dark' ? '#001122' : '#091833'
    } else {
      themeColor = scheme === 'dark' ? '#0f0f23' : '#ffffff'
    }
    
    metaThemeColor.setAttribute('content', themeColor)
  }
}

/**
 * Set color scheme (light/dark)
 */
function setColorScheme(newScheme: ColorScheme) {
  console.log('Setting color scheme to:', newScheme)
  colorScheme.value = newScheme
  localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, newScheme)
  applyTheme(newScheme, themeStyle.value)
}

/**
 * Set theme style (clean/cyberpunk)
 */
function setThemeStyle(newStyle: ThemeStyle) {
  console.log('Setting theme style to:', newStyle)
  themeStyle.value = newStyle
  localStorage.setItem(THEME_STYLE_STORAGE_KEY, newStyle)
  applyTheme(colorScheme.value, newStyle)
}

/**
 * Toggle between light and dark color schemes
 */
function toggleColorScheme() {
  console.log('Toggling color scheme from:', colorScheme.value)
  const newScheme = colorScheme.value === 'dark' ? 'light' : 'dark'
  setColorScheme(newScheme)
}

/**
 * Toggle between clean and cyberpunk styles
 */
function toggleThemeStyle() {
  console.log('Toggling theme style from:', themeStyle.value)
  const newStyle = themeStyle.value === 'cyberpunk' ? 'clean' : 'cyberpunk'
  setThemeStyle(newStyle)
}

/**
 * Legacy theme toggle (for backwards compatibility)
 */
function toggleTheme() {
  toggleColorScheme()
}

/**
 * Initialize theme system
 */
function initializeTheme() {
  console.log('Initializing theme system')

  // Get saved preferences
  const savedScheme = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) as ColorScheme | null
  const savedStyle = localStorage.getItem(THEME_STYLE_STORAGE_KEY) as ThemeStyle | null
  
  console.log('Saved preferences:', { scheme: savedScheme, style: savedStyle })

  if (savedScheme && ['light', 'dark'].includes(savedScheme)) {
    colorScheme.value = savedScheme
  }
  
  if (savedStyle && ['clean', 'cyberpunk'].includes(savedStyle)) {
    themeStyle.value = savedStyle
  }

  console.log('Initial theme set to:', { scheme: colorScheme.value, style: themeStyle.value })
  applyTheme(colorScheme.value, themeStyle.value)
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
    // State
    colorScheme: readonly(colorScheme),
    themeStyle: readonly(themeStyle),
    isDark: readonly(isDark),
    isCyberpunk: readonly(isCyberpunk),
    
    // Actions
    setColorScheme,
    setThemeStyle,
    toggleColorScheme,
    toggleThemeStyle,
    
    // Legacy support
    theme: readonly(colorScheme), // map to colorScheme for backwards compatibility
    toggleTheme
  }
}

// Export for use in other composables
export { colorScheme, themeStyle, isDark, isCyberpunk }

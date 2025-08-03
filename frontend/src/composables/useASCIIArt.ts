import { ref, computed } from 'vue'
let figlet: any | undefined
try {
  // Dynamically import to avoid bundler parsing issues and allow optional presence
  // Use eval to prevent static analysis from bundling it
  // eslint-disable-next-line no-eval
  const req = (eval('require') as any)
  figlet = req?.('figlet')
} catch {
  figlet = undefined
}

// ASCII Art templates for when figlet is not available
const ASCII_TEMPLATES = {
  'PR TRACKER': `
██████╗ ██████╗     ████████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ 
██╔══██╗██╔══██╗    ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
██████╔╝██████╔╝       ██║   ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝
██╔═══╝ ██╔══██╗       ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██║     ██║  ██║       ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
╚═╝     ╚═╝  ╚═╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
`,
  'DASHBOARD': `
██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗ 
██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
██║  ██║███████║███████╗███████║██████╔╝██║   ██║███████║██████╔╝██║  ██║
██║  ██║██╔══██║╚════██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
██████╔╝██║  ██║███████║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
`,
  'REPOSITORIES': `
██████╗ ███████╗██████╗  ██████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝
██████╔╝█████╗  ██████╔╝██║   ██║███████╗
██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║╚════██║
██║  ██║███████╗██║     ╚██████╔╝███████║
╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚══════╝
`,
  'LOGIN': `
██╗      ██████╗  ██████╗ ██╗███╗   ██╗
██║     ██╔═══██╗██╔════╝ ██║████╗  ██║
██║     ██║   ██║██║  ███╗██║██╔██╗ ██║
██║     ██║   ██║██║   ██║██║██║╚██╗██║
███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
`
}

export interface ASCIIArtOptions {
  font?: string
  horizontalLayout?: 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'
  verticalLayout?: 'default' | 'full' | 'fitted' | 'controlled smushing' | 'universal smushing'
  width?: number
  whitespaceBreak?: boolean
}

export function useASCIIArt() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Check if figlet is available
  const figletAvailable = computed(() => {
    return typeof figlet !== 'undefined' && figlet !== null
  })

  /**
   * Generate ASCII art text using figlet or fallback to templates
   */
  const generateASCII = async (
    text: string, 
    options: ASCIIArtOptions = {}
  ): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      // Prefer a known-good font if figlet is available
      if (figletAvailable.value) {
        const figletOptions = {
          font: (options.font || 'Standard') as any, // Known stable bundled font
          horizontalLayout: options.horizontalLayout || 'default',
          verticalLayout: options.verticalLayout || 'default',
          width: options.width || 80,
          whitespaceBreak: options.whitespaceBreak || false
        }

        // Wrap figlet call in try/catch to avoid noisy console warnings
        try {
          const rendered = await new Promise<string>((resolve, reject) => {
            try {
              figlet(text, figletOptions, (err: Error | null, data: string | undefined) => {
                if (err) {
                  // Swallow error into reject; will be handled below without console noise
                  reject(err)
                } else {
                  resolve(data || '')
                }
              })
            } catch (invokeErr) {
              reject(invokeErr as Error)
            }
          })
          if (rendered && rendered.trim().length > 0) {
            return rendered
          }
        } catch {
          // Silent failover below
        }
      }

      // Fallback to templates
      const template = ASCII_TEMPLATES[text.toUpperCase() as keyof typeof ASCII_TEMPLATES]
      if (template) {
        return template.trim()
      }

      // Simple fallback for unknown text
      return createSimpleASCII(text)
    } catch (err) {
      // Do not log to console; provide silent, resilient fallback
      error.value = err instanceof Error ? err.message : 'Failed to generate ASCII art'
      return createSimpleASCII(text)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create simple ASCII art for unknown text
   */
  const createSimpleASCII = (text: string): string => {
    const chars = text.toUpperCase().split('')
    const lines = ['', '', '', '', '']
    
    chars.forEach(char => {
      if (char === ' ') {
        lines[0] += '   '
        lines[1] += '   '
        lines[2] += '   '
        lines[3] += '   '
        lines[4] += '   '
      } else {
        lines[0] += '███ '
        lines[1] += '█ █ '
        lines[2] += '███ '
        lines[3] += '█ █ '
        lines[4] += '███ '
      }
    })

    return lines.join('\n')
  }

  /**
   * Get a predefined ASCII template
   */
  const getTemplate = (name: string): string => {
    const template = ASCII_TEMPLATES[name.toUpperCase() as keyof typeof ASCII_TEMPLATES]
    return template ? template.trim() : createSimpleASCII(name)
  }

  /**
   * Get available template names
   */
  const getAvailableTemplates = (): string[] => {
    return Object.keys(ASCII_TEMPLATES)
  }

  return {
    isLoading,
    error,
    figletAvailable,
    generateASCII,
    getTemplate,
    getAvailableTemplates,
    createSimpleASCII
  }
}

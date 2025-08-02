/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: 'hsl(var(--success))',
  			warning: 'hsl(var(--warning))',
  			info: 'hsl(var(--info))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: 'var(--font-sans)',
  			mono: 'var(--font-terminal)',
  			terminal: 'var(--font-terminal)'
  		},
  		fontSize: {
  			xs: ['var(--text-xs)', { lineHeight: 'var(--leading-xs)' }],
  			sm: ['var(--text-sm)', { lineHeight: 'var(--leading-sm)' }],
  			base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
  			lg: ['var(--text-lg)', { lineHeight: 'var(--leading-lg)' }],
  			xl: ['var(--text-xl)', { lineHeight: 'var(--leading-xl)' }],
  			'2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-2xl)' }],
  			'3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-3xl)' }]
  		},
  		spacing: {
  			xs: 'var(--spacing-xs)',
  			sm: 'var(--spacing-sm)',
  			md: 'var(--spacing-md)',
  			lg: 'var(--spacing-lg)',
  			xl: 'var(--spacing-xl)',
  			'2xl': 'var(--spacing-2xl)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			'terminal-typing': 'typing 2s steps(40, end), blink 1s infinite',
  			'cyber-glow': 'pulse-glow 2s ease-in-out infinite alternate',
  			'scanlines': 'scanlines 0.1s linear infinite'
  		},
  		keyframes: {
  			typing: {
  				'from': { width: '0' },
  				'to': { width: '100%' }
  			},
  			blink: {
  				'50%': { 'border-color': 'transparent' }
  			},
  			'pulse-glow': {
  				'from': {
  					'box-shadow': '0 0 5px hsl(var(--primary) / 0.3)'
  				},
  				'to': {
  					'box-shadow': '0 0 20px hsl(var(--primary) / 0.6), 0 0 30px hsl(var(--primary) / 0.4)'
  				}
  			},
  			scanlines: {
  				'0%': { transform: 'translateY(-100%)' },
  				'100%': { transform: 'translateY(100vh)' }
  			}
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/forms'),
      require("tailwindcss-animate")
],
}

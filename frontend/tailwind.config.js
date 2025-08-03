/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			'cyber-primary': '#00ff9f',
  			'cyber-secondary': '#0abdc6',
  			'cyber-accent': '#ea00d9',
  			'cyber-bg': '#0a0f1f',
  			'cyber-surface': '#0b1228',
  			'cyber-border': '#10223f',
  			'cyber-muted': '#9ae8d6',
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
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
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
  			terminal: [
  				'Fira Code',
  				'Cascadia Code',
  				'Monaco',
  				'monospace'
  			]
  		},
  		boxShadow: {
  			cyber: '0 0 2px #00ff9f, 0 0 4px #0abdc6, 0 0 8px #ea00d9'
  		},
  		keyframes: {
  			'pulse-glow': {
  				from: {
  					filter: 'drop-shadow(0 0 0 currentColor)'
  				},
  				to: {
  					filter: 'drop-shadow(0 0 6px currentColor)'
  				}
  			},
  			typing: {
  				from: {
  					width: '0'
  				},
  				to: {
  					width: '100%'
  				}
  			},
  			blink: {
  				'50%': {
  					borderColor: 'transparent'
  				}
  			}
  		},
  		animation: {
  			'cyber-glow': 'pulse-glow 2s ease-in-out infinite alternate',
  			'terminal-typing': 'typing 2s steps(40,end), blink 1s step-end infinite'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

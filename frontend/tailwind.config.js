/** @type {import('tailwindcss').Config} */
export default {
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
      },
      fontFamily: {
        terminal: ['Fira Code','Cascadia Code','Monaco','monospace'],
      },
      boxShadow: {
        cyber: '0 0 2px #00ff9f, 0 0 4px #0abdc6, 0 0 8px #ea00d9',
      },
      keyframes: {
        'pulse-glow': { from: { filter: 'drop-shadow(0 0 0 currentColor)' }, to: { filter: 'drop-shadow(0 0 6px currentColor)' } },
        typing: { from: { width: '0' }, to: { width: '100%' } },
        blink: { '50%': { borderColor: 'transparent' } },
      },
      animation: {
        'cyber-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'terminal-typing': 'typing 2s steps(40,end), blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}

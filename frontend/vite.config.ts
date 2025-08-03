import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/composables': resolve(__dirname, 'src/composables'),
      '@/lib': resolve(__dirname, 'src/lib'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '@shared', replacement: resolve(__dirname, '../shared') },
      { find: '@/components', replacement: resolve(__dirname, 'src/components') },
      { find: '@/composables', replacement: resolve(__dirname, 'src/composables') },
      { find: '@/lib', replacement: resolve(__dirname, 'src/lib') },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})

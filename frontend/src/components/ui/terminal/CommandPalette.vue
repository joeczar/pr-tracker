<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { cn } from '@/lib/utils'

const {
  isOpen,
  searchQuery,
  selectedIndex,
  isLoading,
  filteredCommands,
  close,
  executeSelected
} = useCommandPalette()

const searchInput = ref<HTMLInputElement>()

// Focus search input when palette opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    await nextTick()
    searchInput.value?.focus()
  }
})

// Handle command selection with mouse
const selectCommand = (index: number) => {
  selectedIndex.value = index
}

// Handle command execution with mouse
const executeCommand = (index: number) => {
  selectedIndex.value = index
  executeSelected()
}

// Get category color
const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Navigation': return 'text-primary'
    case 'Actions': return 'text-accent'
    case 'Settings': return 'text-secondary'
    case 'Help': return 'text-info'
    case 'Account': return 'text-warning'
    default: return 'text-muted-foreground'
  }
}
</script>

<template>
  <!-- Backdrop -->
  <teleport to="body">
    <div
      v-if="isOpen"
      class="command-palette-backdrop"
      @click="close"
    >
      <!-- Command Palette Modal -->
      <div
        class="command-palette-modal"
        @click.stop
      >
        <!-- Terminal Header -->
        <div class="terminal-header">
          <div class="terminal-controls">
            <div class="terminal-dot terminal-dot-close" @click="close"></div>
            <div class="terminal-dot terminal-dot-minimize"></div>
            <div class="terminal-dot terminal-dot-maximize"></div>
          </div>
          <div class="terminal-title">
            <span class="font-mono text-sm text-muted-foreground">Command Palette</span>
          </div>
          <div class="w-16"></div> <!-- Spacer -->
        </div>

        <!-- Search Input -->
        <div class="search-container">
          <div class="search-icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Type a command or search..."
            class="search-input"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="search-shortcut">
            <kbd class="kbd">Esc</kbd>
          </div>
        </div>

        <!-- Commands List -->
        <div class="commands-container">
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <span class="loading-text">Executing command...</span>
          </div>

          <div v-else-if="filteredCommands.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">No commands found</div>
            <div class="empty-hint">Try a different search term</div>
          </div>

          <div v-else class="commands-list">
            <div
              v-for="(result, index) in filteredCommands"
              :key="result.item.id"
              :class="cn(
                'command-item',
                { 'command-item-selected': index === selectedIndex }
              )"
              @mouseenter="selectCommand(index)"
              @click="executeCommand(index)"
            >
              <div class="command-icon" style="font-size: 14px;">
                {{ result.item.icon || '⚡' }}
              </div>
              
              <div class="command-content">
                <div class="command-name">
                  {{ result.item.name }}
                </div>
                <div v-if="result.item.description" class="command-description">
                  {{ result.item.description }}
                </div>
              </div>

              <div class="command-meta">
                <div v-if="result.item.category" 
                     :class="cn('command-category', getCategoryColor(result.item.category))">
                  {{ result.item.category }}
                </div>
                <div v-if="result.item.shortcut" class="command-shortcut">
                  <kbd class="kbd">{{ result.item.shortcut }}</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="palette-footer">
          <div class="footer-shortcuts">
            <div class="shortcut-item">
              <kbd class="kbd">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div class="shortcut-item">
              <kbd class="kbd">Enter</kbd>
              <span>Execute</span>
            </div>
            <div class="shortcut-item">
              <kbd class="kbd">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* Backdrop */
.command-palette-backdrop {
  @apply fixed inset-0 z-50 bg-black/50 backdrop-blur-sm;
  @apply flex items-start justify-center pt-[10vh];
}

/* Modal */
.command-palette-modal {
  @apply w-full max-w-xl mx-4;
  @apply bg-card border border-border rounded-lg shadow-2xl;
  @apply overflow-hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
}

/* Terminal Header */
.terminal-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply bg-gradient-to-r from-card to-background/50;
  @apply border-b border-border;
}

.terminal-controls {
  @apply flex items-center gap-2;
}

.terminal-dot {
  @apply w-3 h-3 rounded-full cursor-pointer transition-opacity;
}

.terminal-dot:hover {
  @apply opacity-80;
}

.terminal-dot-close { @apply bg-red-500; }
.terminal-dot-minimize { @apply bg-yellow-500; }
.terminal-dot-maximize { @apply bg-green-500; }

.terminal-title {
  @apply flex-1 text-center;
}

/* Search Container */
.search-container {
  @apply relative flex items-center px-4 py-3 border-b border-border;
}

.search-icon {
  @apply text-muted-foreground mr-3;
}

.search-input {
  @apply flex-1 bg-transparent border-none outline-none;
  @apply text-foreground placeholder-muted-foreground;
  @apply font-mono text-sm;
}

.search-shortcut {
  @apply ml-3;
}

/* Commands Container */
.commands-container {
  @apply max-h-96 overflow-y-auto;
}

/* Loading State */
.loading-state {
  @apply flex items-center justify-center gap-3 py-8 text-muted-foreground;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin;
}

.loading-text {
  @apply font-mono text-sm;
}

/* Empty State */
.empty-state {
  @apply text-center py-12 px-4 text-muted-foreground;
}

.empty-icon {
  @apply text-lg mb-3;
}

.empty-text {
  @apply font-medium mb-1;
}

.empty-hint {
  @apply text-sm;
}

/* Commands List */
.commands-list {
  @apply py-2;
}

.command-item {
  @apply flex items-center gap-2 px-3 py-2 cursor-pointer;
  @apply transition-all duration-150;
}

.command-item:hover,
.command-item-selected {
  @apply bg-muted/50;
}

.command-item-selected {
  @apply border-l-2 border-primary;
}

.command-icon {
  @apply flex-shrink-0 text-sm;
  width: 20px;
  text-align: center;
  overflow: hidden;
}

.command-content {
  @apply flex-1 min-w-0;
}

.command-name {
  @apply font-medium text-foreground;
}

.command-description {
  @apply text-sm text-muted-foreground truncate;
}

.command-meta {
  @apply flex items-center gap-2 flex-shrink-0;
}

.command-category {
  @apply text-xs font-mono uppercase tracking-wide;
}

.command-shortcut {
  @apply text-xs;
}

/* Footer */
.palette-footer {
  @apply px-4 py-3 bg-muted/30 border-t border-border;
}

.footer-shortcuts {
  @apply flex items-center gap-4 text-xs text-muted-foreground;
}

.shortcut-item {
  @apply flex items-center gap-1;
}

/* Keyboard shortcut styling */
.kbd {
  @apply inline-flex items-center px-1.5 py-0.5;
  @apply bg-muted border border-border rounded text-xs font-mono;
  @apply text-muted-foreground;
}

/* Scrollbar styling */
.commands-container::-webkit-scrollbar {
  @apply w-2;
}

.commands-container::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.commands-container::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

.commands-container::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}

/* Animations */
.command-palette-modal {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .command-palette-modal {
    animation: none;
  }
  
  .command-item {
    transition: none;
  }
}
</style>

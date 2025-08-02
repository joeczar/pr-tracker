<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useASCIIArt, type ASCIIArtOptions } from '@/composables/useASCIIArt'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  options?: ASCIIArtOptions
  class?: string
  variant?: 'default' | 'glow' | 'pulse' | 'typing'
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  color: 'primary',
  size: 'md',
  animate: false,
  center: true
})

const { generateASCII, getTemplate, isLoading, error } = useASCIIArt()
const asciiText = ref('')
const isVisible = ref(false)

// Generate ASCII art when component mounts or text changes
const generateArt = async () => {
  try {
    const result = await generateASCII(props.text, props.options)
    asciiText.value = result
    
    // Trigger animation after content is loaded
    if (props.animate) {
      setTimeout(() => {
        isVisible.value = true
      }, 100)
    } else {
      isVisible.value = true
    }
  } catch (err) {
    console.warn('Failed to generate ASCII art, using template:', err)
    asciiText.value = getTemplate(props.text)
    isVisible.value = true
  }
}

// Watch for text changes
watch(() => props.text, generateArt, { immediate: true })

onMounted(() => {
  generateArt()
})

// Computed classes for styling
const asciiClasses = computed(() => {
  return cn(
    'ascii-art font-mono whitespace-pre select-none',
    // Size variants
    {
      'text-xs leading-none': props.size === 'xs',
      'text-sm leading-tight': props.size === 'sm', 
      'text-base leading-snug': props.size === 'md',
      'text-lg leading-normal': props.size === 'lg',
      'text-xl leading-relaxed': props.size === 'xl'
    },
    // Color variants
    {
      'text-primary': props.color === 'primary',
      'text-secondary': props.color === 'secondary',
      'text-accent': props.color === 'accent',
      'text-success': props.color === 'success',
      'text-warning': props.color === 'warning',
      'text-destructive': props.color === 'destructive'
    },
    // Visual effects
    {
      'glow-primary': props.variant === 'glow' && props.color === 'primary',
      'glow-secondary': props.variant === 'glow' && props.color === 'secondary',
      'glow-accent': props.variant === 'glow' && props.color === 'accent',
      'glow-success': props.variant === 'glow' && props.color === 'success',
      'pulse-glow': props.variant === 'pulse',
      'typing-animation': props.variant === 'typing'
    },
    // Layout
    {
      'text-center': props.center,
      'text-left': !props.center
    },
    // Animation states
    {
      'opacity-0 transform scale-95': props.animate && !isVisible.value,
      'opacity-100 transform scale-100': props.animate && isVisible.value,
      'transition-all duration-500 ease-out': props.animate
    },
    props.class
  )
})
</script>

<template>
  <div class="ascii-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="ascii-loading">
      <div class="loading-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      <span class="loading-text">Generating ASCII art...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="ascii-error">
      <span class="error-icon">⚠</span>
      <span class="error-text">{{ error }}</span>
    </div>

    <!-- ASCII Art Content -->
    <pre 
      v-else
      :class="asciiClasses"
      :aria-label="`ASCII art: ${text}`"
      role="img"
    >{{ asciiText }}</pre>
  </div>
</template>

<style scoped>
.ascii-container {
  @apply relative;
}

.ascii-art {
  /* Ensure consistent monospace rendering */
  font-feature-settings: 'liga' 0, 'calt' 0;
  font-variant-ligatures: none;
  
  /* Prevent text selection issues */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  /* Improve rendering */
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Loading animation */
.ascii-loading {
  @apply flex flex-col items-center gap-3 py-8 text-muted-foreground;
}

.loading-dots {
  @apply flex gap-1;
}

.dot {
  @apply w-2 h-2 bg-primary rounded-full animate-pulse;
  animation-delay: calc(var(--i, 0) * 0.2s);
}

.dot:nth-child(1) { --i: 0; }
.dot:nth-child(2) { --i: 1; }
.dot:nth-child(3) { --i: 2; }

.loading-text {
  @apply text-sm font-mono;
}

/* Error state */
.ascii-error {
  @apply flex items-center gap-2 text-destructive font-mono text-sm;
}

.error-icon {
  @apply text-lg;
}

/* Typing animation */
.typing-animation {
  overflow: hidden;
  border-right: 2px solid currentColor;
  white-space: nowrap;
  animation: typing 3s steps(40, end), blink-caret 1s step-end infinite;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: currentColor; }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .ascii-art {
    @apply text-sm leading-tight;
    transform: scale(0.9);
    transform-origin: center;
  }
}

@media (max-width: 768px) {
  .ascii-art {
    @apply text-xs leading-tight;
    transform: scale(0.7);
    transform-origin: center;
    max-width: 100%;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .ascii-art {
    @apply text-xs leading-tight;
    transform: scale(0.5);
    transform-origin: center;
    max-width: 100%;
    overflow-x: auto;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .ascii-art {
    @apply text-foreground;
    text-shadow: none;
    box-shadow: none;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .ascii-art {
    animation: none !important;
    transition: none !important;
  }
  
  .typing-animation {
    animation: none;
    border-right: none;
    white-space: pre;
    overflow: visible;
  }
  
  .pulse-glow {
    animation: none;
  }
}
</style>

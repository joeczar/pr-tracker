<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'accent' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  as?: string
  variant?: Variant
  size?: Size
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}>(), {
  as: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button'
})
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? props.type : undefined"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex select-none items-center justify-center gap-2 rounded border font-medium transition will-change-transform
           outline-none focus-visible:ring-2 focus-visible:ring-cyber-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black
           [text-shadow:0_0_2px_currentColor,0_0_6px_currentColor] hover:brightness-110 active:scale-[0.98]"
    :class="[
      // variant styles
      variant === 'primary' && 'border-cyber-primary text-cyber-primary bg-black/30 shadow-cyber',
      variant === 'secondary' && 'border-cyber-secondary text-cyber-secondary bg-black/20 shadow-cyber',
      variant === 'accent' && 'border-cyber-accent text-cyber-accent bg-black/20 shadow-cyber',
      variant === 'ghost' && 'border-cyber-border text-cyber-muted bg-transparent hover:bg-black/20',
      disabled && 'opacity-50 pointer-events-none',
      // size styles
      size === 'sm' && 'px-2 py-1 text-xs',
      size === 'md' && 'px-3 py-1.5 text-sm',
      size === 'lg' && 'px-4 py-2 text-base',
    ]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/components/ui/button/Button.vue'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  as?: string
  href?: string
  target?: string
  rel?: string
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

/**
 * Map terminal variants/sizes to shadcn button variants/sizes and augment
 * with terminal/cyber aesthetic classes.
 */
const shadcnVariant = computed(() => {
  switch (props.variant) {
    case 'ghost':
      return 'ghost'
    case 'link':
      return 'link'
    case 'danger':
      return 'destructive'
    case 'secondary':
      return 'secondary'
    // primary and accent both map to default; accent will be styled via extra classes
    case 'primary':
    case 'accent':
    default:
      return 'default'
  }
})

const shadcnSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'sm'
    case 'lg':
      return 'lg'
    case 'md':
    default:
      return 'default'
  }
})

const extraClasses = computed(() => {
  return [
    'will-change-transform',
    'outline-none',
    'hover:brightness-110',
    'active:scale-[0.98]',
    '[text-shadow:0_0_2px_currentColor,0_0_6px_currentColor]',
    // terminal color accents per variant
    props.variant === 'primary' && 'border border-cyber-primary text-cyber-primary bg-black/30 shadow-cyber',
    props.variant === 'secondary' && 'border border-cyber-secondary text-cyber-secondary bg-black/20 shadow-cyber',
    props.variant === 'accent' && 'border border-cyber-accent text-cyber-accent bg-black/20 shadow-cyber',
    props.variant === 'ghost' && 'border border-cyber-border text-cyber-muted bg-transparent hover:bg-black/20',
    props.variant === 'danger' && 'border border-rose-500 text-rose-400 bg-black/20 hover:bg-rose-950/20',
    props.variant === 'link' && 'border-transparent text-cyber-accent underline underline-offset-4 hover:brightness-125',
    // ring color alignment with cyber accent
    'focus-visible:ring-cyber-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'
  ].filter(Boolean).join(' ')
})
</script>

<template>
  <!-- Anchor rendering preserved via as prop, using native element for a tags -->
  <a
    v-if="as === 'a'"
    :href="href"
    :target="target"
    :rel="rel"
    :aria-label="ariaLabel"
    class="inline-flex"
    :class="extraClasses"
  >
    <Button as="span" :variant="shadcnVariant" :size="shadcnSize" :disabled="disabled" class="bg-transparent border-0 p-0">
      <slot />
    </Button>
  </a>

  <Button
    v-else
    :type="props.type"
    :variant="shadcnVariant"
    :size="shadcnSize"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :class="extraClasses"
  >
    <slot />
  </Button>
</template>

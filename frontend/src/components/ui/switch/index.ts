import { cva, type VariantProps } from 'class-variance-authority'

export { default as Switch } from './Switch.vue'

export const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-5 w-9 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        terminal: 'h-6 w-11 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted border-primary/20 shadow-lg data-[state=checked]:shadow-primary/20 data-[state=unchecked]:shadow-muted/20',
        cyberpunk: 'h-6 w-11 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary/80 data-[state=unchecked]:bg-muted border-primary/30 shadow-lg data-[state=checked]:shadow-primary/30 data-[state=unchecked]:shadow-muted/20',
        compact: 'h-4 w-7 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform',
  {
    variants: {
      variant: {
        default: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        terminal: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 shadow-primary/20',
        cyberpunk: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 shadow-primary/30 bg-gradient-to-r from-background to-background/90',
        compact: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type SwitchVariants = VariantProps<typeof switchVariants>

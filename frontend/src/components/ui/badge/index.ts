import { cva, type VariantProps } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'
export { default as StatusBadge } from './StatusBadge.vue'

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        // Terminal/Status variants
        active: 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 font-terminal',
        inactive: 'border-muted bg-muted/10 text-muted-foreground font-terminal',
        error: 'border-destructive bg-destructive/10 text-destructive shadow-lg shadow-destructive/20 font-terminal',
        warning: 'border-warning bg-warning/10 text-warning shadow-lg shadow-warning/20 font-terminal',
        success: 'border-success bg-success/10 text-success shadow-lg shadow-success/20 font-terminal',
        processing: 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/40 font-terminal animate-pulse',
        terminal: 'border-primary/50 bg-background text-primary hover:bg-primary/5 hover:border-primary hover:shadow-lg hover:shadow-primary/20 font-terminal',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

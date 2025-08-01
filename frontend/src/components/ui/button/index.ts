import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-terminal font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:glow-primary border border-primary/20',
        destructive:
          'bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-xl border border-destructive/30',
        outline:
          'border-2 border-primary bg-transparent text-primary shadow hover:bg-primary/10 hover:text-primary hover:glow-primary',
        secondary:
          'bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/80 hover:glow-accent border border-secondary/20',
        ghost: 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
        terminal: 'bg-background border-2 border-primary text-primary hover:bg-primary/5 hover:glow-primary font-mono px-6',
        command: 'bg-card border border-border text-foreground hover:border-primary hover:text-primary hover:bg-card/80',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 rounded px-2 text-xs',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
        terminal: 'h-12 px-6 py-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

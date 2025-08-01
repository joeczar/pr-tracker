import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-terminal font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40 text-sm',
        destructive:
          'bg-destructive text-destructive-foreground border border-destructive/30 shadow-lg hover:bg-destructive/90 hover:shadow-xl text-sm',
        outline:
          'bg-transparent text-foreground border border-border hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/20 text-sm',
        secondary:
          'bg-secondary text-secondary-foreground border border-secondary/20 shadow-lg hover:bg-secondary/80 hover:shadow-xl hover:shadow-secondary/40 text-sm',
        ghost: 'hover:bg-primary/10 hover:text-primary text-muted-foreground text-sm',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80 text-sm',
        terminal: 'bg-background border-2 border-primary text-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/40 px-6 text-sm',
        command: 'bg-card border border-border text-foreground hover:border-primary hover:text-primary hover:bg-card/80 text-sm',
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

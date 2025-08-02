import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border border-transparent hover:bg-primary/90 hover:shadow-[0_0_10px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 text-sm',
        destructive:
          'bg-destructive text-destructive-foreground border border-transparent hover:bg-destructive/90 hover:shadow-[0_0_10px_hsl(var(--destructive)/0.5)] hover:-translate-y-0.5 text-sm',
        outline:
          'bg-transparent text-foreground border border-border hover:border-primary hover:text-primary hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)] text-sm',
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent hover:bg-secondary/90 hover:shadow-[0_0_10px_hsl(var(--secondary)/0.5)] hover:-translate-y-0.5 text-sm',
        ghost: 'bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground text-sm',
        link: 'bg-transparent text-primary border border-transparent underline-offset-4 hover:underline hover:text-primary/80 text-sm p-0 h-auto',
        terminal: 'bg-transparent border border-primary/30 text-primary font-mono hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)] text-sm',
        accent: 'bg-accent text-accent-foreground border border-transparent hover:bg-accent/90 hover:shadow-[0_0_10px_hsl(var(--accent)/0.5)] hover:-translate-y-0.5 text-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        terminal: 'h-10 px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

import { cva, type VariantProps } from 'class-variance-authority'

export { default as Alert } from './Alert.vue'
export { default as AlertDescription } from './AlertDescription.vue'
export { default as AlertTitle } from './AlertTitle.vue'

export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm font-terminal transition-all duration-200 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/5',
        // Terminal variants
        error: 'border-destructive bg-destructive/10 text-destructive shadow-lg shadow-destructive/20 [&>svg]:text-destructive',
        warning: 'border-warning bg-warning/10 text-warning shadow-lg shadow-warning/20 [&>svg]:text-warning',
        success: 'border-success bg-success/10 text-success shadow-lg shadow-success/20 [&>svg]:text-success',
        info: 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 [&>svg]:text-primary',
        terminal: 'border-primary/50 bg-background/50 text-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20 [&>svg]:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>

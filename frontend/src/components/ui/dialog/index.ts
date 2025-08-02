import { cva, type VariantProps } from 'class-variance-authority'

export { default as Dialog } from './Dialog.vue'
export { default as DialogClose } from './DialogClose.vue'
export { default as DialogContent } from './DialogContent.vue'
export { default as DialogDescription } from './DialogDescription.vue'
export { default as DialogFooter } from './DialogFooter.vue'
export { default as DialogHeader } from './DialogHeader.vue'
export { default as DialogScrollContent } from './DialogScrollContent.vue'
export { default as DialogTitle } from './DialogTitle.vue'
export { default as DialogTrigger } from './DialogTrigger.vue'
export { default as TerminalDialog } from './TerminalDialog.vue'

export const dialogContentVariants = cva(
  'fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      variant: {
        default: 'max-w-lg',
        terminal: 'max-w-2xl border-primary/30 bg-background/95 backdrop-blur-sm shadow-2xl shadow-primary/10 font-terminal',
        cyberpunk: 'max-w-2xl border-primary/50 bg-gradient-to-br from-background via-background/90 to-background/80 shadow-2xl shadow-primary/20 backdrop-blur-md',
        compact: 'max-w-md',
        large: 'max-w-4xl',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      variant: {
        default: 'bg-black/80',
        terminal: 'bg-black/90 backdrop-blur-sm',
        cyberpunk: 'bg-gradient-to-br from-black/80 via-primary/5 to-black/80 backdrop-blur-md',
        compact: 'bg-black/80',
        large: 'bg-black/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const dialogTitleVariants = cva(
  'text-lg font-semibold leading-none tracking-tight',
  {
    variants: {
      variant: {
        default: '',
        terminal: 'font-terminal text-primary tracking-wider uppercase text-base',
        cyberpunk: 'font-terminal text-primary tracking-widest uppercase text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
        compact: 'text-base font-semibold',
        large: 'text-xl font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export const dialogDescriptionVariants = cva(
  'text-sm text-muted-foreground',
  {
    variants: {
      variant: {
        default: '',
        terminal: 'font-terminal text-muted-foreground/80 text-xs',
        cyberpunk: 'font-terminal text-muted-foreground/90 text-sm',
        compact: 'text-xs text-muted-foreground',
        large: 'text-base text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type DialogVariants = VariantProps<typeof dialogContentVariants>

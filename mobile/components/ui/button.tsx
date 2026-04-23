import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { Pressable } from 'react-native'
import { cn } from '~/lib/utils'
import { TextClassContext } from '~/components/ui/text'

const buttonVariants = cva(
  'group shrink-0 flex-row items-center justify-center gap-2 rounded-xl shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-primary active:opacity-90 shadow-sm shadow-black/5',
        destructive: 'bg-destructive active:opacity-90 shadow-sm shadow-black/5',
        outline: 'border-border bg-background active:bg-accent border shadow-sm shadow-black/5',
        secondary: 'bg-secondary active:opacity-80 shadow-sm shadow-black/5',
        ghost: 'active:bg-accent',
        link: '',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 gap-1.5 rounded-lg px-3',
        lg: 'h-14 rounded-xl px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

const buttonTextVariants = cva('text-sm font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground group-active:text-accent-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground group-active:text-accent-foreground',
      link: 'text-primary',
    },
    size: {
      default: '',
      sm: 'text-xs',
      lg: 'text-base',
      icon: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

type ButtonProps = React.ComponentProps<typeof Pressable> & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          props.disabled && 'opacity-50',
          buttonVariants({ variant, size }),
          className
        )}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export { Button, buttonTextVariants, buttonVariants }
export type { ButtonProps }

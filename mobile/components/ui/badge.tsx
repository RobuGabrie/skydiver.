import * as Slot from '@rn-primitives/slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { View } from 'react-native'
import { cn } from '~/lib/utils'
import { TextClassContext } from '~/components/ui/text'

const badgeVariants = cva(
  'shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5',
  {
    variants: {
      variant: {
        default: 'bg-primary border-transparent',
        secondary: 'bg-secondary border-transparent',
        destructive: 'bg-destructive border-transparent',
        outline: 'border-border',
        success: 'bg-green-500/20 border-green-500/50',
        warning: 'bg-orange-500/20 border-orange-500/50',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const badgeTextVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-white',
      outline: 'text-foreground',
      success: 'text-green-400',
      warning: 'text-orange-400',
    },
  },
  defaultVariants: { variant: 'default' },
})

type BadgeProps = React.ComponentProps<typeof View> & {
  asChild?: boolean
} & VariantProps<typeof badgeVariants>

function Badge({ className, variant, asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  )
}

export { Badge, badgeTextVariants, badgeVariants }
export type { BadgeProps }

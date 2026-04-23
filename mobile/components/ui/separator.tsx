import * as React from 'react'
import { View } from 'react-native'
import { cn } from '~/lib/utils'

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
}: {
  className?: string
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}) {
  return (
    <View
      role={decorative ? 'none' : 'separator'}
      className={cn(
        'bg-border shrink-0',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
    />
  )
}

export { Separator }

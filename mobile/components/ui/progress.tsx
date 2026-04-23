import * as ProgressPrimitive from '@rn-primitives/progress'
import * as React from 'react'
import { Platform, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated'
import { cn } from '~/lib/utils'

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
      value={value}
    >
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

type IndicatorProps = {
  value: number | undefined | null
  className?: string
}

function NativeIndicator({ value, className }: IndicatorProps) {
  const progress = useDerivedValue(() => value ?? 0)

  const indicator = useAnimatedStyle(() => ({
    width: withSpring(
      `${interpolate(progress.value, [0, 100], [1, 100], Extrapolation.CLAMP)}%`,
      { overshootClamping: true }
    ),
  }), [value])

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View style={indicator} className={cn('bg-foreground h-full', className)} />
    </ProgressPrimitive.Indicator>
  )
}

function WebIndicator({ value, className }: IndicatorProps) {
  return (
    <View
      className={cn('bg-primary h-full w-full flex-1', className)}
      style={{ transform: [{ translateX: `${-(100 - (value ?? 0))}%` } as any] }}
    />
  )
}

const Indicator = Platform.select({
  web: WebIndicator,
  default: NativeIndicator,
})!

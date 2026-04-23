import React from 'react'
import { Pressable, PressableProps } from 'react-native'
import { MotiView, useDynamicAnimation } from 'moti'

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode
  containerStyle?: any
}

export function AnimatedPressable({
  children,
  containerStyle,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const anim = useDynamicAnimation(() => ({ scale: 1, opacity: 1 }))

  return (
    <Pressable
      onPressIn={e => {
        anim.animateTo({ scale: 0.94, opacity: 0.8 })
        onPressIn?.(e)
      }}
      onPressOut={e => {
        anim.animateTo({ scale: 1, opacity: 1 })
        onPressOut?.(e)
      }}
      {...props}
    >
      <MotiView
        state={anim}
        transition={{ type: 'timing', duration: 100 }}
        style={containerStyle}
      >
        {children}
      </MotiView>
    </Pressable>
  )
}

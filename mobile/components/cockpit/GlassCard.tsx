import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../../lib/ThemeContext'
import { Radius, Spacing } from '../../lib/theme'

type GlassCardProps = ViewProps & {
  intensity?: number
  padded?: boolean
}

export function GlassCard({
  children,
  style,
  intensity = 32,
  padded = true,
  ...props
}: GlassCardProps) {
  const { colors, isDark } = useTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.border,
          boxShadow: isDark
            ? '0 18px 40px rgba(2, 16, 13, 0.44)'
            : '0 12px 32px rgba(10, 36, 30, 0.14)',
        },
        padded && styles.padded,
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    borderWidth: 1,
    position: 'relative',
  },
  padded: {
    padding: Spacing.md,
  },
})

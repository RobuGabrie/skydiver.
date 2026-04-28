import React, { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '../../lib/ThemeContext'

export const CockpitBackground = memo(function CockpitBackground() {
  const { colors, isDark } = useTheme()

  const topGlow = isDark
    ? [colors.primary + '30', 'transparent'] as const
    : [colors.primary + '26', 'transparent'] as const

  const bottomGlow = isDark
    ? [colors.wifi + '24', 'transparent'] as const
    : [colors.wifi + '1D', 'transparent'] as const

  const centerGlow = isDark
    ? [colors.warning + '20', 'transparent'] as const
    : [colors.warning + '14', 'transparent'] as const

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.background, colors.surfaceRaised, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={topGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topBlob}
      />
      <LinearGradient
        colors={centerGlow}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.centerBlob}
      />
      <LinearGradient
        colors={bottomGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bottomBlob}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  topBlob: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 360,
    height: 320,
    borderRadius: 220,
  },
  centerBlob: {
    position: 'absolute',
    top: '34%',
    left: -70,
    width: 250,
    height: 250,
    borderRadius: 180,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -130,
    left: -80,
    width: 340,
    height: 280,
    borderRadius: 220,
  },
})

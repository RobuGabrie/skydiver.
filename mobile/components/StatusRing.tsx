import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography } from '../lib/theme'

interface Props {
  value: number
  size?: number
  color?: string
  trackColor?: string
  label?: string
  centerLabel?: string
}

export function StatusRing({ value, size = 80, color, trackColor, label, centerLabel }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const ringColor = color ?? colors.primary
  const ringTrack = trackColor ?? colors.border

  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value))
  const strokeDashoffset = circumference * (1 - progress / 100)
  const cx = size / 2
  const cy = size / 2

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cy} r={radius} stroke={ringTrack} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        {centerLabel && (
          <Text style={[styles.centerText, { color: ringColor, fontSize: size * 0.22 }]}>{centerLabel}</Text>
        )}
        <Text style={[styles.valueText, { color: ringColor, fontSize: size * 0.2 }]}>
          {Math.round(progress)}
        </Text>
      </View>
      {label && <Text style={[styles.label, { fontSize: size * 0.14 }]}>{label}</Text>}
    </View>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerText: {
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    valueText: {
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    label: {
      color: colors.textMuted,
      marginTop: 4,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  })
}

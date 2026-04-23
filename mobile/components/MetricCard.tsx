import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius } from '../lib/theme'

interface Props {
  label: string
  value: string | number
  unit?: string
  color?: string
  warning?: boolean
  large?: boolean
  delay?: number
  children?: React.ReactNode
}

export function MetricCard({ label, value, unit, color, warning, large, delay = 0, children }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const accentColor = warning ? colors.danger : (color ?? colors.primary)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 110, delay }}
      style={[
        styles.card,
        warning && { borderColor: colors.danger + '60', backgroundColor: colors.dangerDim },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, large && styles.valueLarge, { color: accentColor }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: accentColor + '80' }]}>{unit}</Text>
        )}
      </View>
      {children}
    </MotiView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      overflow: 'hidden',
      flex: 1,
    },
    accent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
    },
    label: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.xs,
      fontWeight: Typography.medium,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
    },
    value: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      fontVariant: ['tabular-nums'],
    },
    valueLarge: {
      fontSize: Typography.hero,
      lineHeight: Typography.hero * 1.1,
    },
    unit: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      marginBottom: 3,
    },
  })
}

import React, { useMemo, useRef, useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MotiView } from 'moti'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius } from '../lib/theme'
import { Progress } from '~/components/ui/progress'

interface Props {
  label: string
  value: string | number
  unit?: string
  color?: string
  warning?: boolean
  large?: boolean
  delay?: number
  progress?: number
  children?: React.ReactNode
}

export function MetricCard({ label, value, unit, color, warning, large, delay = 0, progress, children }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const accentColor = warning ? colors.danger : (color ?? colors.primary)

  const prevValue = useRef(value)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 500)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 110, delay }}
      style={[
        styles.card,
        warning
          ? { borderColor: colors.danger + '55', backgroundColor: colors.dangerDim }
          : { borderColor: accentColor + '28' },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <Text style={styles.label}>{label}</Text>

      <MotiView
        animate={pulsing ? { scale: 1.07, opacity: 0.65 } : { scale: 1, opacity: 1 }}
        transition={{ type: 'timing', duration: 220 }}
        style={styles.valueRow}
      >
        <Text style={[styles.value, large && styles.valueLarge, { color: accentColor }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: accentColor + '80' }]}>{unit}</Text>
        )}
      </MotiView>

      {progress !== undefined && (
        <Progress
          value={Math.min(100, Math.max(0, progress))}
          className="h-1 mt-2"
          indicatorClassName={warning ? 'bg-destructive' : undefined}
        />
      )}

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
      padding: Spacing.md,
      overflow: 'hidden',
      flex: 1,
    },
    accentBar: {
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
      letterSpacing: 1.1,
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
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
    },
    valueLarge: {
      fontSize: Typography.hero,
      lineHeight: Typography.hero * 1.05,
    },
    unit: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      fontFamily: Typography.mono,
      marginBottom: 3,
    },
  })
}

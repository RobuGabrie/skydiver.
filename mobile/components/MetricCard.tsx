import React, { useMemo, useRef, useEffect, useState, memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../lib/theme'
import { Progress } from '~/components/ui/progress'
import type { VitalPoint } from '../lib/types'

interface Props {
  label: string
  value: string | number
  unit?: string
  color?: string
  warning?: boolean
  large?: boolean
  progress?: number
  icon?: React.ComponentProps<typeof Ionicons>['name']
  history?: VitalPoint[]
  children?: React.ReactNode
}

export const MetricCard = memo(function MetricCard({ label, value, unit, color, warning, large, progress, icon, history, children }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const accentColor = warning ? colors.danger : (color ?? colors.primary)
  const [expanded, setExpanded] = useState(false)
  const canExpand = Boolean(history && history.length >= 2)

  const prevValue = useRef(value)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 300)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <Pressable
      onPress={() => {
        if (canExpand) setExpanded(prev => !prev)
      }}
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.surfaceGlass },
      ]}
      accessibilityRole={canExpand ? 'button' : undefined}
      accessibilityLabel={`${label}${canExpand ? ', tap to expand history' : ''}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {icon && (
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Ionicons name={icon} size={16} color={accentColor} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>

        {canExpand && (
          <View style={styles.chevronWrap}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={[styles.valueRow, pulsing && styles.valueRowPulse]}>
        <Text style={[styles.value, large && styles.valueLarge, { color: accentColor }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: accentColor + '80' }]}>{unit}</Text>
        )}
      </View>

      {progress !== undefined && (
        <Progress
          value={Math.min(100, Math.max(0, progress))}
          className="h-0.5 mt-2"
          indicatorClassName={warning ? 'bg-destructive' : undefined}
        />
      )}

      {expanded && canExpand && (
        <View style={styles.expandedSection}>
          {children ? <View style={styles.historyWrap}>{children}</View> : null}
          <View style={styles.rangeRow}>
            <View style={[styles.rangeChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>Min</Text>
              <Text style={[styles.rangeValue, { color: colors.textPrimary }]}>
                {Math.min(...(history ?? []).map(point => point.value)).toFixed(0)}
              </Text>
            </View>
            <View style={[styles.rangeChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>Now</Text>
              <Text style={[styles.rangeValue, { color: accentColor }]}>{String(value)}</Text>
            </View>
            <View style={[styles.rangeChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>Max</Text>
              <Text style={[styles.rangeValue, { color: colors.textPrimary }]}>
                {Math.max(...(history ?? []).map(point => point.value)).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  )
})

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.md,
      flex: 1,
      gap: 8,
      boxShadow: '0 10px 28px rgba(3, 10, 22, 0.22)',
      minHeight: TouchTarget,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: Typography.medium,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
    },
    valueRowPulse: {
      opacity: 0.45,
    },
    value: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
      lineHeight: Typography.xl * 1.1,
      letterSpacing: 0.3,
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
    chevronWrap: {
      width: TouchTarget,
      height: TouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandedSection: {
      gap: Spacing.sm,
    },
    historyWrap: {
      paddingTop: 2,
    },
    rangeRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    rangeChip: {
      flex: 1,
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 2,
    },
    rangeLabel: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.9,
      fontWeight: Typography.semibold,
    },
    rangeValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
    },
  })
}

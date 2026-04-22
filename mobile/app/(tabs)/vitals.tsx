import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSimulation } from '../../hooks/useSimulation'
import { useTheme } from '../../lib/ThemeContext'
import { StatusRing } from '../../components/StatusRing'
import { SparkLine } from '../../components/SparkLine'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'

interface VitalRowProps {
  label: string
  value: number
  unit: string
  color: string
  min: number
  max: number
  warning: boolean
  description: string
  history: { time: number; value: number }[]
  colors: AppColors
}

function VitalRow({ label, value, unit, color, min, max, warning, description, history, colors }: VitalRowProps) {
  const [expanded, setExpanded] = useState(false)
  const styles = useMemo(() => makeStyles(colors), [colors])
  const pct = Math.round(((value - min) / (max - min)) * 100)
  const accentColor = warning ? colors.danger : color

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      style={[styles.vitalRow, warning && { borderColor: colors.danger + '50', backgroundColor: colors.dangerDim }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value} ${unit}`}
    >
      <View style={styles.vitalTop}>
        <View style={styles.vitalLeft}>
          <Text style={[styles.vitalLabel, { color: warning ? colors.danger : colors.textMuted }]}>
            {label}
          </Text>
          <View style={styles.vitalValueRow}>
            <Text style={[styles.vitalValue, { color: accentColor }]}>{value}</Text>
            <Text style={[styles.vitalUnit, { color: accentColor + '80' }]}>{unit}</Text>
            {warning && (
              <View style={styles.warningBadge}>
                <Ionicons name="warning" size={11} color={colors.danger} />
                <Text style={styles.warningText}>Alert</Text>
              </View>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, {
                width: `${Math.min(100, Math.max(0, pct))}%`,
                backgroundColor: accentColor,
              }]}
            />
          </View>
        </View>
        <View style={styles.vitalRight}>
          <SparkLine data={history} color={accentColor} width={80} height={36} />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textMuted}
            style={styles.chevron}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedDesc}>{description}</Text>
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>Min: {min} {unit}</Text>
            <Text style={[styles.rangeText, { color: accentColor }]}>Now: {value} {unit}</Text>
            <Text style={styles.rangeText}>Max: {max} {unit}</Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}

export default function VitalsScreen() {
  const { colors } = useTheme()
  const { data } = useSimulation()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const vitals: Omit<VitalRowProps, 'colors'>[] = [
    {
      label: 'Heart Rate',
      value: data.heartRate,
      unit: 'bpm',
      color: colors.heartRate,
      min: 40,
      max: 200,
      warning: data.heartRate > 160,
      description: 'Heart beats per minute. Safe range during freefall: 60–160 bpm. Elevated heart rate may indicate physical stress or exertion.',
      history: data.heartRateHistory,
    },
    {
      label: 'Blood Oxygen (SpO₂)',
      value: data.oxygen,
      unit: '%',
      color: colors.oxygen,
      min: 85,
      max: 100,
      warning: data.oxygen < 93,
      description: 'Oxygen saturation in blood. Below 93% is concerning at altitude. Hypoxia can impair decision-making. Normal: 95–100%.',
      history: data.oxygenHistory,
    },
    {
      label: 'Stress Index',
      value: data.stress,
      unit: '%',
      color: colors.stress,
      min: 0,
      max: 100,
      warning: data.stress > 80,
      description: 'Derived stress index from HRV and motion patterns. Above 80% indicates possible panic response or loss of control.',
      history: data.heartRateHistory.map(p => ({ ...p, value: p.value * 0.5 })),
    },
    {
      label: 'Body Temperature',
      value: data.temperature,
      unit: '°C',
      color: colors.temperature,
      min: 35,
      max: 40,
      warning: data.temperature > 37.5,
      description: 'Skin temperature from wrist sensor. Hypothermia risk at high altitude. Normal range: 36.1–37.2°C.',
      history: data.heartRateHistory.map(p => ({ ...p, value: 36 + Math.sin(p.time / 10000) * 0.8 })),
    },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Biometrics</Text>
        <Text style={styles.pageSubtitle}>Live physiological monitoring</Text>

        {/* Status rings */}
        <View style={styles.ringsCard}>
          <View style={styles.ringItem}>
            <StatusRing
              value={data.oxygen}
              size={88}
              color={data.oxygen < 93 ? colors.danger : colors.oxygen}
            />
            <Text style={styles.ringLabel}>SpO₂</Text>
            <Text style={[styles.ringValue, { color: data.oxygen < 93 ? colors.danger : colors.oxygen }]}>
              {data.oxygen}%
            </Text>
          </View>
          <View style={styles.ringDivider} />
          <View style={styles.ringItem}>
            <StatusRing
              value={data.stress}
              size={88}
              color={data.stress > 80 ? colors.danger : colors.stress}
            />
            <Text style={styles.ringLabel}>Stress</Text>
            <Text style={[styles.ringValue, { color: data.stress > 80 ? colors.danger : colors.stress }]}>
              {data.stress}%
            </Text>
          </View>
          <View style={styles.ringDivider} />
          <View style={styles.ringItem}>
            <StatusRing
              value={data.battery}
              size={88}
              color={data.battery < 20 ? colors.danger : colors.battery}
            />
            <Text style={styles.ringLabel}>Battery</Text>
            <Text style={[styles.ringValue, { color: data.battery < 20 ? colors.danger : colors.battery }]}>
              {data.battery}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detail View</Text>
        <Text style={styles.sectionHint}>Tap a row to expand</Text>

        <View style={styles.vitalsList}>
          {vitals.map(v => (
            <VitalRow key={v.label} {...v} colors={colors} />
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: Spacing.md },

    pageTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary, marginBottom: 2 },
    pageSubtitle: { fontSize: Typography.sm, color: colors.textMuted, marginBottom: Spacing.lg },

    ringsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    ringItem: { flex: 1, alignItems: 'center', gap: Spacing.xs },
    ringDivider: { width: 1, height: 60, backgroundColor: colors.border },
    ringLabel: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    ringValue: { fontSize: Typography.md, fontWeight: Typography.bold, fontFamily: Typography.mono },

    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    sectionHint: { fontSize: Typography.xs, color: colors.textMuted, marginBottom: Spacing.md },

    vitalsList: { gap: Spacing.sm },

    vitalRow: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      minHeight: TouchTarget,
    },

    vitalTop: { flexDirection: 'row', gap: Spacing.md },
    vitalLeft: { flex: 1 },
    vitalRight: { alignItems: 'flex-end', justifyContent: 'space-between' },

    vitalLabel: {
      fontSize: Typography.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: Typography.medium,
      marginBottom: 4,
    },
    vitalValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: Spacing.sm },
    vitalValue: { fontSize: Typography.xl, fontWeight: Typography.bold, fontVariant: ['tabular-nums'] },
    vitalUnit: { fontSize: Typography.sm, marginBottom: 3, fontWeight: Typography.medium },

    warningBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.dangerDim,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.full,
      marginBottom: 3,
      marginLeft: 4,
    },
    warningText: { fontSize: Typography.xs, color: colors.danger, fontWeight: Typography.semibold },

    progressTrack: { height: 3, backgroundColor: colors.borderMuted, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    chevron: { marginTop: Spacing.xs },

    expandedSection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Spacing.sm,
    },
    expandedDesc: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: Typography.sm * 1.6,
    },
    rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
    rangeText: { fontSize: Typography.xs, color: colors.textMuted, fontFamily: Typography.mono },
  })
}

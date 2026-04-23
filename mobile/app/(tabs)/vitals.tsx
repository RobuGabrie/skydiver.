import React, { useState, useMemo, useRef, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from 'moti'
import { useBle } from '../../lib/BleContext'
import { useTheme } from '../../lib/ThemeContext'
import { StatusRing } from '../../components/StatusRing'
import { SparkLine } from '../../components/SparkLine'
import { Progress } from '~/components/ui/progress'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'
import type { VitalPoint } from '../../lib/types'

const MAX_HIST = 40

function pushPoint(arr: VitalPoint[], value: number): VitalPoint[] {
  return [...arr.slice(-(MAX_HIST - 1)), { time: Date.now(), value }]
}

interface VitalRowProps {
  label: string
  value: number
  unit: string
  color: string
  min: number
  max: number
  warning: boolean
  description: string
  history: VitalPoint[]
  colors: AppColors
  index: number
}

function VitalRow({
  label, value, unit, color, min, max, warning, description, history, colors, index,
}: VitalRowProps) {
  const [expanded, setExpanded] = useState(false)
  const styles = useMemo(() => makeStyles(colors), [colors])
  const pct = Math.round(((value - min) / (max - min)) * 100)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 110, delay: index * 70 }}
    >
      <Pressable
        onPress={() => setExpanded(e => !e)}
        style={[
          styles.vitalRow,
          warning && { borderColor: colors.danger + '50', backgroundColor: colors.dangerDim },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value} ${unit}`}
      >
        <View style={styles.vitalTop}>
          <View style={styles.vitalLeft}>
            <Text style={[styles.vitalLabel, { color: warning ? colors.danger : colors.textMuted }]}>
              {label}
            </Text>
            <View style={styles.vitalValRow}>
              <Text style={[styles.vitalValue, { color: warning ? colors.danger : colors.textPrimary }]}>
                {value}
              </Text>
              <Text style={[styles.vitalUnit, { color: warning ? colors.danger + '80' : colors.textMuted }]}>
                {unit}
              </Text>
              {warning && (
                <View style={styles.warningBadge}>
                  <Ionicons name="warning" size={10} color={colors.danger} />
                  <Text style={styles.warningText}>Alert</Text>
                </View>
              )}
            </View>
            <Progress
              value={Math.min(100, Math.max(0, pct))}
              className="h-1"
              indicatorClassName={warning ? 'bg-destructive' : undefined}
            />
          </View>

          <View style={styles.vitalRight}>
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 400, delay: index * 70 + 200 }}
            >
              <SparkLine data={history} color={warning ? colors.danger : color} width={72} height={32} />
            </MotiView>
            <MotiView
              animate={{ rotate: expanded ? '180deg' : '0deg' }}
              transition={{ type: 'spring', damping: 16, stiffness: 200 }}
              style={styles.chevron}
            >
              <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
            </MotiView>
          </View>
        </View>

        <AnimatePresence>
          {expanded && (
            <MotiView
              key="expanded"
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -6 }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.expandedSection}
            >
              <Text style={styles.expandedDesc}>{description}</Text>
              <View style={styles.rangeRow}>
                <Text style={styles.rangeText}>Min: {min} {unit}</Text>
                <Text style={[styles.rangeText, { color: warning ? colors.danger : color }]}>
                  Now: {value} {unit}
                </Text>
                <Text style={styles.rangeText}>Max: {max} {unit}</Text>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </Pressable>
    </MotiView>
  )
}

export default function VitalsScreen() {
  const { colors } = useTheme()
  const { slowPacket, connectedId } = useBle()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const hrHist = useRef<VitalPoint[]>([])
  const o2Hist = useRef<VitalPoint[]>([])
  const stressHist = useRef<VitalPoint[]>([])
  const tempHist = useRef<VitalPoint[]>([])
  const [, forceUpdate] = useState(false)

  useEffect(() => {
    if (!slowPacket) return
    hrHist.current = pushPoint(hrHist.current, slowPacket.bpm)
    o2Hist.current = pushPoint(o2Hist.current, slowPacket.spo2)
    stressHist.current = pushPoint(stressHist.current, slowPacket.stressPct)
    tempHist.current = pushPoint(tempHist.current, slowPacket.tempC)
    forceUpdate(v => !v)
  }, [slowPacket])

  const isConnected = connectedId !== null

  if (!isConnected || !slowPacket) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 260 }}
          >
            <Text style={styles.pageTitle}>Biometrics</Text>
            <Text style={styles.pageSubtitle}>Live physiological monitoring</Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 16, stiffness: 100, delay: 100 }}
            style={styles.emptyState}
          >
            <Ionicons name="heart-dislike-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No device connected</Text>
            <Text style={styles.emptyBody}>
              Connect a SkyWatch wearable on the Connect tab to see real-time biometric data.
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    )
  }

  const vitals: Omit<VitalRowProps, 'colors' | 'index'>[] = [
    {
      label: 'Heart Rate',
      value: Math.round(slowPacket.bpm),
      unit: 'bpm',
      color: colors.heartRate,
      min: 40, max: 200,
      warning: slowPacket.bpm > 160,
      description:
        'Heart beats per minute. Safe range during freefall: 60–160 bpm. Elevated rate may indicate physical stress.',
      history: hrHist.current,
    },
    {
      label: 'Blood Oxygen (SpO₂)',
      value: Math.round(slowPacket.spo2),
      unit: '%',
      color: colors.oxygen,
      min: 85, max: 100,
      warning: slowPacket.spo2 < 93,
      description:
        'Oxygen saturation in blood. Below 93% is concerning at altitude — hypoxia can impair decision-making. Normal: 95–100%.',
      history: o2Hist.current,
    },
    {
      label: 'Stress Index',
      value: Math.round(slowPacket.stressPct),
      unit: '%',
      color: colors.stress,
      min: 0, max: 100,
      warning: slowPacket.stressPct > 80,
      description:
        'Derived stress index from HRV and motion. Above 80% indicates possible panic response or loss of control.',
      history: stressHist.current,
    },
    {
      label: 'Body Temperature',
      value: +slowPacket.tempC.toFixed(1),
      unit: '°C',
      color: colors.temperature,
      min: 35, max: 40,
      warning: slowPacket.tempC > 37.5,
      description:
        'Skin temperature from wrist sensor. Hypothermia risk at altitude. Normal: 36.1–37.2°C.',
      history: tempHist.current,
    },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
        >
          <Text style={styles.pageTitle}>Biometrics</Text>
          <Text style={styles.pageSubtitle}>Live physiological monitoring</Text>
        </MotiView>

        {/* Status rings */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 60 }}
          style={styles.ringsCard}
        >
          {[
            {
              value: slowPacket.spo2,
              color: slowPacket.spo2 < 93 ? colors.danger : colors.oxygen,
              label: 'SpO₂',
              display: `${Math.round(slowPacket.spo2)}%`,
              delay: 80,
            },
            {
              value: slowPacket.stressPct,
              color: slowPacket.stressPct > 80 ? colors.danger : colors.stress,
              label: 'Stress',
              display: `${Math.round(slowPacket.stressPct)}%`,
              delay: 140,
            },
            {
              value: slowPacket.battPct,
              color: slowPacket.battPct < 20 ? colors.danger : colors.battery,
              label: 'Battery',
              display: `${Math.round(slowPacket.battPct)}%`,
              delay: 200,
            },
          ].map((ring, i) => (
            <React.Fragment key={ring.label}>
              {i > 0 && <View style={styles.ringDivider} />}
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 120, delay: ring.delay }}
                style={styles.ringItem}
              >
                <StatusRing value={ring.value} size={88} color={ring.color} />
                <Text style={styles.ringLabel}>{ring.label}</Text>
                <Text style={[styles.ringValue, { color: ring.color }]}>{ring.display}</Text>
              </MotiView>
            </React.Fragment>
          ))}
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 240, delay: 200 }}
        >
          <Text style={styles.sectionTitle}>Detail View</Text>
          <Text style={styles.sectionHint}>Tap a row to expand</Text>
        </MotiView>

        <View style={styles.vitalsList}>
          {vitals.map((v, i) => (
            <VitalRow key={v.label} {...v} colors={colors} index={i} />
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

    pageTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    pageSubtitle: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      marginBottom: Spacing.lg,
    },

    emptyState: {
      alignItems: 'center',
      paddingTop: Spacing.xxl,
      gap: Spacing.md,
    },
    emptyTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: colors.textSecondary,
    },
    emptyBody: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: Typography.sm * 1.7,
      maxWidth: 280,
    },

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
    ringValue: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
    },

    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    sectionHint: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      marginBottom: Spacing.md,
    },

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
    vitalValRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      marginBottom: Spacing.sm,
    },
    vitalValue: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      fontVariant: ['tabular-nums'],
    },
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
    warningText: {
      fontSize: Typography.xs,
      color: colors.danger,
      fontWeight: Typography.semibold,
    },

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
    rangeText: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      fontFamily: Typography.mono,
    },
  })
}

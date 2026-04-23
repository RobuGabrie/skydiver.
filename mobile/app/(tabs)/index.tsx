import React, { useMemo, useRef, useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from 'moti'
import { useBle } from '../../lib/BleContext'
import { useConnectivity } from '../../hooks/useConnectivity'
import { useTheme } from '../../lib/ThemeContext'
import { usePhoneLocation } from '../../hooks/usePhoneLocation'
import { ConnectionBadge } from '../../components/ConnectionBadge'
import { MetricCard } from '../../components/MetricCard'
import { SparkLine } from '../../components/SparkLine'
import { Badge } from '~/components/ui/badge'
import { Text as UIText } from '~/components/ui/text'
import { Progress } from '~/components/ui/progress'
import { AppColors, Typography, Spacing, Radius } from '../../lib/theme'
import { formatDuration } from '../../lib/timeUtils'
import type { VitalPoint, SkydiverStatus } from '../../lib/types'

const MAX_HIST = 40

function pushPoint(arr: VitalPoint[], value: number): VitalPoint[] {
  return [...arr.slice(-(MAX_HIST - 1)), { time: Date.now(), value }]
}

function deriveStatus(
  vSpeed: number,
  altitude: number | null,
  stationary: number,
): SkydiverStatus {
  if (stationary === 1) {
    return altitude !== null && altitude > 200 ? 'standby' : 'landed'
  }
  if (vSpeed < -15) return 'freefall'
  if (vSpeed < -2) return 'canopy_open'
  if (altitude !== null && altitude < 30) return 'landed'
  return 'standby'
}

type BadgeVariant = 'default' | 'success' | 'secondary' | 'destructive'

const STATUS_CFG: Record<SkydiverStatus, { label: string; color: string; variant: BadgeVariant; pulse: boolean }> = {
  freefall:    { label: 'FREEFALL',    color: '#00E5FF', variant: 'default',     pulse: true },
  canopy_open: { label: 'CANOPY OPEN', color: '#00E676', variant: 'success',     pulse: true },
  landed:      { label: 'LANDED',      color: '#3A5A78', variant: 'secondary',   pulse: false },
  standby:     { label: 'STANDBY',     color: '#3A5A78', variant: 'secondary',   pulse: false },
  alert:       { label: 'ALERT',       color: '#FF3B30', variant: 'destructive', pulse: true },
}

export default function DashboardScreen() {
  const { colors } = useTheme()
  const { mode, bleConnected, deviceRssi } = useConnectivity()
  const { slowPacket, fastPacket, connectedId, updatePhoneLocation } = useBle()
  const { location } = usePhoneLocation(true)
  const { width: screenWidth } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const hrHist = useRef<VitalPoint[]>([])
  const o2Hist = useRef<VitalPoint[]>([])
  const altHist = useRef<VitalPoint[]>([])
  const [, forceUpdate] = useState(false)

  const sessionStart = useRef(Date.now())
  const prevConnected = useRef<string | null>(null)

  const prevAlt = useRef<number | null>(null)
  const prevAltTime = useRef(Date.now())
  const [vertSpeed, setVertSpeed] = useState(0)

  useEffect(() => {
    if (connectedId && connectedId !== prevConnected.current) {
      sessionStart.current = Date.now()
      hrHist.current = []
      o2Hist.current = []
    }
    prevConnected.current = connectedId
  }, [connectedId])

  useEffect(() => {
    if (!slowPacket) return
    hrHist.current = pushPoint(hrHist.current, slowPacket.bpm)
    o2Hist.current = pushPoint(o2Hist.current, slowPacket.spo2)
    forceUpdate(v => !v)
  }, [slowPacket])

  useEffect(() => {
    if (!location) return

    updatePhoneLocation({
      lat: location.latitude,
      lon: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
    })

    const alt = location.altitude
    if (alt !== null) {
      const now = Date.now()
      if (prevAlt.current !== null) {
        const dt = (now - prevAltTime.current) / 1000
        if (dt > 0.1) {
          setVertSpeed((alt - prevAlt.current) / dt)
        }
      }
      prevAlt.current = alt
      prevAltTime.current = now
      altHist.current = pushPoint(altHist.current, alt)
      forceUpdate(v => !v)
    }
  }, [location, updatePhoneLocation])

  const isConnected = connectedId !== null
  const altitude = location?.altitude ?? null
  const status = deriveStatus(vertSpeed, altitude, fastPacket?.stationary ?? 1)
  const statusCfg = STATUS_CFG[status]

  const gForce = fastPacket
    ? Math.sqrt(fastPacket.accelX ** 2 + fastPacket.accelY ** 2 + fastPacket.accelZ ** 2)
    : null

  const cardInner = screenWidth - Spacing.md * 2 - Spacing.md * 2
  const sparkW = Math.floor((screenWidth - Spacing.md * 4 - Spacing.sm) / 2)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.appTitle}>SKYDIVER</Text>
            <Text style={styles.subTitle}>
              {isConnected ? 'Device connected' : 'No device'}
            </Text>
          </View>
          <ConnectionBadge mode={mode} bleConnected={bleConnected} deviceRssi={deviceRssi} />
        </MotiView>

        {/* ── Altitude + status hero ───────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 60 }}
          style={[styles.heroCard, { borderColor: statusCfg.color + '30' }]}
        >
          <View style={styles.heroTop}>
            <Badge variant={statusCfg.variant} className="flex-row items-center gap-1.5">
              <MotiView
                from={{ opacity: 1, scale: 1 }}
                animate={statusCfg.pulse ? { opacity: 0.15, scale: 1.8 } : { opacity: 1, scale: 1 }}
                transition={
                  statusCfg.pulse
                    ? { type: 'timing', duration: 850, loop: true, repeatReverse: true }
                    : { type: 'timing', duration: 200 }
                }
                style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusCfg.color }}
              />
              <UIText className="text-xs font-bold tracking-widest" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </UIText>
            </Badge>
            <Text style={styles.sessionTimer}>
              {formatDuration(Date.now() - sessionStart.current)}
            </Text>
          </View>

          <View style={styles.altRow}>
            <Text style={[styles.altValue, { color: statusCfg.color }]}>
              {altitude !== null ? Math.round(altitude).toLocaleString() : '—'}
            </Text>
            <Text style={[styles.altUnit, { color: statusCfg.color + '70' }]}>m</Text>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="arrow-down" size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>{Math.abs(vertSpeed).toFixed(1)} m/s</Text>
            </View>
            {location ? (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {location.latitude.toFixed(5)}°  {location.longitude.toFixed(5)}°
                </Text>
              </View>
            ) : (
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>Acquiring GPS…</Text>
              </View>
            )}
          </View>

          <AnimatePresence>
            {altHist.current.length >= 2 && (
              <MotiView
                key="sparkline"
                from={{ opacity: 0, scaleX: 0.85 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 16, stiffness: 120 }}
                style={[styles.sparkWrap, { transformOrigin: 'left' } as any]}
              >
                <SparkLine
                  data={altHist.current}
                  color={statusCfg.color}
                  width={cardInner}
                  height={44}
                />
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>

        {/* ── Vitals header ────────────────────────────── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 240, delay: 120 }}
          style={styles.sectionRow}
        >
          <Text style={styles.sectionTitle}>Vitals</Text>
          {isConnected && (
            <View style={styles.liveChip}>
              <MotiView
                from={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0.15, scale: 1.7 }}
                transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
                style={[styles.liveDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
            </View>
          )}
        </MotiView>

        {/* ── Vitals MetricCard grid ───────────────────── */}
        <AnimatePresence>
          {isConnected && slowPacket ? (
            <MotiView
              key="vitals-grid"
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -8 }}
              transition={{ type: 'spring', damping: 18, stiffness: 110, delay: 140 }}
            >
              <View style={styles.metricRow}>
                <MetricCard
                  label="Heart Rate"
                  value={Math.round(slowPacket.bpm)}
                  unit="bpm"
                  color={colors.heartRate}
                  warning={slowPacket.bpm > 160}
                  delay={140}
                >
                  <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 220 }}>
                    <SparkLine data={hrHist.current} color={slowPacket.bpm > 160 ? colors.danger : colors.heartRate} width={sparkW} height={20} />
                  </MotiView>
                </MetricCard>
                <MetricCard
                  label="SpO₂"
                  value={Math.round(slowPacket.spo2)}
                  unit="%"
                  color={colors.oxygen}
                  warning={slowPacket.spo2 < 93}
                  delay={170}
                >
                  <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 260 }}>
                    <SparkLine data={o2Hist.current} color={slowPacket.spo2 < 93 ? colors.danger : colors.oxygen} width={sparkW} height={20} />
                  </MotiView>
                </MetricCard>
              </View>

              <View style={styles.metricRow}>
                <MetricCard
                  label="Stress"
                  value={Math.round(slowPacket.stressPct)}
                  unit="%"
                  color={colors.stress}
                  warning={slowPacket.stressPct > 80}
                  progress={slowPacket.stressPct}
                  delay={200}
                />
                <MetricCard
                  label="Temperature"
                  value={slowPacket.tempC.toFixed(1)}
                  unit="°C"
                  color={colors.temperature}
                  warning={slowPacket.tempC > 37.5}
                  delay={230}
                />
              </View>

              {fastPacket && gForce !== null && (
                <View style={styles.metricRow}>
                  <MetricCard
                    label="G-Force"
                    value={gForce.toFixed(2)}
                    unit="g"
                    color={gForce > 3 ? colors.warning : colors.primary}
                    warning={gForce > 4}
                    delay={260}
                  />
                  <MetricCard
                    label="Vert Speed"
                    value={Math.abs(vertSpeed).toFixed(1)}
                    unit="m/s"
                    color={colors.primary}
                    delay={290}
                  />
                </View>
              )}
            </MotiView>
          ) : (
            <MotiView
              key="vitals-empty"
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 260, delay: 140 }}
              style={styles.emptyCard}
            >
              <Ionicons name="bluetooth-outline" size={22} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No device connected</Text>
              <Text style={styles.emptyBody}>
                Connect a SkyWatch wearable to see live vitals
              </Text>
            </MotiView>
          )}
        </AnimatePresence>

        {/* ── Motion · IMU ─────────────────────────────── */}
        {fastPacket && (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 110, delay: 180 }}
          >
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Motion · IMU</Text>
              {fastPacket.stationary === 1 && (
                <Text style={styles.staticLabel}>Stationary</Text>
              )}
            </View>

            <View style={styles.imuCard}>
              <Text style={styles.imuGroup}>Orientation</Text>
              <View style={styles.imuRow}>
                {[
                  { label: 'Roll',  val: `${fastPacket.rollDeg.toFixed(1)}°` },
                  { label: 'Pitch', val: `${fastPacket.pitchDeg.toFixed(1)}°` },
                  { label: 'Yaw',   val: `${fastPacket.yawDeg.toFixed(1)}°` },
                ].map(item => (
                  <View key={item.label} style={styles.imuCell}>
                    <Text style={styles.imuLabel}>{item.label}</Text>
                    <Text style={[styles.imuValue, { color: colors.textSecondary }]}>{item.val}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.imuDivider} />

              <Text style={styles.imuGroup}>Accel (g)</Text>
              <View style={styles.imuRow}>
                {[
                  { label: 'X', val: fastPacket.accelX.toFixed(3) },
                  { label: 'Y', val: fastPacket.accelY.toFixed(3) },
                  { label: 'Z', val: fastPacket.accelZ.toFixed(3) },
                ].map(item => (
                  <View key={item.label} style={styles.imuCell}>
                    <Text style={styles.imuLabel}>{item.label}</Text>
                    <Text style={[styles.imuValue, { color: colors.primary }]}>
                      {item.val}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.imuDivider} />

              <Text style={styles.imuGroup}>Gyro (dps)</Text>
              <View style={styles.imuRow}>
                {[
                  { label: 'X', val: fastPacket.gyroX.toFixed(1) },
                  { label: 'Y', val: fastPacket.gyroY.toFixed(1) },
                  { label: 'Z', val: fastPacket.gyroZ.toFixed(1) },
                ].map(item => (
                  <View key={item.label} style={styles.imuCell}>
                    <Text style={styles.imuLabel}>{item.label}</Text>
                    <Text style={[styles.imuValue, { color: colors.stress }]}>
                      {item.val}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>
        )}

        {/* ── Device ───────────────────────────────────── */}
        {slowPacket && (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 110, delay: 220 }}
          >
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Device</Text>
            </View>

            <View style={styles.deviceRow}>
              <View style={styles.battCard}>
                <View style={styles.battTop}>
                  <Ionicons
                    name={slowPacket.battPct > 20 ? 'battery-half' : 'battery-dead'}
                    size={16}
                    color={slowPacket.battPct > 20 ? colors.battery : colors.danger}
                  />
                  <Text style={[
                    styles.battPct,
                    { color: slowPacket.battPct > 20 ? colors.battery : colors.danger },
                  ]}>
                    {Math.round(slowPacket.battPct)}%
                  </Text>
                </View>
                <Progress
                  value={slowPacket.battPct}
                  className="h-1.5 mb-1"
                  indicatorClassName={slowPacket.battPct > 20 ? 'bg-battery' : 'bg-destructive'}
                />
                <Text style={styles.battDetail}>
                  {slowPacket.voltageV.toFixed(2)} V · {slowPacket.currentMA} mA
                </Text>
              </View>

              <View style={styles.sysCard}>
                {[
                  { label: 'CPU', val: `${Math.round(slowPacket.cpuPct)}%` },
                  { label: 'Seq', val: `#${slowPacket.seq}` },
                  { label: 'Up',  val: `${(slowPacket.uptimeMs / 1000).toFixed(0)}s` },
                ].map(item => (
                  <View key={item.label} style={styles.sysRow}>
                    <Text style={styles.sysLabel}>{item.label}</Text>
                    <Text style={styles.sysVal}>{item.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </MotiView>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    appTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      letterSpacing: 4,
    },
    subTitle: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      marginTop: 2,
      letterSpacing: 0.3,
    },

    heroCard: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sessionTimer: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      fontFamily: Typography.mono,
    },

    altRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      marginBottom: Spacing.xs,
    },
    altValue: {
      fontSize: 60,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
      lineHeight: 66,
    },
    altUnit: {
      fontSize: Typography.xl,
      marginBottom: 10,
    },

    heroMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      fontFamily: Typography.mono,
    },

    sparkWrap: { marginTop: Spacing.xs, overflow: 'hidden' },

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.4,
    },
    liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: Typography.xs, fontWeight: Typography.medium },
    staticLabel: { fontSize: Typography.xs, color: colors.textMuted },

    metricRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },

    emptyCard: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.xl,
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      fontSize: Typography.base,
      color: colors.textSecondary,
      fontWeight: Typography.semibold,
    },
    emptyBody: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: Typography.sm * 1.6,
    },

    imuCard: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    imuGroup: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    imuRow: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    imuCell: { flex: 1, alignItems: 'center' },
    imuLabel: { fontSize: Typography.xs, color: colors.textMuted, marginBottom: 3 },
    imuValue: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      fontFamily: Typography.mono,
    },
    imuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.sm,
    },

    deviceRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    battCard: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    battTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    battPct: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
    },
    battDetail: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      fontFamily: Typography.mono,
      marginTop: 4,
    },

    sysCard: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    sysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sysLabel: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sysVal: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textPrimary,
      fontFamily: Typography.mono,
    },
  })
}

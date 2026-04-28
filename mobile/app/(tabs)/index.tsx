import React, { memo, useMemo, useRef, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import Svg, { Circle } from 'react-native-svg'
import { useBle } from '../../lib/BleContext'
import { useConnectivity } from '../../hooks/useConnectivity'
import { useTheme } from '../../lib/ThemeContext'
import { usePhoneLocation } from '../../hooks/usePhoneLocation'
import { ConnectionBadge } from '../../components/ConnectionBadge'
import { MetricCard } from '../../components/MetricCard'
import { SparkLine } from '../../components/SparkLine'
import { CockpitBackground } from '../../components/cockpit/CockpitBackground'
import { EmptyStatePanel } from '../../components/cockpit/EmptyStatePanel'
import { SectionHeader } from '../../components/cockpit/SectionHeader'
import { AppColors, Typography, Spacing, Radius } from '../../lib/theme'
import { formatDuration } from '../../lib/timeUtils'
import type { FastPacket } from '../../lib/bleProtocol'
import type { VitalPoint, SkydiverStatus } from '../../lib/types'

const MAX_HIST = 40

function pushPoint(arr: VitalPoint[], value: number): VitalPoint[] {
  return [...arr.slice(-(MAX_HIST - 1)), { time: Date.now(), value }]
}

function deriveStatus(
  vSpeed: number | null,
  altitude: number | null,
  stationary: number,
): SkydiverStatus {
  if (stationary === 1) {
    return altitude !== null && altitude > 200 ? 'standby' : 'landed'
  }
  if (vSpeed !== null && vSpeed < -15) return 'freefall'
  if (vSpeed !== null && vSpeed < -2) return 'canopy_open'
  if (altitude !== null && altitude < 30) return 'landed'
  return 'standby'
}

const STATUS_CFG: Record<SkydiverStatus, { label: string; color: string; pulse: boolean }> = {
  freefall:    { label: 'FREEFALL',    color: '#38BDF8', pulse: true },
  canopy_open: { label: 'CANOPY OPEN', color: '#22C55E', pulse: true },
  landed:      { label: 'LANDED',      color: '#64748B', pulse: false },
  standby:     { label: 'STANDBY',     color: '#64748B', pulse: false },
  alert:       { label: 'ALERT',       color: '#EF4444', pulse: true },
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

const motionStyles = StyleSheet.create({
  telemetryCardOuter: {
    flex: 1,
  },
  telemetryCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  telemetryCopy: {
    flex: 1,
    gap: 4,
  },
  telemetryTitle: {
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: Typography.semibold,
  },
  telemetryValue: {
    fontSize: Typography.xl,
    lineHeight: Typography.xl * 1.05,
    fontWeight: Typography.bold,
    fontFamily: Typography.mono,
    fontVariant: ['tabular-nums'],
  },
  telemetrySubtitle: {
    fontSize: Typography.sm,
    lineHeight: Typography.sm * 1.35,
  },
  telemetryRingWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryRingLabelWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryRingLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    letterSpacing: 1.1,
  },
  telemetryChipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  telemetryChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  telemetryChipLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: Typography.semibold,
  },
  telemetryChipValue: {
    fontSize: Typography.sm,
    fontFamily: Typography.mono,
    fontWeight: Typography.semibold,
  },
  telemetryBarBlock: {
    gap: 6,
  },
  telemetryBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryBarLabel: {
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    fontWeight: Typography.semibold,
  },
  telemetryBarValue: {
    fontSize: Typography.xs,
    fontFamily: Typography.mono,
    fontWeight: Typography.bold,
  },
  telemetryBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
  },
  telemetryBar: {
    flex: 1,
    borderRadius: Radius.full,
  },
})

const RingGauge = memo(function RingGauge({
  value,
  size,
  stroke,
  color,
  track,
}: {
  value: number
  size: number
  stroke: number
  color: string
  track: string
}) {
  const radius = (size - stroke) / 2
  const circumference = Math.PI * radius * 2
  const dashOffset = circumference * (1 - clamp(value, 0, 100) / 100)

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={track}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
})

const TelemetryCard = memo(function TelemetryCard({
  title,
  value,
  subtitle,
  accent,
  colors,
  ringValue,
  ringLabel,
  ringTrack,
  chipA,
  chipB,
  barLabel,
  barValue,
  isCritical = false,
}: {
  title: string
  value: string
  subtitle: string
  accent: string
  colors: AppColors
  ringValue: number
  ringLabel: string
  ringTrack: string
  chipA: { label: string; value: string }
  chipB: { label: string; value: string }
  barLabel: string
  barValue: number
  isCritical?: boolean
}) {
  const barCount = 10
  const activeBars = Math.max(1, Math.round(clamp(barValue, 0, 100) / 10))

  return (
    <View style={motionStyles.telemetryCardOuter}>
      <LinearGradient
        colors={[
          accent + '24',
          isCritical ? accent + '0F' : accent + '12',
          colors.surface,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          motionStyles.telemetryCard,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceRaised,
            borderTopColor: accent,
            borderTopWidth: 2.5,
          },
        ]}
      >
        <View style={motionStyles.telemetryTopRow}>
          <View style={motionStyles.telemetryCopy}>
            <Text style={[motionStyles.telemetryTitle, { color: colors.textMuted }]}>{title}</Text>
            <Text style={[motionStyles.telemetryValue, { color: accent }]}>{value}</Text>
            <Text style={[motionStyles.telemetrySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>

          <View style={motionStyles.telemetryRingWrap}>
            <RingGauge
              value={ringValue}
              size={76}
              stroke={7}
              color={accent}
              track={ringTrack}
            />
            <View style={motionStyles.telemetryRingLabelWrap}>
              <Text style={[motionStyles.telemetryRingLabel, { color: accent }]}>{ringLabel}</Text>
            </View>
          </View>
        </View>

        <View style={motionStyles.telemetryChipRow}>
          <View style={[motionStyles.telemetryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[motionStyles.telemetryChipLabel, { color: colors.textMuted }]}>{chipA.label}</Text>
            <Text style={[motionStyles.telemetryChipValue, { color: colors.textPrimary }]}>{chipA.value}</Text>
          </View>
          <View style={[motionStyles.telemetryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[motionStyles.telemetryChipLabel, { color: colors.textMuted }]}>{chipB.label}</Text>
            <Text style={[motionStyles.telemetryChipValue, { color: colors.textPrimary }]}>{chipB.value}</Text>
          </View>
        </View>

        <View style={motionStyles.telemetryBarBlock}>
          <View style={motionStyles.telemetryBarHeader}>
            <Text style={[motionStyles.telemetryBarLabel, { color: colors.textMuted }]}>{barLabel}</Text>
            <Text style={[motionStyles.telemetryBarValue, { color: accent }]}>{Math.round(barValue)}%</Text>
          </View>
          <View style={motionStyles.telemetryBars}>
            {Array.from({ length: barCount }, (_, index) => {
              const isActive = index < activeBars
              return (
                <View
                  key={index}
                  style={[
                    motionStyles.telemetryBar,
                    {
                      backgroundColor: isActive ? accent : ringTrack,
                      opacity: isActive ? 1 : 0.35,
                      height: 9 + (index % 3) * 3,
                    },
                  ]}
                />
              )
            })}
          </View>
        </View>
      </LinearGradient>
    </View>
  )
})

export default function DashboardScreen() {
  const { colors, isDark } = useTheme()
  const { mode, bleConnected, deviceRssi } = useConnectivity()
  const { slowPacket, fastPacketRef, connectedId, updatePhoneLocation } = useBle()
  const { location } = usePhoneLocation(true)
  const { width: screenWidth } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const fastPacket = fastPacketRef.current as FastPacket | null

  const hrHist = useRef<VitalPoint[]>([])
  const o2Hist = useRef<VitalPoint[]>([])
  const stressHist = useRef<VitalPoint[]>([])
  const tempHist = useRef<VitalPoint[]>([])
  const altHist = useRef<VitalPoint[]>([])

  // IMU-based vertical speed — integrated world-frame acceleration, used as fallback when GPS altitude is unavailable.
  const imuVSpeedRef = useRef(0)
  const lastImuTimeRef = useRef<number | null>(null)

  const sessionStart = useRef(Date.now())
  const prevConnected = useRef<string | null>(null)

  // Track previous values so we can update refs synchronously during render,
  // avoiding a second forceUpdate render after each BLE packet or GPS tick.
  const prevSlowPacketRef = useRef(slowPacket)
  const prevLocationRef = useRef(location)

  if (slowPacket !== prevSlowPacketRef.current) {
    prevSlowPacketRef.current = slowPacket
    if (slowPacket) {
      hrHist.current = pushPoint(hrHist.current, slowPacket.bpm)
      o2Hist.current = pushPoint(o2Hist.current, slowPacket.spo2)
      stressHist.current = pushPoint(stressHist.current, slowPacket.stressPct)
      tempHist.current = pushPoint(tempHist.current, slowPacket.tempC)

      // Update IMU vertical speed using world-frame Z acceleration from the latest fast packet.
      // Quaternion rotates body accel → world frame; subtract gravity, integrate with decay.
      const fast = fastPacketRef.current
      const nowMs = Date.now()
      if (fast) {
        const { quat0: qw, quat1: qx, quat2: qy, quat3: qz, accelX, accelY, accelZ } = fast
        // World-frame Z: rotate body accel vector by quaternion
        const worldZ = 2*(qx*qz - qw*qy)*accelX + 2*(qy*qz + qw*qx)*accelY + (1 - 2*(qx*qx + qy*qy))*accelZ
        const vertAccelMs2 = (worldZ - 1.0) * 9.81  // subtract gravity, convert g → m/s²
        if (lastImuTimeRef.current !== null) {
          const dt = (nowMs - lastImuTimeRef.current) / 1000
          if (dt > 0 && dt < 1.0) {
            // Integrate with exponential decay (τ ≈ 0.5 s) to prevent unbounded drift
            imuVSpeedRef.current = imuVSpeedRef.current * Math.exp(-dt / 0.5) + vertAccelMs2 * dt
          }
        }
        lastImuTimeRef.current = nowMs
      }
    }
  }

  if (location !== prevLocationRef.current) {
    prevLocationRef.current = location
    if (location?.altitude !== null && location?.altitude !== undefined) {
      altHist.current = pushPoint(altHist.current, location.altitude)
    }
  }

  // GPS-based vertical speed (primary). Falls back to IMU integration when GPS altitude unavailable.
  const vertSpeed: number | null = (() => {
    const h = altHist.current
    if (h.length >= 2) {
      const last = h[h.length - 1]
      const prev = h[h.length - 2]
      const dt = (last.time - prev.time) / 1000
      if (dt > 0.1) return (last.value - prev.value) / dt
    }
    // Fall back to IMU integration if the board is connected and has sent data
    if (lastImuTimeRef.current !== null) return imuVSpeedRef.current
    return null
  })()

  useEffect(() => {
    if (connectedId && connectedId !== prevConnected.current) {
      sessionStart.current = Date.now()
      hrHist.current = []
      o2Hist.current = []
      altHist.current = []
      imuVSpeedRef.current = 0
      lastImuTimeRef.current = null
    }
    prevConnected.current = connectedId
  }, [connectedId])

  useEffect(() => {
    if (!location) return
    updatePhoneLocation({
      lat: location.latitude,
      lon: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
    })
  }, [location, updatePhoneLocation])

  const isConnected = connectedId !== null
  const altitude = location?.altitude ?? null
  const status = deriveStatus(vertSpeed, altitude, fastPacket?.stationary ?? 1)
  const statusCfg = STATUS_CFG[status]
  const heroGradient = isDark
    ? [statusCfg.color + '28', colors.surfaceRaised, colors.surface] as const
    : [statusCfg.color + '18', '#FFFFFF', colors.surfaceRaised] as const

  const gForce = fastPacket
    ? Math.sqrt(fastPacket.accelX ** 2 + fastPacket.accelY ** 2 + fastPacket.accelZ ** 2)
    : null

  const sparkW = Math.floor((screenWidth - Spacing.md * 2 - Spacing.sm) / 2 - Spacing.md * 2)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CockpitBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoMark, { backgroundColor: colors.primary + '1E', borderColor: colors.primary + '45' }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.appTitle}>SkyDiver</Text>
              <Text style={styles.subTitle}>
                {isConnected ? 'Device connected' : 'No device connected'}
              </Text>
            </View>
          </View>
          <ConnectionBadge mode={mode} bleConnected={bleConnected} deviceRssi={deviceRssi} />
        </View>

        {/* ── Hero Altitude Card ── */}
        <View style={[styles.heroCard, { borderColor: statusCfg.color + '50' }]}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />

          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { borderColor: statusCfg.color + '40' }]}>
              <MotiView
                from={{ opacity: 1 }}
                animate={statusCfg.pulse ? { opacity: 0.2 } : { opacity: 1 }}
                transition={statusCfg.pulse
                  ? { type: 'timing', duration: 800, loop: true, repeatReverse: true }
                  : { type: 'timing', duration: 200 }
                }
                style={[styles.statusDot, { backgroundColor: statusCfg.color }]}
              />
              <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
            <View style={[styles.timerChip, { backgroundColor: colors.surface + 'C0', borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={10} color={colors.textMuted} />
              <Text style={styles.sessionTimer}>
                {formatDuration(Date.now() - sessionStart.current)}
              </Text>
            </View>
          </View>

          <View style={styles.altRow}>
            <Text style={[styles.altValue, { color: statusCfg.color }]}>
              {altitude !== null ? Math.round(altitude).toLocaleString() : '—'}
            </Text>
            <Text style={[styles.altUnit, { color: statusCfg.color + '70' }]}>m</Text>
          </View>

          <View style={styles.heroMeta}>
            <View style={[styles.metaChip, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}>
              <Ionicons name="arrow-down" size={10} color={colors.textMuted} />
              <Text style={styles.metaText}>{vertSpeed !== null ? `${Math.abs(vertSpeed).toFixed(1)} m/s` : '— m/s'}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: colors.surface + '80', borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={10} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {location
                  ? `${location.latitude.toFixed(4)}°  ${location.longitude.toFixed(4)}°`
                  : 'Acquiring GPS…'
                }
              </Text>
            </View>
          </View>

          {altHist.current.length >= 2 && (
            <View style={styles.sparkWrap}>
              <SparkLine
                data={altHist.current}
                color={statusCfg.color}
                width={screenWidth - Spacing.md * 4}
                height={36}
              />
            </View>
          )}
        </View>

        {/* ── Vitals section ── */}
        <View style={styles.sectionRow}>
          <SectionHeader title="Vitals" />
          {isConnected && (
            <View style={styles.liveChip}>
              <MotiView
                from={{ opacity: 1 }}
                animate={{ opacity: 0.2 }}
                transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
                style={[styles.liveDot, { backgroundColor: colors.success }]}
              />
              <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
            </View>
          )}
        </View>

        {isConnected && slowPacket ? (
          <View>
            <View style={styles.metricRow}>
              <MetricCard
                label="Heart Rate"
                value={Math.round(slowPacket.bpm)}
                unit="bpm"
                color={colors.heartRate}
                warning={slowPacket.bpm > 160}
                icon="heart-outline"
                history={hrHist.current}
              >
                <View style={styles.sparkInCard}>
                  <SparkLine
                    data={hrHist.current}
                    color={slowPacket.bpm > 160 ? colors.danger : colors.heartRate}
                    width={sparkW}
                    height={22}
                  />
                </View>
              </MetricCard>
              <MetricCard
                label="SpO₂"
                value={Math.round(slowPacket.spo2)}
                unit="%"
                color={colors.oxygen}
                warning={slowPacket.spo2 < 93}
                icon="water-outline"
                history={o2Hist.current}
              >
                <View style={styles.sparkInCard}>
                  <SparkLine
                    data={o2Hist.current}
                    color={slowPacket.spo2 < 93 ? colors.danger : colors.oxygen}
                    width={sparkW}
                    height={22}
                  />
                </View>
              </MetricCard>
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Stress Index"
                value={Math.round(slowPacket.stressPct)}
                unit="%"
                color={colors.stress}
                warning={slowPacket.stressPct > 80}
                icon="pulse-outline"
                progress={slowPacket.stressPct}
                history={stressHist.current}
              >
                <View style={styles.sparkInCard}>
                  <SparkLine
                    data={stressHist.current}
                    color={slowPacket.stressPct > 80 ? colors.danger : colors.stress}
                    width={sparkW}
                    height={22}
                  />
                </View>
              </MetricCard>
              <MetricCard
                label="Temperature"
                value={slowPacket.tempC.toFixed(1)}
                unit="°C"
                color={colors.temperature}
                warning={slowPacket.tempC > 37.5}
                icon="thermometer-outline"
                history={tempHist.current}
              >
                <View style={styles.sparkInCard}>
                  <SparkLine
                    data={tempHist.current}
                    color={slowPacket.tempC > 37.5 ? colors.danger : colors.temperature}
                    width={sparkW}
                    height={22}
                  />
                </View>
              </MetricCard>
            </View>

            {gForce !== null && (
              <View style={styles.metricRow}>
                <MetricCard
                  label="G-Force"
                  value={gForce.toFixed(2)}
                  unit="g"
                  color={gForce > 3 ? colors.warning : colors.primary}
                  warning={gForce > 4}
                  icon="speedometer-outline"
                />
                <MetricCard
                  label="Vert Speed"
                  value={vertSpeed !== null ? Math.abs(vertSpeed).toFixed(1) : '—'}
                  unit="m/s"
                  color={colors.primary}
                  icon="arrow-down-outline"
                />
              </View>
            )}
          </View>
        ) : (
          <EmptyStatePanel
            icon="bluetooth-outline"
            title="No device connected"
            body="Connect a SkyWatch wearable to see live vitals."
          />
        )}

        {slowPacket && (
          <View>
            <SectionHeader title="System Strip" hint="Battery · Voltage · CPU · Temp" />
            <View style={styles.systemStrip}>
              {[
                { label: 'Battery', value: `${Math.round(slowPacket.battPct)}%`, color: slowPacket.battPct <= 20 ? colors.danger : colors.battery },
                { label: 'Voltage', value: `${slowPacket.voltageV.toFixed(2)} V`, color: colors.textPrimary },
                { label: 'CPU', value: `${Math.round(slowPacket.cpuPct)}%`, color: slowPacket.cpuPct > 80 ? colors.warning : colors.textPrimary },
                { label: 'Temp', value: `${slowPacket.tempC.toFixed(1)} °C`, color: slowPacket.tempC > 37.5 ? colors.danger : colors.temperature },
              ].map(item => (
                <View key={item.label} style={[styles.systemChip, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
                  <Text style={[styles.systemLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.systemValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
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
      paddingTop: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoMark: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    subTitle: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      marginTop: 1,
    },

    heroCard: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      overflow: 'hidden',
      position: 'relative',
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: colors.surface + 'D0',
      borderWidth: 1,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      letterSpacing: 1.5,
    },
    timerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    sessionTimer: {
      fontSize: Typography.xs,
      color: colors.textSecondary,
      fontFamily: Typography.mono,
    },

    altRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      marginBottom: Spacing.sm,
    },
    altValue: {
      fontSize: 62,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
      lineHeight: 66,
    },
    altUnit: {
      fontSize: Typography.xl,
      marginBottom: 8,
      fontFamily: Typography.mono,
      fontWeight: Typography.medium,
    },

    heroMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      borderWidth: 1,
    },
    metaText: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      fontFamily: Typography.mono,
    },

    sparkWrap: { marginTop: Spacing.sm, overflow: 'hidden' },

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
      marginTop: Spacing.sm,
    },
    liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: Typography.xs, fontWeight: Typography.medium },

    metricRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },

    systemStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    systemChip: {
      flexBasis: '48%',
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.sm,
      gap: 4,
    },
    systemLabel: {
      fontSize: Typography.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontWeight: Typography.semibold,
    },
    systemValue: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
    },

    sparkInCard: { marginTop: Spacing.sm },
  })
}

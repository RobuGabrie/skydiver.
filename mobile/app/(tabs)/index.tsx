import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSimulation } from '../../hooks/useSimulation'
import { useConnectivity } from '../../hooks/useConnectivity'
import { useBle } from '../../lib/BleContext'
import { useTheme } from '../../lib/ThemeContext'
import { ConnectionBadge } from '../../components/ConnectionBadge'
import { MetricCard } from '../../components/MetricCard'
import { AlertBanner } from '../../components/AlertBanner'
import { SparkLine } from '../../components/SparkLine'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'
import { formatDuration, formatTime } from '../../lib/timeUtils'

const STATUS_KEYS = {
  freefall:    { label: 'Freefall',    colorKey: 'primary' as const,  icon: 'arrow-down' as const },
  canopy_open: { label: 'Canopy Open', colorKey: 'success' as const,  icon: 'checkmark-circle' as const },
  landed:      { label: 'Landed',      colorKey: 'textMuted' as const, icon: 'location' as const },
  standby:     { label: 'Standby',     colorKey: 'textMuted' as const, icon: 'time' as const },
  alert:       { label: 'ALERT',       colorKey: 'danger' as const,    icon: 'alert-circle' as const },
}

export default function DashboardScreen() {
  const { colors } = useTheme()
  const { data: simData, activeAlerts, dismissAlert } = useSimulation()
  const { mode, bleConnected, deviceRssi } = useConnectivity()
  const { slowPacket } = useBle()
  const styles = useMemo(() => makeStyles(colors), [colors])

  // Prefer live BLE vitals; fall back to simulation when not connected
  const data = useMemo(() => {
    if (!slowPacket) return simData
    return {
      ...simData,
      heartRate:   Math.round(slowPacket.bpm),
      oxygen:      Math.round(slowPacket.spo2),
      stress:      Math.round(slowPacket.stressPct),
      temperature: slowPacket.tempC,
      battery:     Math.round(slowPacket.battPct),
      lastUpdate:  Date.now(),
    }
  }, [simData, slowPacket])

  const statusCfg = STATUS_KEYS[data.status]
  const statusColor = colors[statusCfg.colorKey]
  const jumpDuration = Date.now() - data.sessionStarted

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>SKYDIVER</Text>
            <Text style={styles.subTitle}>Jump #{data.jumpNumber}</Text>
          </View>
          <ConnectionBadge mode={mode} bleConnected={bleConnected} deviceRssi={deviceRssi} />
        </View>

        <Text style={styles.updateTime}>Updated {formatTime(data.lastUpdate)}</Text>

        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            {activeAlerts.slice(0, 3).map(alert => (
              <AlertBanner key={alert.id} alert={alert} onDismiss={dismissAlert} />
            ))}
          </View>
        )}

        {/* Status hero card — clean, no gradient */}
        <View style={[styles.heroCard, { borderColor: statusColor + '50' }]}>
          <View style={styles.heroTop}>
            <View style={[styles.statusPill, { borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]}>{statusCfg.label}</Text>
            </View>
            <Text style={styles.jumpTimer}>{formatDuration(jumpDuration)}</Text>
          </View>

          <View style={styles.altitudeRow}>
            <Text style={[styles.altitudeValue, { color: statusColor }]}>
              {data.altitude.toLocaleString()}
            </Text>
            <Text style={styles.altitudeUnit}>m</Text>
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="arrow-down" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{Math.abs(data.verticalSpeed).toFixed(1)} m/s</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="body" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{data.position}</Text>
            </View>
            {data.parachuteOpen && (
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Text style={[styles.metaText, { color: colors.success }]}>Chute Open</Text>
              </View>
            )}
          </View>

          <View style={styles.sparkContainer}>
            <SparkLine data={data.altitudeHistory} color={statusColor} width={340} height={50} />
          </View>
        </View>

        {/* Vitals grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vitals</Text>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveLabel, { color: colors.success }]}>Live</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Heart Rate" value={data.heartRate} unit="bpm" color={colors.heartRate} warning={data.heartRate > 160}>
            <SparkLine data={data.heartRateHistory} color={colors.heartRate} width={100} height={28} />
          </MetricCard>
          <MetricCard label="SpO₂" value={data.oxygen} unit="%" color={colors.oxygen} warning={data.oxygen < 93}>
            <SparkLine data={data.oxygenHistory} color={colors.oxygen} width={100} height={28} />
          </MetricCard>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="Stress" value={data.stress} unit="%" color={colors.stress} warning={data.stress > 80} />
          <MetricCard label="Temp" value={data.temperature} unit="°C" color={colors.temperature} warning={data.temperature > 37.5} />
        </View>

        {/* Device row */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Device</Text>
        </View>

        <View style={styles.deviceRow}>
          <View style={styles.batteryCard}>
            <View style={styles.batteryHeader}>
              <Ionicons
                name={data.battery > 20 ? 'battery-half' : 'battery-dead'}
                size={18}
                color={data.battery > 20 ? colors.battery : colors.danger}
              />
              <Text style={[styles.batteryLabel, { color: data.battery > 20 ? colors.battery : colors.danger }]}>
                {data.battery}%
              </Text>
            </View>
            <View style={styles.batteryTrack}>
              <View
                style={[
                  styles.batteryFill,
                  { width: `${data.battery}%`, backgroundColor: data.battery > 20 ? colors.battery : colors.danger },
                ]}
              />
            </View>
            <Text style={styles.batteryStatus}>
              {data.battery > 50 ? 'Good' : data.battery > 20 ? 'Low' : 'Critical'}
            </Text>
          </View>

          <View style={styles.positionCard}>
            <Text style={styles.positionLabel}>Position</Text>
            <Text style={styles.positionValue}>{data.position}</Text>
            <Text style={styles.positionSub}>Changed {formatDuration(Date.now() - data.lastPositionChange)} ago</Text>
          </View>
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

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    appTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      letterSpacing: 2,
    },
    subTitle: { fontSize: Typography.sm, color: colors.textMuted, marginTop: 1 },
    updateTime: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      marginBottom: Spacing.md,
      fontFamily: Typography.mono,
    },

    section: { marginBottom: Spacing.xs },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    heroCard: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
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
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    jumpTimer: { fontSize: Typography.sm, color: colors.textMuted, fontFamily: Typography.mono },

    altitudeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: Spacing.sm },
    altitudeValue: { fontSize: 52, fontWeight: Typography.bold, fontVariant: ['tabular-nums'], lineHeight: 56 },
    altitudeUnit: { fontSize: Typography.xl, color: colors.textMuted, marginBottom: 6 },

    heroMeta: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap', marginBottom: Spacing.xs },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.sm, color: colors.textSecondary },

    sparkContainer: { marginTop: Spacing.xs, marginHorizontal: -Spacing.xs },

    metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },

    deviceRow: { flexDirection: 'row', gap: Spacing.sm },
    batteryCard: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    batteryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    batteryLabel: { fontSize: Typography.md, fontWeight: Typography.bold, fontFamily: Typography.mono },
    batteryTrack: {
      height: 5,
      backgroundColor: colors.borderMuted,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    batteryFill: { height: '100%', borderRadius: 3 },
    batteryStatus: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    positionCard: {
      flex: 1,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      justifyContent: 'center',
    },
    positionLabel: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    positionValue: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      textTransform: 'capitalize',
      marginBottom: 4,
    },
    positionSub: { fontSize: Typography.xs, color: colors.textMuted },
  })
}

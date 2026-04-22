import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'

interface ToggleRowProps {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
  color?: string
  colors: AppColors
}

function ToggleRow({ label, description, value, onChange, color, colors }: ToggleRowProps) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  const trackColor = color ?? colors.primary
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={styles.settingRow}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: trackColor + '70' }}
        thumbColor={value ? trackColor : colors.textMuted}
        ios_backgroundColor={colors.border}
      />
    </Pressable>
  )
}

interface ThresholdRowProps {
  label: string
  value: string
  unit: string
  color: string
  onPress?: () => void
  colors: AppColors
}

function ThresholdRow({ label, value, unit, color, onPress, colors }: ThresholdRowProps) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <Pressable
      onPress={onPress}
      style={styles.settingRow}
      accessibilityRole="button"
      accessibilityLabel={`${label} threshold: ${value} ${unit}`}
    >
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>Alert threshold</Text>
      </View>
      <View style={styles.thresholdBadge}>
        <Text style={[styles.thresholdValue, { color }]}>{value}</Text>
        <Text style={[styles.thresholdUnit, { color: colors.textMuted }]}>{unit}</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
      </View>
    </Pressable>
  )
}

function SectionHeader({ title, colors }: { title: string; colors: AppColors }) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <Text style={styles.sectionTitle}>{title}</Text>
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [alerts, setAlerts] = useState({
    lowOxygen: true,
    highHeartRate: true,
    highStress: true,
    noMovement: true,
    excessiveRotation: true,
    lowBattery: true,
    positionChange: false,
  })
  const [sync, setSync] = useState({
    autoSync: true,
    backgroundSync: true,
    instructorAlerts: true,
    vibration: true,
    sound: false,
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>Alerts, thresholds & preferences</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AM</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Mercer</Text>
            <Text style={styles.profileMeta}>Jump #247 · Wearable v2.1.0</Text>
          </View>
          <Pressable style={styles.editBtn} accessibilityLabel="Edit profile">
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" colors={colors} />
        <View style={styles.group}>
          <Pressable
            onPress={toggleTheme}
            style={styles.settingRow}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.settingDesc}>Switch between dark and light theme</Text>
            </View>
            <View style={styles.themeToggle}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        {/* Alert thresholds */}
        <SectionHeader title="Alert Thresholds" colors={colors} />
        <View style={styles.group}>
          <ThresholdRow label="Low Blood Oxygen" value="93" unit="%" color={colors.oxygen} colors={colors} />
          <View style={styles.divider} />
          <ThresholdRow label="High Heart Rate" value="160" unit="bpm" color={colors.heartRate} colors={colors} />
          <View style={styles.divider} />
          <ThresholdRow label="Stress Level" value="80" unit="%" color={colors.stress} colors={colors} />
          <View style={styles.divider} />
          <ThresholdRow label="High Temperature" value="37.5" unit="°C" color={colors.temperature} colors={colors} />
          <View style={styles.divider} />
          <ThresholdRow label="Low Battery" value="20" unit="%" color={colors.battery} colors={colors} />
          <View style={styles.divider} />
          <ThresholdRow label="Min Deploy Altitude" value="800" unit="m" color={colors.danger} colors={colors} />
        </View>

        {/* Active alerts */}
        <SectionHeader title="Active Alerts" colors={colors} />
        <View style={styles.group}>
          <ToggleRow label="Low Blood Oxygen" description="Alert when SpO₂ < threshold" value={alerts.lowOxygen} onChange={v => setAlerts(p => ({ ...p, lowOxygen: v }))} color={colors.oxygen} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="High Heart Rate" description="Alert when HR exceeds threshold" value={alerts.highHeartRate} onChange={v => setAlerts(p => ({ ...p, highHeartRate: v }))} color={colors.heartRate} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Critical Stress Level" description="Physiological distress indicator" value={alerts.highStress} onChange={v => setAlerts(p => ({ ...p, highStress: v }))} color={colors.stress} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="No Movement Detected" description="Possible unconsciousness" value={alerts.noMovement} onChange={v => setAlerts(p => ({ ...p, noMovement: v }))} color={colors.danger} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Excessive Rotation" description="Flat spin or instability" value={alerts.excessiveRotation} onChange={v => setAlerts(p => ({ ...p, excessiveRotation: v }))} color={colors.warning} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Position Change" description="Notify on body position update" value={alerts.positionChange} onChange={v => setAlerts(p => ({ ...p, positionChange: v }))} colors={colors} />
        </View>

        {/* Sync & notifications */}
        <SectionHeader title="Sync & Notifications" colors={colors} />
        <View style={styles.group}>
          <ToggleRow label="Auto WiFi Sync" description="Sync to web dashboard when online" value={sync.autoSync} onChange={v => setSync(p => ({ ...p, autoSync: v }))} color={colors.wifi} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Background Sync" description="Keep syncing when app is minimized" value={sync.backgroundSync} onChange={v => setSync(p => ({ ...p, backgroundSync: v }))} color={colors.wifi} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Alert Instructor" description="Auto-notify team on critical alerts" value={sync.instructorAlerts} onChange={v => setSync(p => ({ ...p, instructorAlerts: v }))} color={colors.danger} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Vibration" description="Vibrate on alerts" value={sync.vibration} onChange={v => setSync(p => ({ ...p, vibration: v }))} colors={colors} />
          <View style={styles.divider} />
          <ToggleRow label="Sound Alerts" description="Play sound on critical events" value={sync.sound} onChange={v => setSync(p => ({ ...p, sound: v }))} colors={colors} />
        </View>

        {/* App info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Skydiver Monitor</Text>
          <Text style={styles.infoVersion}>Version 1.0.0 · Android</Text>
          <Text style={styles.infoDesc}>
            Real-time biometric monitoring via BLE wearable. Safety analysis. Data syncs to web dashboard when WiFi is available.
          </Text>
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

    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.primary },
    profileInfo: { flex: 1 },
    profileName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary },
    profileMeta: { fontSize: Typography.xs, color: colors.textMuted, marginTop: 2 },
    editBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },

    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      paddingHorizontal: 2,
    },
    group: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: colors.borderMuted, marginLeft: Spacing.md },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      minHeight: TouchTarget,
      gap: Spacing.md,
    },
    settingInfo: { flex: 1, gap: 3 },
    settingLabel: { fontSize: Typography.base, fontWeight: Typography.medium, color: colors.textPrimary },
    settingDesc: { fontSize: Typography.xs, color: colors.textMuted, lineHeight: Typography.xs * 1.5 },

    thresholdBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    thresholdValue: { fontSize: Typography.base, fontWeight: Typography.bold, fontFamily: Typography.mono },
    thresholdUnit: { fontSize: Typography.xs, fontWeight: Typography.medium },

    themeToggle: {
      width: TouchTarget,
      height: TouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },

    infoCard: {
      marginTop: Spacing.lg,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
      alignItems: 'center',
    },
    infoTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },
    infoVersion: { fontSize: Typography.xs, color: colors.textMuted, fontFamily: Typography.mono },
    infoDesc: {
      fontSize: Typography.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: Typography.sm * 1.6,
      marginTop: Spacing.xs,
    },
  })
}

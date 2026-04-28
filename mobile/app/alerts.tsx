import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from 'moti'
import { router } from 'expo-router'
import { useTheme } from '../lib/ThemeContext'
import { useAlerts, severityColor, type LocalAlert } from '../lib/AlertContext'
import { CockpitBackground } from '../components/cockpit/CockpitBackground'
import { GlassCard } from '../components/cockpit/GlassCard'
import { AppColors, Typography, Spacing, Radius } from '../lib/theme'

function AlertRow({ alert, colors, onDismiss }: { alert: LocalAlert; colors: AppColors; onDismiss: () => void }) {
  const color = severityColor(alert.severity, colors)
  const iconName = alert.severity === 'danger' ? 'alert-circle' : alert.severity === 'warning' ? 'warning' : 'information-circle'
  const time = new Date(alert.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: alert.dismissed ? 0.4 : 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 110 }}
      style={[styles.row, { borderLeftColor: color, borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{alert.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
            <Text style={[styles.severityText, { color }]}>{alert.severity}</Text>
          </View>
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{alert.body}</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>
      </View>
      {!alert.dismissed && (
        <Pressable onPress={onDismiss} hitSlop={10}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </MotiView>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  body: { fontSize: Typography.xs, marginTop: 2, lineHeight: Typography.xs * 1.5 },
  time: { fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  severityText: { fontSize: 9, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
})

export default function AlertsScreen() {
  const { colors } = useTheme()
  const { alerts, dismissAlert, dismissAll } = useAlerts()

  const active = alerts.filter(a => !a.dismissed)
  const past   = alerts.filter(a => a.dismissed)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <CockpitBackground />
      <ScrollView contentContainerStyle={{ padding: Spacing.md }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary, letterSpacing: -0.3 }}>Alerts</Text>
            <Text style={{ fontSize: Typography.xs, color: colors.textMuted }}>{active.length} active · {past.length} dismissed</Text>
          </View>
          {active.length > 0 && (
            <Pressable
              onPress={dismissAll}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.medium }}>Dismiss all</Text>
            </Pressable>
          )}
        </View>

        {alerts.length === 0 && (
          <GlassCard style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl }}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={{ color: colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.semibold }}>All clear</Text>
            <Text style={{ color: colors.textMuted, fontSize: Typography.sm, textAlign: 'center' }}>No alerts have been triggered in this session.</Text>
          </GlassCard>
        )}

        {active.length > 0 && (
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 1.2, color: colors.danger, marginBottom: 4 }}>Active</Text>
            {active.map(a => <AlertRow key={a.id} alert={a} colors={colors} onDismiss={() => dismissAlert(a.id)} />)}
          </View>
        )}

        {past.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 1.2, color: colors.textMuted, marginBottom: 4 }}>Dismissed</Text>
            {past.map(a => <AlertRow key={a.id} alert={a} colors={colors} onDismiss={() => {}} />)}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

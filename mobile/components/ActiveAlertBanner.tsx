import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MotiView, AnimatePresence } from 'moti'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAlerts, severityColor } from '../lib/AlertContext'
import { useTheme } from '../lib/ThemeContext'
import { Typography, Spacing, Radius } from '../lib/theme'

export function ActiveAlertBanner() {
  const { activeAlert, dismissAlert } = useAlerts()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  if (!activeAlert) return null

  const color = severityColor(activeAlert.severity, colors)
  const iconName = activeAlert.severity === 'danger'
    ? 'alert-circle'
    : activeAlert.severity === 'warning'
    ? 'warning'
    : 'information-circle'

  return (
    <AnimatePresence>
      <MotiView
        key={activeAlert.id}
        from={{ opacity: 0, translateY: -60 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -60 }}
        transition={{ type: 'spring', damping: 22, stiffness: 140 }}
        style={[
          styles.banner,
          {
            top: insets.top + 8,
            backgroundColor: colors.surfaceGlassStrong,
            borderColor: color + '60',
          },
        ]}
      >
        <Ionicons name={iconName} size={18} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color }]}>{activeAlert.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={1}>
            {activeAlert.body}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/alerts')} hitSlop={8}>
          <Text style={[styles.viewBtn, { color }]}>View</Text>
        </Pressable>
        <Pressable onPress={() => dismissAlert(activeAlert.id)} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </MotiView>
    </AnimatePresence>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  body: {
    fontSize: Typography.xs,
    marginTop: 1,
  },
  viewBtn: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
})

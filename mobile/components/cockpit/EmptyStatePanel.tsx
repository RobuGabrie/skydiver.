import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../lib/ThemeContext'
import { Typography, Spacing, Radius } from '../../lib/theme'
import { GlassCard } from './GlassCard'

export function EmptyStatePanel({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  body: string
}) {
  const { colors } = useTheme()

  return (
    <GlassCard style={styles.card}>
      <View style={[styles.iconRing, { borderColor: colors.border }]}>
        <View
          style={[styles.iconWrap, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}
        >
          <Ionicons name={icon} size={28} color={colors.primary} />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  body: {
    fontSize: Typography.sm,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.65,
    maxWidth: 270,
  },
})

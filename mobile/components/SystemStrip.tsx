import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/ThemeContext'
import { Typography, Spacing } from '../lib/theme'

interface SystemStripProps {
  battPct: number
  voltageV: number
  cpuPct: number
  tempC: number
}

export function SystemStrip({ battPct, voltageV, cpuPct, tempC }: SystemStripProps) {
  const { colors } = useTheme()

  const items = [
    {
      icon: 'battery-half-outline' as const,
      label: 'Battery',
      value: `${Math.round(battPct)}%`,
      color: battPct < 20 ? colors.danger : colors.textSecondary,
    },
    {
      icon: 'flash-outline' as const,
      label: 'Voltage',
      value: `${voltageV.toFixed(2)}V`,
      color: colors.textSecondary,
    },
    {
      icon: 'hardware-chip-outline' as const,
      label: 'CPU',
      value: `${Math.round(cpuPct)}%`,
      color: cpuPct >= 75 ? colors.warning : colors.textSecondary,
    },
    {
      icon: 'thermometer-outline' as const,
      label: 'Temp',
      value: `${tempC.toFixed(1)}°C`,
      color: colors.textSecondary,
    },
  ]

  return (
    <View style={[styles.strip, { borderTopColor: colors.border }]}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <View style={styles.item}>
            <Ionicons name={item.icon} size={12} color={item.color} />
            <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    alignSelf: 'center',
  },
  value: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    fontFamily: Typography.mono,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
})

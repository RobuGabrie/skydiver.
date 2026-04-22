import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius } from '../lib/theme'
import { ConnectionMode } from '../lib/types'

interface Props {
  mode: ConnectionMode
  bleConnected?: boolean
  deviceRssi?: number
}

const MODE_CONFIG = {
  wifi:    { icon: 'wifi' as const,         colorKey: 'wifi' as const,    label: 'WiFi' },
  ble:     { icon: 'bluetooth' as const,     colorKey: 'ble' as const,     label: 'BLE' },
  offline: { icon: 'cloud-offline' as const, colorKey: 'offline' as const, label: 'Offline' },
}

export function ConnectionBadge({ mode, bleConnected = true, deviceRssi }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const cfg = MODE_CONFIG[mode]
  const accentColor = colors[cfg.colorKey]
  const dotColor = bleConnected ? accentColor : colors.offline

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Ionicons name={cfg.icon} size={12} color={accentColor} />
      <Text style={[styles.label, { color: accentColor }]}>{cfg.label}</Text>
      {deviceRssi !== undefined && mode === 'ble' && (
        <Text style={[styles.rssi, { color: colors.textMuted }]}>{deviceRssi} dBm</Text>
      )}
    </View>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    rssi: {
      fontSize: Typography.xs - 1,
      fontFamily: Typography.mono,
    },
  })
}

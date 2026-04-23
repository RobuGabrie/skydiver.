import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Radius } from '../lib/theme'
import { ConnectionMode } from '../lib/types'

interface Props {
  mode: ConnectionMode
  bleConnected?: boolean
  deviceRssi?: number
}

const MODE_CONFIG = {
  wifi:    { icon: 'wifi' as const,         colorKey: 'wifi' as const,    label: 'WiFi' },
  ble:     { icon: 'bluetooth' as const,     colorKey: 'ble' as const,     label: 'BLE' },
  offline: { icon: 'cloud-offline' as const, colorKey: 'offline' as const, label: 'Off' },
}

export function ConnectionBadge({ mode, bleConnected = true, deviceRssi }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const cfg = MODE_CONFIG[mode]
  const accentColor = colors[cfg.colorKey]
  const isActive = bleConnected && mode !== 'offline'
  const dotColor = isActive ? accentColor : colors.offline

  return (
    <View style={[styles.container, { borderColor: accentColor + '35' }]}>
      <View style={styles.dotWrap}>
        {isActive && (
          <MotiView
            from={{ opacity: 0.75, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ type: 'timing', duration: 1400, loop: true }}
            style={[styles.pulseRing, { backgroundColor: dotColor }]}
          />
        )}
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>
      <Ionicons name={cfg.icon} size={11} color={accentColor} />
      <Text style={[styles.label, { color: accentColor }]}>{cfg.label}</Text>
      {deviceRssi !== undefined && mode === 'ble' && (
        <Text style={[styles.rssi, { color: colors.textMuted }]}>{deviceRssi}dBm</Text>
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
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    dotWrap: {
      width: 8,
      height: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
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
      fontSize: 10,
      fontFamily: 'monospace',
    },
  })
}

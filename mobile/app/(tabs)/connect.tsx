import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { useBle } from '../../lib/BleContext'
import { useConnectivity } from '../../hooks/useConnectivity'
import { useTheme } from '../../lib/ThemeContext'
import { Button } from '~/components/ui/button'
import { Text as UIText } from '~/components/ui/text'
import { AnimatedPressable } from '~/components/ui/pressable'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'
import type { BleCommand } from '../../lib/bleProtocol'

interface DeviceRowProps {
  name: string
  id: string
  rssi: number
  connected: boolean
  onPress: () => void
  colors: AppColors
  index: number
}

function DeviceRow({ name, id, rssi, connected, onPress, colors, index }: DeviceRowProps) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  const bars = rssi > -60 ? 4 : rssi > -70 ? 3 : rssi > -80 ? 2 : 1

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 110, delay: index * 60 }}
    >
      <View style={[styles.deviceRow, connected && { borderColor: colors.ble + '40' }]}>
        <View style={styles.deviceIcon}>
          <Ionicons name="watch-outline" size={22} color={connected ? colors.ble : colors.textMuted} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{name}</Text>
          <Text style={styles.deviceId}>{id}</Text>
          <View style={styles.signalRow}>
            {[1, 2, 3, 4].map(b => (
              <View
                key={b}
                style={[styles.signalBar, { height: 6 + b * 3, backgroundColor: b <= bars ? colors.ble : colors.border }]}
              />
            ))}
            <Text style={styles.rssiText}>{rssi} dBm</Text>
          </View>
        </View>
        <Button
          variant={connected ? 'secondary' : 'outline'}
          size="sm"
          onPress={onPress}
          accessibilityLabel={connected ? 'Disconnect device' : 'Connect to device'}
        >
          <UIText className={connected ? 'text-green-400' : undefined}>
            {connected ? 'Connected' : 'Connect'}
          </UIText>
        </Button>
      </View>
    </MotiView>
  )
}

export default function ConnectScreen() {
  const { colors } = useTheme()
  const { mode, isConnected } = useConnectivity()
  const { bleReady, scanning, devices, connectedId, slowPacket, startScan, connect, disconnect, sendCommand } = useBle()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const bleConnected = connectedId !== null

  async function handleDevicePress(deviceId: string) {
    if (connectedId === deviceId) {
      disconnect()
    } else {
      try {
        await connect(deviceId)
      } catch (e: any) {
        Alert.alert('Connection failed', e?.message ?? 'Could not connect to device.')
      }
    }
  }

  async function handleCommand(cmd: BleCommand) {
    try {
      await sendCommand(cmd)
    } catch {
      Alert.alert('Error', `Failed to send ${cmd} command.`)
    }
  }

  const modeColor = mode === 'wifi' ? colors.wifi : colors.ble
  const modeLabel = mode === 'ble' ? 'BLE Mode Active' : mode === 'wifi' ? 'WiFi Mode Active' : 'Offline'
  const modeDesc  = mode === 'ble'
    ? 'Receiving wearable data via Bluetooth.'
    : mode === 'wifi'
      ? 'Syncing data with web monitoring dashboard over WiFi.'
      : 'No connectivity.'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
        >
          <Text style={styles.pageTitle}>Connection</Text>
          <Text style={styles.pageSubtitle}>Manage device connectivity</Text>
        </MotiView>

        {/* Mode banner */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 110, delay: 60 }}
          style={[styles.modeBanner, { borderColor: modeColor + '40' }]}
        >
          <View style={[styles.modeBannerIcon, { backgroundColor: modeColor + '15' }]}>
            <Ionicons name={mode === 'wifi' ? 'wifi' : 'bluetooth'} size={18} color={modeColor} />
          </View>
          <View style={styles.modeInfo}>
            <Text style={[styles.modeTitle, { color: modeColor }]}>{modeLabel}</Text>
            <Text style={styles.modeDesc}>{modeDesc}</Text>
          </View>
        </MotiView>

        {/* Connectivity cards */}
        <View style={styles.connectCards}>
          {[
            {
              icon: 'wifi' as const,
              color: colors.wifi,
              active: isConnected,
              title: 'WiFi / Internet',
              status: isConnected ? 'Connected' : 'Disconnected',
              desc: isConnected ? 'Live sync with web dashboard active' : 'No internet — BLE only mode',
              delay: 100,
            },
            {
              icon: 'bluetooth' as const,
              color: colors.ble,
              active: bleConnected,
              title: 'Bluetooth BLE',
              status: !bleReady ? 'BT Off' : bleConnected ? 'Connected' : 'No Device',
              desc: bleConnected ? 'Receiving wearable data' : bleReady ? 'Scan to find your SkyWatch' : 'Enable Bluetooth to pair',
              delay: 150,
            },
          ].map(card => (
            <MotiView
              key={card.title}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 110, delay: card.delay }}
              style={[styles.connectCard, card.active && { borderColor: card.color + '50' }]}
            >
              <View style={styles.connectCardTop}>
                <View style={styles.connectCardIcon}>
                  <Ionicons name={card.icon} size={20} color={card.color} />
                </View>
                <MotiView
                  from={{ opacity: 1, scale: 1 }}
                  animate={card.active ? { opacity: 0.3, scale: 1.5 } : { opacity: 1, scale: 1 }}
                  transition={card.active ? { type: 'timing', duration: 900, loop: true, repeatReverse: true } : { type: 'timing', duration: 200 }}
                  style={[styles.indicator, { backgroundColor: card.active ? colors.success : colors.textMuted }]}
                />
              </View>
              <Text style={styles.connectCardTitle}>{card.title}</Text>
              <Text style={[styles.connectCardStatus, { color: card.active ? colors.success : colors.textMuted }]}>
                {card.status}
              </Text>
              <Text style={styles.connectCardDesc}>{card.desc}</Text>
            </MotiView>
          ))}
        </View>

        {/* Device commands — only when connected */}
        {bleConnected && (
          <>
            <Text style={styles.sectionTitle}>Device Commands</Text>
            <View style={styles.commandRow}>
              {(['START', 'STOP', 'RESET'] as BleCommand[]).map(cmd => (
                <Button
                  key={cmd}
                  variant={cmd === 'RESET' ? 'destructive' : 'outline'}
                  size="sm"
                  onPress={() => handleCommand(cmd)}
                  accessibilityLabel={`Send ${cmd} command`}
                  className="flex-1"
                >
                  <UIText>{cmd}</UIText>
                </Button>
              ))}
            </View>

            {slowPacket && (
              <>
                <Text style={styles.sectionTitle}>Live Telemetry</Text>
                <View style={styles.telemetryGrid}>
                  {[
                    { label: 'Heart Rate', value: `${slowPacket.bpm.toFixed(0)} bpm` },
                    { label: 'SpO₂',       value: `${slowPacket.spo2.toFixed(1)}%` },
                    { label: 'Stress',     value: `${slowPacket.stressPct.toFixed(0)}%` },
                    { label: 'Temp',       value: `${slowPacket.tempC.toFixed(1)} °C` },
                    { label: 'Battery',    value: `${slowPacket.battPct.toFixed(0)}%` },
                    { label: 'Voltage',    value: `${slowPacket.voltageV.toFixed(2)} V` },
                    { label: 'Current',    value: `${slowPacket.currentMA} mA` },
                    { label: 'CPU',        value: `${slowPacket.cpuPct.toFixed(0)}%` },
                  ].map(item => (
                    <View key={item.label} style={styles.telemetryCell}>
                      <Text style={styles.telemetryLabel}>{item.label}</Text>
                      <Text style={styles.telemetryValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Device list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Devices</Text>
          <Button
            variant="outline"
            size="sm"
            onPress={scanning ? () => {} : startScan}
            disabled={!bleReady}
            accessibilityLabel="Scan for Bluetooth devices"
          >
            {scanning
              ? <ActivityIndicator size="small" color={colors.ble} />
              : <Ionicons name="refresh" size={16} color={colors.ble} />
            }
            <UIText className="text-ble">{scanning ? 'Scanning…' : 'Scan'}</UIText>
          </Button>
        </View>

        <View style={styles.deviceList}>
          {devices.length === 0 && !scanning && (
            <Text style={styles.emptyText}>
              {bleReady ? 'No devices found — tap Scan to search.' : 'Enable Bluetooth to scan for devices.'}
            </Text>
          )}
          {devices.map((d, i) => (
            <DeviceRow
              key={d.id}
              name={d.name}
              id={d.id}
              rssi={d.rssi}
              connected={d.id === connectedId}
              onPress={() => handleDevicePress(d.id)}
              colors={colors}
              index={i}
            />
          ))}
        </View>

        {/* Protocol info */}
        <Text style={styles.sectionTitle}>Communication Protocol</Text>
        <View style={styles.protoList}>
          {[
            { icon: 'bluetooth' as const, label: 'BLE (offline)', color: colors.ble, desc: 'Direct wearable → phone link. Works without internet. Fast IMU at 50 Hz, slow vitals at 4 Hz.' },
            { icon: 'wifi' as const, label: 'WiFi (online)', color: colors.wifi, desc: 'Phone → Web Dashboard sync. Requires internet. Sends live telemetry to instructors.' },
          ].map(p => (
            <View key={p.label} style={styles.protoRow}>
              <View style={styles.protoIcon}>
                <Ionicons name={p.icon} size={16} color={p.color} />
              </View>
              <View style={styles.protoInfo}>
                <Text style={[styles.protoLabel, { color: p.color }]}>{p.label}</Text>
                <Text style={styles.protoDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
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

    modeBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
      backgroundColor: colors.surfaceRaised, marginBottom: Spacing.lg,
    },
    modeBannerIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
    modeInfo: { flex: 1, gap: 3 },
    modeTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
    modeDesc: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: Typography.sm * 1.5 },

    connectCards: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    connectCard: {
      flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.border, padding: Spacing.md, gap: 5,
    },
    connectCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    connectCardIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    indicator: { width: 8, height: 8, borderRadius: 4 },
    connectCardTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textPrimary },
    connectCardStatus: { fontSize: Typography.base, fontWeight: Typography.bold },
    connectCardDesc: { fontSize: Typography.xs, color: colors.textMuted, lineHeight: Typography.xs * 1.5 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, marginTop: Spacing.xs },
    sectionTitle: {
      fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
    },
    emptyText: { fontSize: Typography.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },

    commandRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },

    telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    telemetryCell: {
      width: '47%', backgroundColor: colors.surfaceRaised, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.border, padding: Spacing.sm,
    },
    telemetryLabel: { fontSize: Typography.xs, color: colors.textMuted, marginBottom: 2 },
    telemetryValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary, fontFamily: Typography.mono },

    deviceList: { gap: Spacing.sm, marginBottom: Spacing.lg },
    deviceRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surfaceRaised, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.border, padding: Spacing.md, minHeight: TouchTarget,
    },
    deviceIcon: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    deviceInfo: { flex: 1, gap: 3 },
    deviceName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary },
    deviceId: { fontSize: Typography.xs, color: colors.textMuted, fontFamily: Typography.mono },
    signalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 4 },
    signalBar: { width: 4, borderRadius: 2 },
    rssiText: { fontSize: Typography.xs, color: colors.textMuted, marginLeft: 6, fontFamily: Typography.mono },
    protoList: { gap: Spacing.sm },
    protoRow: {
      flexDirection: 'row', gap: Spacing.md, backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.md, borderWidth: 1, borderColor: colors.border, padding: Spacing.md,
    },
    protoIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    protoInfo: { flex: 1, gap: 4 },
    protoLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    protoDesc: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: Typography.sm * 1.5 },
  })
}

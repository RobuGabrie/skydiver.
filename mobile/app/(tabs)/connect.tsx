import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import { useBle } from '../../lib/BleContext'
import { useConnectivity } from '../../hooks/useConnectivity'
import { useTheme, type ThemeMode } from '../../lib/ThemeContext'
import { useAlerts } from '../../lib/AlertContext'
import { Button } from '~/components/ui/button'
import { Text as UIText } from '~/components/ui/text'
import { CockpitBackground } from '../../components/cockpit/CockpitBackground'
import { SectionHeader } from '../../components/cockpit/SectionHeader'
import { EmptyStatePanel } from '../../components/cockpit/EmptyStatePanel'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../../lib/theme'
import type { BleCommand } from '../../lib/bleProtocol'

interface DeviceRowProps {
  name: string
  id: string
  rssi: number
  connected: boolean
  selected: boolean
  onPress: () => void
  colors: AppColors
  index: number
}

function formatRssiBars(rssi: number) {
  if (rssi > -60) return 4
  if (rssi > -70) return 3
  if (rssi > -80) return 2
  return 1
}

function getDeviceLabel(name: string, id: string) {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : `Device ${id.slice(0, 8)}`
}

function AlertSettingRow({
  label,
  description,
  icon,
  color,
  thresholdValue,
  thresholdUnit,
  toggleValue,
  onToggleChange,
  colors,
}: {
  label: string
  description?: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  thresholdValue?: string
  thresholdUnit?: string
  toggleValue?: boolean
  onToggleChange?: (next: boolean) => void
  colors: AppColors
}) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  const hasToggle = toggleValue !== undefined && onToggleChange !== undefined

  return (
    <Pressable
      onPress={hasToggle ? () => onToggleChange!(!toggleValue) : undefined}
      style={styles.settingRow}
      accessibilityRole={hasToggle ? 'switch' : 'none'}
      accessibilityState={hasToggle ? { checked: toggleValue } : undefined}
      accessibilityLabel={label}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {thresholdValue !== undefined && (
        <View style={[styles.thresholdBadge, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
          <Text style={[styles.thresholdValue, { color }]}>{thresholdValue}</Text>
          <Text style={[styles.thresholdUnit, { color: colors.textMuted }]}>{thresholdUnit}</Text>
        </View>
      )}
      {hasToggle && (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: colors.border, true: colors.primary + '70' }}
          thumbColor={toggleValue ? colors.primary : colors.textMuted}
          ios_backgroundColor={colors.border}
        />
      )}
    </Pressable>
  )
}

function DeviceRow({ name, id, rssi, connected, selected, onPress, colors, index }: DeviceRowProps) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  const bars = formatRssiBars(rssi)
  const displayName = getDeviceLabel(name, id)

  return (
    <MotiView
      from={{ opacity: 0, translateX: -14 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 110, delay: index * 50 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.deviceRow,
          selected && { borderColor: colors.primary + '70', backgroundColor: colors.primary + '08' },
          connected && { borderTopColor: colors.ble, borderTopWidth: 2.5 },
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${displayName}`}
      >
        <View style={[
          styles.deviceIcon,
          connected
            ? { borderColor: colors.ble + '55', backgroundColor: colors.ble + '14' }
            : { borderColor: colors.border, backgroundColor: colors.surfaceRaised },
        ]}>
          <Ionicons name="watch-outline" size={22} color={connected ? colors.ble : colors.textMuted} />
        </View>

        <View style={styles.deviceInfo}>
          <View style={styles.deviceTitleRow}>
            <Text style={[styles.deviceName, connected && { color: colors.ble }]}>{displayName}</Text>
            {connected && (
              <View style={[styles.deviceStatePill, { backgroundColor: colors.ble + '14', borderColor: colors.ble + '40' }]}> 
                <Text style={[styles.deviceStateText, { color: colors.ble }]}>Connected</Text>
              </View>
            )}
          </View>
          <Text style={styles.deviceId}>{id.slice(0, 20)}…</Text>
          <View style={styles.signalRow}>
            {[1, 2, 3, 4].map(b => (
              <View
                key={b}
                style={[
                  styles.signalBar,
                  {
                    height: 4 + b * 3,
                    backgroundColor: b <= bars ? colors.ble : colors.border,
                    opacity: b <= bars ? 1 : 0.35,
                  },
                ]}
              />
            ))}
            <Text style={styles.rssiText}>{rssi} dBm</Text>
          </View>
        </View>

        <View style={styles.deviceChevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </MotiView>
  )
}

function ModalShell({
  children,
  onBackdropPress,
  backdropStyle,
}: {
  children: React.ReactNode
  onBackdropPress: () => void
  backdropStyle: ViewStyle
}) {
  return (
    <View style={backdropStyle}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onBackdropPress} />
      {children}
    </View>
  )
}

function AppearanceModal({
  visible,
  themeMode,
  colors,
  onSelect,
  onClose,
}: {
  visible: boolean
  themeMode: ThemeMode
  colors: AppColors
  onSelect: (mode: ThemeMode) => void
  onClose: () => void
}) {
  const styles = useMemo(() => makeStyles(colors), [colors])

  const options: Array<{ mode: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; desc: string }> = [
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline', desc: 'Follow the device appearance setting.' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline', desc: 'White mode for bright environments.' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline', desc: 'Higher contrast for low light.' },
  ]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalShell onBackdropPress={onClose} backdropStyle={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalGrip} />
          <Text style={styles.modalTitle}>Theme</Text>
          <Text style={styles.modalSubtitle}>Pick a theme for the app shell.</Text>
          <View style={styles.modalOptionList}>
            {options.map(option => {
              const active = themeMode === option.mode
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => onSelect(option.mode)}
                  style={[
                    styles.modalOption,
                    active
                      ? { borderColor: colors.primary + '65', backgroundColor: colors.primary + '10' }
                      : { borderColor: colors.border, backgroundColor: colors.surfaceRaised },
                  ]}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: active ? colors.primary + '18' : colors.borderMuted }]}> 
                    <Ionicons name={option.icon} size={18} color={active ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={styles.modalOptionBody}>
                    <Text style={styles.modalOptionTitle}>{option.label}</Text>
                    <Text style={styles.modalOptionDesc}>{option.desc}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </Pressable>
              )
            })}
          </View>
          <Button variant="outline" onPress={onClose}>
            <UIText>Close</UIText>
          </Button>
        </View>
      </ModalShell>
    </Modal>
  )
}

function DeviceModal({
  visible,
  devices,
  device,
  bleReady,
  scanning,
  connected,
  connectedId,
  colors,
  onClose,
  onSelectDevice,
  onConnect,
  onStartScan,
  onStopScan,
}: {
  visible: boolean
  devices: Array<{ name: string; id: string; rssi: number }>
  device: { name: string; id: string; rssi: number } | null
  bleReady: boolean
  scanning: boolean
  connected: boolean
  connectedId: string | null
  colors: AppColors
  onClose: () => void
  onSelectDevice: (deviceId: string | null) => void
  onConnect: (deviceId: string) => Promise<void>
  onStartScan: () => void
  onStopScan: () => void
}) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  const displayName = device ? getDeviceLabel(device.name, device.id) : ''
  const bars = device ? formatRssiBars(device.rssi) : 0

  async function handleConnect() {
    if (!device) return
    try {
      await onConnect(device.id)
      onClose()
    } catch {
      Alert.alert('Connection failed', 'Could not connect to the selected device.')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ModalShell onBackdropPress={onClose} backdropStyle={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalGrip} />
          {!device ? (
            <>
              <Text style={styles.modalTitle}>Device browser</Text>
              <Text style={styles.modalSubtitle}>Tap a device to inspect it, then connect from the detail sheet.</Text>
              <View style={styles.browserMetaRow}>
                <View style={[styles.metaPill, { backgroundColor: bleReady ? colors.primaryDim : colors.dangerDim, borderColor: bleReady ? colors.primary + '33' : colors.danger + '33' }]}>
                  <Text style={[styles.metaPillText, { color: bleReady ? colors.primary : colors.danger }]}>{bleReady ? 'Bluetooth ready' : 'Bluetooth off'}</Text>
                </View>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
                  <Text style={[styles.metaPillText, { color: colors.textMuted }]}>{devices.length} nearby</Text>
                </View>
              </View>

              <View style={styles.browserList}>
                {devices.length === 0 ? (
                  <EmptyStatePanel
                    icon="bluetooth-outline"
                    title={bleReady ? 'No devices found' : 'Bluetooth unavailable'}
                    body={bleReady ? 'Start a scan to discover nearby SkyWatch devices.' : 'Enable Bluetooth before searching for devices.'}
                  />
                ) : (
                  devices.map((item, index) => (
                    <DeviceRow
                      key={item.id}
                      name={item.name}
                      id={item.id}
                      rssi={item.rssi}
                      connected={item.id === connectedId}
                      selected={false}
                      onPress={() => onSelectDevice(item.id)}
                      colors={colors}
                      index={index}
                    />
                  ))
                )}
              </View>

              <View style={styles.modalActionRow}>
                <Button variant="outline" className="flex-1" onPress={scanning ? onStopScan : onStartScan} disabled={!bleReady}>
                  <UIText>{scanning ? 'Stop scan' : 'Scan again'}</UIText>
                </Button>
                <Button variant="secondary" className="flex-1" onPress={onClose}>
                  <UIText>Close</UIText>
                </Button>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => onSelectDevice(null)} style={styles.backLink}>
                <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                <Text style={styles.backLinkText}>Back to browser</Text>
              </Pressable>

              <View style={styles.deviceModalHeader}>
                <View style={[styles.deviceModalIcon, { backgroundColor: connected ? colors.ble + '18' : colors.surfaceRaised, borderColor: connected ? colors.ble + '40' : colors.border }]}> 
                  <Ionicons name="watch-outline" size={24} color={connected ? colors.ble : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{displayName}</Text>
                  <Text style={styles.modalSubtitle}>{device.id}</Text>
                </View>
              </View>

              <View style={styles.deviceDetailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Connection</Text>
                  <Text style={[styles.detailValue, { color: connected ? colors.ble : colors.textPrimary }]}>
                    {connected ? 'Connected' : 'Available'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Signal</Text>
                  <View style={styles.signalRow}>
                    {[1, 2, 3, 4].map(b => (
                      <View
                        key={b}
                        style={[
                          styles.signalBar,
                          {
                            height: 4 + b * 3,
                            backgroundColor: b <= bars ? colors.ble : colors.border,
                            opacity: b <= bars ? 1 : 0.35,
                          },
                        ]}
                      />
                    ))}
                    <Text style={styles.rssiText}>{device.rssi} dBm</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mode</Text>
                  <Text style={styles.detailValue}>{bleReady ? 'Bluetooth ready' : 'Bluetooth unavailable'}</Text>
                </View>
              </View>

              <View style={styles.modalActionRow}>
                <Button
                  variant={connected ? 'destructive' : 'default'}
                  className="flex-1"
                  onPress={handleConnect}
                >
                  <UIText>{connected ? 'Disconnect' : 'Connect'}</UIText>
                </Button>
                <Button variant="outline" className="flex-1" onPress={scanning ? onStopScan : onStartScan} disabled={!bleReady}>
                  <UIText>{scanning ? 'Stop scan' : 'Rescan'}</UIText>
                </Button>
              </View>

              <Button variant="secondary" onPress={onClose}>
                <UIText>Close</UIText>
              </Button>
            </>
          )}
        </View>
      </ModalShell>
    </Modal>
  )
}

export default function ConnectScreen() {
  const { colors, themeMode, setThemeMode } = useTheme()
  const { isConnected } = useConnectivity()
  const { bleReady, scanning, devices, connectedId, startScan, stopScan, connect, disconnect, sendCommand } = useBle()
  const { settings, updateSettings } = useAlerts()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [deviceBrowserOpen, setDeviceBrowserOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  const bleConnected = connectedId !== null
  const selectedDevice = useMemo(
    () => devices.find(device => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  )
  const themeIcon = themeMode === 'dark' ? 'moon-outline' : themeMode === 'light' ? 'sunny-outline' : 'phone-portrait-outline'

  async function handleDeviceConnect(deviceId: string) {
    if (connectedId === deviceId) {
      await disconnect()
      return
    }

    await connect(deviceId)
  }

  async function handleCommand(cmd: BleCommand) {
    try {
      await sendCommand(cmd)
    } catch {
      Alert.alert('Error', `Failed to send ${cmd} command.`)
    }
  }

  const modeCardTitle = bleReady ? (scanning ? 'Scanning in progress' : 'Scanner ready') : 'Bluetooth is off'
  const modeCardDesc = bleReady
    ? (scanning ? 'Nearby devices are being discovered now.' : 'Open the scanner and tap a device for details.')
    : 'Enable Bluetooth to search for your wearable.'

  function openDeviceBrowser(deviceId: string | null = connectedId ?? devices[0]?.id ?? null) {
    setSelectedDeviceId(deviceId)
    setDeviceBrowserOpen(true)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CockpitBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
        >
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <View style={[styles.pageIconWrap, { backgroundColor: colors.ble + '18', borderColor: colors.ble + '40' }]}>
                <Ionicons name="radio" size={18} color={colors.ble} />
              </View>
              <View>
                <Text style={styles.pageTitle}>Connection</Text>
                <Text style={styles.pageSubtitle}>Manage device connectivity</Text>
              </View>
            </View>
            <View style={styles.pageHeaderActions}>
              <Pressable
                onPress={() => setAppearanceOpen(true)}
                style={[styles.iconActionBtn, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel="Open appearance settings"
              >
                <Ionicons name={themeIcon} size={17} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={scanning ? stopScan : startScan}
                disabled={!bleReady}
                style={[
                  styles.iconActionBtn,
                  { backgroundColor: scanning ? colors.ble + '18' : colors.surfaceRaised, borderColor: colors.border },
                  !bleReady && { opacity: 0.45 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={scanning ? 'Stop device scan' : 'Start device scan'}
              >
                {scanning ? <ActivityIndicator size="small" color={colors.ble} /> : <Ionicons name="bluetooth" size={18} color={colors.ble} />}
              </Pressable>
            </View>
          </View>
        </MotiView>

        <View style={styles.scanCard}>
          <View style={styles.scanCardTop}>
            <View style={[styles.scanCardIcon, { backgroundColor: colors.ble + '14', borderColor: colors.ble + '38' }]}> 
              <Ionicons name={scanning ? 'radio' : 'bluetooth'} size={22} color={colors.ble} />
            </View>
            <View style={styles.scanCardInfo}>
              <Text style={styles.scanCardTitle}>{modeCardTitle}</Text>
              <Text style={styles.scanCardDesc}>{modeCardDesc}</Text>
            </View>
          </View>

          <View style={styles.scanActionRow}>
            <Button
              variant="default"
              className="flex-1"
              onPress={() => openDeviceBrowser(connectedId ?? devices[0]?.id ?? null)}
              disabled={!bleReady && devices.length === 0 && connectedId === null}
            >
              <UIText>{devices.length > 0 || connectedId ? 'Browse devices' : 'Open device browser'}</UIText>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onPress={scanning ? stopScan : startScan}
              disabled={!bleReady}
            >
              <UIText>{scanning ? 'Stop scan' : 'Scan again'}</UIText>
            </Button>
          </View>
        </View>

        <View style={styles.connectStatusRow}>
          {[
            {
              icon: 'wifi' as const,
              color: colors.wifi,
              active: isConnected,
              label: 'WiFi',
              status: isConnected ? 'Connected' : 'Offline',
            },
            {
              icon: 'bluetooth' as const,
              color: colors.ble,
              active: bleConnected,
              label: 'BLE',
              status: !bleReady ? 'Off' : bleConnected ? 'Connected' : 'Idle',
            },
          ].map(item => (
            <View
              key={item.label}
              style={[
                styles.connectStatusChip,
                {
                  borderColor: item.active ? item.color + '55' : colors.border,
                  backgroundColor: item.active ? item.color + '0D' : colors.surfaceRaised,
                },
              ]}
            >
              <View style={[styles.connectStatusIcon, { backgroundColor: item.active ? item.color + '20' : colors.borderMuted }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.connectStatusLabel, { color: colors.textMuted }]}>{item.label}</Text>
                <Text style={[styles.connectStatusValue, { color: item.active ? item.color : colors.textMuted }]}>{item.status}</Text>
              </View>
              <MotiView
                from={{ opacity: 1 }}
                animate={item.active ? { opacity: 0.2 } : { opacity: 1 }}
                transition={item.active ? { type: 'timing', duration: 900, loop: true, repeatReverse: true } : { type: 'timing', duration: 200 }}
                style={[styles.connectDot, { backgroundColor: item.active ? colors.success : colors.border }]}
              />
            </View>
          ))}
        </View>

        {bleConnected && (
          <>
            <SectionHeader title="Device Commands" hint="Quick actions" />
            <View style={styles.commandRow}>
              {([
                { cmd: 'START' as BleCommand, icon: 'play-circle-outline' as const, color: colors.success },
                { cmd: 'STOP' as BleCommand,  icon: 'stop-circle-outline' as const,  color: colors.warning },
                { cmd: 'RESET' as BleCommand, icon: 'refresh-circle-outline' as const, color: colors.danger },
              ]).map(({ cmd, icon, color }) => (
                <Pressable
                  key={cmd}
                  onPress={() => handleCommand(cmd)}
                  style={({ pressed }) => [
                    styles.commandBtn,
                    { borderColor: color + '55', backgroundColor: color + '0D' },
                    pressed && { opacity: 0.75 },
                  ]}
                  accessibilityLabel={`Send ${cmd} command`}
                >
                  <Ionicons name={icon} size={22} color={color} />
                  <Text style={[styles.commandBtnLabel, { color }]}>{cmd}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: Spacing.xl }}>
          <SectionHeader title="Alert Configuration" hint="Thresholds & triggers" />
        </View>
        <View style={styles.configurationGroup}>
          <View style={[styles.configCard, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}>
            <Text style={styles.configTitle}>Alert Settings</Text>
            <AlertSettingRow label="Low Blood Oxygen" description="Alert when SpO₂ drops" icon="water-outline" color={colors.oxygen} thresholdValue={String(settings.spo2WarnPct)} thresholdUnit="%" toggleValue={settings.lowOxygen} onToggleChange={v => updateSettings({ lowOxygen: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="High Heart Rate" description="Alert when HR exceeds limit" icon="heart-outline" color={colors.heartRate} thresholdValue={String(settings.hrWarnBpm)} thresholdUnit="bpm" toggleValue={settings.highHeartRate} onToggleChange={v => updateSettings({ highHeartRate: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="Critical Stress" description="Physiological distress" icon="pulse-outline" color={colors.stress} thresholdValue={String(settings.stressWarnPct)} thresholdUnit="%" toggleValue={settings.highStress} onToggleChange={v => updateSettings({ highStress: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="Low Battery" description="Device battery warning" icon="battery-dead-outline" color={colors.battery} thresholdValue={String(settings.battWarnPct)} thresholdUnit="%" toggleValue={settings.lowBattery} onToggleChange={v => updateSettings({ lowBattery: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="Min Deploy Altitude" description="Minimum safe deployment height" icon="arrow-down-outline" color={colors.danger} thresholdValue={String(settings.minDeployAltM)} thresholdUnit="m" colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="No Movement" description="Possible unconsciousness" icon="body-outline" color={colors.warning} toggleValue={settings.noMovement} onToggleChange={v => updateSettings({ noMovement: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="Excessive Rotation" description="Flat spin or instability" icon="refresh-outline" color={colors.warning} toggleValue={settings.excessiveRotation} onToggleChange={v => updateSettings({ excessiveRotation: v })} colors={colors} />
            <View style={styles.divider} />
            <AlertSettingRow label="Haptic Feedback" description="Vibrate on alerts" icon="phone-portrait-outline" color={colors.primary} toggleValue={settings.vibration} onToggleChange={v => updateSettings({ vibration: v })} colors={colors} />
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <AppearanceModal
        visible={appearanceOpen}
        themeMode={themeMode}
        colors={colors}
        onSelect={mode => {
          setThemeMode(mode)
          setAppearanceOpen(false)
        }}
        onClose={() => setAppearanceOpen(false)}
      />

      <DeviceModal
        visible={deviceBrowserOpen}
        devices={devices}
        device={selectedDevice}
        bleReady={bleReady}
        scanning={scanning}
        connected={selectedDevice ? selectedDevice.id === connectedId : false}
        connectedId={connectedId}
        colors={colors}
        onClose={() => {
          setSelectedDeviceId(null)
          setDeviceBrowserOpen(false)
        }}
        onSelectDevice={setSelectedDeviceId}
        onConnect={handleDeviceConnect}
        onStartScan={startScan}
        onStopScan={stopScan}
      />
    </SafeAreaView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: Spacing.md },

    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: Spacing.lg,
    },
    pageHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    pageHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconActionBtn: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      marginBottom: 1,
      letterSpacing: -0.3,
    },
    pageSubtitle: { fontSize: Typography.sm, color: colors.textMuted },

    scanCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
      padding: Spacing.md,
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    scanCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    scanCardIcon: {
      width: 52,
      height: 52,
      borderRadius: Radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    scanCardInfo: { flex: 1, gap: 4 },
    scanCardTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },
    scanCardDesc: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: Typography.sm * 1.45 },
    metaPill: {
      borderWidth: 1,
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    metaPillText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      letterSpacing: 0.2,
    },
    scanActionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },

    deviceBrowserCard: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    deviceBrowserTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    deviceBrowserIcon: {
      width: 52,
      height: 52,
      borderRadius: Radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    deviceBrowserInfo: { flex: 1, gap: 4 },
    deviceBrowserTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary },
    deviceBrowserDesc: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: Typography.sm * 1.45 },
    deviceBrowserMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    connectStatusRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    connectStatusChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: Radius.md,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    connectStatusIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    connectStatusLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 1,
    },
    connectStatusValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
    },
    connectDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    commandRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    commandBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      borderRadius: Radius.md,
      borderWidth: 1,
      paddingVertical: 12,
    },
    commandBtnLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },

    configurationGroup: {
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    configCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.md,
    },
    configTitle: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: Typography.bold,
      marginBottom: Spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: 8,
      minHeight: TouchTarget,
    },
    rowIconWrap: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    settingInfo: {
      flex: 1,
      gap: 2,
    },
    settingLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textPrimary,
    },
    settingDesc: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      lineHeight: Typography.xs * 1.35,
    },
    thresholdBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      borderWidth: 1,
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    thresholdValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
    },
    thresholdUnit: {
      fontSize: 10,
      fontWeight: Typography.semibold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderMuted,
      marginVertical: 2,
    },

    deviceList: { gap: Spacing.sm, marginBottom: Spacing.lg },
    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    deviceIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    deviceInfo: { flex: 1, gap: 4 },
    deviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deviceName: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.textPrimary },
    deviceStatePill: {
      borderWidth: 1,
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    deviceStateText: {
      fontSize: 10,
      fontWeight: Typography.bold,
      letterSpacing: 0.3,
    },
    deviceId: { fontSize: Typography.xs, color: colors.textMuted, fontFamily: Typography.mono },
    signalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 4 },
    signalBar: { width: 4, borderRadius: 2 },
    rssiText: { fontSize: Typography.xs, color: colors.textMuted, marginLeft: 6, fontFamily: Typography.mono },
    deviceChevron: { paddingLeft: 2 },

    protoList: { gap: Spacing.sm },
    protoRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      backgroundColor: colors.surfaceRaised,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    protoIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    protoInfo: { flex: 1, gap: 4 },
    protoLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
    protoDesc: { fontSize: Typography.sm, color: colors.textSecondary, lineHeight: Typography.sm * 1.5 },

    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    modalSheet: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlassStrong,
      padding: Spacing.md,
      gap: Spacing.md,
      maxHeight: '85%' as any,
    },
    modalGrip: {
      width: 44,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: colors.borderMuted,
      alignSelf: 'center',
    },
    modalTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: Typography.sm * 1.45,
    },
    modalOptionList: {
      gap: 8,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderRadius: Radius.lg,
      padding: Spacing.md,
    },
    modalOptionIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOptionBody: {
      flex: 1,
      gap: 2,
    },
    modalOptionTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textPrimary,
    },
    modalOptionDesc: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      lineHeight: Typography.xs * 1.45,
    },
    modalActionRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    browserMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    browserList: {
      gap: Spacing.sm,
    },
    backLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    backLinkText: {
      fontSize: Typography.xs,
      color: colors.textMuted,
      fontWeight: Typography.semibold,
    },
    deviceModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    deviceModalIcon: {
      width: 52,
      height: 52,
      borderRadius: Radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    deviceDetailCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceRaised,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    detailLabel: {
      fontSize: Typography.sm,
      color: colors.textMuted,
    },
    detailValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: colors.textPrimary,
      textAlign: 'right',
    },
  })
}
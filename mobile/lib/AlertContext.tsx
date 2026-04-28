import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import * as Haptics from 'expo-haptics'
import { useBle } from './BleContext'
import type { AppColors } from './theme'

export type AlertSeverity = 'info' | 'warning' | 'danger'

export interface LocalAlert {
  id: string
  severity: AlertSeverity
  title: string
  body: string
  timestamp: number
  dismissed: boolean
}

export interface AlertSettings {
  vibration: boolean
  lowOxygen: boolean
  highHeartRate: boolean
  highStress: boolean
  noMovement: boolean
  excessiveRotation: boolean
  lowBattery: boolean
  // thresholds
  spo2WarnPct: number
  spo2DangerPct: number
  hrWarnBpm: number
  stressWarnPct: number
  battWarnPct: number
  minDeployAltM: number
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  vibration: true,
  lowOxygen: true,
  highHeartRate: true,
  highStress: true,
  noMovement: true,
  excessiveRotation: true,
  lowBattery: true,
  spo2WarnPct: 93,
  spo2DangerPct: 90,
  hrWarnBpm: 160,
  stressWarnPct: 80,
  battWarnPct: 20,
  minDeployAltM: 800,
}

interface AlertContextValue {
  alerts: LocalAlert[]
  activeAlert: LocalAlert | null
  settings: AlertSettings
  updateSettings: (patch: Partial<AlertSettings>) => void
  dismissAlert: (id: string) => void
  dismissAll: () => void
}

const AlertContext = createContext<AlertContextValue>({
  alerts: [],
  activeAlert: null,
  settings: DEFAULT_ALERT_SETTINGS,
  updateSettings: () => {},
  dismissAlert: () => {},
  dismissAll: () => {},
})

const COOLDOWN_MS = 30_000
const MAX_ALERTS = 100

function makeAlertId() {
  return 'alert-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { slowPacket, fastPacketRef } = useBle()
  const [alerts, setAlerts] = useState<LocalAlert[]>([])
  const [settings, setSettings] = useState<AlertSettings>(DEFAULT_ALERT_SETTINGS)
  const cooldownsRef = useRef(new Map<string, number>())

  const addAlert = useCallback((
    severity: AlertSeverity,
    key: string,
    title: string,
    body: string,
    enabled: boolean,
  ) => {
    if (!enabled) return

    const now = Date.now()
    const last = cooldownsRef.current.get(key) ?? 0
    if (now - last < COOLDOWN_MS) return
    cooldownsRef.current.set(key, now)

    const alert: LocalAlert = {
      id: makeAlertId(),
      severity,
      title,
      body,
      timestamp: now,
      dismissed: false,
    }

    setAlerts(prev => [alert, ...prev].slice(0, MAX_ALERTS))

    if (settings.vibration) {
      if (severity === 'danger') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      } else if (severity === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      }
    }
  }, [settings.vibration])

  useEffect(() => {
    if (!slowPacket) return

    const { bpm, spo2, stressPct, battPct } = slowPacket

    // Sensor returns 0 while initialising or not in contact — ignore those readings.
    const spo2Valid  = spo2 > 0
    const bpmValid   = bpm > 0
    const battValid  = battPct > 0

    addAlert(
      spo2 < settings.spo2DangerPct ? 'danger' : 'warning',
      'low_oxygen',
      'Low Blood Oxygen',
      `SpO₂ is ${spo2.toFixed(0)}% — below safe threshold (${settings.spo2WarnPct}%)`,
      settings.lowOxygen && spo2Valid && spo2 < settings.spo2WarnPct,
    )

    addAlert(
      'warning',
      'high_hr',
      'Elevated Heart Rate',
      `Heart rate is ${Math.round(bpm)} bpm — above ${settings.hrWarnBpm} bpm`,
      settings.highHeartRate && bpmValid && bpm > settings.hrWarnBpm,
    )

    addAlert(
      stressPct > 88 ? 'danger' : 'warning',
      'high_stress',
      'Critical Stress Level',
      `Stress index ${Math.round(stressPct)}% — possible panic or loss of control`,
      settings.highStress && bpmValid && stressPct > settings.stressWarnPct,
    )

    addAlert(
      'info',
      'low_battery',
      'Low Device Battery',
      `Wearable battery at ${Math.round(battPct)}% — charge soon`,
      settings.lowBattery && battValid && battPct < settings.battWarnPct,
    )

    const fast = fastPacketRef.current
    if (fast) {
      const roll  = Math.abs(fast.rollDeg)
      const pitch = Math.abs(fast.pitchDeg)
      // Only check rotation when the IMU is actually reporting non-zero data
      const imuValid = fast.gyroX !== 0 || fast.gyroY !== 0 || fast.gyroZ !== 0
      addAlert(
        'danger',
        'excessive_rotation',
        'Excessive Body Rotation',
        `Roll ${roll.toFixed(0)}° / Pitch ${pitch.toFixed(0)}° — possible flat spin`,
        settings.excessiveRotation && imuValid && (roll > 45 || pitch > 45),
      )

      if (settings.noMovement && imuValid && fast.stationary === 1 && fast.stillCount > 60) {
        addAlert(
          'danger',
          'no_movement',
          'No Movement Detected',
          `Device stationary for ${fast.stillCount} cycles — check skydiver`,
          true,
        )
      }
    }
  }, [slowPacket, settings, addAlert, fastPacketRef])

  const updateSettings = useCallback((patch: Partial<AlertSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))
  }, [])

  const dismissAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))
  }, [])

  const activeAlert = alerts.find(a => !a.dismissed) ?? null

  return (
    <AlertContext.Provider value={{ alerts, activeAlert, settings, updateSettings, dismissAlert, dismissAll }}>
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts() {
  return useContext(AlertContext)
}

export function severityColor(severity: AlertSeverity, colors: AppColors): string {
  switch (severity) {
    case 'danger':  return colors.danger
    case 'warning': return colors.warning
    case 'info':    return colors.primary
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { SkydiverData, AlertItem, VitalPoint, BodyPosition, SkydiverStatus } from '../lib/types'

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
function jitter(v: number, range: number) {
  return v + (Math.random() - 0.5) * range * 2
}
function pushHistory(arr: VitalPoint[], value: number, max = 30): VitalPoint[] {
  return [...arr.slice(-(max - 1)), { time: Date.now(), value }]
}

const INITIAL_DATA: SkydiverData = {
  status: 'freefall',
  parachuteOpen: false,
  position: 'stable',
  lastPositionChange: Date.now(),
  altitude: 3800,
  verticalSpeed: -52,
  heartRate: 138,
  oxygen: 96,
  stress: 65,
  temperature: 36.8,
  battery: 84,
  heartRateHistory: Array.from({ length: 15 }, (_, i) => ({
    time: Date.now() - (15 - i) * 2000,
    value: 130 + Math.random() * 20,
  })),
  oxygenHistory: Array.from({ length: 15 }, (_, i) => ({
    time: Date.now() - (15 - i) * 2000,
    value: 94 + Math.random() * 4,
  })),
  altitudeHistory: Array.from({ length: 15 }, (_, i) => ({
    time: Date.now() - (15 - i) * 2000,
    value: 4200 - i * 90 + Math.random() * 20,
  })),
  jumpNumber: 247,
  sessionStarted: Date.now() - 480000,
  lastUpdate: Date.now(),
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    type: 'warning',
    title: 'Parachute not deployed',
    body: 'Altitude is 3,800m — deploy recommended below 1,500m.',
    timestamp: Date.now() - 30000,
    dismissed: false,
  },
]

export function useSimulation() {
  const [data, setData] = useState<SkydiverData>(INITIAL_DATA)
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS)
  const tickRef = useRef(0)

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))
  }, [])

  const dismissAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, dismissed: true })))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1
      const tick = tickRef.current

      setData(prev => {
        const newHr   = Math.round(clamp(jitter(prev.heartRate, 4), 55, 190))
        const newO2   = Math.round(clamp(jitter(prev.oxygen, 1.2), 85, 100))
        const newStr  = Math.round(clamp(jitter(prev.stress, 4), 0, 100))
        const newTemp = parseFloat(clamp(jitter(prev.temperature, 0.1), 35.5, 39.5).toFixed(1))
        const newAlt  = prev.status === 'freefall'
          ? Math.max(0, prev.altitude + Math.round(prev.verticalSpeed * 2 + jitter(0, 5)))
          : prev.status === 'canopy_open'
            ? Math.max(0, prev.altitude - Math.round(5 + jitter(0, 2)))
            : prev.altitude

        // Auto open parachute at 900m
        const newParachute = prev.parachuteOpen || newAlt <= 900
        const newStatus: SkydiverStatus =
          newAlt <= 5 ? 'landed' :
          newParachute ? 'canopy_open' : 'freefall'

        // Random position change every ~20 ticks
        const positions: BodyPosition[] = ['stable', 'headdown', 'tracking', 'tumbling']
        const newPosition = tick % 20 === 0
          ? positions[Math.floor(Math.random() * positions.length)]
          : prev.position

        return {
          ...prev,
          status: newStatus,
          parachuteOpen: newParachute,
          position: newPosition,
          lastPositionChange: newPosition !== prev.position ? Date.now() : prev.lastPositionChange,
          altitude: newAlt,
          verticalSpeed: newParachute ? -5 : prev.verticalSpeed,
          heartRate: newHr,
          oxygen: newO2,
          stress: newStr,
          temperature: newTemp,
          heartRateHistory: pushHistory(prev.heartRateHistory, newHr),
          oxygenHistory: pushHistory(prev.oxygenHistory, newO2),
          altitudeHistory: pushHistory(prev.altitudeHistory, newAlt),
          lastUpdate: Date.now(),
        }
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Generate contextual alerts based on thresholds
  useEffect(() => {
    if (data.oxygen < 93) {
      setAlerts(prev => {
        if (prev.some(a => a.id === 'low-o2' && !a.dismissed)) return prev
        return [...prev.filter(a => a.id !== 'low-o2'), {
          id: 'low-o2', type: 'danger',
          title: 'Low Blood Oxygen',
          body: `SpO₂ at ${data.oxygen}% — below safe threshold of 93%.`,
          timestamp: Date.now(), dismissed: false,
        }]
      })
    }
    if (data.heartRate > 160) {
      setAlerts(prev => {
        if (prev.some(a => a.id === 'high-hr' && !a.dismissed)) return prev
        return [...prev.filter(a => a.id !== 'high-hr'), {
          id: 'high-hr', type: 'warning',
          title: 'Elevated Heart Rate',
          body: `Heart rate ${data.heartRate} bpm — above safe limit for freefall phase.`,
          timestamp: Date.now(), dismissed: false,
        }]
      })
    }
    if (data.stress > 80) {
      setAlerts(prev => {
        if (prev.some(a => a.id === 'high-stress' && !a.dismissed)) return prev
        return [...prev.filter(a => a.id !== 'high-stress'), {
          id: 'high-stress', type: 'danger',
          title: 'Critical Stress Level',
          body: `Stress index at ${data.stress}% — possible panic response.`,
          timestamp: Date.now(), dismissed: false,
        }]
      })
    }
    if (data.parachuteOpen && !alerts.some(a => a.id === 'chute-open')) {
      setAlerts(prev => [...prev, {
        id: 'chute-open', type: 'info',
        title: 'Parachute Deployed',
        body: `Canopy open at ${data.altitude}m. Descent rate: ${Math.abs(data.verticalSpeed)} m/s.`,
        timestamp: Date.now(), dismissed: false,
      }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.oxygen, data.heartRate, data.stress, data.parachuteOpen])

  const activeAlerts = alerts.filter(a => !a.dismissed)
  const dangerAlerts = activeAlerts.filter(a => a.type === 'danger')

  return { data, alerts, activeAlerts, dangerAlerts, dismissAlert, dismissAll }
}

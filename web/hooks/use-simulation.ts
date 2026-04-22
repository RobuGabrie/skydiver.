"use client"

import { useState, useEffect, useCallback } from "react"
import { Skydiver, Alert } from "@/lib/types"
import { MOCK_SKYDIVERS, MOCK_ALERTS } from "@/lib/mock-data"

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function jitter(val: number, range: number) {
  return val + (Math.random() - 0.5) * range * 2
}

export function useSimulation() {
  const [skydivers, setSkydivers] = useState<Skydiver[]>(MOCK_SKYDIVERS)
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [tick, setTick] = useState(0)

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a))
  }, [])

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)

      setSkydivers(prev => prev.map(s => {
        if (s.status === "landed" || s.status === "standby") return { ...s, lastUpdate: new Date() }

        const newHr = Math.round(clamp(jitter(s.heartRate, 4), 55, 190))
        const newO2 = Math.round(clamp(jitter(s.oxygen, 1.5), 85, 100))
        const newStress = Math.round(clamp(jitter(s.stress, 5), 0, 100))
        const newTemp = parseFloat(clamp(jitter(s.temperature, 0.15), 35.5, 39.5).toFixed(1))
        const newAlt = s.status === "freefall"
          ? Math.max(0, s.altitude + Math.round(s.verticalSpeed * 2 + jitter(0, 5)))
          : s.status === "canopy_open"
            ? Math.max(0, s.altitude - Math.round(Math.abs(s.verticalSpeed) + jitter(0, 2)))
            : s.altitude

        const newVitalPoint = {
          time: new Date().toISOString(),
          heartRate: newHr,
          oxygen: newO2,
          stress: newStress,
          temperature: newTemp,
        }
        const newAltPoint = {
          time: new Date().toISOString(),
          altitude: newAlt,
          verticalSpeed: s.verticalSpeed,
        }

        return {
          ...s,
          heartRate: newHr,
          oxygen: newO2,
          stress: newStress,
          temperature: newTemp,
          altitude: newAlt,
          lastUpdate: new Date(),
          vitalHistory: [...s.vitalHistory.slice(-49), newVitalPoint],
          altitudeHistory: [...s.altitudeHistory.slice(-49), newAltPoint],
        }
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === "critical")

  return { skydivers, alerts, unacknowledgedAlerts, criticalAlerts, acknowledgeAlert, acknowledgeAll, tick }
}

"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCallback } from "react"
import { useMockMode } from "@/lib/mock-context"
import { useSimulation } from "@/hooks/use-simulation"
import { useSkydivers } from "@/hooks/use-skydivers"
import type { Skydiver, Alert } from "@/lib/types"

interface SkydiversContextValue {
  skydivers: Skydiver[]
  alerts: Alert[]
  unacknowledgedAlerts: Alert[]
  criticalAlerts: Alert[]
  acknowledgeAlert: (id: string) => void
  acknowledgeAll: () => void
  tick: number
}

const SkydiversContext = createContext<SkydiversContextValue | null>(null)

export function SkydiversProvider({ children }: { children: ReactNode }) {
  const { isMockMode } = useMockMode()
  const sim  = useSimulation(isMockMode)
  const live = useSkydivers()

  const acknowledgeAlert = useCallback((id: string) => {
    if (sim.alerts.some(a => a.id === id)) {
      sim.acknowledgeAlert(id)
    } else {
      live.acknowledgeAlert(id)
    }
  }, [sim, live])

  const acknowledgeAll = useCallback(() => {
    sim.acknowledgeAll()
    live.acknowledgeAll()
  }, [sim, live])

  let value: SkydiversContextValue
  if (!isMockMode) {
    value = live
  } else {
    const skydivers = [...live.skydivers, ...sim.skydivers]
    const alerts = [...live.alerts, ...sim.alerts]
    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
    const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === "critical")
    value = {
      skydivers,
      alerts,
      unacknowledgedAlerts,
      criticalAlerts,
      acknowledgeAlert,
      acknowledgeAll,
      tick: live.tick + sim.tick,
    }
  }

  return (
    <SkydiversContext.Provider value={value}>
      {children}
    </SkydiversContext.Provider>
  )
}

export function useSkydiversData(): SkydiversContextValue {
  const ctx = useContext(SkydiversContext)
  if (!ctx) throw new Error("useSkydiversData must be used inside SkydiversProvider")
  return ctx
}

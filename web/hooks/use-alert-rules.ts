"use client"

import { useState, useCallback } from "react"
import { AlertRule } from "@/lib/types"

const STORAGE_KEY = "skydiver-alert-rules"

const DEFAULT_RULES: AlertRule[] = [
  { id: "parachute",   label: "Parachute not deployed below",  active: true, severity: "critical", threshold: 800,  unit: "m" },
  { id: "o2_warn",     label: "O₂ saturation below",          active: true, severity: "warning",  threshold: 93,   unit: "%" },
  { id: "o2_crit",     label: "O₂ saturation critical below", active: true, severity: "critical", threshold: 90,   unit: "%" },
  { id: "hr_high",     label: "Heart rate above",             active: true, severity: "warning",  threshold: 160,  unit: "bpm" },
  { id: "stress_crit", label: "Stress level above",           active: true, severity: "critical", threshold: 88,   unit: "%" },
  { id: "stress_warn", label: "Stress warning above",         active: true, severity: "warning",  threshold: 75,   unit: "%" },
  { id: "rotation",    label: "Rotation rate above",          active: true, severity: "critical", threshold: 180,  unit: "°/s" },
  { id: "no_move",     label: "No movement for more than",    active: true, severity: "critical", threshold: 10,   unit: "s" },
  { id: "battery",     label: "Battery below",                active: true, severity: "info",     threshold: 20,   unit: "%" },
  { id: "vspeed",      label: "Vertical speed above",         active: true, severity: "warning",  threshold: 65,   unit: "m/s" },
]

function load(): AlertRule[] {
  if (typeof window === "undefined") return DEFAULT_RULES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RULES
    const saved: AlertRule[] = JSON.parse(raw)
    // Merge: keep default IDs, apply saved state
    return DEFAULT_RULES.map(d => {
      const found = saved.find(s => s.id === d.id)
      return found ? { ...d, active: found.active, threshold: found.threshold ?? d.threshold } : d
    })
  } catch {
    return DEFAULT_RULES
  }
}

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(load)

  const persist = useCallback((next: AlertRule[]) => {
    setRules(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const toggle = useCallback((id: string) => {
    setRules(prev => {
      const next = prev.map(r => r.id === id ? { ...r, active: !r.active } : r)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const setThreshold = useCallback((id: string, threshold: number) => {
    setRules(prev => {
      const next = prev.map(r => r.id === id ? { ...r, threshold } : r)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const reset = useCallback(() => persist(DEFAULT_RULES), [persist])

  return { rules, toggle, setThreshold, reset }
}

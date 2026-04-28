"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "skydiver-alert-sound"

export function useAlertSound() {
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Sync from localStorage after mount — keeps SSR and client renders identical
  useEffect(() => {
    setSoundEnabled(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])
  const prevCriticalCount = useRef(0)

  const toggle = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const ping = useCallback(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
      osc.onended = () => ctx.close()
    } catch {
      // AudioContext may be unavailable in some environments
    }
  }, [])

  const notifyIfNeeded = useCallback((criticalCount: number) => {
    if (!soundEnabled) return
    if (criticalCount > prevCriticalCount.current) {
      ping()
    }
    prevCriticalCount.current = criticalCount
  }, [soundEnabled, ping])

  return { soundEnabled, toggle, notifyIfNeeded }
}

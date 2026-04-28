"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MetricValueProps {
  value: number | string
  className?: string
  flashClass?: string
}

/**
 * Renders a value that briefly flashes when it changes — giving the instructor
 * an immediate visual cue that this metric just updated from a BLE packet.
 */
export function MetricValue({ value, className, flashClass = "text-primary" }: MetricValueProps) {
  const [flash, setFlash] = useState(false)
  const prevValue = useRef(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      if (timerRef.current) clearTimeout(timerRef.current)
      setFlash(true)
      timerRef.current = setTimeout(() => setFlash(false), 350)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value])

  const display = typeof value === "number" && !Number.isFinite(value) ? "—" : value

  return (
    <span className={cn(className, flash && flashClass, flash && "transition-colors duration-300")}>
      {display}
    </span>
  )
}

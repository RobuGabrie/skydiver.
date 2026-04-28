import { useCallback, useEffect, useRef } from 'react'
import { useBle } from '../lib/BleContext'
import { usePhoneLocation } from './usePhoneLocation'
import {
  startJump,
  recordJumpSample,
  endJump,
} from '../lib/jumpRecorder'
import type { FastPacket, SlowPacket } from '../lib/bleProtocol'

type Status = 'freefall' | 'canopy_open' | 'landed' | 'standby' | 'alert'

function deriveStatus(vSpeed: number, alt: number | null, stationary: number): Status {
  if (stationary === 1) return alt !== null && alt > 200 ? 'standby' : 'landed'
  if (vSpeed < -15) return 'freefall'
  if (vSpeed < -2) return 'canopy_open'
  if (alt !== null && alt < 30) return 'landed'
  return 'standby'
}

export function useJumpRecorder() {
  const { slowPacket, fastPacketRef, connectedId } = useBle()
  const { location } = usePhoneLocation(true)

  const currentJumpIdRef = useRef<string | null>(null)
  const inJumpRef = useRef(false)
  const landedSinceRef = useRef<number | null>(null)
  const lastAltRef = useRef<number | null>(null)
  const lastAltTimeRef = useRef<number | null>(null)

  // Reset everything when device disconnects
  useEffect(() => {
    if (!connectedId) {
      if (currentJumpIdRef.current && inJumpRef.current) {
        endJump(currentJumpIdRef.current).catch(() => {})
      }
      currentJumpIdRef.current = null
      inJumpRef.current = false
      landedSinceRef.current = null
      lastAltRef.current = null
      lastAltTimeRef.current = null
    }
  }, [connectedId])

  const processSample = useCallback(
    async (slow: SlowPacket, fast: FastPacket | null, deviceId: string) => {
      const now = Date.now()
      const alt = location?.altitude ?? null

      // Compute vertical speed
      let vSpeed = 0
      if (alt !== null && lastAltRef.current !== null && lastAltTimeRef.current !== null) {
        const dt = (now - lastAltTimeRef.current) / 1000
        if (dt >= 0.5) {
          vSpeed = (alt - lastAltRef.current) / dt
          lastAltRef.current = alt
          lastAltTimeRef.current = now
        }
      } else if (alt !== null) {
        lastAltRef.current = alt
        lastAltTimeRef.current = now
      }

      const status = deriveStatus(vSpeed, alt, fast?.stationary ?? 1)
      const isActive = status === 'freefall' || status === 'canopy_open'

      const gForce = fast
        ? Math.sqrt(fast.accelX ** 2 + fast.accelY ** 2 + fast.accelZ ** 2)
        : 0

      // Start a new jump when we first see freefall
      if (isActive && !inJumpRef.current) {
        const jumpId = await startJump(deviceId)
        currentJumpIdRef.current = jumpId
        inJumpRef.current = true
        landedSinceRef.current = null
      }

      if (!currentJumpIdRef.current || !inJumpRef.current) return

      // Record the sample
      await recordJumpSample(currentJumpIdRef.current, {
        lat: location?.latitude ?? null,
        lon: location?.longitude ?? null,
        altM: alt ?? null,
        bpm: slow.bpm,
        spo2: slow.spo2,
        stress: slow.stressPct,
        tempC: slow.tempC,
        battPct: slow.battPct,
        rollDeg: fast?.rollDeg ?? 0,
        pitchDeg: fast?.pitchDeg ?? 0,
        yawDeg: fast?.yawDeg ?? 0,
        gForce,
        vSpeedMs: vSpeed,
        status,
      })

      // End the jump 30 s after sustained landing
      if (status === 'landed') {
        if (landedSinceRef.current === null) {
          landedSinceRef.current = now
        } else if (now - landedSinceRef.current > 30_000) {
          await endJump(currentJumpIdRef.current)
          currentJumpIdRef.current = null
          inJumpRef.current = false
          landedSinceRef.current = null
        }
      } else {
        landedSinceRef.current = null
      }
    },
    [location],
  )

  useEffect(() => {
    if (!slowPacket || !connectedId) return
    const fast = fastPacketRef.current as FastPacket | null
    processSample(slowPacket, fast, connectedId).catch(() => {})
  }, [slowPacket, connectedId, fastPacketRef, processSample])

  return {
    activeJumpId: currentJumpIdRef.current,
    isRecording: inJumpRef.current,
  }
}

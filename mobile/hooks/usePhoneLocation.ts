import { useState, useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'

export interface PhoneLocation {
  latitude: number
  longitude: number
  altitude: number | null
  altitudeAccuracy: number | null
  accuracy: number | null
  timestamp: number
}

export function usePhoneLocation(active = true) {
  const [location, setLocation] = useState<PhoneLocation | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const subRef = useRef<Location.LocationSubscription | null>(null)

  const stop = useCallback(() => {
    subRef.current?.remove()
    subRef.current = null
  }, [])

  useEffect(() => {
    if (!active) {
      stop()
      return
    }

    let cancelled = false

    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (cancelled) return
        const granted = status === 'granted'
        setPermissionGranted(granted)
        if (!granted) return

        return Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (loc) => {
            if (cancelled) return
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              altitudeAccuracy: loc.coords.altitudeAccuracy ?? null,
              accuracy: loc.coords.accuracy,
              timestamp: loc.timestamp,
            })
          },
        )
      })
      .then((sub) => {
        if (sub) {
          if (cancelled) sub.remove()
          else subRef.current = sub
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      stop()
    }
  }, [active, stop])

  return { location, permissionGranted }
}

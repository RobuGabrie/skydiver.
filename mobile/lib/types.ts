export type ConnectionMode = 'wifi' | 'ble' | 'offline'

export type SkydiverStatus = 'freefall' | 'canopy_open' | 'landed' | 'standby' | 'alert'

export type BodyPosition = 'stable' | 'headdown' | 'tracking' | 'tumbling'

export interface VitalPoint {
  time: number   // timestamp ms
  value: number
}

export interface SkydiverData {
  // Status
  status: SkydiverStatus
  parachuteOpen: boolean
  position: BodyPosition
  lastPositionChange: number  // timestamp ms

  // Altitude & motion
  altitude: number      // meters
  verticalSpeed: number // m/s (negative = falling)

  // Vitals
  heartRate: number     // bpm
  oxygen: number        // %
  stress: number        // 0–100
  temperature: number   // °C
  battery: number       // %

  // History (last 30 points)
  heartRateHistory: VitalPoint[]
  oxygenHistory: VitalPoint[]
  altitudeHistory: VitalPoint[]

  // Metadata
  jumpNumber: number
  sessionStarted: number  // timestamp ms
  lastUpdate: number      // timestamp ms
}

export interface AlertItem {
  id: string
  type: 'danger' | 'warning' | 'info'
  title: string
  body: string
  timestamp: number
  dismissed: boolean
}

export interface DeviceInfo {
  name: string
  id: string
  rssi: number   // signal strength
  batteryLevel: number
  firmwareVersion: string
  connected: boolean
}

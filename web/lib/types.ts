export type SkydiverStatus = "freefall" | "canopy_open" | "landed" | "standby" | "alert"

export type AlertSeverity = "critical" | "warning" | "info"

export type AlertType =
  | "uncontrolled_fall"
  | "excessive_rotation"
  | "no_movement"
  | "abnormal_pulse"
  | "high_stress"
  | "low_oxygen"
  | "high_temp"
  | "low_battery"
  | "parachute_open"
  | "position_change"
  | "accident_risk"
  | "abnormal_behavior"

export interface VitalPoint {
  time: string
  heartRate: number
  oxygen: number
  stress: number
  temperature: number
}

export interface AltitudePoint {
  time: string
  altitude: number
  verticalSpeed: number
}

export interface Skydiver {
  id: string
  name: string
  avatar: string
  status: SkydiverStatus
  jumpNumber: number
  altitude: number
  verticalSpeed: number
  heartRate: number
  oxygen: number
  stress: number
  temperature: number
  battery: number
  parachuteOpen: boolean
  position: "stable" | "tumbling" | "headdown" | "tracking"
  lastUpdate: Date
  vitalHistory: VitalPoint[]
  altitudeHistory: AltitudePoint[]
  riskScore: number
  connectedVia: "ble" | "wifi" | "offline"
}

export interface Alert {
  id: string
  skydiverId: string
  skydiverName: string
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: Date
  acknowledged: boolean
  value?: number
  threshold?: number
}

export interface SessionStats {
  totalJumps: number
  alertsTriggered: number
  avgHeartRate: number
  avgOxygen: number
  avgStress: number
  maxAltitude: number
  jumpDuration: number
  safetyScore: number
}

export interface AIAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical"
  detectedAnomalies: string[]
  predictions: string[]
  confidence: number
  lastAnalyzed: Date
}

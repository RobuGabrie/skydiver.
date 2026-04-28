import React, { memo, useMemo, useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { MotiView } from 'moti'
import Svg, { Polyline, Circle, Text as SvgText, Line } from 'react-native-svg'
import { useBle } from '../../lib/BleContext'
import { usePhoneLocation } from '../../hooks/usePhoneLocation'
import { useTheme } from '../../lib/ThemeContext'
import { CockpitBackground } from '../../components/cockpit/CockpitBackground'
import { GlassCard } from '../../components/cockpit/GlassCard'
import { EmptyStatePanel } from '../../components/cockpit/EmptyStatePanel'
import { AppColors, Typography, Spacing, Radius } from '../../lib/theme'

interface TrackPoint {
  lat: number
  lon: number
  altM: number | null
  ts: number
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  freefall:    '#38BDF8',
  canopy_open: '#22C55E',
  landed:      '#64748B',
  standby:     '#64748B',
}

const MAX_TRACK_POINTS = 600

function deriveStatus(vSpeed: number, alt: number | null, stationary: number): string {
  if (stationary === 1) return alt !== null && alt > 200 ? 'standby' : 'landed'
  if (vSpeed < -15) return 'freefall'
  if (vSpeed < -2) return 'canopy_open'
  if (alt !== null && alt < 30) return 'landed'
  return 'standby'
}

// Minimum viewport span (~150 m). Prevents the map from zooming in so much
// that normal GPS noise (3-10 m) looks like large movements on screen.
const MIN_VIEWPORT_DEG = 0.00135

const TrackMap = memo(function TrackMap({
  track,
  width,
  height,
  colors,
}: {
  track: TrackPoint[]
  width: number
  height: number
  colors: AppColors
}) {
  if (track.length < 2) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="location-outline" size={32} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: Typography.xs, marginTop: 8, textAlign: 'center' }}>
          Move to start recording track
        </Text>
      </View>
    )
  }

  const pad = 28
  let latMin = track[0].lat, latMax = track[0].lat
  let lonMin = track[0].lon, lonMax = track[0].lon
  for (const pt of track) {
    if (pt.lat < latMin) latMin = pt.lat
    if (pt.lat > latMax) latMax = pt.lat
    if (pt.lon < lonMin) lonMin = pt.lon
    if (pt.lon > lonMax) lonMax = pt.lon
  }

  // Enforce minimum viewport so GPS noise stays visually tiny
  const latRange = Math.max(latMax - latMin, MIN_VIEWPORT_DEG)
  const lonRange = Math.max(lonMax - lonMin, MIN_VIEWPORT_DEG)
  // Centre the viewport
  const latMid = (latMin + latMax) / 2
  const lonMid = (lonMin + lonMax) / 2
  const latMinV = latMid - latRange / 2
  const lonMinV = lonMid - lonRange / 2

  const scale = Math.min((width - pad * 2) / lonRange, (height - pad * 2) / latRange)

  function proj(lat: number, lon: number) {
    return {
      x: pad + (lon - lonMinV) * scale,
      y: height - pad - (lat - latMinV) * scale,
    }
  }

  // Group consecutive same-colour points into Polyline batches.
  // This replaces N individual <Line> elements with a handful of <Polyline>
  // elements, which is dramatically faster to render and produces smooth joins.
  const polylines: Array<{ color: string; pts: string }> = []
  let curColor = ''
  let curPts: string[] = []

  for (let i = 0; i < track.length; i++) {
    const { x, y } = proj(track[i].lat, track[i].lon)
    const color = STATUS_COLORS[track[i].status] ?? colors.primary
    if (color !== curColor) {
      if (curPts.length >= 2) polylines.push({ color: curColor, pts: curPts.join(' ') })
      // Overlap one point so there is no gap between colour segments
      curColor = color
      curPts = i > 0
        ? [(() => { const p = proj(track[i - 1].lat, track[i - 1].lon); return `${p.x},${p.y}` })(), `${x},${y}`]
        : [`${x},${y}`]
    } else {
      curPts.push(`${x},${y}`)
    }
  }
  if (curPts.length >= 2) polylines.push({ color: curColor, pts: curPts.join(' ') })

  const current = proj(track[track.length - 1].lat, track[track.length - 1].lon)
  const start   = proj(track[0].lat, track[0].lon)

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(t => {
        const y = pad + t * (height - pad * 2)
        return <Line key={`h${t}`} x1={pad} y1={y} x2={width - pad} y2={y} stroke={colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
      })}
      {[0.25, 0.5, 0.75].map(t => {
        const x = pad + t * (width - pad * 2)
        return <Line key={`v${t}`} x1={x} y1={pad} x2={x} y2={height - pad} stroke={colors.border} strokeWidth={0.5} strokeDasharray="4,4" />
      })}

      {/* Track — one Polyline per colour run, smooth joins */}
      {polylines.map((pl, i) => (
        <Polyline
          key={i}
          points={pl.pts}
          stroke={pl.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}

      {/* Start marker */}
      <Circle cx={start.x} cy={start.y} r={6} fill={colors.primary} />
      <SvgText x={start.x + 8} y={start.y - 4} fontSize={9} fill={colors.primary} fontWeight="bold">START</SvgText>

      {/* Current position */}
      <Circle cx={current.x} cy={current.y} r={10} fill={colors.primary} opacity={0.18} />
      <Circle cx={current.x} cy={current.y} r={5} fill={colors.primary} />
      <SvgText x={current.x + 8} y={current.y - 4} fontSize={9} fill={colors.primary} fontWeight="bold">HERE</SvgText>
    </Svg>
  )
})

export default function MapScreen() {
  const { colors } = useTheme()
  const { connectedId, slowPacket, fastPacketRef } = useBle()
  const { location } = usePhoneLocation(true)
  const { width: screenWidth } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const trackRef = useRef<TrackPoint[]>([])
  const lastAltRef = useRef<number | null>(null)
  const lastAltTimeRef = useRef<number | null>(null)
  // EMA state for lat/lon — smooths out GPS noise
  const emaLatRef = useRef<number | null>(null)
  const emaLonRef = useRef<number | null>(null)
  const [, tick] = useState(0)

  // EMA alpha: 0.25 = heavily smoothed, 0.6 = more responsive. 0.3 is a good
  // balance — stationary noise is absorbed, real movement catches up in ~3 s.
  const EMA_ALPHA = 0.3

  // Reset track on new connection
  useEffect(() => {
    if (connectedId) {
      trackRef.current = []
      lastAltRef.current = null
      lastAltTimeRef.current = null
      emaLatRef.current = null
      emaLonRef.current = null
      tick(v => v + 1)
    }
  }, [connectedId])

  // Append GPS points whenever location changes and device is connected
  useEffect(() => {
    if (!location || !connectedId) return
    const { latitude: rawLat, longitude: rawLon, altitude, accuracy } = location
    const now = Date.now()

    // EMA smoothing — first point seeds the filter
    const sLat = emaLatRef.current === null
      ? rawLat
      : EMA_ALPHA * rawLat + (1 - EMA_ALPHA) * emaLatRef.current
    const sLon = emaLonRef.current === null
      ? rawLon
      : EMA_ALPHA * rawLon + (1 - EMA_ALPHA) * emaLonRef.current
    emaLatRef.current = sLat
    emaLonRef.current = sLon

    let vSpeed = 0
    if (altitude !== null && altitude !== undefined && lastAltRef.current !== null && lastAltTimeRef.current !== null) {
      const dt = (now - lastAltTimeRef.current) / 1000
      if (dt >= 0.5) {
        vSpeed = (altitude - lastAltRef.current) / dt
        lastAltRef.current = altitude
        lastAltTimeRef.current = now
      }
    } else if (altitude !== null && altitude !== undefined) {
      lastAltRef.current = altitude
      lastAltTimeRef.current = now
    }

    const fast = fastPacketRef.current
    const status = deriveStatus(vSpeed, altitude ?? null, fast?.stationary ?? 1)

    const prev = trackRef.current
    if (prev.length > 0) {
      const last = prev[prev.length - 1]
      const dLat = sLat - last.lat
      const dLon = sLon - last.lon
      // Require movement of at least the GPS accuracy radius (min 5 m) before
      // adding a new point. Converts accuracy from metres to degrees (÷111320).
      const minDeg = Math.max(0.000045, (accuracy ?? 10) / 111320)
      if (Math.sqrt(dLat ** 2 + dLon ** 2) < minDeg) return
    }

    trackRef.current = [
      ...trackRef.current.slice(-(MAX_TRACK_POINTS - 1)),
      { lat: sLat, lon: sLon, altM: altitude ?? null, ts: now, status },
    ]
    tick(v => v + 1)
  }, [location, connectedId, fastPacketRef])

  const track = trackRef.current
  const mapWidth = screenWidth - Spacing.md * 2

  const currentStatus = track.length > 0 ? track[track.length - 1].status : null
  const currentAlt = location?.altitude
  const lastPoint = track.length > 0 ? track[track.length - 1] : null

  // Compute distance from start
  let distanceM = 0
  if (track.length >= 2) {
    const R = 6371000
    const a = track[0]
    const b = track[track.length - 1]
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLon = (b.lon - a.lon) * Math.PI / 180
    const sa = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    distanceM = R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa))
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CockpitBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.pageIconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
          <Ionicons name="map-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Live Track</Text>
          <Text style={styles.pageSubtitle}>
            {connectedId ? `${track.length} points · GPS active` : 'Connect device to record'}
          </Text>
        </View>
        {currentStatus && (
          <View style={[styles.statusChip, { borderColor: (STATUS_COLORS[currentStatus] ?? colors.primary) + '55' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[currentStatus] ?? colors.primary }]}>
              {currentStatus.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Stats strip */}
      {connectedId && (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
          style={[styles.statsStrip, { marginHorizontal: Spacing.md }]}
        >
          <GlassCard style={styles.statsCard}>
            {[
              { label: 'ALT', value: currentAlt != null ? `${Math.round(currentAlt)} m` : '—', color: colors.primary, icon: 'arrow-up-outline' as const },
              { label: 'DIST', value: distanceM > 1 ? `${Math.round(distanceM)} m` : '—', color: colors.stress, icon: 'navigate-outline' as const },
              { label: 'GPS', value: location ? `±${Math.round(location.accuracy ?? 0)} m` : 'No fix', color: colors.success, icon: 'locate-outline' as const },
              { label: 'PTS', value: String(track.length), color: colors.textSecondary, icon: 'analytics-outline' as const },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />}
                <View style={styles.statItem}>
                  <Ionicons name={item.icon} size={11} color={item.color} />
                  <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </GlassCard>
        </MotiView>
      )}

      {/* Map canvas */}
      <View style={[styles.mapContainer, { margin: Spacing.md, marginTop: Spacing.sm }]}>
        {!connectedId ? (
          <EmptyStatePanel
            icon="map-outline"
            title="Device not connected"
            body="Connect a SkyWatch wearable to start recording your GPS track in real time."
          />
        ) : (
          <View style={[styles.mapCanvas, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TrackMap track={track} width={mapWidth - 2} height={380} colors={colors} />

            {/* Legend */}
            <View style={[styles.legend, { backgroundColor: colors.overlay }]}>
              {Object.entries(STATUS_COLORS).slice(0, 3).map(([status, color]) => (
                <View key={status} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {status.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Coordinates */}
      {lastPoint && (
        <View style={[styles.coordsBar, { marginHorizontal: Spacing.md }]}>
          <Ionicons name="location" size={11} color={colors.primary} />
          <Text style={[styles.coordsText, { color: colors.textMuted }]}>
            {lastPoint.lat.toFixed(5)}°  {lastPoint.lon.toFixed(5)}°
            {lastPoint.altM !== null ? `  ·  ${Math.round(lastPoint.altM)} m` : ''}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    pageIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    pageSubtitle: { fontSize: Typography.xs, color: colors.textMuted },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    statusText: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1 },

    statsStrip: { marginBottom: Spacing.sm },
    statsCard: {
      flexDirection: 'row',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 3 },
    statsDivider: { width: 1, alignSelf: 'stretch', marginVertical: 6 },
    statValue: { fontSize: Typography.xs, fontWeight: Typography.bold, fontFamily: 'monospace' },
    statLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.7 },

    mapContainer: { flex: 1 },
    mapCanvas: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    legend: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      flexDirection: 'column',
      gap: 4,
      padding: 8,
      borderRadius: Radius.sm,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 9, textTransform: 'capitalize' },

    coordsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingBottom: Spacing.xs,
    },
    coordsText: { fontSize: 10, fontFamily: 'monospace' },
  })
}

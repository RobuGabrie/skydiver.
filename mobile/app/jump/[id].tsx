import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import * as SharingLib from 'expo-sharing'
import { Paths, File as EFile } from 'expo-file-system'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { useTheme } from '../../lib/ThemeContext'
import { getJump, getJumpSamples, exportJumpJson, type JumpSummary, type JumpSample } from '../../lib/jumpRecorder'
import { CockpitBackground } from '../../components/cockpit/CockpitBackground'
import { GlassCard } from '../../components/cockpit/GlassCard'
import { AppColors, Typography, Spacing, Radius } from '../../lib/theme'
import { formatDuration } from '../../lib/timeUtils'

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Mini sparkline for detail charts
function MiniChart({
  data,
  color,
  width,
  height,
  label,
  unit,
  colors,
}: {
  data: number[]
  color: string
  width: number
  height: number
  label: string
  unit: string
  colors: AppColors
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: Typography.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ fontSize: Typography.xs, color, fontFamily: 'monospace', fontWeight: Typography.bold }}>
          {data[data.length - 1].toFixed(0)} {unit}
        </Text>
      </View>
      <Svg width={width} height={height}>
        <Polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

// GPS Track SVG visualization (relative position)
function GpsTrack({
  samples,
  width,
  height,
  colors,
}: {
  samples: JumpSample[]
  width: number
  height: number
  colors: AppColors
}) {
  const gps = samples.filter(s => s.lat !== null && s.lon !== null)
  if (gps.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted, fontSize: Typography.xs }}>No GPS data for this jump</Text>
      </View>
    )
  }

  const lats = gps.map(s => s.lat!)
  const lons = gps.map(s => s.lon!)
  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)
  const lonMin = Math.min(...lons)
  const lonMax = Math.max(...lons)
  const pad = 20
  const latRange = latMax - latMin || 0.001
  const lonRange = lonMax - lonMin || 0.001
  const scale = Math.min((width - pad * 2) / lonRange, (height - pad * 2) / latRange)

  function proj(lat: number, lon: number) {
    return {
      x: pad + (lon - lonMin) * scale,
      y: height - pad - (lat - latMin) * scale,
    }
  }

  const alts = gps.map(s => s.altM ?? 0)
  const altMin = Math.min(...alts)
  const altMax = Math.max(...alts) - altMin || 1

  // Colour each segment by altitude (blue high → red low)
  const segments: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
  for (let i = 1; i < gps.length; i++) {
    const a = proj(gps[i - 1].lat!, gps[i - 1].lon!)
    const b = proj(gps[i].lat!, gps[i].lon!)
    const t = (gps[i].altM ?? 0 - altMin) / altMax
    const r = Math.round(55 + (1 - t) * 200)
    const g = Math.round(100 + t * 100)
    const bl = Math.round(150 + t * 105)
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: `rgb(${r},${g},${bl})` })
  }

  const start = proj(gps[0].lat!, gps[0].lon!)
  const end   = proj(gps[gps.length - 1].lat!, gps[gps.length - 1].lon!)

  return (
    <Svg width={width} height={height}>
      {segments.map((s, i) => (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={2} />
      ))}
      <Circle cx={start.x} cy={start.y} r={5} fill={colors.primary} />
      <SvgText x={start.x + 7} y={start.y + 4} fontSize={9} fill={colors.primary}>EXIT</SvgText>
      <Circle cx={end.x} cy={end.y} r={5} fill={colors.danger} />
      <SvgText x={end.x + 7} y={end.y + 4} fontSize={9} fill={colors.danger}>LAND</SvgText>
    </Svg>
  )
}

function StatRow({ label, value, color, colors }: { label: string; value: string; color: string; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: colors.textMuted, fontSize: Typography.sm }}>{label}</Text>
      <Text style={{ color, fontSize: Typography.sm, fontWeight: Typography.semibold, fontFamily: 'monospace' }}>{value}</Text>
    </View>
  )
}

export default function JumpDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const { width: screenWidth } = useWindowDimensions()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const chartWidth = screenWidth - Spacing.md * 4

  const [jump, setJump] = useState<JumpSummary | null>(null)
  const [samples, setSamples] = useState<JumpSample[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getJump(id), getJumpSamples(id)]).then(([j, s]) => {
      setJump(j)
      setSamples(s)
    }).finally(() => setLoading(false))
  }, [id])

  async function handleExport() {
    if (!jump) return
    const json = exportJumpJson(jump, samples)
    const filename = `jump-${jump.id}.json`
    try {
      const file = new EFile(Paths.cache, filename)
      file.write(json)
      const canShare = await SharingLib.isAvailableAsync()
      if (canShare) {
        await SharingLib.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Jump Data' })
      } else {
        Share.share({ message: json, title: filename })
      }
    } catch {
      Share.share({ message: json, title: filename })
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CockpitBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Loading…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!jump) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <CockpitBackground />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.danger }}>Jump not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const altData    = samples.map(s => s.altM ?? 0)
  const bpmData    = samples.map(s => s.bpm)
  const spo2Data   = samples.map(s => s.spo2)
  const stressData = samples.map(s => s.stress)
  const gforceData = samples.map(s => s.gForce)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CockpitBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Jump Detail</Text>
            <Text style={styles.pageSubtitle}>{formatDate(jump.startedAt)}</Text>
          </View>
          <Pressable onPress={handleExport} style={[styles.exportBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
            <Ionicons name="share-outline" size={16} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary }]}>Export</Text>
          </Pressable>
        </View>

        {/* Hero stats */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: colors.primary }]}>{Math.round(jump.maxAltM)}</Text>
              <Text style={[styles.heroUnit, { color: colors.textMuted }]}>m alt</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: colors.stress }]}>{jump.maxVSpeedMs.toFixed(1)}</Text>
              <Text style={[styles.heroUnit, { color: colors.textMuted }]}>m/s</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{formatDuration(jump.durationMs)}</Text>
              <Text style={[styles.heroUnit, { color: colors.textMuted }]}>duration</Text>
            </View>
          </View>
        </GlassCard>

        {/* Altitude timeline */}
        {altData.length >= 2 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Altitude Profile</Text>
            <MiniChart data={altData} color={colors.primary} width={chartWidth} height={80} label="Altitude" unit="m" colors={colors} />
          </GlassCard>
        )}

        {/* GPS Track */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>GPS Track</Text>
          <GpsTrack samples={samples} width={chartWidth} height={220} colors={colors} />
        </GlassCard>

        {/* Biometrics charts */}
        {bpmData.length >= 2 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Biometrics Timeline</Text>
            <View style={{ gap: Spacing.md }}>
              <MiniChart data={bpmData}    color={colors.heartRate}   width={chartWidth} height={50} label="Heart Rate" unit="bpm"   colors={colors} />
              <MiniChart data={spo2Data}   color={colors.oxygen}      width={chartWidth} height={50} label="SpO₂"       unit="%"     colors={colors} />
              <MiniChart data={stressData} color={colors.stress}      width={chartWidth} height={50} label="Stress"     unit="%"     colors={colors} />
              <MiniChart data={gforceData} color={colors.warning}     width={chartWidth} height={50} label="G-Force"    unit="g"     colors={colors} />
            </View>
          </GlassCard>
        )}

        {/* Summary table */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Jump Summary</Text>
          <StatRow label="Max Altitude"     value={`${Math.round(jump.maxAltM)} m`}             color={colors.primary}   colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Peak Descent"     value={`${jump.maxVSpeedMs.toFixed(1)} m/s`}        color={colors.stress}    colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Max G-Force"      value={`${jump.maxGForce.toFixed(2)} g`}            color={colors.warning}   colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Peak Heart Rate"  value={`${Math.round(jump.peakBpm)} bpm`}           color={colors.heartRate} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Min SpO₂"         value={`${Math.round(jump.minSpo2)}%`}              color={jump.minSpo2 < 93 ? colors.danger : colors.oxygen} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Peak Stress"      value={`${Math.round(jump.peakStress)}%`}           color={colors.stress}    colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Duration"         value={formatDuration(jump.durationMs)}             color={colors.textPrimary} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderMuted }]} />
          <StatRow label="Samples"          value={String(jump.sampleCount)}                   color={colors.textMuted}  colors={colors} />
        </GlassCard>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: Spacing.md },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: Spacing.lg,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
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
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    exportText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    heroCard: { marginBottom: Spacing.md, padding: Spacing.md },
    heroRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    heroStat: { flex: 1, alignItems: 'center', gap: 2 },
    heroValue: { fontSize: Typography.xl, fontWeight: Typography.bold, fontFamily: 'monospace' },
    heroUnit: { fontSize: Typography.xs },
    heroDivider: { width: 1, height: 40, alignSelf: 'center' },

    section: {
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      color: colors.textMuted,
      marginBottom: 4,
    },
    divider: { height: 1 },
  })
}

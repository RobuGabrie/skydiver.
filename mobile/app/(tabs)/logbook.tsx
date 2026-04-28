import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTheme } from '../../lib/ThemeContext'
import { listJumps, type JumpSummary } from '../../lib/jumpRecorder'
import { CockpitBackground } from '../../components/cockpit/CockpitBackground'
import { GlassCard } from '../../components/cockpit/GlassCard'
import { EmptyStatePanel } from '../../components/cockpit/EmptyStatePanel'
import { SectionHeader } from '../../components/cockpit/SectionHeader'
import { AppColors, Typography, Spacing, Radius } from '../../lib/theme'
import { formatDuration } from '../../lib/timeUtils'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayLabel(dayKey: string) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const todayKey = today.toDateString()
  const yesterdayKey = yesterday.toDateString()

  if (dayKey === todayKey) return 'Today'
  if (dayKey === yesterdayKey) return 'Yesterday'
  return new Date(dayKey).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function metricChip({
  label,
  value,
  color,
  colors,
  styles,
}: {
  label: string
  value: string
  color: string
  colors: AppColors
  styles: ReturnType<typeof makeStyles>
}) {
  return (
    <View style={[styles.metricChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}> 
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  )
}

function JumpCard({ jump, colors, styles }: { jump: JumpSummary; colors: AppColors; styles: ReturnType<typeof makeStyles> }) {
  const startLabel = formatTime(jump.startedAt)
  const finishLabel = jump.endedAt ? formatTime(jump.endedAt) : 'In progress'

  return (
    <Pressable
      onPress={() => router.push(`/jump/${jump.id}`)}
      style={({ pressed }) => [
        styles.jumpCard,
        { borderColor: colors.border, backgroundColor: colors.surfaceGlass, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {/* left accent strip */}
      <View style={[styles.jumpAccentBar, { backgroundColor: colors.primary }]} />

      <View style={styles.jumpCardInner}>
        {/* Header */}
        <View style={styles.jumpCardTop}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={[styles.jumpTitle, { color: colors.textPrimary }]}>
                Jump #{jump.id.slice(-4).toUpperCase()}
              </Text>
              {!jump.endedAt && (
                <View style={[styles.livePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={[styles.jumpSubtitle, { color: colors.textMuted }]}>
              {formatDate(jump.startedAt)} · {startLabel}–{finishLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        {/* Metrics 2×2 grid */}
        <View style={styles.metricGrid}>
          <View style={styles.metricGridRow}>
            {metricChip({ label: 'Max Alt', value: `${Math.round(jump.maxAltM)} m`, color: colors.primary, colors, styles })}
            {metricChip({ label: 'V-Speed', value: `${jump.maxVSpeedMs.toFixed(1)} m/s`, color: colors.stress, colors, styles })}
          </View>
          <View style={styles.metricGridRow}>
            {metricChip({ label: 'Peak HR', value: `${Math.round(jump.peakBpm)} bpm`, color: colors.heartRate, colors, styles })}
            {metricChip({ label: 'Min SpO₂', value: `${Math.round(jump.minSpo2)}%`, color: jump.minSpo2 < 93 ? colors.danger : colors.oxygen, colors, styles })}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.durationValue, { color: colors.textSecondary }]}>
            {formatDuration(jump.durationMs)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

export default function LogbookScreen() {
  const { colors } = useTheme()
  const [jumps, setJumps] = useState<JumpSummary[]>([])
  const [loading, setLoading] = useState(true)
  const stylesMemo = useMemo(() => makeStyles(colors), [colors])

  useEffect(() => {
    listJumps()
      .then(setJumps)
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, JumpSummary[]>()
    for (const jump of jumps) {
      const key = new Date(jump.startedAt).toDateString()
      const existing = map.get(key) ?? []
      existing.push(jump)
      map.set(key, existing)
    }
    return Array.from(map.entries())
  }, [jumps])

  const totalDuration = jumps.reduce((sum, jump) => sum + jump.durationMs, 0)
  const bestAltitude = jumps.reduce((max, jump) => Math.max(max, jump.maxAltM), 0)
  const avgSamples = jumps.length > 0
    ? Math.round(jumps.reduce((sum, jump) => sum + jump.sampleCount, 0) / jumps.length)
    : 0

  return (
    <SafeAreaView style={stylesMemo.safe} edges={['top']}>
      <CockpitBackground />
      <ScrollView style={stylesMemo.scroll} contentContainerStyle={stylesMemo.content} showsVerticalScrollIndicator={false}>
        <View style={stylesMemo.header}>
          <View style={[stylesMemo.headerIcon, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}> 
            <Ionicons name="book-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={stylesMemo.title}>Logbook</Text>
            <Text style={stylesMemo.subtitle}>{jumps.length} jumps recorded</Text>
          </View>
          <Pressable
            onPress={() => router.push('/connect')}
            style={[stylesMemo.linkButton, { borderColor: colors.border, backgroundColor: colors.surfaceRaised }]}
          >
            <Text style={[stylesMemo.linkButtonText, { color: colors.textSecondary }]}>Device</Text>
          </Pressable>
        </View>

        <GlassCard style={stylesMemo.summaryCard}>
          <View style={stylesMemo.summaryGrid}>
            <View style={stylesMemo.summaryItem}>
              <Ionicons name="paper-plane-outline" size={14} color={colors.primary} style={{ marginBottom: 4 }} />
              <Text style={[stylesMemo.summaryValue, { color: colors.primary }]}>{jumps.length}</Text>
              <Text style={[stylesMemo.summaryLabel, { color: colors.textMuted }]}>Jumps</Text>
            </View>
            <View style={stylesMemo.summaryDivider} />
            <View style={stylesMemo.summaryItem}>
              <Ionicons name="time-outline" size={14} color={colors.stress} style={{ marginBottom: 4 }} />
              <Text style={[stylesMemo.summaryValue, { color: colors.stress }]}>{formatDuration(totalDuration)}</Text>
              <Text style={[stylesMemo.summaryLabel, { color: colors.textMuted }]}>Total time</Text>
            </View>
            <View style={stylesMemo.summaryDivider} />
            <View style={stylesMemo.summaryItem}>
              <Ionicons name="trending-up-outline" size={14} color={colors.warning} style={{ marginBottom: 4 }} />
              <Text style={[stylesMemo.summaryValue, { color: colors.warning }]}>{Math.round(bestAltitude)} m</Text>
              <Text style={[stylesMemo.summaryLabel, { color: colors.textMuted }]}>Best altitude</Text>
            </View>
          </View>
          <View style={stylesMemo.summaryFooter}>
            <View style={[stylesMemo.summaryPill, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '30' }]}> 
              <Text style={[stylesMemo.summaryPillText, { color: colors.primary }]}>{avgSamples} avg samples</Text>
            </View>
            <View style={[stylesMemo.summaryPill, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}> 
              <Text style={[stylesMemo.summaryPillText, { color: colors.textMuted }]}>Grouped by day</Text>
            </View>
          </View>
        </GlassCard>

        {loading ? (
          <View style={stylesMemo.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[stylesMemo.loadingText, { color: colors.textMuted }]}>Loading logbook…</Text>
          </View>
        ) : jumps.length === 0 ? (
          <EmptyStatePanel
            icon="document-text-outline"
            title="No jumps yet"
            body="Start recording a session and your flight history will appear here as grouped cards."
          />
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {grouped.map(([dayKey, dayJumps]) => (
              <View key={dayKey} style={{ gap: Spacing.sm }}>
                <SectionHeader title={dayLabel(dayKey)} hint={`${dayJumps.length} session${dayJumps.length === 1 ? '' : 's'}`} />
                <View style={{ gap: Spacing.sm }}>
                  {dayJumps.map(jump => (
                    <JumpCard key={jump.id} jump={jump} colors={colors} styles={stylesMemo} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

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
      marginBottom: Spacing.md,
    },
    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: Typography.xs,
      color: colors.textMuted,
    },
    linkButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radius.md,
      borderWidth: 1,
    },
    linkButtonText: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
    },

    summaryCard: {
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    summaryGrid: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    summaryDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.border,
      opacity: 0.8,
    },
    summaryValue: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
    },
    summaryLabel: {
      fontSize: Typography.xs,
    },
    summaryFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    summaryPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    summaryPillText: {
      fontSize: Typography.xs,
      fontWeight: Typography.medium,
    },

    loadingWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
      gap: Spacing.sm,
    },
    loadingText: {
      fontSize: Typography.sm,
    },

    jumpCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      flexDirection: 'row',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(3, 15, 12, 0.08)',
    },
    jumpAccentBar: {
      width: 3,
      alignSelf: 'stretch',
    },
    jumpCardInner: {
      flex: 1,
      padding: Spacing.md,
      gap: 10,
    },
    jumpCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    jumpTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      letterSpacing: -0.2,
    },
    jumpSubtitle: {
      fontSize: Typography.xs,
      marginTop: 2,
      lineHeight: Typography.xs * 1.4,
    },
    metricGrid: {
      gap: 6,
    },
    metricGridRow: {
      flexDirection: 'row',
      gap: 6,
    },
    metricChip: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: Radius.md,
      borderWidth: 1,
      gap: 2,
    },
    livePill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    liveText: {
      fontSize: 9,
      fontWeight: Typography.bold,
      letterSpacing: 0.8,
    },
    metricLabel: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      fontFamily: Typography.mono,
      fontVariant: ['tabular-nums'],
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    durationValue: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      fontFamily: Typography.mono,
    },
  })
}
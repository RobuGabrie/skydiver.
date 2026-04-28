import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../lib/ThemeContext'
import { Typography, Spacing, Radius } from '../../lib/theme'

export function SectionHeader({
  title,
  hint,
}: {
  title: string
  hint?: string
}) {
  const { colors } = useTheme()

  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <View style={[styles.accentBar, { backgroundColor: colors.borderMuted }]} />
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      {hint ? (
        <View style={[styles.hintChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}> 
          <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentBar: {
    width: 3,
    height: 14,
    borderRadius: Radius.full,
    opacity: 0.75,
  },
  title: {
    fontSize: Typography.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: Typography.bold,
  },
  hintChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  hint: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
})

import React, { useMemo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../lib/ThemeContext'
import { AppColors, Typography, Spacing, Radius, TouchTarget } from '../lib/theme'
import { AlertItem } from '../lib/types'
import { formatDistanceToNow } from '../lib/timeUtils'

interface Props {
  alert: AlertItem
  onDismiss: (id: string) => void
}

function getTypeConfig(type: AlertItem['type'], colors: AppColors) {
  return {
    danger:  { bg: colors.dangerDim,  border: colors.danger + '55',  text: colors.danger,  icon: 'alert-circle' as const },
    warning: { bg: colors.warningDim, border: colors.warning + '55', text: colors.warning, icon: 'warning' as const },
    info:    { bg: colors.infoDim,    border: colors.primary + '55', text: colors.primary, icon: 'information-circle' as const },
  }[type]
}

export function AlertBanner({ alert, onDismiss }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const cfg = getTypeConfig(alert.type, colors)

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[styles.stripe, { backgroundColor: cfg.text }]} />
      <View style={[styles.iconWrap, { backgroundColor: cfg.text + '18' }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.text} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: cfg.text }]}>{alert.title}</Text>
        <Text style={styles.message}>{alert.body}</Text>
        <Text style={styles.time}>{formatDistanceToNow(alert.timestamp)}</Text>
      </View>
      <Pressable
        onPress={() => onDismiss(alert.id)}
        style={styles.dismiss}
        accessibilityLabel="Dismiss alert"
        hitSlop={12}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.lg,
      borderWidth: 1,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
      boxShadow: '0 10px 24px rgba(2, 10, 22, 0.18)',
    },
    stripe: {
      width: 4,
      alignSelf: 'stretch',
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
      flexShrink: 0,
    },
    body: {
      flex: 1,
      gap: 3,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    title: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
    },
    message: {
      fontSize: Typography.sm,
      color: colors.textSecondary,
      lineHeight: Typography.sm * 1.5,
    },
    time: {
      fontSize: Typography.xs,
      color: colors.textMuted,
    },
    dismiss: {
      width: TouchTarget,
      height: TouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  })
}

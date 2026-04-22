// Accent colors — identical in light and dark modes (iOS system palette)
const Accents = {
  primary:     '#007AFF',
  success:     '#34C759',
  warning:     '#FF9F0A',
  danger:      '#FF3B30',
  heartRate:   '#FF3B30',
  oxygen:      '#007AFF',
  stress:      '#BF5AF2',
  temperature: '#FF9F0A',
  battery:     '#34C759',
  wifi:        '#007AFF',
  ble:         '#BF5AF2',
  offline:     '#8E8E93',
} as const

export const DarkColors = {
  background:    '#000000',
  surface:       '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  border:        '#38383A',
  borderMuted:   '#2C2C2E',
  textPrimary:   '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted:     '#636366',
  primaryDim:    '#001D45',
  dangerDim:     '#3A0000',
  warningDim:    '#2A1800',
  infoDim:       '#001835',
  ...Accents,
} as const

export const LightColors = {
  background:    '#F2F2F7',
  surface:       '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border:        '#C6C6C8',
  borderMuted:   '#E5E5EA',
  textPrimary:   '#000000',
  textSecondary: '#3C3C43',
  textMuted:     '#8E8E93',
  primaryDim:    '#E3F0FF',
  dangerDim:     '#FFF0EF',
  warningDim:    '#FFF7E6',
  infoDim:       '#EAF2FF',
  ...Accents,
} as const

export type AppColors = typeof DarkColors

// Backward compatibility — defaults to dark
export const Colors = DarkColors

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const

export const Radius = {
  sm:  6,
  md:  12,
  lg:  16,
  xl:  24,
  full: 9999,
} as const

export const Typography = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  32,
  hero: 48,

  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  mono:      'monospace' as const,
} as const

export const TouchTarget = 44

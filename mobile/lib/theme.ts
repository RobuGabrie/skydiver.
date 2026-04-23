const Accents = {
  primary:     '#00E5FF',
  success:     '#00E676',
  warning:     '#FFB300',
  danger:      '#FF3B30',
  heartRate:   '#FF4D6A',
  oxygen:      '#00E5FF',
  stress:      '#BF5AF2',
  temperature: '#FFB300',
  battery:     '#00E676',
  wifi:        '#00BFFF',
  ble:         '#00E5FF',
  offline:     '#4A5568',
} as const

export const DarkColors = {
  background:    '#060D14',
  surface:       '#0C1521',
  surfaceRaised: '#111D2C',
  border:        '#1A2D42',
  borderMuted:   '#0E1A28',
  textPrimary:   '#E8F4FD',
  textSecondary: '#7BA8C8',
  textMuted:     '#3A5A78',
  primaryDim:    '#00131F',
  dangerDim:     '#160404',
  warningDim:    '#160D00',
  infoDim:       '#00131F',
  ...Accents,
} as const

export const LightColors = {
  background:    '#EEF4F9',
  surface:       '#FFFFFF',
  surfaceRaised: '#F8FBFF',
  border:        '#C0D4E8',
  borderMuted:   '#DCE9F5',
  textPrimary:   '#0A1628',
  textSecondary: '#2A4A6A',
  textMuted:     '#5A7A9A',
  primaryDim:    '#E0FAFF',
  dangerDim:     '#FFF0EF',
  warningDim:    '#FFF8E1',
  infoDim:       '#E0FAFF',
  ...Accents,
} as const

export type AppColors = typeof DarkColors

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
  hero: 52,

  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  mono:      'monospace' as const,
} as const

export const TouchTarget = 44

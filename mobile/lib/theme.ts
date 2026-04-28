const Accents = {
  primary: '#15B8A6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  heartRate: '#FB7185',
  oxygen: '#2DD4BF',
  stress: '#F97316',
  temperature: '#FB923C',
  battery: '#84CC16',
  wifi: '#0EA5E9',
  ble: '#22C55E',
  offline: '#64748B',
} as const

export const DarkColors = {
  background: '#04120F',
  surface: '#0A1B17',
  surfaceRaised: '#102722',
  border: '#1D3B34',
  borderMuted: '#17312B',
  textPrimary: '#E7FFF9',
  textSecondary: '#B6E5DB',
  textMuted: '#79A9A0',
  primaryDim: '#123B34',
  dangerDim: '#32131B',
  warningDim: '#38280B',
  infoDim: '#102D33',
  surfaceGlass: 'rgba(15, 40, 35, 0.78)',
  surfaceGlassStrong: 'rgba(10, 31, 27, 0.94)',
  overlay: 'rgba(2, 15, 12, 0.74)',
  ...Accents,
} as const

export const LightColors = {
  background: '#F4FBF9',
  surface: '#FFFFFF',
  surfaceRaised: '#ECF7F3',
  border: '#CDE6DF',
  borderMuted: '#DBECE7',
  textPrimary: '#0C2520',
  textSecondary: '#295249',
  textMuted: '#51766F',
  primaryDim: '#D6F4EE',
  dangerDim: '#FFF1F4',
  warningDim: '#FFF7E7',
  infoDim: '#E8F8F5',
  surfaceGlass: 'rgba(255, 255, 255, 0.9)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.98)',
  overlay: 'rgba(7, 36, 30, 0.08)',
  ...Accents,
} as const

export type AppColors = typeof DarkColors | typeof LightColors

export const Colors = DarkColors

export const Spacing = {
  xxs: 2,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
  xxl: 48,
  xxxl: 72,
} as const

export const Radius = {
  xs: 4,
  sm: 10,
  md: 14,
  lg: 22,
  xl: 30,
  full: 9999,
} as const

export const Typography = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 20,
  lg: 24,
  xl: 30,
  xxl: 36,
  hero: 60,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heading: 'System' as const,
  body: 'System' as const,
  mono:      'monospace' as const,
} as const

export const TouchTarget = 44

export const Motion = {
  micro: 160,
  standard: 240,
  emphasis: 320,
} as const

export const Elevation = {
  card: '0 10px 24px rgba(0, 0, 0, 0.16)',
  cardHover: '0 16px 32px rgba(0, 0, 0, 0.22)',
  floating: '0 20px 48px rgba(3, 10, 22, 0.36)',
} as const

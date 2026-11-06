// ─── Design Tokens for FocusOn ──────────────────────────────────────────────

export const Colors = {
  background: '#0D0D14',
  surface: '#16161F',
  surfaceElevated: '#1E1E2E',
  surfaceActive: '#252538',
  border: '#2A2A3D',
  borderLight: '#353550',

  accent: '#7C63FF',
  accentLight: '#9B85FF',
  accentDark: '#5A45E0',
  accentDim: 'rgba(124, 99, 255, 0.18)',
  accentGlow: 'rgba(124, 99, 255, 0.06)',

  success: '#4ADE80',
  successDim: 'rgba(74, 222, 128, 0.15)',

  danger: '#F87171',
  dangerDim: 'rgba(248, 113, 113, 0.15)',

  warning: '#FBBF24',
  warningDim: 'rgba(251, 191, 36, 0.15)',

  text: '#F0F0FF',
  textMuted: '#8B8FA8',
  textDim: '#4B4F6A',
  textDisabled: '#35364A',

  white: '#FFFFFF',
  overlay: 'rgba(13, 13, 20, 0.9)',
} as const;

export const PriorityConfig = {
  high: {
    label: 'Alta',
    color: Colors.danger,
    dimColor: Colors.dangerDim,
    emoji: '🔴',
  },
  medium: {
    label: 'Media',
    color: Colors.warning,
    dimColor: Colors.warningDim,
    emoji: '🟡',
  },
  low: {
    label: 'Baja',
    color: Colors.success,
    dimColor: Colors.successDim,
    emoji: '🟢',
  },
} as const;

export const CategoryConfig = {
  general: { label: 'General', icon: 'list-outline' as const },
  trabajo: { label: 'Trabajo', icon: 'briefcase-outline' as const },
  salud: { label: 'Salud', icon: 'heart-outline' as const },
  personal: { label: 'Personal', icon: 'person-outline' as const },
} as const;

export const RepeatOptions = [
  { label: 'Nunca', value: 0 },
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#7C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;

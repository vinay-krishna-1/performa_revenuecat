/**
 * PERFORMA High-Performance Precision Athletic Design System
 * Dark: Pure Pitch Black Canvas (#000000) + Neutral Studio Zinc + Precision Volt Accent (#CCFF00)
 * Light: Crisp Ice Canvas (#F8FAFC) + Deep Cobalt Foreground (#0A1128) + Electric Cobalt Accent (#0052FF)
 */

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  surfaceGlassElevated: string;
  surfaceGlassActive: string;
  glassBorder: string;
  glassBorderSubtle: string;
  glassBorderHighlight: string;
  surfaceBorder: string;
  surfaceBorderSubtle: string;
  divider: string;
  primary: string;
  primaryBright: string;
  primaryGlow: string;
  primaryMuted: string;
  accent: string;
  accentBright: string;
  accentGlow: string;
  accentMuted: string;
  warning: string;
  warningGlow: string;
  danger: string;
  dangerGlow: string;
  dangerMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  bronze: string;
  silver: string;
  gold: string;
  platinum: string;
  diamond: string;
  zenith: string;
}

export const DARK_COLORS: ThemeColors = {
  // Pure Pitch Black Minimalist Canvas (OLED infinite contrast, zero blue tint)
  background: '#000000',
  backgroundSecondary: '#08080A',

  // Architectural Flat Surfaces
  surface: '#0D0D10',
  surfaceElevated: '#141418',
  surfaceGlass: 'rgba(18, 18, 22, 0.70)',
  surfaceGlassElevated: 'rgba(24, 24, 30, 0.85)',
  surfaceGlassActive: 'rgba(32, 32, 40, 0.95)',
  
  // Studio Precision Hairlines
  glassBorder: 'rgba(255, 255, 255, 0.07)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.035)',
  glassBorderHighlight: 'rgba(255, 255, 255, 0.12)',
  surfaceBorder: 'rgba(255, 255, 255, 0.07)',
  surfaceBorderSubtle: 'rgba(255, 255, 255, 0.035)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // Stark Titanium White Primary
  primary: '#FFFFFF',
  primaryBright: '#FFFFFF',
  primaryGlow: 'rgba(255, 255, 255, 0.08)',
  primaryMuted: 'rgba(255, 255, 255, 0.06)',

  // Precision Athletic Volt
  accent: '#CCFF00',
  accentBright: '#DDFF33',
  accentGlow: 'rgba(204, 255, 0, 0.15)',
  accentMuted: 'rgba(204, 255, 0, 0.08)',

  // Alerts
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.12)',
  dangerMuted: 'rgba(239, 68, 68, 0.08)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#52525B',

  // Division Metals
  bronze: '#A86D48',
  silver: '#9CA3AF',
  gold: '#EAB308',
  platinum: '#38BDF8',
  diamond: '#818CF8',
  zenith: '#F43F5E',
};

export const LIGHT_COLORS: ThemeColors = {
  // Crisp Light Slate Canvas
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',

  // Flat Ceramic Surfaces
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  surfaceGlassElevated: 'rgba(241, 245, 249, 0.95)',
  surfaceGlassActive: 'rgba(226, 232, 240, 0.95)',
  
  // Precision Light Hairlines
  glassBorder: 'rgba(15, 23, 42, 0.08)',
  glassBorderSubtle: 'rgba(15, 23, 42, 0.04)',
  glassBorderHighlight: 'rgba(0, 82, 255, 0.18)',
  surfaceBorder: 'rgba(15, 23, 42, 0.08)',
  surfaceBorderSubtle: 'rgba(15, 23, 42, 0.04)',
  divider: 'rgba(15, 23, 42, 0.06)',

  // Electric Cobalt Blue Primary & Accent
  primary: '#0052FF',
  primaryBright: '#1A66FF',
  primaryGlow: 'rgba(0, 82, 255, 0.15)',
  primaryMuted: 'rgba(0, 82, 255, 0.08)',

  accent: '#0052FF',
  accentBright: '#0066FF',
  accentGlow: 'rgba(0, 82, 255, 0.18)',
  accentMuted: 'rgba(0, 82, 255, 0.08)',

  // Alerts
  warning: '#D97706',
  warningGlow: 'rgba(217, 119, 6, 0.12)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.12)',
  dangerMuted: 'rgba(239, 68, 68, 0.08)',

  // Blue / Slate Foreground Typography
  textPrimary: '#0A1128', // Deep Midnight Cobalt
  textSecondary: '#334155', // Slate
  textMuted: '#64748B', // Cool Slate

  // Division Metals (Refined for light canvas)
  bronze: '#9A3412',
  silver: '#475569',
  gold: '#D97706',
  platinum: '#0284C7',
  diamond: '#4F46E5',
  zenith: '#E11D48',
};

// Default fallback export
export const COLORS = DARK_COLORS;

export const TYPOGRAPHY = {
  metricHero: {
    fontSize: 54,
    fontWeight: '800' as const,
    letterSpacing: -2.0,
  },
  metricLarge: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
  },
  metricMedium: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  metricSmall: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const SHADOWS = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  glowAccent: {
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  glowPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

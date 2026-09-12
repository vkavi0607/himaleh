/**
 * HIMALEH OFFICIAL BRAND IDENTITY & DESIGN TOKENS
 * Derived directly from the official Himaleh Mountain Summit Logo.
 * 
 * Brand Colors extracted from the source of truth:
 * - Summit Golden Trail: #D97706, #F59E0B, #B45309 (The winding path of daily progress)
 * - Crimson Summit Flag: #DC2626, #EF4444, #B91C1C (Victory, pinnacle achievement, target reached)
 * - Obsidian Slate Rock: #0F172A, #111827, #1E293B (Grounding, peak shadows, resilience)
 * - Alpine Snow Facets: #FFFFFF, #F8FAFC, #E2E8F0 (Clarity, focus, pristine execution)
 */

/**
 * HIMALEH OFFICIAL BRAND IDENTITY & DESIGN TOKENS
 * Derived directly from the official Himaleh Mountain Summit Logo.
 * 
 * Centralized Design Token System supporting seamless, real-time Light and Dark themes.
 */

export interface HimalehThemeTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  primaryMuted: string;
  success: string;
  warning: string;
  error: string;
  accountability: string;
  inputBackground: string;
  navigationBackground: string;
  statusBarBackground: string;
  statusBarText: string;
}

/**
 * Premium, clean Himaleh Light Theme:
 * - warm / refined off-white background
 * - white elevated cards
 * - refined indigo/violet primary
 * - subtle borders
 * - dark readable typography
 * - controlled success/warning/error colors
 */
export const lightThemeTokens: HimalehThemeTokens = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSecondary: '#F1F3F5',
  border: '#E2E8F0',
  borderSubtle: '#EDF2F7',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5', // Refined indigo
  primaryPressed: '#4338CA',
  primaryMuted: '#EEF2FF',
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  error: '#EF4444', // Rose
  accountability: '#DC2626', // Summit Red
  inputBackground: '#F8FAFC',
  navigationBackground: 'rgba(255, 255, 255, 0.94)',
  statusBarBackground: '#F8F9FA',
  statusBarText: '#0F172A',
};

/**
 * Premium cinematic Himaleh Dark Theme:
 * - deep navy/charcoal background
 * - layered dark surfaces (no harsh pure-black everywhere)
 * - refined indigo/violet primary
 * - subtle borders
 * - readable white/light typography
 * - controlled accent glow
 */
export const darkThemeTokens: HimalehThemeTokens = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  surfaceSecondary: '#161F30',
  border: '#1E293B',
  borderSubtle: '#172033',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1', // Refined violet/indigo
  primaryPressed: '#4F46E5',
  primaryMuted: 'rgba(99, 102, 241, 0.15)',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  accountability: '#EF4444',
  inputBackground: '#0D1424',
  navigationBackground: 'rgba(17, 24, 39, 0.94)',
  statusBarBackground: '#0B0F19',
  statusBarText: '#F8FAFC',
};

export const getThemeTokens = (isDark: boolean): HimalehThemeTokens => {
  return isDark ? darkThemeTokens : lightThemeTokens;
};

export const brandTokens = {
  // Brand Archetype
  name: 'Himaleh',
  tagline: 'Track • Improve • Achieve',
  motto: 'Consistency & Goal Engine',

  // Core Brand Colors
  colors: {
    // Primary - The Golden Trail of Consistency
    primary: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706', // Primary Trail Gold
      700: '#B45309', // Dark Golden Sand
      800: '#92400E',
      900: '#78350F',
    },

    // Accent - The Red Summit Flag of Achievement
    summitFlag: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444',
      600: '#DC2626', // Flag Red
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },

    // Obsidian Rock & Mountain Shadow
    obsidian: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#0B1120',
    },

    // Alpine Snow Highlights
    snow: {
      pure: '#FFFFFF',
      tint: '#F8FAFC',
      frost: '#F1F5F9',
      glacier: '#E2E8F0',
    },

    // Semantic States
    success: '#10B981', // Emerald summit completion
    warning: '#F59E0B', // Golden trail caution
    accountability: '#DC2626', // Genuine overdue notice (summit flag red)
    info: '#0284C7',
  },

  // Surfaces and Containers
  surfaces: {
    light: lightThemeTokens,
    dark: darkThemeTokens,
  },

  // Typography Settings
  typography: {
    fontDisplay: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    fontMono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
} as const;

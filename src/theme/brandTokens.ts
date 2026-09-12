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
    light: {
      canvas: '#F8FAFC',
      card: '#FFFFFF',
      elevated: '#FFFFFF',
      muted: '#F1F5F9',
      border: '#E2E8F0',
      borderHover: '#CBD5E1',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
    },
    dark: {
      canvas: '#0B1120',
      card: '#0F172A',
      elevated: '#1E293B',
      muted: '#131D31',
      border: '#1E293B',
      borderHover: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
    },
  },

  // Typography Settings
  typography: {
    fontDisplay: '"Plus Jakarta Sans", "Cinzel", Georgia, serif',
    fontBody: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    fontMono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
} as const;

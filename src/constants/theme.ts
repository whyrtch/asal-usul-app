/**
 * AsalUsul Design System — Theme Constants
 *
 * Inspired by shadcn/ui design philosophy (semantic tokens, consistent scale,
 * variant-driven components), adapted for React Native.
 *
 * All exports from the original theme are preserved for backward compatibility.
 *
 * ─── Token Categories ──────────────────────────────────────────────────────────
 * Colors       — Base light/dark theme + static brand palette
 * Spacing      — 4-point grid scale (4, 8, 16, 24, 32, 64)
 * Radii        — Border radius scale (sm=8, md=16, lg=24, pill=999)
 * Shadows      — Elevation presets (card, button, elevated)
 * Typography   — Font size & line-height scale (xs → 4xl)
 * Semantic UI  — shadcn-style token aliases (destructive, warning, success, info)
 */

import { Platform } from 'react-native';

// ============================================================================
// 1. COLOR PALETTE — Base light/dark theme (preserved from original)
// ============================================================================

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ============================================================================
// 2. BRAND PALETTE — Static AsalUsul heritage colors (preserved from original)
// ============================================================================

export const AsalUsulColors = {
  // Backgrounds
  backgroundWarm:    '#F5F0E8',
  backgroundCard:    '#FDFAF4',
  backgroundOverlay: '#EDE8DC',

  // Brand
  primary:           '#1B4332',
  primaryLight:      '#2D6A4F',
  primaryMuted:      '#52796F',

  // Text
  textHeading:       '#1A1A1A',
  textBody:          '#3D3D3D',
  textMuted:         '#8A8070',
  textOnPrimary:     '#FFFFFF',

  // Decorative
  goldAccent:        '#C9A84C',
  borderSubtle:      '#E0D9CC',

  // Semantic (new)
  destructive:       '#C0392B',
  destructiveLight:  '#FDECEA',
  success:           '#2D6A4F',
  warning:           '#C9A84C',
  info:              '#52796F',
} as const;

export type AsalUsulColor = keyof typeof AsalUsulColors;

// ============================================================================
// 3. TYPOGRAPHY SCALE — shadcn-inspired type ramp for RN
// ============================================================================

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const FontSize = {
  xs:    12,
  sm:    14,
  base:  15,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
  '5xl': 48,
} as const;

export const LineHeight = {
  xs:    16,
  sm:    20,
  base:  22,
  md:    24,
  lg:    28,
  xl:    30,
  '2xl': 32,
  '3xl': 36,
  '4xl': 44,
  '5xl': 52,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold: '600' as const,
  bold:    '700' as const,
};

export type FontSizeToken = keyof typeof FontSize;
export type LineHeightToken = keyof typeof LineHeight;

// ============================================================================
// 4. SPACING SCALE — 4-point grid (preserved from original, extended)
// ============================================================================

export const Spacing = {
  half: 2,
  one:  4,
  two:  8,
  three: 16,
  four: 24,
  five: 32,
  six:  64,
} as const;

export type SpacingToken = keyof typeof Spacing;

// ============================================================================
// 5. BORDER RADIUS SCALE (preserved from original)
// ============================================================================

export const Radii = {
  sm:   8,
  md:   16,
  lg:   24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof Radii;

// ============================================================================
// 6. SHADOW ELEVATION PRESETS (preserved from original)
// ============================================================================

export const Shadows = {
  card: {
    shadowColor:   '#1B4332',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     6,
  },
  button: {
    shadowColor:   '#1B4332',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius:  16,
    elevation:     8,
  },
  elevated: {
    shadowColor:   '#1B4332',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius:  20,
    elevation:     10,
  },
} as const;

export type ShadowToken = keyof typeof Shadows;

// ============================================================================
// 7. SEMANTIC UI TOKENS — shadcn-inspired alias map
// ============================================================================

/**
 * Semantic color tokens that map to specific UI roles.
 * These mirror the shadcn/ui approach of semantic naming so that
 * components can reference `colors.background` or `colors.destructive`
 * without caring about the specific hex value.
 */
export const SemanticColors = {
  // Background
  background:        AsalUsulColors.backgroundWarm,
  card:              AsalUsulColors.backgroundCard,
  elevated:          AsalUsulColors.backgroundCard,
  overlay:           AsalUsulColors.backgroundOverlay,

  // Foreground / Text
  foreground:        AsalUsulColors.textHeading,
  mutedForeground:   AsalUsulColors.textMuted,
  bodyForeground:    AsalUsulColors.textBody,

  // Brand
  primary:           AsalUsulColors.primary,
  primaryForeground: AsalUsulColors.textOnPrimary,
  primaryLight:      AsalUsulColors.primaryLight,
  primaryMuted:      AsalUsulColors.primaryMuted,

  // Semantic
  destructive:       AsalUsulColors.destructive,
  destructiveForeground: '#FFFFFF',
  destructiveLight:  AsalUsulColors.destructiveLight,
  success:           AsalUsulColors.success,
  successForeground: '#FFFFFF',
  warning:           AsalUsulColors.warning,
  warningForeground: '#1A1A1A',
  info:              AsalUsulColors.info,
  infoForeground:    '#FFFFFF',

  // Borders
  border:            AsalUsulColors.borderSubtle,
  input:             AsalUsulColors.borderSubtle,
  ring:              AsalUsulColors.primary,

  // Misc
  goldAccent:        AsalUsulColors.goldAccent,
} as const;

export type SemanticColor = keyof typeof SemanticColors;

// ============================================================================
// 8. LAYOUT CONSTANTS (preserved from original)
// ============================================================================

export const BottomTabInset = Platform.select({ ios: 90, android: 100 }) ?? 0;
export const MaxContentWidth = 800;

// ============================================================================
// 9. DERIVED STYLE HELPERS
// ============================================================================

/**
 * Button size presets matching shadcn/ui sizing convention.
 */
export const ButtonHeight = {
  sm: 40,
  default: 52,
  lg: 60,
} as const;

export const ButtonPadding = {
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  default: { paddingVertical: 16, paddingHorizontal: 24 },
  lg: { paddingVertical: 20, paddingHorizontal: 32 },
} as const;

export type ButtonSize = keyof typeof ButtonHeight;

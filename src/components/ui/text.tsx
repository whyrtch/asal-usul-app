/**
 * Text — Enhanced text primitive with shadcn-style semantic variants.
 *
 * Extends the existing ThemedText concept with additional type presets:
 *   - h1 / h2 / h3 (headings)
 *   - p (body)
 *   - small (caption)
 *   - label (form labels)
 *   - code (monospace)
 *   - muted (diminished emphasis)
 *
 * Uses theme tokens for all styling.
 */

import { Platform, StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { AsalUsulColors, FontSize, FontWeight, Fonts, LineHeight } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'small'
  | 'smallBold'
  | 'label'
  | 'muted'
  | 'link'
  | 'linkPrimary'
  | 'code';

export interface UITextProps extends TextProps {
  /** Typography variant — default: 'p' */
  variant?: TextVariant;
}

// ─── Variant style resolver ───────────────────────────────────────────────────

interface TextStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  color: string;
  fontFamily?: string;
}

function resolveVariant(variant: TextVariant): TextStyle {
  switch (variant) {
    case 'h1':
      return {
        fontSize: FontSize['5xl'],
        lineHeight: LineHeight['5xl'],
        fontWeight: FontWeight.bold,
        color: AsalUsulColors.textHeading,
      };
    case 'h2':
      return {
        fontSize: FontSize['4xl'],
        lineHeight: LineHeight['4xl'],
        fontWeight: FontWeight.bold,
        color: AsalUsulColors.textHeading,
      };
    case 'h3':
      return {
        fontSize: FontSize['2xl'],
        lineHeight: LineHeight['2xl'],
        fontWeight: FontWeight.semibold,
        color: AsalUsulColors.textHeading,
      };
    case 'p':
      return {
        fontSize: FontSize.base,
        lineHeight: LineHeight.base,
        fontWeight: FontWeight.regular,
        color: AsalUsulColors.textBody,
      };
    case 'small':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.medium,
        color: AsalUsulColors.textMuted,
      };
    case 'smallBold':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.bold,
        color: AsalUsulColors.textBody,
      };
    case 'label':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.semibold,
        color: AsalUsulColors.textBody,
      };
    case 'muted':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.regular,
        color: AsalUsulColors.textMuted,
      };
    case 'link':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.medium,
        color: AsalUsulColors.primaryMuted,
        ...Platform.select({ default: {}, web: { textDecorationLine: 'underline' as const } }),
      };
    case 'linkPrimary':
      return {
        fontSize: FontSize.sm,
        lineHeight: LineHeight.sm,
        fontWeight: FontWeight.medium,
        color: AsalUsulColors.primaryLight,
        ...Platform.select({ default: {}, web: { textDecorationLine: 'underline' as const } }),
      };
    case 'code':
      return {
        fontSize: FontSize.xs,
        lineHeight: LineHeight.xs,
        fontWeight: FontWeight.regular,
        color: AsalUsulColors.textBody,
        fontFamily: Fonts.mono,
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UIText({ variant = 'p', style, ...rest }: UITextProps) {
  const resolved = resolveVariant(variant);

  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize: resolved.fontSize,
          lineHeight: resolved.lineHeight,
          fontWeight: resolved.fontWeight,
          color: resolved.color,
        } as any,
        resolved.fontFamily ? { fontFamily: resolved.fontFamily } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    // Reset default RN text styles
  },
});

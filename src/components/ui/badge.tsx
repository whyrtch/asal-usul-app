/**
 * Badge — Inline status/label badge with semantic color variants.
 *
 * Variants:
 *   - default (muted overlay bg)
 *   - primary (brand green bg)
 *   - destructive (red for deletion warnings)
 *   - outline (transparent with border)
 *   - success (green for positive states)
 *   - warning (amber/gold for caution)
 */

import React from 'react';
import { StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { AsalUsulColors, FontSize, FontWeight, Radii } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'primary' | 'destructive' | 'outline' | 'success' | 'warning';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

// ─── Variant resolver ─────────────────────────────────────────────────────────

interface BadgeStyle {
  container: ViewStyle;
  text: { color: string };
}

function resolveVariant(variant: BadgeVariant): BadgeStyle {
  switch (variant) {
    case 'default':
      return {
        container: {
          backgroundColor: AsalUsulColors.backgroundOverlay,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: { color: AsalUsulColors.textBody },
      };
    case 'primary':
      return {
        container: {
          backgroundColor: AsalUsulColors.primary,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: { color: AsalUsulColors.textOnPrimary },
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: AsalUsulColors.destructiveLight,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: { color: AsalUsulColors.destructive },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: AsalUsulColors.borderSubtle,
          borderWidth: 1,
        },
        text: { color: AsalUsulColors.textBody },
      };
    case 'success':
      return {
        container: {
          backgroundColor: AsalUsulColors.primaryLight + '20',
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: { color: AsalUsulColors.primaryLight },
      };
    case 'warning':
      return {
        container: {
          backgroundColor: AsalUsulColors.goldAccent + '20',
          borderColor: 'transparent',
          borderWidth: 0,
        },
        text: { color: AsalUsulColors.textHeading },
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const resolved = resolveVariant(variant);

  return (
    <View style={[styles.badge, resolved.container, style]}>
      <Text style={[styles.text, resolved.text]}>{children}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xs * 1.5,
  },
});

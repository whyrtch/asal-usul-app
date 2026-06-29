/**
 * Separator — Thin visual divider line.
 *
 * shadcn-style separator adapted for React Native.
 * Orientation: horizontal (default) or vertical.
 */

import React from 'react';
import { StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AsalUsulColors } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  /** Color override — defaults to borderSubtle */
  color?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Separator({
  orientation = 'horizontal',
  style,
  color = AsalUsulColors.borderSubtle,
}: SeparatorProps) {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        { backgroundColor: color },
        style,
      ]}
      accessibilityRole="separator"
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});

/**
 * Chip — Selectable pill/chip component for option groups.
 *
 * Features:
 *   - Selected/unselected states
 *   - Pill shape with brand colors
 *   - Accessible as radio
 *   - Supports icon + label
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { AsalUsulColors, FontSize, FontWeight, Radii } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Optional leading icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Accessibility label (defaults to label) */
  accessibilityLabel?: string;
  /** Container style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  accessibilityLabel,
  style,
}: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && { opacity: 0.8 },
        style,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? AsalUsulColors.textOnPrimary : AsalUsulColors.textBody}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.pill,
    paddingVertical: 6,
    paddingHorizontal: SpacingDefault,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: AsalUsulColors.primary,
    borderColor: AsalUsulColors.primary,
  },
  chipUnselected: {
    backgroundColor: AsalUsulColors.backgroundWarm,
    borderColor: AsalUsulColors.borderSubtle,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * 1.4,
  },
  labelSelected: {
    color: AsalUsulColors.textOnPrimary,
  },
  labelUnselected: {
    color: AsalUsulColors.textBody,
  },
});

const SpacingDefault = 12;

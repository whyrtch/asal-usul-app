/**
 * Button — shadcn-style variant-based button primitive for React Native.
 *
 * Variants:
 *   - default (filled dark green)
 *   - outline (transparent bg, green border)
 *   - destructive (red for delete actions)
 *   - ghost (minimal, no bg/border)
 *   - link (text-only, underlined)
 *
 * Sizes: sm, default, lg
 *
 * Composes: Pressable + ActivityIndicator + text label
 * Accessibility: role="button", state tracking for disabled/busy
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { AsalUsulColors, ButtonHeight, ButtonPadding, FontSize, Radii, Shadows } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg';

export interface ButtonProps {
  /** Button label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant — default: 'default' */
  variant?: ButtonVariant;
  /** Size preset — default: 'default' */
  size?: ButtonSize;
  /** Show loading spinner instead of label */
  isLoading?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Optional icon (Ionicons name) placed before the label */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional icon (Ionicons name) placed after the label */
  iconEnd?: keyof typeof Ionicons.glyphMap;
  /** Additional style for the outer Pressable */
  style?: StyleProp<ViewStyle>;
  /** Test ID */
  testID?: string;
}

// ─── Variant resolver ─────────────────────────────────────────────────────────

interface VariantStyle {
  container: ViewStyle;
  label: { color: string };
  spinnerColor: string;
}

function resolveVariant(variant: ButtonVariant): VariantStyle {
  switch (variant) {
    case 'default':
      return {
        container: {
          backgroundColor: AsalUsulColors.primary,
          borderColor: 'transparent',
          borderWidth: 1.5,
          ...Shadows.button,
        },
        label: { color: AsalUsulColors.textOnPrimary },
        spinnerColor: AsalUsulColors.textOnPrimary,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: AsalUsulColors.primary,
          borderWidth: 1.5,
        },
        label: { color: AsalUsulColors.primary },
        spinnerColor: AsalUsulColors.primary,
      };
    case 'destructive':
      return {
        container: {
          backgroundColor: AsalUsulColors.destructive,
          borderColor: 'transparent',
          borderWidth: 1.5,
          ...Shadows.button,
        },
        label: { color: '#FFFFFF' },
        spinnerColor: '#FFFFFF',
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        },
        label: { color: AsalUsulColors.primary },
        spinnerColor: AsalUsulColors.primary,
      };
    case 'link':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          minHeight: undefined,
          paddingVertical: 4,
          paddingHorizontal: 0,
        },
        label: { color: AsalUsulColors.primary, textDecorationLine: 'underline' as const },
        spinnerColor: AsalUsulColors.primary,
      };
  }
}

function resolveSize(size: ButtonSize) {
  return {
    height: ButtonHeight[size],
    paddingVertical: ButtonPadding[size].paddingVertical,
    paddingHorizontal: ButtonPadding[size].paddingHorizontal,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled = false,
  icon,
  iconEnd,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const variantStyle = resolveVariant(variant);
  const sizeStyle = resolveSize(size);

  function handlePress() {
    if (isDisabled) return;
    onPress();
  }

  const iconColor = variant === 'outline' || variant === 'ghost' || variant === 'link'
    ? AsalUsulColors.primary
    : '#FFFFFF';

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variantStyle.spinnerColor} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 20}
              color={iconColor}
              style={styles.iconStart}
            />
          )}
          <Text
            style={[
              styles.label,
              variantStyle.label,
              size === 'sm' && styles.labelSm,
              size === 'lg' && styles.labelLg,
            ]}
          >
            {label}
          </Text>
          {iconEnd && (
            <Ionicons
              name={iconEnd}
              size={size === 'sm' ? 16 : 20}
              color={iconColor}
              style={styles.iconEnd}
            />
          )}
        </>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: '600',
    lineHeight: FontSize.base * 1.4,
    textAlign: 'center',
  },
  labelSm: {
    fontSize: FontSize.sm,
  },
  labelLg: {
    fontSize: FontSize.md,
  },
  iconStart: {
    marginRight: 8,
  },
  iconEnd: {
    marginLeft: 8,
  },
});

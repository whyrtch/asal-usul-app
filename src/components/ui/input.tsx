/**
 * Input — Themed text input with shadcn-style semantics.
 *
 * Features:
 *   - Consistent styling with theme tokens
 *   - Error state (red border + error message)
 *   - Label and helper text composition
 *   - Multiline support
 *   - Accessible (label, error association)
 */

import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput as RNTextInput,
    View,
    type TextInputProps,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { AsalUsulColors, FontSize, FontWeight, Radii, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InputProps extends TextInputProps {
  /** Visible label above the input */
  label?: string;
  /** Error message shown below the input */
  error?: string;
  /** Helper text shown below the input (hidden when error is present) */
  helperText?: string;
  /** Required field indicator */
  required?: boolean;
  /** Multiline mode */
  multiline?: boolean;
  /** Container style override */
  containerStyle?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<RNTextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      multiline = false,
      containerStyle,
      style,
      ...rest
    },
    ref,
  ) => {
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {/* ── Label ──────────────────────────────────────────────────────── */}
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        {/* ── Input ──────────────────────────────────────────────────────── */}
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            hasError && styles.inputError,
            style,
          ]}
          placeholderTextColor={AsalUsulColors.textMuted}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label || rest.placeholder}
          accessibilityInvalid={hasError ? true : undefined}
          {...rest}
        />

        {/* ── Error / Helper ─────────────────────────────────────────────── */}
        {hasError ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: AsalUsulColors.textBody,
    lineHeight: FontSize.sm * 1.4,
  },
  required: {
    color: AsalUsulColors.destructive,
  },
  input: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: FontSize.base,
    color: AsalUsulColors.textBody,
    backgroundColor: AsalUsulColors.backgroundWarm,
    lineHeight: FontSize.base * 1.4,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: Spacing.two + 2,
  },
  inputError: {
    borderColor: AsalUsulColors.destructive,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: AsalUsulColors.destructive,
    lineHeight: FontSize.xs * 1.4,
    marginTop: -Spacing.one,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: AsalUsulColors.textMuted,
    lineHeight: FontSize.xs * 1.4,
    marginTop: -Spacing.one,
  },
});

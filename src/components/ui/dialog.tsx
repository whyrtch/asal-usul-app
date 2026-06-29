/**
 * Dialog — Centered confirmation dialog (shadcn-style AlertDialog).
 *
 * Features:
 *   - ZoomIn entrance animation via Reanimated
 *   - Semi-transparent overlay
 *   - Title, description, and action buttons
 *   - Accessible with proper labels
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AsalUsulColors, FontSize, FontWeight, Radii, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'destructive';
}

export interface DialogProps {
  /** Controls visibility */
  visible: boolean;
  /** Dialog title */
  title?: string;
  /** Dialog description / body text */
  description?: string;
  /** Primary message with optional bold name */
  message?: React.ReactNode;
  /** Sub-message (smaller, muted) */
  subMessage?: string;
  /** Action buttons — max 2 recommended */
  actions: DialogAction[];
  /** Called when overlay is tapped or dialog dismissed */
  onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Dialog({
  visible,
  title,
  description,
  message,
  subMessage,
  actions,
  onCancel,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(250)} style={styles.card}>
          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Description */}
          {description && <Text style={styles.description}>{description}</Text>}

          {/* Custom message (supports bold fragments) */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Sub-message */}
          {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            {actions.map((action, index) => (
              <Button
                key={index}
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? (index === 0 ? 'outline' : 'default')}
                size="sm"
                style={styles.button}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: '100%',
    borderRadius: Radii.lg,
    backgroundColor: AsalUsulColors.backgroundCard,
    padding: Spacing.five,
    gap: Spacing.three,
    maxWidth: 400,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: AsalUsulColors.textHeading,
    lineHeight: FontSize.lg * 1.3,
  },
  description: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: AsalUsulColors.textBody,
    lineHeight: FontSize.base * 1.5,
  },
  message: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: AsalUsulColors.textBody,
    lineHeight: FontSize.base * 1.5,
  },
  subMessage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: AsalUsulColors.textMuted,
    lineHeight: FontSize.sm * 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
  },
});

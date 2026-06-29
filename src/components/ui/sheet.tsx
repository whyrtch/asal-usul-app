/**
 * Sheet — Animated bottom sheet component (shadcn-style).
 *
 * Features:
 *   - SlideInDown / SlideOutDown animations via Reanimated
 *   - Semi-transparent overlay with tap-to-dismiss
 *   - Drag handle
 *   - KeyboardAvoidingView integration
 *   - Accessible
 */

import React from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SheetProps {
  /** Controls visibility */
  visible: boolean;
  /** Called when user taps overlay or dismisses */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Show drag handle bar — default: true */
  showHandle?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Overlay opacity — default: 0.45 */
  overlayOpacity?: number;
  /** Accessibility label for the overlay */
  overlayLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sheet({
  visible,
  onClose,
  children,
  showHandle = true,
  style,
  overlayOpacity = 0.45,
  overlayLabel = 'Tutup',
}: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay — tap to dismiss */}
      <Pressable
        style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={overlayLabel}
      />

      {/* Animated sheet panel */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(250)}
          style={[styles.sheet, style]}
        >
          {showHandle && <View style={styles.handle} />}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    ...Shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginBottom: Spacing.two,
  },
});

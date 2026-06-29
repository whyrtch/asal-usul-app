/**
 * IconButton — Pressable icon with spring animation feedback.
 *
 * Features:
 *   - Spring scale animation on press-in/press-out
 *   - Accessible with role="button"
 *   - Variants: default (brand color), muted, destructive
 *   - Configurable size and hitSlop
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { AsalUsulColors, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IconButtonVariant = 'default' | 'muted' | 'destructive';

export interface IconButtonProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Press handler */
  onPress: () => void;
  /** Color variant — default: 'default' */
  variant?: IconButtonVariant;
  /** Icon size — default: 22 */
  size?: number;
  /** Accessibility label */
  accessibilityLabel: string;
  /** Additional hit area padding */
  hitSlop?: number;
}

// ─── Variant resolver ─────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<IconButtonVariant, string> = {
  default: AsalUsulColors.primary,
  muted: AsalUsulColors.textMuted,
  destructive: AsalUsulColors.destructive,
};

// ─── Spring config ────────────────────────────────────────────────────────────

const SPRING = { damping: 10, stiffness: 300 };

// ─── Component ────────────────────────────────────────────────────────────────

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 22,
  accessibilityLabel,
  hitSlop = 8,
}: IconButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9, SPRING); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING); }}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlop}
      >
        <Ionicons name={icon} size={size} color={VARIANT_COLORS[variant]} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    padding: Spacing.one,
  },
});

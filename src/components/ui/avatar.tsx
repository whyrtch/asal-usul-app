/**
 * Avatar — Circular avatar with initials fallback.
 *
 * Features:
 *   - Image support via source prop
 *   - Initials fallback when no image
 *   - Configurable size
 *   - Variants: default (brand bg), outline (border only)
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { AsalUsulColors, FontSize, FontWeight } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarVariant = 'default' | 'outline';

export interface AvatarProps {
  /** Full name used to generate initials */
  name?: string;
  /** Image URL or require() source */
  source?: string | { uri: string };
  /** Avatar size — default: 48 */
  size?: number;
  /** Variant — default: 'default' */
  variant?: AvatarVariant;
  /** Style override */
  style?: StyleProp<ViewStyle>;
}

// ─── Helper: get initials from name ───────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  source,
  size = 48,
  variant = 'default',
  style,
}: AvatarProps) {
  const initials = name ? getInitials(name) : '?';
  const fontSize = size * 0.35;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        variant === 'default' ? styles.defaultVariant : styles.outlineVariant,
        style,
      ]}
    >
      {source ? (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          contentFit="cover"
          style={[containerStyle, { position: 'absolute' }]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultVariant: {
    backgroundColor: AsalUsulColors.primary,
  },
  outlineVariant: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
});

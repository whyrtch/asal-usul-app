/**
 * MemberAvatar — circular avatar that shows a member's photo when available
 * and always falls back to a default (initials on the brand color) when:
 *   - there is no photoUrl, OR
 *   - the remote image fails to load.
 *
 * Centralizes avatar rendering so every surface (tree node, profile card)
 * shows a consistent default and never renders a blank circle.
 *
 * Phase 1 — 4.1 Foto anggota (default image / fallback).
 */

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AsalUsulColors } from '@/constants/theme';

/** Derives up to two uppercase initials from a full name. */
function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export interface MemberAvatarProps {
  fullName: string;
  photoUrl: string | null;
  /** Diameter of the avatar in logical pixels. */
  size: number;
}

export function MemberAvatar({ fullName, photoUrl, size }: MemberAvatarProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error flag whenever the photo source changes so a new, valid
  // URL is given a fresh chance to load.
  useEffect(() => {
    setErrored(false);
  }, [photoUrl]);

  const radius = size / 2;
  const showImage = !!photoUrl && !errored;

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: photoUrl! }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit="cover"
          transition={200}
          onError={() => setErrored(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
          {getInitials(fullName)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: AsalUsulColors.textOnPrimary,
    fontWeight: '700',
  },
});

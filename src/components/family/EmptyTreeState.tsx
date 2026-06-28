/**
 * EmptyTreeState — onboarding screen shown when a family tree has no members yet.
 *
 * Renders an icon, heading, explanatory copy, and a CTA button.
 * Each child element enters with a staggered FadeInDown animation.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 9.2
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EmptyTreeStateProps {
  /**
   * Called when the user taps the "Tambah Anggota Pertama" CTA.
   * When omitted (e.g. a viewer with read-only access), the CTA is hidden and
   * a read-only message is shown instead.
   */
  onAddFirstMember?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EmptyTreeState component.
 *
 * Displays an icon placeholder, heading, explanatory copy, and a primary CTA
 * button. Each element enters with a staggered FadeInDown animation
 * (Requirement 3.4, 9.2).
 */
export function EmptyTreeState({ onAddFirstMember }: EmptyTreeStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon placeholder — stagger delay 0 ms */}
      <Animated.View entering={FadeInDown.duration(400).delay(0)}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="people-outline"
            size={80}
            color={AsalUsulColors.primaryMuted}
          />
        </View>
      </Animated.View>

      {/* Heading — stagger delay 80 ms (Requirement 3.1) */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <ThemedText type="subtitle" style={styles.heading}>
          Mulai Pohon Keluargamu
        </ThemedText>
      </Animated.View>

      {/* Explanatory copy — stagger delay 160 ms (Requirement 3.1) */}
      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <ThemedText type="default" style={styles.body}>
          {onAddFirstMember
            ? 'Tambahkan dirimu sebagai anggota pertama untuk memulai perjalanan silsilah keluarga.'
            : 'Belum ada anggota dalam pohon keluarga ini.'}
        </ThemedText>
      </Animated.View>

      {/* CTA button — only for users who can edit (Requirements 3.2, 3.3) */}
      {onAddFirstMember && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={styles.ctaWrapper}
        >
          <Pressable
            onPress={onAddFirstMember}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Tambah Anggota Pertama"
          >
            <ThemedText type="default" style={styles.ctaLabel}>
              Tambah Anggota Pertama
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  iconWrapper: {
    width: 128,
    height: 128,
    borderRadius: Radii.lg,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    textAlign: 'center',
    color: AsalUsulColors.textHeading,
    fontSize: 24,
    lineHeight: 32,
  },
  body: {
    textAlign: 'center',
    color: AsalUsulColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: Spacing.two,
  },
  cta: {
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    ...Shadows.button,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    color: AsalUsulColors.textOnPrimary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});

/**
 * EmptyTreeState — onboarding screen shown when a family tree has no members yet.
 *
 * Renders an icon, heading, explanatory copy, and a CTA button.
 * Each child element enters with a staggered FadeInDown animation.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 9.2
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Radii, Spacing } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EmptyTreeStateProps {
  /** Called when the user taps the "Tambah Anggota Pertama" CTA. */
  onAddFirstMember: () => void;
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
        <UIText variant="h3" style={styles.heading}>
          Mulai Pohon Keluargamu
        </UIText>
      </Animated.View>

      {/* Explanatory copy — stagger delay 160 ms (Requirement 3.1) */}
      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <UIText variant="p" style={styles.body}>
          Tambahkan dirimu sebagai anggota pertama untuk memulai perjalanan
          silsilah keluarga.
        </UIText>
      </Animated.View>

      {/* CTA button — stagger delay 240 ms (Requirements 3.2, 3.3) */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(240)}
        style={styles.ctaWrapper}
      >
        <Button
          label="Tambah Anggota Pertama"
          onPress={onAddFirstMember}
          variant="default"
          size="default"
        />
      </Animated.View>
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
  },
  body: {
    textAlign: 'center',
    color: AsalUsulColors.textMuted,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: Spacing.two,
  },
});

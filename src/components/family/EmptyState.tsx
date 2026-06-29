/**
 * EmptyState — shown on the Home Screen when no family trees exist.
 *
 * Renders HeroIllustration, heading, description, and a CTA button.
 * Each child element enters with a staggered FadeInDown animation.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HeroIllustration } from '@/components/hero-illustration';
import { PrimaryButton } from '@/components/primary-button';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors } from '@/constants/theme';

export interface EmptyStateProps {
  /** Called when the "Buat Sekarang" button is pressed. */
  onCreatePress: () => void;
}

/**
 * EmptyState component.
 *
 * Displays a hero illustration, heading, description, and a primary CTA button.
 * Each element enters with a staggered FadeInDown animation (Requirement 7.6).
 */
export function EmptyState({ onCreatePress }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Hero illustration — Requirement 7.1 */}
      <Animated.View entering={FadeInDown.duration(400).delay(0)}>
        <HeroIllustration />
      </Animated.View>

      {/* Heading — Requirement 7.2 */}
      <Animated.View entering={FadeInDown.duration(400).delay(80)}>
        <UIText variant="h3" style={styles.heading}>
          Belum ada pohon keluarga
        </UIText>
      </Animated.View>

      {/* Description — Requirement 7.3 */}
      <Animated.View entering={FadeInDown.duration(400).delay(160)}>
        <UIText variant="p" style={styles.description}>
          Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya
        </UIText>
      </Animated.View>

      {/* CTA button — Requirement 7.4, 7.5 */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(240)}
        style={styles.buttonWrapper}
      >
        <PrimaryButton
          variant="filled"
          label="Buat Sekarang"
          onPress={onCreatePress}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  heading: {
    textAlign: 'center',
    color: AsalUsulColors.textHeading,
  },
  description: {
    textAlign: 'center',
    color: AsalUsulColors.textMuted,
  },
  buttonWrapper: {
    width: '100%',
  },
});

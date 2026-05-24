/**
 * HomeScreen — Empty state layout with animations.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.7, 6.8, 6.9
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroIllustration } from '@/components/hero-illustration';
import { HomeHeader } from '@/components/home-header';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <HomeHeader actionIcon="notifications-outline" />

        {/* ── Empty state content ─────────────────────────────────────── */}
        <View style={styles.content}>
          {/* Hero illustration — Requirement 3.2, 3.6 */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <HeroIllustration />
          </Animated.View>

          {/* Heading — Requirement 3.3, 3.6 */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <ThemedText type="subtitle" style={styles.heading}>
              Belum ada pohon keluarga
            </ThemedText>
          </Animated.View>

          {/* Description — Requirement 3.4, 3.6 */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <ThemedText type="default" style={styles.description}>
              Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya
            </ThemedText>
          </Animated.View>

          {/* CTA button — Requirement 3.5, 3.6, 3.9 */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.buttonWrapper}>
            <PrimaryButton
              variant="filled"
              label="Buat Sekarang"
              onPress={() => {}}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  safeArea: {
    flex: 1,
  },
  content: {
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

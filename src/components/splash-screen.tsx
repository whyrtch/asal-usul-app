import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
} from 'react-native-reanimated';

import { UIText } from '@/components/ui/text';
import { AsalUsulColors } from '@/constants/theme';

export interface SplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export function SplashScreen({ isReady, onAnimationComplete }: SplashScreenProps) {
  const hasCalledComplete = useRef<boolean>(false);

  useEffect(() => {
    if (!isReady) return;
    if (hasCalledComplete.current) return;

    // Delay matches the FadeOut duration (400ms) so the callback fires
    // after the exit animation finishes.
    const timer = setTimeout(() => {
      if (!hasCalledComplete.current) {
        hasCalledComplete.current = true;
        onAnimationComplete();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isReady, onAnimationComplete]);

  if (!isReady) {
    return (
      <View style={styles.overlay}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/asal-usul-logo.png')}
            contentFit="contain"
            style={styles.logo}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <UIText variant="h2" style={styles.appName}>
            AsalUsul
          </UIText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(500).delay(450)}>
          <UIText variant="muted" style={styles.tagline}>
            Jejak Keluarga dalam Satu Pohon
          </UIText>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(400).delay(600)} style={styles.loadingContainer}>
          <UIText variant="muted" style={styles.loadingText}>
            Memuat...
          </UIText>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View exiting={FadeOut.duration(400)} style={styles.overlay} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AsalUsulColors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
  },
  appName: {
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
    marginBottom: 0,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
  },
  loadingText: {
    color: AsalUsulColors.textMuted,
    opacity: 0.6,
    textAlign: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AsalUsulColors, Radii } from '@/constants/theme';

export interface HeroIllustrationProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 240;

/**
 * HeroIllustration — decorative card with a tree/git-network icon.
 * Composes cleanly with Card-like styling from theme tokens.
 */
export function HeroIllustration({ size = DEFAULT_SIZE, style }: HeroIllustrationProps) {
  const width = size;
  const height = (3 / 4) * width;

  return (
    <View
      testID="hero-illustration"
      style={[
        styles.container,
        { width, height },
        style,
      ]}
    >
      <Ionicons
        name="git-network-outline"
        size={64}
        color={AsalUsulColors.primaryMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AsalUsulColors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

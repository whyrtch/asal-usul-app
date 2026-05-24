import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors } from '@/constants/theme';

export interface LogoHeaderProps {
  showTagline?: boolean;
  logoSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function LogoHeader({ showTagline = false, logoSize = 96, style }: LogoHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('@/assets/images/asal-usul-logo.png')}
        contentFit="contain"
        style={{ width: logoSize, height: logoSize }}
      />
      <ThemedText type="title" style={styles.appName}>
        AsalUsul
      </ThemedText>
      {showTagline === true && (
        <ThemedText type="small" style={styles.tagline}>
          Jejak Keluarga dalam Satu Pohon
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  appName: {
    color: AsalUsulColors.textHeading,
    marginTop: 12,
  },
  tagline: {
    color: AsalUsulColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

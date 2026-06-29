import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { UIText } from '@/components/ui/text';
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
      <UIText variant="h2" style={styles.appName}>
        AsalUsul
      </UIText>
      {showTagline === true && (
        <UIText variant="muted" style={styles.tagline}>
          Jejak Keluarga dalam Satu Pohon
        </UIText>
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

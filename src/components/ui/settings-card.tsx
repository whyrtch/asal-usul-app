import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AsalUsulColors, Radii, Shadows } from '@/constants/theme';

export interface SettingsCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SettingsCard({ children, style }: SettingsCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AsalUsulColors.borderSubtle,
    padding: 20,
    ...Shadows.card,
  },
});

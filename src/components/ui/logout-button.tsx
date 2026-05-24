import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AsalUsulColors, Radii, Shadows } from '@/constants/theme';

export interface LogoutButtonProps {
  onPress: () => void;
}

export function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <Pressable
      testID="logout-button"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Keluar"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.inner}>
        <Ionicons
          name="log-out-outline"
          size={20}
          color={AsalUsulColors.textOnPrimary}
          style={styles.icon}
        />
        <Text style={styles.label}>Keluar</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    ...Shadows.button,
  },
  pressed: {
    opacity: 0.85,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    // slight nudge so icon aligns optically with text baseline
  },
  label: {
    color: AsalUsulColors.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});

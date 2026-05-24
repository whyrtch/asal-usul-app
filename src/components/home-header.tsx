import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors } from '@/constants/theme';

export interface HomeHeaderProps {
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

export function HomeHeader({ actionIcon, onActionPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        AsalUsul
      </ThemedText>
      {actionIcon !== undefined && (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          style={styles.iconButton}
        >
          <Ionicons name={actionIcon} size={24} color={AsalUsulColors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: AsalUsulColors.primary,
  },
  iconButton: {
    padding: 8,
  },
});

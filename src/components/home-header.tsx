import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors } from '@/constants/theme';

export interface HomeHeaderProps {
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

export function HomeHeader({ actionIcon, onActionPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <UIText variant="h3" style={styles.title}>
        AsalUsul
      </UIText>
      {actionIcon !== undefined && onActionPress !== undefined && (
        <IconButton
          icon={actionIcon}
          onPress={onActionPress}
          accessibilityLabel={actionIcon === 'add' ? 'Tambah pohon keluarga' : 'Notifikasi'}
          variant="default"
          size={24}
        />
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
});

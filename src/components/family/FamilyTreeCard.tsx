import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Radii } from '@/constants/theme';
import { FamilyTree } from '@/types/familyTree';
import { formatRelativeDate } from '@/utils/familyTreeUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyTreeCardProps {
  item: FamilyTree;
  onPress?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Premium card displaying a single family tree entry in the Home Screen list.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export function FamilyTreeCard({ item, onPress }: FamilyTreeCardProps) {
  function handlePress() {
    onPress?.(item.id);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      style={({ pressed }) => [pressed && styles.cardPressed]}
    >
      <Card variant="default" style={styles.card}>
        {/* Left avatar */}
        <View style={styles.avatar}>
          <Ionicons
            name="git-network-outline"
            size={24}
            color={AsalUsulColors.primary}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <UIText
            variant="h3"
            style={styles.name}
            numberOfLines={1}
          >
            {item.name}
          </UIText>

          <UIText variant="small" style={styles.memberCount}>
            {item.totalMembers} Anggota
          </UIText>

          <UIText variant="small" style={styles.date}>
            {formatRelativeDate(item.createdAt)}
          </UIText>
        </View>

        {/* Right chevron */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={AsalUsulColors.textMuted}
        />
      </Card>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: AsalUsulColors.textHeading,
  },
  memberCount: {
    color: AsalUsulColors.textMuted,
  },
  date: {
    color: AsalUsulColors.textMuted,
  },
});

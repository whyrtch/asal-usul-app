import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows } from '@/constants/theme';
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
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
        <ThemedText
          type="subtitle"
          style={styles.name}
          numberOfLines={1}
        >
          {item.name}
        </ThemedText>

        <ThemedText type="small" style={styles.memberCount}>
          {item.totalMembers} Anggota
        </ThemedText>

        <ThemedText type="small" style={styles.date}>
          {formatRelativeDate(item.createdAt)}
        </ThemedText>
      </View>

      {/* Right chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={AsalUsulColors.textMuted}
      />
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    backgroundColor: AsalUsulColors.backgroundCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    ...Shadows.card,
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
    fontSize: 18,
    lineHeight: 24,
    color: AsalUsulColors.textHeading,
  },
  memberCount: {
    color: AsalUsulColors.textMuted,
  },
  date: {
    color: AsalUsulColors.textMuted,
  },
});

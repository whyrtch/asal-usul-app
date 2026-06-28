/**
 * FamilyTreeNode — presentational card for a single family member in the tree.
 *
 * Fixed 120×140 card: circular avatar on top, name + role + birth year below.
 * Applies FadeIn + ZoomIn entering animations and spring press feedback.
 *
 * Requirements: 7.1–7.8, 9.5
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    ZoomIn,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import { formatLifeRange, NODE_HEIGHT, NODE_WIDTH } from '@/utils/treeLayoutEngine';

export interface FamilyTreeNodeProps {
  member: Member;
  onPress?: (memberId: string) => void;
  /** When true, draws a highlight ring (used by search-to-focus). */
  highlighted?: boolean;
}

const FamilyTreeNode = React.memo(function FamilyTreeNode({
  member,
  onPress,
  highlighted = false,
}: FamilyTreeNodeProps) {
  const scale = useSharedValue(1);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const lifeRange = formatLifeRange(member.birthDate, member.deathDate, member.status);

  return (
    <Animated.View entering={FadeIn.duration(400).delay(100)}>
      <Animated.View entering={ZoomIn.duration(300).delay(150)}>
        <Animated.View style={animatedScaleStyle}>
          <Pressable
            onPress={() => onPress?.(member.id)}
            onPressIn={() => {
              scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 10, stiffness: 300 });
            }}
            accessibilityRole="button"
            accessibilityLabel={member.fullName}
            style={[styles.card, highlighted && styles.cardHighlighted]}
          >
            {/* Avatar (photo with initials fallback) */}
            <MemberAvatar fullName={member.fullName} photoUrl={member.photoUrl} size={52} />

            {/* Name */}
            <ThemedText style={styles.fullName} numberOfLines={2}>
              {member.fullName}
            </ThemedText>

            {/* Role */}
            <ThemedText style={styles.role} numberOfLines={1}>
              {member.role}
            </ThemedText>

            {/* Life range (birth–death years) */}
            {lifeRange.length > 0 && (
              <ThemedText style={styles.birthYear}>{lifeRange}</ThemedText>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

export { FamilyTreeNode };

const styles = StyleSheet.create({
  card: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: 2,
    ...Shadows.card,
  },
  cardHighlighted: {
    borderWidth: 2.5,
    borderColor: AsalUsulColors.primary,
  },
  fullName: {
    fontSize: 12,
    fontWeight: '600',
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
    lineHeight: 16,
  },
  role: {
    fontSize: 11,
    color: AsalUsulColors.primaryMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  birthYear: {
    fontSize: 11,
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});

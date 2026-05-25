/**
 * FamilyTreeNode — pure presentational card for a single family member in the tree.
 *
 * Displays a circular initials avatar, full name, role, and birth year.
 * Applies FadeIn + ZoomIn entering animations and a spring scale press feedback.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 9.5
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    ZoomIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import { extractBirthYear } from '@/utils/treeLayoutEngine';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyTreeNodeProps {
  member: Member;
  onPress?: (memberId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives up to 2 uppercase initials from a full name.
 * e.g. "Budi Santoso" → "BS", "Siti" → "SI" (first two chars of single word)
 */
function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FamilyTreeNode component.
 *
 * Wrapped in React.memo to prevent re-renders when sibling nodes update
 * (Requirement 7.8).
 */
const FamilyTreeNode = React.memo(function FamilyTreeNode({
  member,
  onPress,
}: FamilyTreeNodeProps) {
  // Press scale feedback — Requirement 7.7, 9.5
  const scale = useSharedValue(1);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }

  function handlePress() {
    onPress?.(member.id);
  }

  const initials = getInitials(member.fullName);
  const birthYear = extractBirthYear(member.birthDate);

  return (
    // Outer Animated.View — FadeIn entering animation (Requirement 7.6, 9.5)
    <Animated.View entering={FadeIn.duration(400).delay(100)}>
      {/* Inner Animated.View — ZoomIn entering animation (Requirement 7.6, 9.5) */}
      <Animated.View entering={ZoomIn.duration(300).delay(150)}>
        {/* Scale feedback wrapper */}
        <Animated.View style={animatedScaleStyle}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel={member.fullName}
            style={styles.card}
          >
            {/* Circular avatar placeholder — Requirement 7.1 */}
            <View style={styles.avatar}>
              <ThemedText style={styles.initials}>{initials}</ThemedText>
            </View>

            {/* Text content */}
            <View style={styles.textContent}>
              {/* Full name — Requirement 7.2 */}
              <ThemedText
                type="subtitle"
                style={styles.fullName}
                numberOfLines={1}
              >
                {member.fullName}
              </ThemedText>

              {/* Role — Requirement 7.3 */}
              <ThemedText type="small" style={styles.role} numberOfLines={1}>
                {member.role}
              </ThemedText>

              {/* Birth year — Requirements 7.4, 7.5 */}
              {birthYear.length > 0 && (
                <ThemedText type="small" style={styles.birthYear}>
                  {birthYear}
                </ThemedText>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

export { FamilyTreeNode };

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    minWidth: 120,
    maxWidth: 160,
    ...Shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24, // fully circular
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 18,
    fontWeight: '700',
    color: AsalUsulColors.textOnPrimary,
    lineHeight: 22,
  },
  textContent: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  fullName: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
  },
  role: {
    color: AsalUsulColors.primaryMuted,
    textAlign: 'center',
  },
  birthYear: {
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
  },
});

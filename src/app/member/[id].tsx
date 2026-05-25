/**
 * MemberDetailScreen — dynamic route for a single family member.
 *
 * Reads `id` from route params, resolves the matching Member from useMemberStore
 * (searching across all loaded trees), and renders the full profile with
 * edit/delete flows.
 *
 * Sections:
 *   1. Stack header — title: member.fullName, headerRight: edit + delete icons
 *   2. MemberProfileCard — avatar, name, role badge, birth date
 *   3. Bio section — collapsible, only shown when bio is non-null and non-empty
 *   4. RelationshipSection — Ayah, Ibu, Pasangan, Anak rows
 *   5. EditMemberModal + DeleteMemberDialog — wired to useMemberStore
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 5.1, 6.1, 8.7, 8.8
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeleteMemberDialog } from '@/components/member/DeleteMemberDialog';
import { EditMemberModal } from '@/components/member/EditMemberModal';
import { MemberProfileCard } from '@/components/member/MemberProfileCard';
import { RelationshipSection } from '@/components/member/RelationshipSection';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useMemberStore } from '@/store/useMemberStore';
import type { Member } from '@/types/familyTree';

// ─── Header icon button with spring press feedback ────────────────────────────

interface HeaderIconButtonProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
}

function HeaderIconButton({
  iconName,
  onPress,
  accessibilityLabel,
  color = AsalUsulColors.primary,
}: HeaderIconButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        }}
        style={styles.headerButton}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
      >
        <Ionicons name={iconName} size={22} color={color} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Bio section ──────────────────────────────────────────────────────────────

interface BioSectionProps {
  bio: string;
}

function BioSection({ bio }: BioSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.bioCard}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.bioHeader}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Sembunyikan biografi' : 'Tampilkan biografi'}
        accessibilityState={{ expanded }}
      >
        <Text style={styles.bioTitle}>Biografi</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={AsalUsulColors.primaryMuted}
        />
      </Pressable>

      {expanded && (
        <Text style={styles.bioText}>{bio}</Text>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MemberDetailScreen() {
  // ── Route params ────────────────────────────────────────────────────────────
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── Store selectors ─────────────────────────────────────────────────────────
  // Search across all loaded trees to find the member by id (Requirement 4.8)
  const membersByTreeId = useMemberStore((s) => s.membersByTreeId);
  const updateMember = useMemberStore((s) => s.updateMember);
  const deleteMember = useMemberStore((s) => s.deleteMember);

  // ── Derived state ────────────────────────────────────────────────────────────
  // Find the member across all trees; derive treeId from member.familyTreeId
  let member: Member | undefined;
  for (const members of Object.values(membersByTreeId)) {
    const found = members.find((m) => m.id === id);
    if (found) {
      member = found;
      break;
    }
  }
  const treeId: string = member?.familyTreeId ?? '';
  // All members in the same tree (for RelationshipSection)
  const allMembers: Member[] = treeId ? (membersByTreeId[treeId] ?? []) : [];

  // ── Local UI state ───────────────────────────────────────────────────────────
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  // ── Guard: redirect if member not found ─────────────────────────────────────
  useEffect(() => {
    if (!member) {
      router.back();
    }
  }, [member, router]);

  // ── Callbacks ────────────────────────────────────────────────────────────────

  const handleEditSave = useCallback(
    (patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>) => {
      if (id && treeId) {
        updateMember(treeId, id, patch);
      }
    },
    [id, treeId, updateMember],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (id && treeId) {
      deleteMember(treeId, id);
    }
    router.back();
  }, [id, treeId, deleteMember, router]);

  // ── Early return while guard is in effect ───────────────────────────────────
  if (!member) {
    return null;
  }

  const hasBio = member.bio !== null && member.bio.trim().length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Configure header — Requirements 4.8, 8.7, 8.8 */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: member.fullName,
          headerRight: () => (
            <View style={styles.headerRight}>
              <HeaderIconButton
                iconName="create-outline"
                onPress={() => setEditVisible(true)}
                accessibilityLabel="Edit anggota"
              />
              <HeaderIconButton
                iconName="trash-outline"
                onPress={() => setDeleteVisible(true)}
                accessibilityLabel="Hapus anggota"
                color="#C0392B"
              />
            </View>
          ),
        }}
      />

      {/* Main content with FadeIn animation — Requirement 8.7 */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.animatedContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card — Requirements 4.2, 4.10, 8.5 */}
          <MemberProfileCard member={member} />

          {/* Bio section — collapsible, only when bio exists — Requirement 4.3 */}
          {hasBio && <BioSection bio={member.bio!} />}

          {/* Relationship section — Requirements 4.5, 4.6, 4.7 */}
          <RelationshipSection member={member} allMembers={allMembers} />
        </ScrollView>
      </Animated.View>

      {/* Edit member modal — Requirements 5.1, 8.3 */}
      <EditMemberModal
        visible={editVisible}
        member={member}
        onSave={handleEditSave}
        onClose={() => setEditVisible(false)}
      />

      {/* Delete member dialog — Requirements 6.1, 8.4 */}
      <DeleteMemberDialog
        visible={deleteVisible}
        memberName={member.fullName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  animatedContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  headerButton: {
    padding: Spacing.one,
  },

  // Bio card
  bioCard: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    ...Shadows.card,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: AsalUsulColors.textBody,
    marginTop: Spacing.three,
  },
});

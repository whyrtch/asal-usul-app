/**
 * FamilyTreeDetailScreen — dynamic route for a single family tree.
 *
 * Reads `id` from route params, resolves the matching FamilyTree and its
 * members from the Zustand store, and orchestrates the three-state UI:
 *   1. EmptyTreeState  — no members yet, showForm = false
 *   2. FamilyMemberForm — no members yet, showForm = true
 *   3. FamilyTreeCanvas — at least one member exists
 *
 * Task 6.1: route setup, store wiring, state management, and SafeAreaView.
 * Task 6.2: conditional rendering logic wired up.
 * Task 7:   settings button + FamilySettingsSheet + EditFamilyModal + DeleteFamilyDialog.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 3.3, 3.5, 8.1, 8.2, 8.8
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeleteFamilyDialog } from '@/components/family/DeleteFamilyDialog';
import { EditFamilyModal } from '@/components/family/EditFamilyModal';
import { EmptyTreeState } from '@/components/family/EmptyTreeState';
import { FamilyMemberForm } from '@/components/family/FamilyMemberForm';
import { FamilySettingsSheet } from '@/components/family/FamilySettingsSheet';
import { FamilyTreeCanvas } from '@/components/family/FamilyTreeCanvas';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useFamilyTreeStore } from '@/store/useFamilyTreeStore';
import type { FamilyTree, Member } from '@/types/familyTree';

// ─── FAB ──────────────────────────────────────────────────────────────────────

function AddMemberFAB({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.fabContainer, animatedStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        }}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Tambah anggota keluarga"
      >
        <Ionicons name="add" size={28} color={AsalUsulColors.textOnPrimary} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Settings icon button (header right) ─────────────────────────────────────

function SettingsButton({ onPress }: { onPress: () => void }) {
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
        accessibilityLabel="Pengaturan keluarga"
        hitSlop={8}
      >
        <Ionicons
          name="settings-outline"
          size={22}
          color={AsalUsulColors.primary}
        />
      </Pressable>
    </Animated.View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FamilyTreeDetailScreen() {
  // ── Route params — Requirement 1.2 ─────────────────────────────────────────
  const { id: treeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── Store selectors — Requirements 10.1, 10.4 ──────────────────────────────
  const familyTrees = useFamilyTreeStore((state: { familyTrees: FamilyTree[] }) => state.familyTrees);
  const members = useFamilyTreeStore((state: { members: Member[] }) => state.members);
  const updateFamilyTree = useFamilyTreeStore((state) => state.updateFamilyTree);
  const deleteFamilyTree = useFamilyTreeStore((state) => state.deleteFamilyTree);

  // ── Derived state — Requirements 1.3, 2.4 ──────────────────────────────────
  const tree = familyTrees.find((t) => t.id === treeId);
  const treeMembers = members.filter((m) => m.familyTreeId === treeId);

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);

  // Settings / edit / delete sheet visibility — Requirement 1.1
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editFamilyVisible, setEditFamilyVisible] = useState(false);
  const [deleteFamilyVisible, setDeleteFamilyVisible] = useState(false);

  // ── Guard: redirect if tree not found — Requirement 1.5 ────────────────────
  useEffect(() => {
    if (!tree) {
      router.replace('/(tabs)');
    }
  }, [tree, router]);

  // ── Callbacks ───────────────────────────────────────────────────────────────

  /** Called when the user taps "Tambah Anggota Pertama" in EmptyTreeState. */
  const handleShowForm = useCallback(() => {
    setShowForm(true);
  }, []);

  /** Called after FamilyMemberForm successfully adds a member. */
  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
  }, []);

  /** Called when the user dismisses FamilyMemberForm without submitting. */
  const handleFormDismiss = useCallback(() => {
    setShowForm(false);
  }, []);

  /** Open settings sheet. */
  const handleSettingsPress = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  /** FamilySettingsSheet → Edit: close sheet first, then open edit modal. */
  const handleEditPress = useCallback(() => {
    setSettingsVisible(false);
    setEditFamilyVisible(true);
  }, []);

  /** FamilySettingsSheet → Delete: close sheet first, then open delete dialog. */
  const handleDeletePress = useCallback(() => {
    setSettingsVisible(false);
    setDeleteFamilyVisible(true);
  }, []);

  /** EditFamilyModal → Save: persist to store. */
  const handleEditSave = useCallback(
    (name: string, description: string | null) => {
      if (treeId) {
        updateFamilyTree(treeId, { name, description });
      }
    },
    [treeId, updateFamilyTree],
  );

  /** DeleteFamilyDialog → Confirm: delete tree then navigate home. */
  const handleDeleteConfirm = useCallback(() => {
    if (treeId) {
      deleteFamilyTree(treeId);
    }
    router.replace('/(tabs)');
  }, [treeId, deleteFamilyTree, router]);

  // ── Early return while guard is in effect ──────────────────────────────────
  if (!tree) {
    return null;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      {/* Configure header title and settings button — Requirements 1.4, 8.1 */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: tree.name,
          headerRight: () => (
            <SettingsButton onPress={handleSettingsPress} />
          ),
        }}
      />

      {/* ── Conditional rendering — Requirements 2.1, 2.2, 2.3, 2.5, 5.6, 5.7 ── */}
      <View style={styles.content}>
        {treeMembers.length === 0 && !showForm && (
          // State 1: empty tree, form not shown — Requirement 2.1
          <EmptyTreeState onAddFirstMember={handleShowForm} />
        )}
        {showForm && (
          // State 2: form shown (first member or additional member)
          <FamilyMemberForm
            familyTreeId={treeId}
            existingMembers={treeMembers}
            onSuccess={handleFormSuccess}
            onDismiss={handleFormDismiss}
          />
        )}
        {treeMembers.length > 0 && !showForm && (
          // State 3: tree has members, form hidden — Requirement 2.3
          <FamilyTreeCanvas
            members={treeMembers}
            onNodePress={(memberId) => router.push(`/member/${memberId}`)}
          />
        )}

        {/* FAB — visible when tree has members and form is not open */}
        {treeMembers.length > 0 && !showForm && (
          <AddMemberFAB onPress={handleShowForm} />
        )}
      </View>

      {/* ── Settings sheet — Requirements 1.2, 1.3, 8.1, 8.2 ─────────────── */}
      <FamilySettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onEditPress={handleEditPress}
        onDeletePress={handleDeletePress}
      />

      {/* ── Edit family modal — Requirements 2.4, 8.3 ─────────────────────── */}
      <EditFamilyModal
        visible={editFamilyVisible}
        initialName={tree.name}
        initialDescription={tree.description}
        onSave={handleEditSave}
        onClose={() => setEditFamilyVisible(false)}
      />

      {/* ── Delete family dialog — Requirements 3.3, 3.5, 8.4 ────────────── */}
      <DeleteFamilyDialog
        visible={deleteFamilyVisible}
        familyName={tree.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteFamilyVisible(false)}
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
  content: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.five,
    right: Spacing.four,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radii.pill,
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  headerButton: {
    padding: Spacing.one,
  },
});

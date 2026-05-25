/**
 * HomeScreen — Conditionally renders EmptyState or a FlatList of FamilyTreeCard
 * components based on the FamilyTreeStore state.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateFamilyTreeModal } from '@/components/family/CreateFamilyTreeModal';
import { EmptyState } from '@/components/family/EmptyState';
import { FamilyTreeCard } from '@/components/family/FamilyTreeCard';
import { HomeHeader } from '@/components/home-header';
import { AsalUsulColors } from '@/constants/theme';
import { useFamilyTreeStore } from '@/store/useFamilyTreeStore';
import type { FamilyTree } from '@/types/familyTree';

/** Placeholder owner ID until Firebase auth is integrated. */
const OWNER_ID = 'local-user';

export default function HomeScreen() {
  const familyTrees = useFamilyTreeStore((state) => state.familyTrees);
  const addFamilyTree = useFamilyTreeStore((state) => state.addFamilyTree);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);

  // ─── Memoized callbacks ────────────────────────────────────────────────────

  /** Requirement 1.8 — close modal */
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  /** Requirement 1.7 — submit: add tree then close modal */
  const handleModalSubmit = useCallback(
    (name: string) => {
      addFamilyTree(name, OWNER_ID);
      setModalVisible(false);
    },
    [addFamilyTree],
  );

  /** Requirement 1.4 / 1.5 — open modal */
  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  // ─── FlatList renderer ─────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: FamilyTree }) => {
      return <FamilyTreeCard item={item} onPress={(id) => router.push(`/family/${id}`)} />;
    },
    [router],
  );

  const keyExtractor = useCallback((item: FamilyTree) => item.id, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const hasTrees = familyTrees.length > 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        {hasTrees ? (
          // Requirement 1.3 — show create button in header area when trees exist
          <View style={styles.headerRow}>
            <HomeHeader actionIcon="notifications-outline" />
            <Pressable
              onPress={handleOpenModal}
              style={styles.createButton}
              accessibilityRole="button"
              accessibilityLabel="Buat pohon keluarga baru"
            >
              <Ionicons name="add" size={20} color={AsalUsulColors.primary} />
            </Pressable>
          </View>
        ) : (
          <HomeHeader actionIcon="notifications-outline" />
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {hasTree(familyTrees) ? (
          // Requirement 1.2 — FlatList of FamilyTreeCard
          <FlatList
            data={familyTrees}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          // Requirement 1.1 — EmptyState when no trees
          <EmptyState onCreatePress={handleOpenModal} />
        )}
      </SafeAreaView>

      {/* Requirement 1.6 — always render modal */}
      <CreateFamilyTreeModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </View>
  );
}

/** Type-narrowing helper — avoids inline ternary repetition. */
function hasTree(trees: FamilyTree[]): trees is [FamilyTree, ...FamilyTree[]] {
  return trees.length > 0;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButton: {
    padding: 8,
    marginRight: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
});

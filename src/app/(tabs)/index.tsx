/**
 * HomeScreen — Conditionally renders EmptyState or a FlatList of FamilyTreeCard
 * components based on the FamilyTreeStore state.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.4, 2.5, 2.6, 2.7
 */

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateFamilyTreeModal } from '@/components/family/CreateFamilyTreeModal';
import { EmptyState } from '@/components/family/EmptyState';
import { FamilyTreeCard } from '@/components/family/FamilyTreeCard';
import { FeaturedTreesRow } from '@/components/family/FeaturedTreesRow';
import { HomeHeader } from '@/components/home-header';
import { FEATURE_DEV_SEED } from '@/constants/features';
import { AsalUsulColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyTreeStore } from '@/store/useFamilyTreeStore';
import type { FamilyTree } from '@/types/familyTree';

export default function HomeScreen() {
  const { user } = useAuth();

  const familyTrees = useFamilyTreeStore((state) => state.familyTrees);
  const loading = useFamilyTreeStore((state) => state.loading);
  const error = useFamilyTreeStore((state) => state.error);
  const loadFamilyTrees = useFamilyTreeStore((state) => state.loadFamilyTrees);
  const createFamilyTree = useFamilyTreeStore((state) => state.createFamilyTree);

  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // ─── Load family trees on mount / uid change (Requirements: 2.4) ──────────
  useEffect(() => {
    if (user?.uid) {
      loadFamilyTrees(user.uid);
    }
  }, [user?.uid, loadFamilyTrees]);

  // ─── Dev-only: seed sample trees (Jokowi & Prabowo) ───────────────────────
  const handleSeed = useCallback(async () => {
    if (!user?.uid || seeding) return;
    setSeeding(true);
    try {
      const { seedSampleData } = await import('@/services/sampleSeed');
      await seedSampleData(user.uid);
      await loadFamilyTrees(user.uid);
    } finally {
      setSeeding(false);
    }
  }, [user?.uid, seeding, loadFamilyTrees]);

  // ─── Memoized callbacks ────────────────────────────────────────────────────

  /** Requirement 1.8 — close modal */
  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  /** Requirement 1.7 — submit: create tree then close modal */
  const handleModalSubmit = useCallback(
    (name: string) => {
      if (user?.uid) {
        createFamilyTree(name, user.uid);
      }
      setModalVisible(false);
    },
    [createFamilyTree, user?.uid],
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
        <HomeHeader
          actionIcon={hasTrees ? 'add' : 'notifications-outline'}
          onActionPress={hasTrees ? handleOpenModal : undefined}
        />

        {/* ── Error banner (Requirement 2.7) ──────────────────────────────── */}
        {error !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Dev-only seed button ────────────────────────────────────────── */}
        {FEATURE_DEV_SEED && (
          <Pressable onPress={handleSeed} disabled={seeding} style={styles.devSeedButton}>
            <Text style={styles.devSeedText}>
              {seeding ? 'Memuat contoh…' : '🌱 Muat Contoh (Jokowi & Prabowo)'}
            </Text>
          </Pressable>
        )}

        {/* ── Content area (fills remaining space) ────────────────────────── */}
        <View style={styles.body}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AsalUsulColors.primary} />
            </View>
          ) : hasTree(familyTrees) ? (
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
        </View>

        {/* ── "Jelajahi Contoh" dipancang di paling bawah (di atas tab bar) ── */}
        <View style={styles.featuredPinned}>
          <FeaturedTreesRow />
        </View>
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  body: {
    flex: 1,
  },
  // Pinned showcase row at the very bottom; marginBottom clears the floating tab bar.
  featuredPinned: {
    paddingTop: 8,
    marginBottom: 96,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  errorText: {
    color: '#B71C1C',
    fontSize: 14,
    lineHeight: 20,
  },
  devSeedButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AsalUsulColors.primary,
    backgroundColor: AsalUsulColors.backgroundCard,
    alignItems: 'center',
  },
  devSeedText: {
    color: AsalUsulColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

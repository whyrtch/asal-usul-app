/**
 * ShowcaseScreen — read-only viewer for a curated sample family tree.
 *
 * Renders a bundled example tree (e.g. Jokowi, Prabowo, Soekarno) using the
 * normal FamilyTreeCanvas so new users can see how a family tree looks. No
 * Firestore, no editing.
 *
 * Route: /showcase/{id}.
 *
 * Phase 1+ — onboarding/explore. Data is illustrative/public, not authoritative.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FamilyTreeCanvas } from '@/components/family/FamilyTreeCanvas';
import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { getSampleTree } from '@/data/sampleFamilyData';
import type { Member } from '@/types/familyTree';

export default function ShowcaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tree = getSampleTree(id ?? '');

  // SampleMember → Member (add a placeholder createdAt; not persisted).
  const members = useMemo<Member[]>(
    () =>
      (tree?.members ?? []).map((m) => ({
        ...m,
        createdAt: '2024-01-01T00:00:00.000Z',
      })),
    [tree],
  );

  if (!tree) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: true, title: 'Contoh' }} />
        <View style={styles.center}>
          <ThemedText style={styles.muted}>Contoh tidak ditemukan.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: tree.name }} />
      <View style={styles.banner}>
        <ThemedText style={styles.bannerText}>
          Contoh · hanya lihat · data ilustratif publik
        </ThemedText>
      </View>
      <View style={styles.canvas}>
        {/* Read-only: no onNodePress → nodes are not tappable into detail. */}
        <FamilyTreeCanvas members={members} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AsalUsulColors.backgroundWarm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: AsalUsulColors.textMuted },
  banner: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  bannerText: {
    fontSize: 12,
    color: AsalUsulColors.primaryMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  canvas: { flex: 1 },
});

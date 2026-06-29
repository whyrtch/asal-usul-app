/**
 * FeaturedTreesRow — horizontal-scroll showcase of curated example family
 * trees (Jokowi, Prabowo, Soekarno, …) shown on Home so new users can see how
 * a family tree looks. Tapping a card opens a read-only viewer (/showcase/{id}).
 *
 * Data is bundled & illustrative (public figures) — no Firestore.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { SHOWCASE_SUMMARIES } from '@/data/sampleFamilyData';

export function FeaturedTreesRow() {
  const router = useRouter();

  if (SHOWCASE_SUMMARIES.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Jelajahi Contoh</ThemedText>
        <ThemedText style={styles.subtitle}>
          Lihat bagaimana pohon keluarga digunakan
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SHOWCASE_SUMMARIES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => router.push(`/showcase/${t.id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Lihat contoh ${t.name}`}
          >
            <View style={styles.avatar}>
              <Ionicons name="git-network-outline" size={22} color={AsalUsulColors.primary} />
            </View>
            <ThemedText style={styles.cardName} numberOfLines={2}>
              {t.name}
            </ThemedText>
            <ThemedText style={styles.cardMeta}>{t.memberCount} anggota</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  header: { paddingHorizontal: 16, gap: 2 },
  title: { fontSize: 16, fontWeight: '700', color: AsalUsulColors.textHeading },
  subtitle: { fontSize: 13, color: AsalUsulColors.textMuted },
  scrollContent: { paddingHorizontal: 16, gap: 12, paddingVertical: 4 },
  card: {
    width: 150,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: 6,
    ...Shadows.card,
  },
  cardPressed: { opacity: 0.85 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardName: { fontSize: 14, fontWeight: '600', color: AsalUsulColors.textHeading, lineHeight: 18 },
  cardMeta: { fontSize: 12, color: AsalUsulColors.textMuted },
});

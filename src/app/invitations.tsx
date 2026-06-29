/**
 * InvitationsScreen — the current user's invitation inbox.
 *
 * Lists pending invitations addressed to the user's verified email and lets
 * them accept (rules-only self-grant) or decline.
 *
 * Route: /invitations. Gated by FEATURE_SHARING.
 *
 * Phase 2 — Family Tree Sharing (Task 9.2).
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FEATURE_SHARING } from '@/constants/features';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useSharingStore } from '@/store/useSharingStore';
import type { Invitation } from '@/types/sharing';

export default function InvitationsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const myInvitations = useSharingStore((s) => s.myInvitations);
  const loading = useSharingStore((s) => s.loading);
  const error = useSharingStore((s) => s.error);
  const loadMyInvitations = useSharingStore((s) => s.loadMyInvitations);
  const accept = useSharingStore((s) => s.accept);
  const decline = useSharingStore((s) => s.decline);

  useEffect(() => {
    if (FEATURE_SHARING && user?.email) {
      loadMyInvitations(user.email);
    }
  }, [user?.email, loadMyInvitations]);

  async function handleAccept(inv: Invitation) {
    if (!user?.uid) return;
    const ok = await accept(inv, user.uid);
    if (ok) router.push(`/family/${inv.treeId}`);
  }

  if (!FEATURE_SHARING) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: true, title: 'Undangan' }} />
        <View style={styles.center}>
          <ThemedText style={styles.muted}>Fitur berbagi belum aktif.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Undangan' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {loading && myInvitations.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={AsalUsulColors.primary} />
          </View>
        ) : myInvitations.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="mail-open-outline" size={64} color={AsalUsulColors.primaryMuted} />
            <ThemedText style={styles.muted}>Tidak ada undangan.</ThemedText>
          </View>
        ) : (
          myInvitations.map((inv) => (
            <View key={inv.id} style={styles.card}>
              <ThemedText style={styles.treeName} numberOfLines={1}>{inv.treeName}</ThemedText>
              <ThemedText style={styles.sub}>
                Diundang sebagai {inv.role === 'editor' ? 'Editor' : 'Pelihat'}
              </ThemedText>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleAccept(inv)}
                  style={styles.acceptBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Terima undangan ${inv.treeName}`}
                >
                  <ThemedText style={styles.acceptText}>Terima</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => decline(inv.id)}
                  style={styles.declineBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Tolak undangan ${inv.treeName}`}
                >
                  <ThemedText style={styles.declineText}>Tolak</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AsalUsulColors.backgroundWarm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  content: { padding: Spacing.four, gap: Spacing.three },
  card: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    gap: Spacing.two,
    ...Shadows.card,
  },
  treeName: { fontSize: 17, fontWeight: '700', color: AsalUsulColors.textHeading },
  sub: { fontSize: 13, color: AsalUsulColors.textMuted },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  acceptBtn: {
    flex: 1,
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
  },
  acceptText: { color: AsalUsulColors.textOnPrimary, fontWeight: '700' },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  declineText: { color: AsalUsulColors.textBody, fontWeight: '600' },
  muted: { fontSize: 14, color: AsalUsulColors.textMuted },
  errorBanner: {
    backgroundColor: '#FDECEA',
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 4,
  },
  errorText: { color: '#B71C1C', fontSize: 14 },
});

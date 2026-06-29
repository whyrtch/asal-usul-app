/**
 * AcceptInviteScreen — deep-link target for `asalusul://invite/{inviteId}`.
 *
 * Fetches the invitation, shows its details, and lets the signed-in invitee
 * accept (rules-only self-grant) or decline. Handles not-found / expired /
 * wrong-account cases with localized messages.
 *
 * Route: /invite/{inviteId}. Gated by FEATURE_SHARING.
 *
 * Phase 2 — Family Tree Sharing (Task 9.5).
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FEATURE_SHARING } from '@/constants/features';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getInvitation } from '@/repositories/invitationRepository';
import { useSharingStore } from '@/store/useSharingStore';
import type { Invitation } from '@/types/sharing';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; invitation: Invitation }
  | { kind: 'notfound' }
  | { kind: 'error' };

export default function AcceptInviteScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const accept = useSharingStore((s) => s.accept);
  const decline = useSharingStore((s) => s.decline);
  const busy = useSharingStore((s) => s.loading);

  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    if (!FEATURE_SHARING || !inviteId) return;
    (async () => {
      try {
        const inv = await getInvitation(inviteId);
        if (!active) return;
        setState(inv ? { kind: 'ready', invitation: inv } : { kind: 'notfound' });
      } catch {
        if (active) setState({ kind: 'error' });
      }
    })();
    return () => {
      active = false;
    };
  }, [inviteId]);

  async function handleAccept(invitation: Invitation) {
    if (!user?.uid) return;
    const ok = await accept(invitation, user.uid);
    if (ok) router.replace(`/family/${invitation.treeId}`);
  }

  async function handleDecline(invitation: Invitation) {
    await decline(invitation.id);
    router.replace('/(tabs)');
  }

  function body() {
    if (!FEATURE_SHARING) return <Notice text="Fitur berbagi belum aktif." />;
    if (state.kind === 'loading') return <ActivityIndicator color={AsalUsulColors.primary} />;
    if (state.kind === 'notfound') return <Notice text="Undangan tidak ditemukan atau sudah tidak berlaku." />;
    if (state.kind === 'error') return <Notice text="Terjadi kesalahan. Silakan coba lagi." />;

    const inv = state.invitation;
    const emailMismatch =
      !!user?.email && user.email.toLowerCase() !== inv.inviteeEmail.toLowerCase();
    const notPending = inv.status !== 'pending';

    if (notPending) return <Notice text="Undangan ini sudah tidak berlaku." />;
    if (emailMismatch) {
      return (
        <Notice
          text={`Undangan ini ditujukan untuk ${inv.inviteeEmail}. Masuk dengan akun tersebut untuk menerimanya.`}
        />
      );
    }

    return (
      <View style={styles.card}>
        <ThemedText style={styles.title}>Undangan Pohon Keluarga</ThemedText>
        <ThemedText style={styles.treeName} numberOfLines={2}>{inv.treeName}</ThemedText>
        <ThemedText style={styles.sub}>
          Kamu diundang sebagai {inv.role === 'editor' ? 'Editor' : 'Pelihat'}.
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            onPress={() => handleAccept(inv)}
            disabled={busy}
            style={styles.acceptBtn}
            accessibilityRole="button"
            accessibilityLabel="Terima undangan"
          >
            {busy ? (
              <ActivityIndicator color={AsalUsulColors.textOnPrimary} />
            ) : (
              <ThemedText style={styles.acceptText}>Terima</ThemedText>
            )}
          </Pressable>
          <Pressable
            onPress={() => handleDecline(inv)}
            disabled={busy}
            style={styles.declineBtn}
            accessibilityRole="button"
            accessibilityLabel="Tolak undangan"
          >
            <ThemedText style={styles.declineText}>Tolak</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{ headerShown: true, title: 'Undangan' }} />
      <View style={styles.center}>{body()}</View>
    </SafeAreaView>
  );
}

function Notice({ text }: { text: string }) {
  return <ThemedText style={styles.notice}>{text}</ThemedText>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AsalUsulColors.backgroundWarm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  notice: { fontSize: 15, color: AsalUsulColors.textMuted, textAlign: 'center', lineHeight: 22 },
  card: {
    width: '100%',
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.five,
    gap: Spacing.two,
    alignItems: 'center',
    ...Shadows.card,
  },
  title: { fontSize: 14, color: AsalUsulColors.textMuted, fontWeight: '600' },
  treeName: { fontSize: 22, fontWeight: '700', color: AsalUsulColors.textHeading, textAlign: 'center' },
  sub: { fontSize: 14, color: AsalUsulColors.textBody, textAlign: 'center', marginBottom: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two, width: '100%' },
  acceptBtn: {
    flex: 1, backgroundColor: AsalUsulColors.primary, borderRadius: Radii.md,
    paddingVertical: Spacing.three, alignItems: 'center', ...Shadows.button,
  },
  acceptText: { color: AsalUsulColors.textOnPrimary, fontWeight: '700', fontSize: 16 },
  declineBtn: {
    flex: 1, borderWidth: 1.5, borderColor: AsalUsulColors.borderSubtle, borderRadius: Radii.md,
    paddingVertical: Spacing.three, alignItems: 'center', backgroundColor: AsalUsulColors.backgroundWarm,
  },
  declineText: { color: AsalUsulColors.textBody, fontWeight: '600', fontSize: 16 },
});

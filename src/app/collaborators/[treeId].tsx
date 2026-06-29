/**
 * CollaboratorsScreen — owner-only management of a tree's collaborators.
 *
 * Lists current collaborators (with role + revoke + role toggle) and pending
 * invitations, plus an invite-by-email form. Owner shares the resulting invite
 * link manually (rules-only sharing — no automatic email).
 *
 * Route: /collaborators/{treeId}. Gated by FEATURE_SHARING + owner role.
 *
 * Phase 2 — Family Tree Sharing (Task 9.1).
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FEATURE_SHARING } from '@/constants/features';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFamilyTreeStore } from '@/store/useFamilyTreeStore';
import { useSharingStore } from '@/store/useSharingStore';
import type { AccessRole } from '@/types/sharing';

const ROLE_OPTIONS: { value: AccessRole; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Lihat' },
];

export default function CollaboratorsScreen() {
  const { treeId } = useLocalSearchParams<{ treeId: string }>();
  const { user } = useAuth();

  const tree = useFamilyTreeStore((s) => s.familyTrees.find((t) => t.id === treeId));

  const collaborators = useSharingStore((s) => s.collaboratorsByTree[treeId ?? ''] ?? []);
  const invitations = useSharingStore((s) => s.invitationsByTree[treeId ?? ''] ?? []);
  const loading = useSharingStore((s) => s.loading);
  const error = useSharingStore((s) => s.error);
  const loadCollaborators = useSharingStore((s) => s.loadCollaborators);
  const loadInvitations = useSharingStore((s) => s.loadInvitations);
  const invite = useSharingStore((s) => s.invite);
  const revoke = useSharingStore((s) => s.revoke);
  const changeRole = useSharingStore((s) => s.changeRole);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('viewer');

  useEffect(() => {
    if (treeId && FEATURE_SHARING) {
      loadCollaborators(treeId);
      loadInvitations(treeId);
    }
  }, [treeId, loadCollaborators, loadInvitations]);

  // Resolve a collaborator's email via the invitation it was created from.
  const emailByInvite = useMemo(() => {
    const map: Record<string, string> = {};
    invitations.forEach((inv) => {
      map[inv.id] = inv.inviteeEmail;
    });
    return map;
  }, [invitations]);

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  async function handleInvite() {
    if (!treeId || !tree || !user?.uid || !user.email) return;
    const ok = await invite({
      treeId,
      treeName: tree.name,
      inviterUid: user.uid,
      inviterEmail: user.email,
      inviteeEmail: email,
      role,
    });
    if (ok) setEmail('');
  }

  if (!FEATURE_SHARING) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: true, title: 'Kelola Akses' }} />
        <View style={styles.center}>
          <ThemedText style={styles.muted}>Fitur berbagi belum aktif.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Kelola Akses' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {/* ── Invite form ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Undang lewat email</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@contoh.com"
            placeholderTextColor={AsalUsulColors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email yang diundang"
          />
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setRole(opt.value)}
                  style={[styles.roleChip, selected && styles.roleChipSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={opt.label}
                >
                  <ThemedText style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleInvite}
            disabled={loading}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Kirim undangan"
          >
            {loading ? (
              <ActivityIndicator color={AsalUsulColors.textOnPrimary} />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Kirim Undangan</ThemedText>
            )}
          </Pressable>
          <ThemedText style={styles.hint}>
            Bagikan tautan undangan ke anggota keluarga secara manual. Mereka menerima lewat aplikasi.
          </ThemedText>
        </View>

        {/* ── Collaborators ────────────────────────────────────────────── */}
        <ThemedText style={styles.listHeading}>Kolaborator</ThemedText>
        {collaborators.length === 0 ? (
          <ThemedText style={styles.muted}>Belum ada kolaborator.</ThemedText>
        ) : (
          collaborators.map((c) => (
            <View key={c.uid} style={styles.rowCard}>
              <Ionicons name="person-circle-outline" size={28} color={AsalUsulColors.primaryMuted} />
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowTitle} numberOfLines={1}>
                  {emailByInvite[c.invitedVia] ?? c.uid}
                </ThemedText>
                <ThemedText style={styles.rowSub}>
                  {c.role === 'editor' ? 'Editor' : 'Lihat'}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => changeRole(treeId!, c.uid, c.role === 'editor' ? 'viewer' : 'editor')}
                style={styles.smallBtn}
                accessibilityRole="button"
                accessibilityLabel="Ubah peran"
              >
                <ThemedText style={styles.smallBtnText}>
                  Jadikan {c.role === 'editor' ? 'Lihat' : 'Editor'}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => revoke(treeId!, c.uid)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Cabut akses"
                hitSlop={8}
              >
                <Ionicons name="close-circle-outline" size={22} color="#C0392B" />
              </Pressable>
            </View>
          ))
        )}

        {/* ── Pending invitations ──────────────────────────────────────── */}
        {pendingInvitations.length > 0 && (
          <>
            <ThemedText style={styles.listHeading}>Menunggu diterima</ThemedText>
            {pendingInvitations.map((inv) => (
              <View key={inv.id} style={styles.rowCard}>
                <Ionicons name="mail-outline" size={24} color={AsalUsulColors.primaryMuted} />
                <View style={styles.rowInfo}>
                  <ThemedText style={styles.rowTitle} numberOfLines={1}>{inv.inviteeEmail}</ThemedText>
                  <ThemedText style={styles.rowSub}>
                    {inv.role === 'editor' ? 'Editor' : 'Lihat'} · menunggu
                  </ThemedText>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AsalUsulColors.backgroundWarm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  card: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AsalUsulColors.textHeading },
  input: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    color: AsalUsulColors.textBody,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.two },
  roleChip: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  roleChipSelected: { borderColor: AsalUsulColors.primary, backgroundColor: AsalUsulColors.primary },
  roleChipText: { fontSize: 14, color: AsalUsulColors.textBody, fontWeight: '500' },
  roleChipTextSelected: { color: AsalUsulColors.textOnPrimary, fontWeight: '600' },
  primaryButton: {
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    ...Shadows.button,
  },
  primaryButtonText: { color: AsalUsulColors.textOnPrimary, fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, color: AsalUsulColors.textMuted, lineHeight: 18 },
  listHeading: { fontSize: 14, fontWeight: '700', color: AsalUsulColors.textHeading, marginTop: Spacing.two },
  muted: { fontSize: 14, color: AsalUsulColors.textMuted },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.md,
    padding: Spacing.three,
    ...Shadows.card,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: AsalUsulColors.textHeading },
  rowSub: { fontSize: 12, color: AsalUsulColors.textMuted },
  smallBtn: {
    borderWidth: 1,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.pill,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
  },
  smallBtnText: { fontSize: 12, color: AsalUsulColors.primary, fontWeight: '600' },
  iconBtn: { padding: 2 },
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

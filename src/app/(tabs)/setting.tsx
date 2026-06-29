/**
 * SettingScreen — Redesigned settings page.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoHeader } from '@/components/logo-header';
import { ThemedText } from '@/components/themed-text';
import { LogoutButton } from '@/components/ui/logout-button';
import { SectionTitle } from '@/components/ui/section-title';
import { SettingsCard } from '@/components/ui/settings-card';
import { VersionInfo } from '@/components/ui/version-info';
import { FEATURE_SHARING } from '@/constants/features';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SettingScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1: App Header ─────────────────────────────────────── */}
        <SettingsCard style={styles.headerCard}>
          <LogoHeader showTagline={true} logoSize={80} />
        </SettingsCard>

        {/* ── Section 2: About App ──────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="TENTANG APLIKASI" />
          <SettingsCard>
            <ThemedText
              type="default"
              style={styles.bodyText}
            >
              AsalUsul membantu keluarga mendokumentasikan sejarah, silsilah, dan warisan keluarga dalam satu pohon digital modern.
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText
              type="small"
              style={styles.missionText}
            >
              Kami percaya setiap keluarga memiliki cerita yang layak untuk dikenang dan diwariskan.
            </ThemedText>
          </SettingsCard>
        </View>

        {/* ── Section 3: App Version ────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="VERSI APLIKASI" />
          <SettingsCard>
            <VersionInfo />
          </SettingsCard>
        </View>

        {/* ── Section: Sharing / Invitations (flag-gated) ───────────────── */}
        {FEATURE_SHARING && (
          <View style={styles.section}>
            <SectionTitle title="BERBAGI" />
            <Pressable
              onPress={() => router.push('/invitations')}
              style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
              accessibilityRole="button"
              accessibilityLabel="Undangan saya"
            >
              <Ionicons name="mail-outline" size={22} color={AsalUsulColors.primary} />
              <ThemedText type="default" style={styles.linkLabel}>Undangan Saya</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={AsalUsulColors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ── Section 4: Account / Logout ───────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="AKUN" />
          <LogoutButton onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 120,
    gap: Spacing.four,
  },
  headerCard: {
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  bodyText: {
    color: AsalUsulColors.textBody,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginVertical: Spacing.three,
  },
  missionText: {
    color: AsalUsulColors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  linkRowPressed: {
    opacity: 0.85,
  },
  linkLabel: {
    flex: 1,
    color: AsalUsulColors.textBody,
    fontWeight: '500',
  },
});

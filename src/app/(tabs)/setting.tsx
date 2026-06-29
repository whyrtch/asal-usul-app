/**
 * SettingScreen — Redesigned settings page.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 *
 * Soft auth gate: shows account section only when logged in.
 * Unauthenticated users see a "Masuk" prompt instead.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoHeader } from '@/components/logo-header';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/ui/logout-button';
import { SectionTitle } from '@/components/ui/section-title';
import { SettingsCard } from '@/components/ui/settings-card';
import { UIText } from '@/components/ui/text';
import { VersionInfo } from '@/components/ui/version-info';
import { FEATURE_SHARING } from '@/constants/features';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SettingScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
  }

  function handleLogin() {
    router.push('/login');
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
            <UIText variant="p" style={styles.bodyText}>
              AsalUsul membantu keluarga mendokumentasikan sejarah, silsilah, dan warisan keluarga dalam satu pohon digital modern.
            </UIText>
            <View style={styles.divider} />
            <UIText variant="muted" style={styles.missionText}>
              Kami percaya setiap keluarga memiliki cerita yang layak untuk dikenang dan diwariskan.
            </UIText>
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
              <UIText variant="default" style={styles.linkLabel}>Undangan Saya</UIText>
              <Ionicons name="chevron-forward" size={20} color={AsalUsulColors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ── Section 4: Account / Logout ───────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="AKUN" />
          {user ? (
            <LogoutButton onPress={handleLogout} />
          ) : (
            <SettingsCard>
              <UIText variant="p" style={styles.loginPromptText}>
                Masuk untuk menyimpan dan mengelola pohon keluarga Anda.
              </UIText>
              <Button
                label="Masuk dengan Google"
                onPress={handleLogin}
                variant="default"
                size="default"
                icon="logo-google"
                style={styles.loginButton}
              />
            </SettingsCard>
          )}
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
  loginPromptText: {
    color: AsalUsulColors.textMuted,
    marginBottom: Spacing.three,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    width: '100%',
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

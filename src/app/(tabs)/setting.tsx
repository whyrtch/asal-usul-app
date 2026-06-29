/**
 * SettingScreen — Redesigned settings page.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 *
 * Soft auth gate: shows account section only when logged in.
 * Unauthenticated users see a "Masuk" prompt instead.
 */

import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoHeader } from '@/components/logo-header';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/ui/logout-button';
import { SectionTitle } from '@/components/ui/section-title';
import { SettingsCard } from '@/components/ui/settings-card';
import { UIText } from '@/components/ui/text';
import { VersionInfo } from '@/components/ui/version-info';
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

        {/* ── Section 4: Account ────────────────────────────────────────── */}
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
});

/**
 * SettingScreen — Redesigned settings page.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoHeader } from '@/components/logo-header';
import { ThemedText } from '@/components/themed-text';
import { LogoutButton } from '@/components/ui/logout-button';
import { SectionTitle } from '@/components/ui/section-title';
import { SettingsCard } from '@/components/ui/settings-card';
import { VersionInfo } from '@/components/ui/version-info';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function SettingScreen() {
  const { signOut } = useAuth();

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
});

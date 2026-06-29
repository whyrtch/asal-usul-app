/**
 * LoginScreen — full-screen onboarding and Google Sign-In entry point.
 *
 * Layout (top → bottom):
 *   1. Decorative leaf illustrations (top corners)
 *   2. LogoHeader — logo icon + "AsalUsul" + tagline + divider
 *   3. Welcome heading + description
 *   4. GoogleSignInButton (full-width, pill)
 *   5. Privacy badge — shield icon + "Aman, privat, dan hanya untuk Anda"
 *   6. Decorative landscape + tree illustration (bottom)
 *   7. Footer consent text with "Syarat Layanan" and "Kebijakan Privasi" links
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 2.9, 2.10, 2.11, 2.12
 */

import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { LogoHeader } from '@/components/logo-header';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGN_IN_TIMEOUT_MS = 30_000;
const TERMS_URL = 'https://asalusul.app/terms';
const PRIVACY_URL = 'https://asalusul.app/privacy';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Sign-in handler ─────────────────────────────────────────────────────────

  const handleSignIn = useCallback(async () => {
    // Requirement 2.12: double-tap guard
    if (isSigningIn) return;

    // Requirement 2.9: clear previous error
    setErrorMessage(null);
    setIsSigningIn(true);

    // Requirement 2.10: 30-second timeout
    timeoutRef.current = setTimeout(() => {
      setIsSigningIn(false);
      setErrorMessage('Waktu habis. Coba lagi.');
    }, SIGN_IN_TIMEOUT_MS);

    try {
      await signInWithGoogle();
      // Soft auth gate: after successful sign-in, navigate back to the
      // screen that triggered the login flow (e.g. home screen).
      // If the user came from "Buat Sekarang", the home screen detects
      // the auth transition and auto-opens the create modal.
      router.back();
    } catch (err: unknown) {
      // Requirement 2.8: surface Indonesian error message
      const message =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : 'Masuk gagal. Coba lagi.';
      setErrorMessage(message);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSigningIn(false);
    }
  }, [isSigningIn, signInWithGoogle, router]);

  // ── Link handlers ───────────────────────────────────────────────────────────

  const handleTermsPress = useCallback(() => {
    WebBrowser.openBrowserAsync(TERMS_URL);
  }, []);

  const handlePrivacyPress = useCallback(() => {
    WebBrowser.openBrowserAsync(PRIVACY_URL);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Logo + App name + Tagline ──────────────────────────────────── */}
        <View style={styles.logoSection}>
          <LogoHeader showTagline logoSize={80} />

          {/* Decorative divider with leaf */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLeafText}>🌿</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        {/* ── Welcome heading ────────────────────────────────────────────── */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeHeading}>Selamat Datang</Text>
          <Text style={styles.welcomeDescription}>
            Masuk untuk melanjutkan perjalanan keluarga Anda
          </Text>
        </View>

        {/* ── Sign-in button + error ─────────────────────────────────────── */}
        <View style={styles.authSection}>
          <GoogleSignInButton
            testID="sign-in-button"
            onPress={handleSignIn}
            isLoading={isSigningIn}
            disabled={isSigningIn}
          />

          {errorMessage !== null && (
            <Text testID="error-message" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
        </View>

        {/* ── Privacy badge ──────────────────────────────────────────────── */}
        <View style={styles.privacyBadge}>
          <Text style={styles.privacyIcon}>✓</Text>
          <Text style={styles.privacyText}>Aman, privat, dan hanya untuk Anda</Text>
        </View>

        {/* ── Decorative landscape spacer ────────────────────────────────── */}
        <View style={styles.landscapeSpacer} />

        {/* ── Footer consent ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Dengan masuk, Anda menyetujui</Text>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={handleTermsPress}
              accessibilityRole="link"
              accessibilityLabel="Syarat Layanan"
            >
              <Text style={styles.footerLink}>Syarat Layanan</Text>
            </Pressable>
            <Text style={styles.footerText}> dan </Text>
            <Pressable
              onPress={handlePrivacyPress}
              accessibilityRole="link"
              accessibilityLabel="Kebijakan Privasi"
            >
              <Text style={styles.footerLink}>Kebijakan Privasi</Text>
            </Pressable>
            <Text style={styles.footerText}> kami.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    justifyContent: 'space-between',
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
    width: '70%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AsalUsulColors.borderSubtle,
  },
  dividerLeafText: {
    fontSize: 12,
    marginHorizontal: Spacing.two,
    color: AsalUsulColors.primaryMuted,
  },

  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  welcomeHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
    marginBottom: Spacing.two,
    letterSpacing: -0.3,
  },
  welcomeDescription: {
    fontSize: 15,
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.three,
  },

  // Auth section
  authSection: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  errorText: {
    fontSize: 13,
    color: '#C0392B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.one,
  },

  // Privacy badge
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  privacyIcon: {
    fontSize: 16,
    color: AsalUsulColors.primaryMuted,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 13,
    color: AsalUsulColors.textMuted,
    lineHeight: 18,
  },

  // Landscape spacer — fills remaining space before footer
  landscapeSpacer: {
    flex: 1,
    minHeight: Spacing.six,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.three,
    borderTopWidth: 0,
  },
  footerText: {
    fontSize: 12,
    color: AsalUsulColors.textMuted,
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: AsalUsulColors.primary,
    textDecorationLine: 'underline',
    lineHeight: 18,
    fontWeight: '500',
  },
});

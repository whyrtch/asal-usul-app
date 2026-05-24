/**
 * LoginScreen — branded Google Sign-In entry point.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 6.7, 6.8, 6.9
 */

import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { LogoHeader } from '@/components/logo-header';
import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/** Maximum time (ms) to wait before resetting the loading state. Requirements: 2.10 */
const SIGN_IN_TIMEOUT_MS = 30_000;

const TERMS_URL = 'https://asalusul.app/terms';
const PRIVACY_URL = 'https://asalusul.app/privacy';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref to hold the timeout ID so we can clear it on success/error.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignIn = async () => {
    // Double-tap guard: prevent second invocation while already signing in.
    // Requirements: 2.12
    if (isSigningIn) return;

    setIsSigningIn(true);
    // Clear any previously displayed error on new attempt. Requirements: 2.9
    setErrorMessage(null);

    // Start a 30-second safety timeout. Requirements: 2.10
    timeoutRef.current = setTimeout(() => {
      setIsSigningIn(false);
      setErrorMessage('Waktu habis. Coba lagi.');
      timeoutRef.current = null;
    }, SIGN_IN_TIMEOUT_MS);

    try {
      await signInWithGoogle();
      // On success the AuthContext updates `user`, which triggers navigation
      // via Stack.Protected in _layout.tsx. No explicit navigation needed here.
    } catch (error: unknown) {
      // Requirements: 2.8 — display Indonesian error message on failure
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Masuk gagal. Coba lagi.';
      setErrorMessage(message);
    } finally {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSigningIn(false);
    }
  };

  const handleOpenTerms = () => {
    WebBrowser.openBrowserAsync(TERMS_URL);
  };

  const handleOpenPrivacy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_URL);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Logo + tagline ─────────────────────────────────────────────── */}
        <LogoHeader showTagline={true} logoSize={80} />

        {/* ── Heading & description ─────────────────────────────────────── */}
        <View style={styles.headingSection}>
          <ThemedText type="subtitle" style={styles.heading}>
            Selamat Datang
          </ThemedText>
          <ThemedText type="default" style={styles.description}>
            Masuk untuk melanjutkan perjalanan keluarga Anda
          </ThemedText>
        </View>

        {/* ── Sign-in area ──────────────────────────────────────────────── */}
        <View style={styles.signInSection}>
          {/* Error message — shown above the button when sign-in fails. Requirements: 2.8 */}
          {errorMessage !== null && (
            <ThemedText
              testID="error-message"
              type="small"
              style={styles.errorText}
            >
              {errorMessage}
            </ThemedText>
          )}

          <GoogleSignInButton
            testID="sign-in-button"
            onPress={handleSignIn}
            isLoading={isSigningIn}
          />
        </View>

        {/* ── Footer links ──────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <ThemedText type="small" style={styles.footerText}>
            Dengan masuk, Anda menyetujui{' '}
          </ThemedText>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={handleOpenTerms}
              accessibilityRole="link"
              accessibilityLabel="Syarat Layanan"
            >
              <ThemedText type="small" style={styles.footerLink}>
                Syarat Layanan
              </ThemedText>
            </Pressable>
            <ThemedText type="small" style={styles.footerText}>
              {' '}dan{' '}
            </ThemedText>
            <Pressable
              onPress={handleOpenPrivacy}
              accessibilityRole="link"
              accessibilityLabel="Kebijakan Privasi"
            >
              <ThemedText type="small" style={styles.footerLink}>
                Kebijakan Privasi
              </ThemedText>
            </Pressable>
            <ThemedText type="small" style={styles.footerText}>
              {' '}kami
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  headingSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  heading: {
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
  },
  description: {
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
  },
  signInSection: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    gap: Spacing.two,
  },
  errorText: {
    color: '#C0392B',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 2,
  },
  footerText: {
    color: AsalUsulColors.textMuted,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    color: AsalUsulColors.textMuted,
    textDecorationLine: 'underline',
  },
});

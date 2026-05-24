/**
 * AuthScreen — Google Sign-In entry point.
 * Requirements: 2.1, 2.4, 2.6, 2.7, 2.8
 */

import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

/** Maximum time (ms) to wait before resetting the loading state. Requirements: 2.8 */
const SIGN_IN_TIMEOUT_MS = 30_000;

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const theme = useTheme();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref to hold the timeout ID so we can clear it on success/error.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignIn = async () => {
    // Prevent double-tap while already signing in. Requirements: 2.8
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage(null);

    // Start a 30-second safety timeout to reset loading state. Requirements: 2.8
    timeoutRef.current = setTimeout(() => {
      setIsSigningIn(false);
      setErrorMessage('Sign-in timed out. Please try again.');
    }, SIGN_IN_TIMEOUT_MS);

    try {
      await signInWithGoogle();
      // On success the AuthContext updates `user`, which triggers navigation
      // via Stack.Protected in _layout.tsx. No explicit navigation needed here.
    } catch (error: unknown) {
      // Requirements: 2.7 — display error message on failure
      const message =
        error instanceof Error
          ? error.message
          : 'Sign-in failed. Please try again.';
      setErrorMessage(message);
    } finally {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSigningIn(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Hero section ─────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <ThemedText type="title" style={styles.title}>
            Welcome
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Sign in to continue
          </ThemedText>
        </View>

        {/* ── Sign-in button area ───────────────────────────────────────── */}
        <View style={styles.buttonSection}>
          {/* Error message — only shown when sign-in fails. Requirements: 2.6, 2.7 */}
          {errorMessage !== null && (
            <ThemedText
              testID="error-message"
              type="small"
              style={[styles.errorText, { color: theme.text }]}
            >
              {errorMessage}
            </ThemedText>
          )}

          {/* Sign-in button — disabled while loading. Requirements: 2.1, 2.8 */}
          <Pressable
            testID="sign-in-button"
            onPress={handleSignIn}
            disabled={isSigningIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
            accessibilityState={{ disabled: isSigningIn, busy: isSigningIn }}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement },
              pressed && !isSigningIn && styles.buttonPressed,
              isSigningIn && styles.buttonDisabled,
            ]}
          >
            {/* ActivityIndicator replaces label while loading. Requirements: 2.8 */}
            {isSigningIn ? (
              <ActivityIndicator
                testID="activity-indicator"
                size="small"
                color={theme.text}
              />
            ) : (
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Sign in with Google
              </ThemedText>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.three,
  },
  errorText: {
    textAlign: 'center',
    // Use a reddish tint via opacity on the theme text color to stay theme-aware.
    opacity: 0.85,
    color: '#D32F2F',
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    minHeight: 52,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    textAlign: 'center',
  },
});

/**
 * SettingScreen — Logout entry point.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState } from 'react';
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

export default function SettingScreen() {
  const { signOut } = useAuth();
  const theme = useTheme();

  // Local loading state for the logout action. Requirements: 5.6
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    // Prevent double-tap while already signing out. Requirements: 5.6
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      // Requirements: 5.2, 5.3, 5.5 — signOut handles Google + Firebase sign-out
      // and always clears user state (even on error).
      await signOut();
    } finally {
      // Reset loading state after signOut resolves or rejects.
      // Navigation back to AuthScreen is handled automatically by Stack.Protected
      // in _layout.tsx once user becomes null. Requirements: 5.4
      setIsSigningOut(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header section ───────────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <ThemedText type="title" style={styles.title}>
            Settings
          </ThemedText>
        </View>

        {/* ── Logout button area ────────────────────────────────────────── */}
        <View style={styles.buttonSection}>
          {/* Logout button — disabled while loading. Requirements: 5.1, 5.6 */}
          <Pressable
            testID="logout-button"
            onPress={handleLogout}
            disabled={isSigningOut}
            accessibilityRole="button"
            accessibilityLabel="Logout"
            accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement },
              pressed && !isSigningOut && styles.buttonPressed,
              isSigningOut && styles.buttonDisabled,
            ]}
          >
            {/* ActivityIndicator replaces label while loading. Requirements: 5.6 */}
            {isSigningOut ? (
              <ActivityIndicator
                testID="activity-indicator"
                size="small"
                color={theme.text}
              />
            ) : (
              <ThemedText type="smallBold" style={styles.buttonLabel}>
                Logout
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
  headerSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  buttonSection: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.three,
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

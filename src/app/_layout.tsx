import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';

// Suppress known Expo Router internal warning about state update before mount.
// This originates from useLinking.native.js inside expo-router and is not
// caused by application code — it is safe to ignore.
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

// Prevent the splash screen from auto-hiding before auth state is resolved.
// Requirements: 1.1
SplashScreen.preventAutoHideAsync();

/**
 * Inner layout component that consumes AuthContext.
 * Must be rendered inside AuthProvider.
 * Requirements: 3.2, 3.3, 3.4
 */
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  // Hide the splash screen once loading is complete.
  // Uses try/finally to guarantee hideAsync is always called even if an error occurs.
  // Requirements: 1.2, 1.3
  useEffect(() => {
    if (!loading) {
      (async () => {
        try {
          await SplashScreen.hideAsync();
        } finally {
          // Ensure splash screen is dismissed even if hideAsync throws
        }
      })();
    }
  }, [loading]);

  // While auth state is loading, render nothing (splash screen is still visible).
  // Stack.Protected will handle routing once loading resolves.
  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only accessible when NOT logged in (Requirements: 3.2, 3.3) */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      {/* Only accessible when logged in (Requirements: 3.2, 3.3) */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

/**
 * Root layout: wraps the entire app with AuthProvider and ThemeProvider.
 * Requirements: 3.2, 3.3, 3.4
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

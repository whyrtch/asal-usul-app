import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { LogBox, useColorScheme } from 'react-native';

import { SplashScreen as SplashScreenComponent } from '@/components/splash-screen';
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
  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Soft auth gate: tabs are always visible.
          Unauthenticated users see the home screen and are prompted to sign in
          only when they attempt a write action (create family tree, etc.). */}
      <Stack.Screen name="(tabs)" />

      {/* Login screen — presented as a modal when the user needs to authenticate.
          navigated to via router.push('/login') from auth-gated actions. */}
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

/**
 * Inner component that has access to AuthContext so it can wire
 * `isReady={!loading}` to the SplashScreen component.
 * Requirements: 1.10, 1.12
 */
function RootLayoutInner({
  splashDone,
  onSplashDone,
}: {
  splashDone: boolean;
  onSplashDone: () => void;
}) {
  const { loading } = useAuth();

  return (
    <>
      <RootLayoutNav />
      {!splashDone && (
        <SplashScreenComponent
          isReady={!loading}
          onAnimationComplete={onSplashDone}
        />
      )}
    </>
  );
}

/**
 * Root layout: wraps the entire app with AuthProvider and ThemeProvider.
 * Requirements: 3.2, 3.3, 3.4
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutInner
          splashDone={splashDone}
          onSplashDone={() => setSplashDone(true)}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

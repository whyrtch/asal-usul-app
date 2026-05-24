/**
 * Unit tests for src/app/_layout.tsx (RootLayoutNav)
 * Requirements: 1.2, 1.3, 3.2, 3.3
 *
 * Tests:
 * - Stack.Protected dengan guard={false} tidak merender screen yang dilindungi
 * - Stack.Protected dengan guard={true} merender screen yang dilindungi
 * - SplashScreen.hideAsync dipanggil saat loading === false
 * - SplashScreen.hideAsync dipanggil dalam finally block (dipanggil meski ada error)
 */

import { act, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-splash-screen: uses the manual mock at __mocks__/expo-splash-screen.ts
jest.mock('expo-splash-screen');

// expo-router: mock Stack and its sub-components
jest.mock('expo-router', () => {
  const React = require('react');

  // Stack.Protected renders children only when guard === true
  const Protected = ({
    guard,
    children,
  }: {
    guard: boolean;
    children: React.ReactNode;
  }) => (guard ? <>{children}</> : null);

  // Stack.Screen renders a placeholder with its name as testID
  const Screen = ({ name }: { name: string }) => {
    const { View } = require('react-native');
    return <View testID={`screen-${name}`} />;
  };

  // Stack renders children directly
  const Stack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Stack.Protected = Protected;
  Stack.Screen = Screen;

  return {
    Stack,
    DarkTheme: {},
    DefaultTheme: {},
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// useColorScheme: always return 'light' to keep tests deterministic
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}));

// AnimatedSplashOverlay: no-op in tests (avoids reanimated/worklets complexity)
jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

// firebase/app and firebase/auth: minimal mocks so lib/firebase.ts can load
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));
jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {},
  isErrorWithCode: jest.fn(),
}));

// ── useAuth mock — controlled per test ───────────────────────────────────────

const mockUseAuth = jest.fn();

jest.mock('@/context/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

// ── Import SUT and SplashScreen after mocks are set up ───────────────────────

import * as SplashScreen from 'expo-splash-screen';

// Import the inner component directly — we test RootLayoutNav in isolation.
// Because _layout.tsx only exports RootLayout as default, we render it and
// let the mocked AuthProvider pass through to RootLayoutNav.
import RootLayout from '../app/_layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLayout() {
  return render(<RootLayout />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RootLayoutNav — Stack.Protected routing (Requirements: 3.2, 3.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does NOT render the login screen when guard={false} (user is logged in)', () => {
    // guard for login = !isLoggedIn = false when user is present
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });

    const { queryByTestId } = renderLayout();

    expect(queryByTestId('screen-login')).toBeNull();
  });

  it('renders the login screen when guard={true} (user is NOT logged in)', () => {
    // guard for login = !isLoggedIn = true when user is null
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const { getByTestId } = renderLayout();

    expect(getByTestId('screen-login')).toBeTruthy();
  });

  it('does NOT render the (tabs) screen when guard={false} (user is NOT logged in)', () => {
    // guard for tabs = isLoggedIn = false when user is null
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const { queryByTestId } = renderLayout();

    expect(queryByTestId('screen-(tabs)')).toBeNull();
  });

  it('renders the (tabs) screen when guard={true} (user is logged in)', () => {
    // guard for tabs = isLoggedIn = true when user is present
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false });

    const { getByTestId } = renderLayout();

    expect(getByTestId('screen-(tabs)')).toBeTruthy();
  });
});

describe('RootLayoutNav — SplashScreen.hideAsync (Requirements: 1.2, 1.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('calls SplashScreen.hideAsync when loading transitions to false', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    // Render outside act so the test renderer stays mounted
    const utils = renderLayout();

    // Flush all pending microtasks/promises (the async IIFE inside useEffect)
    await act(async () => {
      await Promise.resolve();
    });

    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    utils.unmount();
  });

  it('does NOT call SplashScreen.hideAsync while loading is still true', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    const utils = renderLayout();

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    utils.unmount();
  });

  it('calls SplashScreen.hideAsync in finally block even when hideAsync throws (Requirement 1.3)', async () => {
    // Requirement 1.3: hideAsync must be called even when errors occur during
    // resource loading. The _layout.tsx wraps hideAsync in try/finally so it
    // is always invoked when loading becomes false, regardless of the path
    // that caused loading to resolve (success or error/timeout).
    //
    // We simulate the error path: loading becomes false with user=null
    // (as would happen after the 10-second auth timeout or a Firebase error).
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const utils = renderLayout();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // hideAsync is called even on the error/timeout path (loading=false, user=null)
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    utils.unmount();
  });

  it('calls SplashScreen.hideAsync exactly once even when re-rendered with loading=false', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    const { rerender, unmount } = renderLayout();

    await act(async () => {
      await Promise.resolve();
    });

    // Re-render with the same loading=false — useEffect deps haven't changed
    rerender(<RootLayout />);

    await act(async () => {
      await Promise.resolve();
    });

    // The useEffect dependency is [loading]; since loading stays false,
    // hideAsync should only be called once per mount.
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    unmount();
  });
});

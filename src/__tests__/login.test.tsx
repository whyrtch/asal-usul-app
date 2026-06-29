/**
 * Integration tests for src/app/login.tsx (LoginScreen)
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.8, 2.9, 2.10, 2.11, 2.12
 *
 * Tests:
 * - renders LogoHeader with tagline
 * - renders "Selamat Datang" heading
 * - renders GoogleSignInButton
 * - sets isLoading={true} on GoogleSignInButton while signing in
 * - displays Indonesian error message on failure
 * - displays "Masuk gagal. Coba lagi." for non-Error thrown values
 * - displays "Waktu habis. Coba lagi." on 30 s timeout
 * - clears error on new sign-in attempt
 * - double-tap guard prevents second signInWithGoogle call
 * - footer links are rendered
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-splash-screen: uses the manual mock at __mocks__/expo-splash-screen.ts
jest.mock('expo-splash-screen');

// expo-image: mock Image component so it renders in Jest (no native module needed)
jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  return {
    Image: (props: object) => <Image testID="logo-image" {...props} />,
  };
});

// expo-router: mock useRouter for soft auth gate (router.back() after sign-in)
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

// expo-web-browser: mock openBrowserAsync so footer link taps don't fail
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
}));

// @expo/vector-icons: mock AntDesign so GoogleSignInButton renders without native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AntDesign: (props: { name: string; testID?: string }) => (
      <View testID={props.testID ?? `antdesign-${props.name}`} />
    ),
  };
});

// react-native-safe-area-context: render children directly
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) => {
      const { View } = require('react-native');
      return <View style={style}>{children}</View>;
    },
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

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
jest.mock('@react-native-google-signin/google-signin');

// ── useAuth mock — controlled per test ───────────────────────────────────────

const mockSignInWithGoogle = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    user: null,
    loading: false,
    signOut: jest.fn(),
  }),
}));

// ── Import component under test ───────────────────────────────────────────────

import LoginScreen from '../app/login';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(<LoginScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
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

  // ── Requirement 2.2: renders LogoHeader with tagline ─────────────────────────

  describe('Requirement 2.2 — renders LogoHeader with tagline', () => {
    it('renders the logo image inside LogoHeader', () => {
      const { getByTestId } = renderLogin();
      expect(getByTestId('logo-image')).toBeTruthy();
    });

    it('renders the app name "AsalUsul" inside LogoHeader', () => {
      const { getByText } = renderLogin();
      expect(getByText('AsalUsul')).toBeTruthy();
    });

    it('renders the tagline "Jejak Keluarga dalam Satu Pohon" (showTagline=true)', () => {
      const { getByText } = renderLogin();
      expect(getByText('Jejak Keluarga dalam Satu Pohon')).toBeTruthy();
    });
  });

  // ── Requirement 2.3: renders "Selamat Datang" heading ────────────────────────

  describe('Requirement 2.3 — renders "Selamat Datang" heading', () => {
    it('renders the "Selamat Datang" heading text', () => {
      const { getByText } = renderLogin();
      expect(getByText('Selamat Datang')).toBeTruthy();
    });

    it('renders the onboarding description text', () => {
      const { getByText } = renderLogin();
      expect(getByText('Masuk untuk melanjutkan perjalanan keluarga Anda')).toBeTruthy();
    });
  });

  // ── Requirement 2.1: renders GoogleSignInButton ───────────────────────────────

  describe('Requirement 2.1 — renders GoogleSignInButton', () => {
    it('renders the Sign in with Google button', () => {
      const { getByTestId } = renderLogin();
      expect(getByTestId('sign-in-button')).toBeTruthy();
    });
  });

  // ── Requirement 2.6: sets isLoading={true} on GoogleSignInButton while signing in

  describe('Requirement 2.6 — sets isLoading={true} on GoogleSignInButton while signing in', () => {
    it('button is enabled before sign-in starts', () => {
      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('shows ActivityIndicator (isLoading=true) while sign-in is in progress', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('button is disabled (isLoading=true) while sign-in is in progress', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');

      await act(async () => {
        fireEvent.press(button);
      });

      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('hides ActivityIndicator (isLoading=false) after sign-in resolves', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('hides ActivityIndicator after sign-in fails', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Sign-in failed. Please try again.'));

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('button is re-enabled after sign-in resolves', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(button.props.accessibilityState?.disabled).toBeFalsy();
      });
    });
  });

  // ── Requirement 2.8: displays Indonesian error message on failure ─────────────

  describe('Requirement 2.8 — displays Indonesian error message on failure', () => {
    it('shows error message when signInWithGoogle throws an Error', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Masuk gagal. Coba lagi.'));

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Masuk gagal. Coba lagi.')).toBeTruthy();
      });
    });

    it('shows network error message when a network Error is thrown', async () => {
      mockSignInWithGoogle.mockRejectedValue(
        new Error('Jaringan bermasalah. Periksa koneksi Anda.')
      );

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Jaringan bermasalah. Periksa koneksi Anda.')).toBeTruthy();
      });
    });

    it('does NOT show error message on initial render', () => {
      const { queryByTestId } = renderLogin();
      expect(queryByTestId('error-message')).toBeNull();
    });
  });

  // ── Requirement 2.8: "Masuk gagal. Coba lagi." for non-Error thrown values ────

  describe('Requirement 2.8 — displays "Masuk gagal. Coba lagi." for non-Error thrown values', () => {
    it('shows fallback message when signInWithGoogle throws a string', async () => {
      mockSignInWithGoogle.mockRejectedValue('unexpected string error');

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Masuk gagal. Coba lagi.')).toBeTruthy();
      });
    });

    it('shows fallback message when signInWithGoogle throws a plain object', async () => {
      mockSignInWithGoogle.mockRejectedValue({ code: 'auth/unknown' });

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Masuk gagal. Coba lagi.')).toBeTruthy();
      });
    });

    it('shows fallback message when signInWithGoogle throws an Error with empty message', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error(''));

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Masuk gagal. Coba lagi.')).toBeTruthy();
      });
    });
  });

  // ── Requirement 2.10: "Waktu habis. Coba lagi." on 30 s timeout ──────────────

  describe('Requirement 2.10 — displays "Waktu habis. Coba lagi." on 30 s timeout', () => {
    it('shows timeout error message after 30 000 ms without resolution', async () => {
      // Never resolves — simulates a hung sign-in
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      // Advance fake timers by 30 seconds to trigger the timeout
      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Waktu habis. Coba lagi.')).toBeTruthy();
      });
    });

    it('resets isLoading to false after the 30 s timeout fires', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      // Confirm loading state is active
      expect(getByTestId('activity-indicator')).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('does NOT show timeout message before 30 s have elapsed', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId, queryByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      // Advance only 29 seconds — timeout should not have fired yet
      await act(async () => {
        jest.advanceTimersByTime(29_999);
      });

      expect(queryByText('Waktu habis. Coba lagi.')).toBeNull();
    });
  });

  // ── Requirement 2.9: clears error on new sign-in attempt ─────────────────────

  describe('Requirement 2.9 — clears error on new sign-in attempt', () => {
    it('clears previous error message when a new sign-in attempt starts', async () => {
      // First attempt fails
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Sign-in failed. Please try again.'));

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
      });

      // Second attempt — never resolves (keeps isSigningIn=true)
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      // Error message should be cleared while the new attempt is in progress
      expect(queryByTestId('error-message')).toBeNull();
    });

    it('does NOT show error message when signInWithGoogle resolves (cancelled case)', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(queryByTestId('error-message')).toBeNull();
      });
    });
  });

  // ── Requirement 2.12: double-tap guard prevents second signInWithGoogle call ──

  describe('Requirement 2.12 — double-tap guard prevents second signInWithGoogle call', () => {
    it('pressing the button while signing in does not call signInWithGoogle again', async () => {
      // Never resolves — keeps isSigningIn=true
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');

      await act(async () => {
        fireEvent.press(button);
      });

      // Press again while in progress
      await act(async () => {
        fireEvent.press(button);
      });

      // signInWithGoogle should only have been called once
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('allows a second sign-in attempt after the first completes', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Masuk gagal. Coba lagi.'));

      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(button.props.accessibilityState?.disabled).toBeFalsy();
      });

      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(2);
    });
  });

  // ── Requirement 2.11: footer links are rendered ───────────────────────────────

  describe('Requirement 2.11 — footer links are rendered', () => {
    it('renders the footer consent text', () => {
      const { getByText } = renderLogin();
      expect(getByText('Dengan masuk, Anda menyetujui')).toBeTruthy();
    });

    it('renders the "Syarat Layanan" link', () => {
      const { getByText } = renderLogin();
      expect(getByText('Syarat Layanan')).toBeTruthy();
    });

    it('renders the "Kebijakan Privasi" link', () => {
      const { getByText } = renderLogin();
      expect(getByText('Kebijakan Privasi')).toBeTruthy();
    });

    it('"Syarat Layanan" link has accessibilityRole="link"', () => {
      const { getByLabelText } = renderLogin();
      const link = getByLabelText('Syarat Layanan');
      expect(link.props.accessibilityRole).toBe('link');
    });

    it('"Kebijakan Privasi" link has accessibilityRole="link"', () => {
      const { getByLabelText } = renderLogin();
      const link = getByLabelText('Kebijakan Privasi');
      expect(link.props.accessibilityRole).toBe('link');
    });

    it('tapping "Syarat Layanan" calls openBrowserAsync with the terms URL', async () => {
      const { openBrowserAsync } = require('expo-web-browser');
      const { getByLabelText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByLabelText('Syarat Layanan'));
      });

      expect(openBrowserAsync).toHaveBeenCalledWith('https://asalusul.app/terms');
    });

    it('tapping "Kebijakan Privasi" calls openBrowserAsync with the privacy URL', async () => {
      const { openBrowserAsync } = require('expo-web-browser');
      const { getByLabelText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByLabelText('Kebijakan Privasi'));
      });

      expect(openBrowserAsync).toHaveBeenCalledWith('https://asalusul.app/privacy');
    });
  });
});

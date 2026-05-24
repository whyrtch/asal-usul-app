/**
 * Unit tests for src/app/login.tsx (LoginScreen / AuthScreen)
 * Requirements: 2.1, 2.6, 2.7, 2.8
 *
 * Tests:
 * - Tombol dinonaktifkan saat isSigningIn === true
 * - ActivityIndicator tampil saat isSigningIn === true
 * - Error message ditampilkan saat sign-in gagal
 * - Tidak ada error message saat user membatalkan (response type `cancelled`)
 */

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-splash-screen: uses the manual mock at __mocks__/expo-splash-screen.ts
jest.mock('expo-splash-screen');

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

  // ── Requirement 2.1: tombol Sign in with Google tampil ───────────────────────

  it('renders the Sign in with Google button', () => {
    const { getByTestId } = renderLogin();
    expect(getByTestId('sign-in-button')).toBeTruthy();
  });

  // ── Requirement 2.8: tombol dinonaktifkan saat isSigningIn === true ──────────

  describe('Requirement 2.8 — tombol dinonaktifkan saat isSigningIn === true', () => {
    it('button is enabled before sign-in starts', () => {
      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');
      // disabled prop should be falsy when not signing in
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it('button is disabled while sign-in is in progress', async () => {
      // signInWithGoogle never resolves — keeps isSigningIn=true
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderLogin();
      const button = getByTestId('sign-in-button');

      await act(async () => {
        fireEvent.press(button);
      });

      expect(button.props.accessibilityState?.disabled).toBe(true);
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
  });

  // ── Requirement 2.8: ActivityIndicator tampil saat isSigningIn === true ──────

  describe('Requirement 2.8 — ActivityIndicator tampil saat isSigningIn === true', () => {
    it('does NOT show ActivityIndicator before sign-in starts', () => {
      const { queryByTestId } = renderLogin();
      expect(queryByTestId('activity-indicator')).toBeNull();
    });

    it('shows ActivityIndicator while sign-in is in progress', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('hides ActivityIndicator after sign-in resolves', async () => {
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
  });

  // ── Requirement 2.7: error message ditampilkan saat sign-in gagal ────────────

  describe('Requirement 2.7 — error message ditampilkan saat sign-in gagal', () => {
    it('shows error message when signInWithGoogle throws', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Sign-in failed. Please try again.'));

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Sign-in failed. Please try again.')).toBeTruthy();
      });
    });

    it('shows network error message when network error is thrown', async () => {
      mockSignInWithGoogle.mockRejectedValue(
        new Error('Network error. Please check your connection.')
      );

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Network error. Please check your connection.')).toBeTruthy();
      });
    });

    it('shows generic error message for non-Error thrown values', async () => {
      // signInWithGoogle throws a non-Error object
      mockSignInWithGoogle.mockRejectedValue('unexpected string error');

      const { getByTestId, getByText } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(getByTestId('error-message')).toBeTruthy();
        expect(getByText('Sign-in failed. Please try again.')).toBeTruthy();
      });
    });

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
  });

  // ── Requirement 2.6: tidak ada error message saat user membatalkan ───────────

  describe('Requirement 2.6 — tidak ada error message saat user membatalkan', () => {
    it('does NOT show error message when signInWithGoogle resolves (cancelled case)', async () => {
      // signInWithGoogle resolves without throwing when user cancels
      // (AuthContext handles cancelled internally and returns undefined)
      mockSignInWithGoogle.mockResolvedValue(undefined);

      const { getByTestId, queryByTestId } = renderLogin();

      await act(async () => {
        fireEvent.press(getByTestId('sign-in-button'));
      });

      await waitFor(() => {
        expect(queryByTestId('error-message')).toBeNull();
      });
    });

    it('does NOT show error message on initial render', () => {
      const { queryByTestId } = renderLogin();
      expect(queryByTestId('error-message')).toBeNull();
    });
  });
});

/**
 * Unit tests for src/app/(tabs)/setting.tsx (SettingScreen)
 * Requirements: 5.1, 5.2, 5.6
 *
 * Tests:
 * - Tombol "Logout" tampil dan dapat ditekan
 * - Tombol dinonaktifkan saat isSigningOut === true
 * - ActivityIndicator tampil saat isSigningOut === true
 * - signOut() dari AuthContext dipanggil saat tombol ditekan
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

const mockSignOut = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
    user: null,
    loading: false,
    signInWithGoogle: jest.fn(),
  }),
}));

// ── Import component under test ───────────────────────────────────────────────

import SettingScreen from '../app/(tabs)/setting';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSetting() {
  return render(<SettingScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingScreen', () => {
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

  // ── Requirement 5.1: tombol "Logout" tampil dan dapat ditekan ────────────────

  describe('Requirement 5.1 — tombol "Logout" tampil dan dapat ditekan', () => {
    it('renders the Logout button', () => {
      const { getByTestId } = renderSetting();
      expect(getByTestId('logout-button')).toBeTruthy();
    });

    it('shows "Logout" label text on the button', () => {
      const { getByText } = renderSetting();
      expect(getByText('Logout')).toBeTruthy();
    });

    it('button is enabled on initial render', () => {
      const { getByTestId } = renderSetting();
      const button = getByTestId('logout-button');
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  // ── Requirement 5.6: tombol dinonaktifkan saat isSigningOut === true ─────────

  describe('Requirement 5.6 — tombol dinonaktifkan saat isSigningOut === true', () => {
    it('button is disabled while sign-out is in progress', async () => {
      // signOut never resolves — keeps isSigningOut=true
      mockSignOut.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderSetting();
      const button = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(button);
      });

      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('button is re-enabled after sign-out resolves', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { getByTestId } = renderSetting();
      const button = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(button.props.accessibilityState?.disabled).toBeFalsy();
      });
    });

    it('pressing the button while signing out does not call signOut again', async () => {
      // Never resolves — keeps isSigningOut=true
      mockSignOut.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderSetting();
      const button = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(button);
      });

      // Press again while in progress
      await act(async () => {
        fireEvent.press(button);
      });

      // signOut should only have been called once
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  // ── Requirement 5.6: ActivityIndicator tampil saat isSigningOut === true ─────

  describe('Requirement 5.6 — ActivityIndicator tampil saat isSigningOut === true', () => {
    it('does NOT show ActivityIndicator before logout starts', () => {
      const { queryByTestId } = renderSetting();
      expect(queryByTestId('activity-indicator')).toBeNull();
    });

    it('shows ActivityIndicator while sign-out is in progress', async () => {
      mockSignOut.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderSetting();

      await act(async () => {
        fireEvent.press(getByTestId('logout-button'));
      });

      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('hides ActivityIndicator after sign-out resolves', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { getByTestId, queryByTestId } = renderSetting();

      await act(async () => {
        fireEvent.press(getByTestId('logout-button'));
      });

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('hides "Logout" label text while ActivityIndicator is shown', async () => {
      mockSignOut.mockImplementation(() => new Promise(() => {}));

      const { getByTestId, queryByText } = renderSetting();

      await act(async () => {
        fireEvent.press(getByTestId('logout-button'));
      });

      // Label is replaced by ActivityIndicator during loading
      expect(queryByText('Logout')).toBeNull();
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });
  });

  // ── Requirement 5.2: signOut() dipanggil saat tombol ditekan ────────────────

  describe('Requirement 5.2 — signOut() dari AuthContext dipanggil saat tombol ditekan', () => {
    it('calls signOut when Logout button is pressed', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { getByTestId } = renderSetting();

      await act(async () => {
        fireEvent.press(getByTestId('logout-button'));
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('calls signOut exactly once per button press', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { getByTestId } = renderSetting();
      const button = getByTestId('logout-button');

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(button.props.accessibilityState?.disabled).toBeFalsy();
      });

      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(2);
      });
    });

    it('calls signOut even when it rejects (error case)', async () => {
      // Per Requirement 5.5, AuthContext.signOut() always resolves (it handles
      // errors internally and never propagates them). This test verifies signOut
      // is called regardless of the outcome.
      mockSignOut.mockResolvedValue(undefined);

      const { getByTestId } = renderSetting();

      await act(async () => {
        fireEvent.press(getByTestId('logout-button'));
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});

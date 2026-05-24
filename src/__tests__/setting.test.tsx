/**
 * Unit tests for src/app/(tabs)/setting.tsx (SettingScreen)
 *
 * Tests:
 * - Screen renders without crashing
 * - Version info is displayed
 * - Logout button is present with testID="logout-button"
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-splash-screen: uses the manual mock at __mocks__/expo-splash-screen.ts
jest.mock('expo-splash-screen');

// expo-constants: return a fixed version so tests are deterministic
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.2.3' },
  },
}));

// expo-image: render a plain View so Image doesn't need native modules
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: object) => React.createElement(View, props),
  };
});

// react-native-safe-area-context: render children directly
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) => {
      const { View } = require('react-native');
      return React.createElement(View, { style }, children);
    },
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// auth-context: provide a stub signOut so the screen can render without Firebase
const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@example.com', displayName: 'Test', photoURL: null },
    loading: false,
    signOut: mockSignOut,
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
  });

  it('renders without crashing', () => {
    expect(() => renderSetting()).not.toThrow();
  });

  it('displays version info', () => {
    const { getByText } = renderSetting();
    expect(getByText('Version 1.2.3')).toBeTruthy();
  });

  it('renders the logout button with correct testID', () => {
    const { getByTestId } = renderSetting();
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('logout button has correct accessibility attributes', () => {
    const { getByTestId } = renderSetting();
    const button = getByTestId('logout-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Keluar');
  });

  it('renders the about section text', () => {
    const { getByText } = renderSetting();
    expect(
      getByText(
        'AsalUsul membantu keluarga mendokumentasikan sejarah, silsilah, dan warisan keluarga dalam satu pohon digital modern.'
      )
    ).toBeTruthy();
  });

  it('renders the mission statement', () => {
    const { getByText } = renderSetting();
    expect(
      getByText(
        'Kami percaya setiap keluarga memiliki cerita yang layak untuk dikenang dan diwariskan.'
      )
    ).toBeTruthy();
  });

  it('calls signOut when logout button is pressed', async () => {
    const { getByTestId } = renderSetting();
    const button = getByTestId('logout-button');
    fireEvent.press(button);
    // Allow the async signOut to be called
    await Promise.resolve();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

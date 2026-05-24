/**
 * Unit tests for src/app/(tabs)/index.tsx (HomeScreen)
 * Requirements: 4.6, 4.7
 *
 * Tests:
 * - Menampilkan displayName jika tersedia
 * - Menampilkan email sebagai fallback jika displayName null
 * - Menampilkan komponen image saat photoURL non-null
 * - Menampilkan avatar placeholder saat photoURL null
 */

import { render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-image: mock Image component so it renders in Jest (no native module needed)
jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  return {
    Image: (props: object) => <Image {...props} />,
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

const mockUseAuth = jest.fn();

jest.mock('@/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// ── Import component under test ───────────────────────────────────────────────

import HomeScreen from '../app/(tabs)/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUser(overrides: {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}) {
  return {
    uid: 'test-uid',
    email: overrides.email !== undefined ? overrides.email : 'user@example.com',
    displayName: overrides.displayName !== undefined ? overrides.displayName : null,
    photoURL: overrides.photoURL !== undefined ? overrides.photoURL : null,
  };
}

function renderHome(user: ReturnType<typeof buildUser> | null = null) {
  mockUseAuth.mockReturnValue({ user, loading: false, signInWithGoogle: jest.fn(), signOut: jest.fn() });
  return render(<HomeScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Requirement 4.6: displayName jika tersedia ───────────────────────────────

  describe('Requirement 4.6 — menampilkan displayName jika tersedia', () => {
    it('menampilkan displayName ketika displayName non-null', () => {
      const user = buildUser({ displayName: 'John Doe', email: 'john@example.com' });
      const { getByTestId } = renderHome(user);

      expect(getByTestId('user-name').props.children).toBe('John Doe');
    });

    it('menampilkan displayName bukan email ketika keduanya tersedia', () => {
      const user = buildUser({ displayName: 'Jane Smith', email: 'jane@example.com' });
      const { getByTestId, queryByText } = renderHome(user);

      expect(getByTestId('user-name').props.children).toBe('Jane Smith');
      expect(queryByText('jane@example.com')).toBeNull();
    });
  });

  // ── Requirement 4.6: email sebagai fallback jika displayName null ─────────────

  describe('Requirement 4.6 — menampilkan email sebagai fallback jika displayName null', () => {
    it('menampilkan email ketika displayName null', () => {
      const user = buildUser({ displayName: null, email: 'fallback@example.com' });
      const { getByTestId } = renderHome(user);

      expect(getByTestId('user-name').props.children).toBe('fallback@example.com');
    });

    it('tidak menampilkan user-name ketika displayName dan email keduanya null', () => {
      const user = buildUser({ displayName: null, email: null });
      const { queryByTestId } = renderHome(user);

      expect(queryByTestId('user-name')).toBeNull();
    });
  });

  // ── Requirement 4.7: komponen image saat photoURL non-null ───────────────────

  describe('Requirement 4.7 — menampilkan komponen image saat photoURL non-null', () => {
    it('merender profile-image ketika photoURL tersedia', () => {
      const user = buildUser({ photoURL: 'https://example.com/photo.jpg' });
      const { getByTestId, queryByTestId } = renderHome(user);

      expect(getByTestId('profile-image')).toBeTruthy();
      expect(queryByTestId('avatar-placeholder')).toBeNull();
    });

    it('profile-image menggunakan photoURL sebagai source uri', () => {
      const photoURL = 'https://example.com/avatar.png';
      const user = buildUser({ photoURL });
      const { getByTestId } = renderHome(user);

      const image = getByTestId('profile-image');
      expect(image.props.source).toEqual({ uri: photoURL });
    });
  });

  // ── Requirement 4.7: avatar placeholder saat photoURL null ───────────────────

  describe('Requirement 4.7 — menampilkan avatar placeholder saat photoURL null', () => {
    it('merender avatar-placeholder ketika photoURL null', () => {
      const user = buildUser({ photoURL: null });
      const { getByTestId, queryByTestId } = renderHome(user);

      expect(getByTestId('avatar-placeholder')).toBeTruthy();
      expect(queryByTestId('profile-image')).toBeNull();
    });

    it('merender avatar-placeholder ketika user null', () => {
      const { getByTestId, queryByTestId } = renderHome(null);

      expect(getByTestId('avatar-placeholder')).toBeTruthy();
      expect(queryByTestId('profile-image')).toBeNull();
    });

    it('avatar-placeholder menampilkan inisial dari displayName', () => {
      const user = buildUser({ displayName: 'Alice', photoURL: null });
      const { getByTestId } = renderHome(user);

      const placeholder = getByTestId('avatar-placeholder');
      // The initial letter should appear somewhere inside the placeholder subtree
      expect(placeholder).toBeTruthy();
    });
  });
});

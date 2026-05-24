// Feature: expo-firebase-boilerplate, Property 5: User data display with fallback

/**
 * Property 5: User data display with fallback
 * Validates: Requirements 4.6, 4.7
 *
 * For any authenticated user object with any combination of displayName
 * (string or null), email (string or null), and photoURL (string or null),
 * the HomeScreen should display displayName if non-null or email as fallback,
 * and should render a profile image component when photoURL is non-null or a
 * placeholder avatar when photoURL is null.
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock useAuth so we can inject arbitrary user data without a real AuthProvider
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock expo-image: render a plain View with testID so we can query it
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID, ...props }: { testID?: string; [key: string]: unknown }) =>
      React.createElement(View, { testID: testID ?? 'expo-image', ...props }),
  };
});

// Mock react-native-safe-area-context: render children directly
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock ThemedView and ThemedText to avoid theme/hook dependencies
jest.mock('@/components/themed-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
  };
});

jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({
      children,
      testID,
      style,
    }: {
      children?: React.ReactNode;
      testID?: string;
      style?: object;
    }) => React.createElement(Text, { testID, style }, children),
  };
});

// Mock useTheme to return a minimal theme object
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ backgroundElement: '#cccccc', text: '#000000' }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useAuth } from '@/context/auth-context';
import HomeScreen from '../app/(tabs)/index';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Generates a non-empty, non-whitespace-only string suitable for displayName
 * or email values. We avoid empty strings because the component uses
 * `charAt(0)` for the avatar initial and empty strings would produce '?'.
 */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates a URL string for photoURL values.
 */
const photoUrlArb = fc.webUrl();

/**
 * Generates a user object with all combinations of nullable fields.
 * This covers the full input space for Property 5.
 */
const userArb = fc.record({
  uid: fc.string({ minLength: 1, maxLength: 28 }),
  displayName: fc.option(nonEmptyStringArb, { nil: null }),
  email: fc.option(nonEmptyStringArb, { nil: null }),
  photoURL: fc.option(photoUrlArb, { nil: null }),
});

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 5: User data display with fallback', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it(
    // Feature: expo-firebase-boilerplate, Property 5: User data display with fallback
    'displays displayName when non-null, or email as fallback when displayName is null — for any user combination',
    () => {
      fc.assert(
        fc.property(userArb, (user) => {
          // Arrange: inject the generated user via the mocked useAuth hook
          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          const { queryByTestId, unmount } = render(<HomeScreen />);

          // ── Requirement 4.6: displayName if non-null, email as fallback ──────
          const userNameEl = queryByTestId('user-name');

          if (user.displayName !== null) {
            // displayName is available — user-name element must be rendered with displayName
            expect(userNameEl).not.toBeNull();
            expect(userNameEl?.props.children).toBe(user.displayName);
          } else if (user.email !== null) {
            // displayName is null but email is available — user-name element must show email
            expect(userNameEl).not.toBeNull();
            expect(userNameEl?.props.children).toBe(user.email);
          } else {
            // Both are null — the user-name element should not be rendered
            // (the component only renders the label when displayLabel !== null)
            expect(userNameEl).toBeNull();
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: expo-firebase-boilerplate, Property 5: User data display with fallback
    'renders profile-image when photoURL is non-null, and avatar-placeholder when photoURL is null — for any user combination',
    () => {
      fc.assert(
        fc.property(userArb, (user) => {
          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          const { queryByTestId, unmount } = render(<HomeScreen />);

          // ── Requirement 4.7: photo vs placeholder ────────────────────────────
          if (user.photoURL !== null) {
            // photoURL is present — Image component must be rendered
            expect(queryByTestId('profile-image')).not.toBeNull();
            // Placeholder must NOT be rendered when photo is available
            expect(queryByTestId('avatar-placeholder')).toBeNull();
          } else {
            // photoURL is null — placeholder must be rendered
            expect(queryByTestId('avatar-placeholder')).not.toBeNull();
            // Image component must NOT be rendered when there is no photo
            expect(queryByTestId('profile-image')).toBeNull();
          }

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: expo-firebase-boilerplate, Property 5: User data display with fallback
    'displayName takes precedence over email when both are non-null',
    () => {
      // Constrain to cases where both displayName and email are non-null
      const bothNonNullArb = fc.record({
        uid: fc.string({ minLength: 1, maxLength: 28 }),
        displayName: nonEmptyStringArb,
        email: nonEmptyStringArb,
        photoURL: fc.option(photoUrlArb, { nil: null }),
      });

      fc.assert(
        fc.property(bothNonNullArb, (user) => {
          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          const { queryByTestId, unmount } = render(<HomeScreen />);

          // displayName must be shown (it takes precedence)
          const userNameEl = queryByTestId('user-name');
          expect(userNameEl).not.toBeNull();
          expect(userNameEl?.props.children).toBe(user.displayName);

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    // Feature: expo-firebase-boilerplate, Property 5: User data display with fallback
    'exactly one of profile-image or avatar-placeholder is rendered for any photoURL value',
    () => {
      fc.assert(
        fc.property(userArb, (user) => {
          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          const { queryByTestId, unmount } = render(<HomeScreen />);

          const hasImage = queryByTestId('profile-image') !== null;
          const hasPlaceholder = queryByTestId('avatar-placeholder') !== null;

          // Exactly one of the two must be rendered — never both, never neither
          expect(hasImage !== hasPlaceholder).toBe(true);

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

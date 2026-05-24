// Feature: AsalUsul UI Foundation, Properties 3–4: GoogleSignInButton invariants

/**
 * Property 3: GoogleSignInButton loading state invariant
 * Validates: Requirements 5.8, 5.9
 *
 * For any boolean `isLoading`, when `isLoading` is `true` the
 * `ActivityIndicator` is present and the label is absent; when `isLoading` is
 * `false` the label is present and the `ActivityIndicator` is absent.
 */

/**
 * Property 4: GoogleSignInButton accessibility disabled invariant
 * Validates: Requirements 5.12, 5.14, 6.6
 *
 * For any combination of `disabled` and `isLoading` booleans,
 * `accessibilityState.disabled` is `true` whenever either flag is `true`, and
 * `false` only when both are `false`.
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock @expo/vector-icons so AntDesign renders without native module bindings
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AntDesign: ({ testID, ...props }: { testID?: string; [key: string]: unknown }) =>
      React.createElement(View, { testID: testID ?? 'ant-design-icon', ...props }),
  };
});

// Mock ThemedText to render a plain Text node so queryByText works correctly
jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({
      children,
      style,
      testID,
    }: {
      children?: React.ReactNode;
      style?: object;
      testID?: string;
    }) => React.createElement(Text, { style, testID }, children),
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

import { GoogleSignInButton } from '@/components/google-sign-in-button';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 3: GoogleSignInButton loading state invariant', () => {
  /**
   * For any boolean `isLoading`, `ActivityIndicator` is present iff
   * `isLoading === true`; label is present iff `isLoading === false`.
   *
   * **Validates: Requirements 5.8, 5.9**
   */
  it(
    'shows ActivityIndicator iff isLoading is true, and label iff isLoading is false — for any boolean isLoading',
    () => {
      fc.assert(
        fc.property(fc.boolean(), (isLoading) => {
          const { queryByTestId, queryByText, unmount } = render(
            <GoogleSignInButton onPress={() => {}} isLoading={isLoading} />
          );
          if (isLoading) {
            expect(queryByTestId('activity-indicator')).not.toBeNull();
            expect(queryByText(/Masuk dengan Google/i)).toBeNull();
          } else {
            expect(queryByTestId('activity-indicator')).toBeNull();
            expect(queryByText(/Masuk dengan Google/i)).not.toBeNull();
          }
          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

describe('Property 4: GoogleSignInButton accessibility disabled invariant', () => {
  /**
   * For any combination of `disabled` and `isLoading`, `accessibilityState.disabled`
   * is `true` iff `disabled || isLoading`.
   *
   * **Validates: Requirements 5.12, 5.14, 6.6**
   */
  it(
    'sets accessibilityState.disabled to (disabled || isLoading) for any boolean combination',
    () => {
      fc.assert(
        fc.property(fc.boolean(), fc.boolean(), (disabled, isLoading) => {
          const { getByRole, unmount } = render(
            <GoogleSignInButton
              onPress={() => {}}
              disabled={disabled}
              isLoading={isLoading}
            />
          );
          const button = getByRole('button');
          const expectedDisabled = disabled || isLoading;
          expect(button.props.accessibilityState?.disabled).toBe(expectedDisabled);
          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

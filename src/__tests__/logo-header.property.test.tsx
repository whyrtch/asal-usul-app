/**
 * Property tests for LogoHeader component
 *
 * Property 1: tagline visibility invariant
 *   Validates: Requirements 5.3, 5.4
 *
 * Property 2: app name always present invariant
 *   Validates: Requirements 5.2
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock expo-image: render a plain View so the component tree renders without
// the native module that expo-image requires at runtime in tests.
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID, ...props }: { testID?: string; [key: string]: unknown }) =>
      React.createElement(View, { testID: testID ?? 'expo-image', ...props }),
  };
});

// Mock ThemedText to avoid theme/hook dependencies while still rendering
// children as plain Text so queryByText works correctly.
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

// ── Import after mocks ────────────────────────────────────────────────────────

import { LogoHeader } from '@/components/logo-header';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('LogoHeader property tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 1: tagline visibility invariant
   * **Validates: Requirements 5.3, 5.4**
   *
   * For any boolean `showTagline`, the tagline "Jejak Keluarga dalam Satu Pohon"
   * is rendered if and only if `showTagline === true`.
   */
  it('Property 1: tagline is rendered iff showTagline === true — for any boolean showTagline', () => {
    fc.assert(
      fc.property(fc.boolean(), (showTagline) => {
        const { queryByText, unmount } = render(<LogoHeader showTagline={showTagline} />);
        const tagline = queryByText('Jejak Keluarga dalam Satu Pohon');
        if (showTagline) {
          expect(tagline).not.toBeNull();
        } else {
          expect(tagline).toBeNull();
        }
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: app name always present invariant
   * **Validates: Requirements 5.2**
   *
   * For any valid combination of LogoHeader props, the app name "AsalUsul"
   * is always rendered.
   */
  it('Property 2: "AsalUsul" is always rendered for any valid prop combination', () => {
    fc.assert(
      fc.property(
        fc.record({
          showTagline: fc.boolean(),
          logoSize: fc.option(fc.integer({ min: 32, max: 200 }), { nil: undefined }),
        }),
        (props) => {
          const { queryByText, unmount } = render(<LogoHeader {...props} />);
          expect(queryByText('AsalUsul')).not.toBeNull();
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

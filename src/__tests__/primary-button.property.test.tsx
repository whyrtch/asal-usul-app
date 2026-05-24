// Feature: AsalUsul UI Foundation, Properties 5–6: PrimaryButton invariants

/**
 * Property 5: PrimaryButton label invariant
 * Validates: Requirements 5.20, 5.23
 *
 * For any non-empty string `label`, the PrimaryButton always renders that
 * exact text when `isLoading` is `false`.
 */

/**
 * Property 6: PrimaryButton non-interactive when disabled or loading
 * Validates: Requirements 5.22
 *
 * For any combination of `disabled` and `isLoading` where at least one is
 * `true`, the `onPress` callback is never invoked when the button is pressed.
 */

import { fireEvent, render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

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

import { PrimaryButton } from '../components/primary-button';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 5: PrimaryButton label invariant', () => {
  /**
   * For any non-empty string `label`, `PrimaryButton` always renders that
   * exact text when `isLoading={false}`.
   *
   * **Validates: Requirements 5.20, 5.23**
   */
  it(
    'renders the exact label text for any non-empty string when isLoading is false',
    () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (label) => {
          const { queryByText, unmount } = render(
            <PrimaryButton label={label} onPress={() => {}} isLoading={false} />
          );
          expect(queryByText(label)).not.toBeNull();
          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

describe('Property 6: PrimaryButton non-interactive when disabled or loading', () => {
  /**
   * For any combination where `disabled || isLoading`, `onPress` is never
   * invoked on press.
   *
   * **Validates: Requirements 5.22**
   */
  it(
    'never invokes onPress when disabled or isLoading is true, for any such combination',
    () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ disabled: fc.constant(true), isLoading: fc.boolean() }),
            fc.record({ disabled: fc.boolean(), isLoading: fc.constant(true) }),
          ),
          ({ disabled, isLoading }) => {
            const onPress = jest.fn();
            const { getByRole, unmount } = render(
              <PrimaryButton
                label="Test"
                onPress={onPress}
                disabled={disabled}
                isLoading={isLoading}
              />
            );
            fireEvent.press(getByRole('button'));
            expect(onPress).not.toHaveBeenCalled();
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

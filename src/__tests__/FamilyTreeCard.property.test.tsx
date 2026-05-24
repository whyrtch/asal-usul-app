/**
 * Property tests for FamilyTreeCard component
 *
 * Property 13: FamilyTreeCard renders all required data
 *   Validates: Requirements 4.1, 4.2, 4.3
 *
 * For any valid FamilyTree object, the card renders:
 *   - item.name as the primary heading
 *   - "${item.totalMembers} Anggota" as the member count
 *   - a relative date string starting with "Dibuat "
 *
 * Property 14: FamilyTreeCard onPress passes correct id
 *   Validates: Requirements 4.4
 *
 * For any valid FamilyTree object, pressing the FamilyTreeCard invokes
 * `onPress` with exactly `item.id`.
 */

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock @expo/vector-icons so Ionicons renders without native module bindings
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
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
      numberOfLines,
    }: {
      children?: React.ReactNode;
      style?: object;
      testID?: string;
      numberOfLines?: number;
    }) => React.createElement(Text, { style, testID, numberOfLines }, children),
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

import { fireEvent, render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

import { FamilyTreeCard } from '@/components/family/FamilyTreeCard';
import type { FamilyTree } from '@/types/familyTree';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Generates a valid ISO 8601 date string for dates from 2020-01-01 up to now.
 * This ensures formatRelativeDate always returns a "Dibuat …" string.
 */
const isoDateArb = fc
  .integer({ min: new Date('2020-01-01').getTime(), max: Date.now() })
  .map((ms) => new Date(ms).toISOString());

/**
 * Generates a valid FamilyTree object with all required fields populated.
 */
const familyTreeArb: fc.Arbitrary<FamilyTree> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 32 }),
  name: fc.string({ minLength: 1, maxLength: 64 }),
  description: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 128 })),
  coverImage: fc.oneof(fc.constant(null), fc.constant('https://example.com/cover.jpg')),
  ownerId: fc.string({ minLength: 1, maxLength: 32 }),
  createdAt: isoDateArb,
  updatedAt: isoDateArb,
  totalMembers: fc.integer({ min: 0, max: 1000 }),
});

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 13: FamilyTreeCard renders all required data', () => {
  /**
   * For any valid FamilyTree, the card renders:
   *   1. item.name as the primary heading text
   *   2. "${item.totalMembers} Anggota" as the member count string
   *   3. a relative date string starting with "Dibuat "
   *
   * **Validates: Requirements 4.1, 4.2, 4.3**
   */
  it(
    'renders item.name, member count, and a "Dibuat …" date for any valid FamilyTree',
    () => {
      fc.assert(
        fc.property(familyTreeArb, (item) => {
          const { queryByText, unmount } = render(
            <FamilyTreeCard item={item} onPress={() => {}} />
          );

          // Requirement 4.1: item.name is rendered as the primary heading
          expect(queryByText(item.name)).not.toBeNull();

          // Requirement 4.2: member count rendered as "${totalMembers} Anggota"
          expect(queryByText(`${item.totalMembers} Anggota`)).not.toBeNull();

          // Requirement 4.3: relative date starts with "Dibuat "
          const allTexts = queryByText(/^Dibuat /);
          expect(allTexts).not.toBeNull();

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

describe('Property 14: FamilyTreeCard onPress passes correct id', () => {
  /**
   * For any valid FamilyTree object, pressing the FamilyTreeCard invokes
   * `onPress` with exactly `item.id`.
   *
   * **Validates: Requirements 4.4**
   */
  it(
    'invokes onPress with exactly item.id when the card is pressed, for any valid FamilyTree',
    () => {
      fc.assert(
        fc.property(familyTreeArb, (item) => {
          const onPress = jest.fn();

          const { getByRole, unmount } = render(
            <FamilyTreeCard item={item} onPress={onPress} />
          );

          fireEvent.press(getByRole('button'));

          expect(onPress).toHaveBeenCalledTimes(1);
          expect(onPress).toHaveBeenCalledWith(item.id);

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'does not throw when no onPress prop is provided, for any valid FamilyTree',
    () => {
      fc.assert(
        fc.property(familyTreeArb, (item) => {
          expect(() => {
            const { getByRole, unmount } = render(
              <FamilyTreeCard item={item} />
            );
            fireEvent.press(getByRole('button'));
            unmount();
          }).not.toThrow();
        }),
        { numRuns: 50 }
      );
    }
  );
});

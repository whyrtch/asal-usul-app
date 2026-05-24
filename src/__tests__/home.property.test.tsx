/**
 * Property tests for src/app/(tabs)/index.tsx (HomeScreen)
 *
 * Property 1: Home Screen conditional rendering invariant
 *   - Renders EmptyState iff familyTrees.length === 0
 *   - Renders FamilyTreeCard entries iff familyTrees.length > 0
 *
 * Validates: Requirements 1.1, 1.2
 */

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
        React.createElement(View, { style }, children),
    },
    FadeInDown: {
      duration: () => ({ duration: jest.fn() }),
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('@/components/home-header', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HomeHeader: () => React.createElement(View, { testID: 'home-header' }),
  };
});

jest.mock('@/components/family/EmptyState', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    EmptyState: ({ onCreatePress }: { onCreatePress: () => void }) =>
      React.createElement(View, { testID: 'empty-state', onTouchEnd: onCreatePress }),
  };
});

jest.mock('@/components/family/FamilyTreeCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    FamilyTreeCard: ({ item }: { item: { id: string; name: string } }) =>
      React.createElement(
        View,
        { testID: `family-tree-card-${item.id}` },
        React.createElement(Text, null, item.name),
      ),
  };
});

jest.mock('@/components/family/CreateFamilyTreeModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CreateFamilyTreeModal: ({ visible }: { visible: boolean; onClose: () => void; onSubmit: (name: string) => void }) =>
      React.createElement(View, { testID: 'create-family-tree-modal', accessibilityState: { selected: visible } }),
  };
});

// Controllable store mock
const mockAddFamilyTree = jest.fn();
let mockFamilyTrees: { id: string; name: string; totalMembers: number; createdAt: string; updatedAt: string; ownerId: string; description: null; coverImage: null }[] = [];

jest.mock('@/store/useFamilyTreeStore', () => ({
  useFamilyTreeStore: (selector: (state: { familyTrees: typeof mockFamilyTrees; addFamilyTree: typeof mockAddFamilyTree }) => unknown) =>
    selector({ familyTrees: mockFamilyTrees, addFamilyTree: mockAddFamilyTree }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

import HomeScreen from '../app/(tabs)/index';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generates a valid FamilyTree-like object for testing. */
const familyTreeArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  totalMembers: fc.nat(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map((d) => d.toISOString()),
  ownerId: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.constant(null),
  coverImage: fc.constant(null),
});

// ── Property Tests ────────────────────────────────────────────────────────────

describe('HomeScreen property tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyTrees = [];
  });

  /**
   * Property 1: Home Screen conditional rendering invariant
   *
   * For any FamilyTreeStore state:
   * - Renders EmptyState iff familyTrees.length === 0
   * - Renders FamilyTreeCard entries iff familyTrees.length > 0
   *
   * Validates: Requirements 1.1, 1.2
   */
  it('renders EmptyState iff familyTrees.length === 0 (Property 1)', () => {
    fc.assert(
      fc.property(fc.array(familyTreeArb, { minLength: 0, maxLength: 5 }), (trees) => {
        mockFamilyTrees = trees;

        const { queryByTestId, unmount } = render(<HomeScreen />);

        if (trees.length === 0) {
          // Must render EmptyState
          expect(queryByTestId('empty-state')).not.toBeNull();
          // Must NOT render any FamilyTreeCard
          trees.forEach((t) => {
            expect(queryByTestId(`family-tree-card-${t.id}`)).toBeNull();
          });
        } else {
          // Must NOT render EmptyState
          expect(queryByTestId('empty-state')).toBeNull();
          // Must render a FamilyTreeCard for each tree
          trees.forEach((t) => {
            expect(queryByTestId(`family-tree-card-${t.id}`)).not.toBeNull();
          });
        }

        unmount();
      }),
      { numRuns: 30 },
    );
  });

  /**
   * Property: CreateFamilyTreeModal is always rendered regardless of store state.
   * Validates: Requirement 1.6
   */
  it('always renders CreateFamilyTreeModal regardless of familyTrees state (Req 1.6)', () => {
    fc.assert(
      fc.property(fc.array(familyTreeArb, { minLength: 0, maxLength: 5 }), (trees) => {
        mockFamilyTrees = trees;

        const { getByTestId, unmount } = render(<HomeScreen />);
        expect(getByTestId('create-family-tree-modal')).toBeTruthy();
        unmount();
      }),
      { numRuns: 20 },
    );
  });
});

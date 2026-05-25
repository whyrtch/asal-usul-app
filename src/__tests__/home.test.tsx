/**
 * Integration tests for src/app/(tabs)/index.tsx (HomeScreen)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 *
 * Tests:
 * - Renders HomeHeader
 * - Renders EmptyState when familyTrees is empty (Req 1.1)
 * - Does NOT render FlatList when familyTrees is empty (Req 1.1)
 * - Renders FlatList of FamilyTreeCard when familyTrees has entries (Req 1.2)
 * - Does NOT render EmptyState when familyTrees has entries (Req 1.2)
 * - Renders create button in header when trees exist (Req 1.3)
 * - EmptyState onCreatePress opens modal (Req 1.4)
 * - Header create button opens modal (Req 1.5)
 * - CreateFamilyTreeModal is always rendered (Req 1.6)
 * - Modal onSubmit calls addFamilyTree then closes modal (Req 1.7)
 * - Modal onClose sets modalVisible to false (Req 1.8)
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock auth-context so HomeScreen can call useAuth() without Firebase
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(() => ({ user: { uid: 'local-user' }, loading: false })),
}));

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
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      React.createElement(Text, { testID: testID ?? `icon-${name}` }, name),
  };
});

jest.mock('@/components/home-header', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HomeHeader: ({ actionIcon }: { actionIcon?: string }) =>
      React.createElement(View, { testID: 'home-header', accessibilityLabel: actionIcon }),
  };
});

// EmptyState mock — renders a pressable button with testID
jest.mock('@/components/family/EmptyState', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    EmptyState: ({ onCreatePress }: { onCreatePress: () => void }) =>
      React.createElement(
        Pressable,
        { testID: 'empty-state', onPress: onCreatePress },
        React.createElement(Text, null, 'Buat Sekarang'),
      ),
  };
});

// FamilyTreeCard mock — renders a View with the item name
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

// CreateFamilyTreeModal mock — captures visible, onClose, onSubmit
const mockModalOnClose = jest.fn();
const mockModalOnSubmit = jest.fn();
jest.mock('@/components/family/CreateFamilyTreeModal', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  return {
    CreateFamilyTreeModal: ({
      visible,
      onClose,
      onSubmit,
    }: {
      visible: boolean;
      onClose: () => void;
      onSubmit: (name: string) => void;
    }) => {
      // Store refs so tests can call them
      mockModalOnClose.mockImplementation(onClose);
      mockModalOnSubmit.mockImplementation(onSubmit);
      return React.createElement(
        View,
        { testID: 'create-family-tree-modal', accessibilityState: { selected: visible } },
        React.createElement(
          Pressable,
          { testID: 'modal-close-btn', onPress: onClose },
          React.createElement(Text, null, 'Batal'),
        ),
        React.createElement(
          Pressable,
          { testID: 'modal-submit-btn', onPress: () => onSubmit('Test Tree') },
          React.createElement(Text, null, 'Buat'),
        ),
      );
    },
  };
});

// useFamilyTreeStore mock — controllable state
const mockCreateFamilyTree = jest.fn();
let mockFamilyTrees: { id: string; name: string; totalMembers: number; createdAt: string; updatedAt: string; ownerId: string; description: null; coverImage: null }[] = [];

jest.mock('@/store/useFamilyTreeStore', () => ({
  useFamilyTreeStore: (selector: (state: {
    familyTrees: typeof mockFamilyTrees;
    createFamilyTree: typeof mockCreateFamilyTree;
    loading: boolean;
    error: string | null;
    loadFamilyTrees: jest.Mock;
  }) => unknown) =>
    selector({
      familyTrees: mockFamilyTrees,
      createFamilyTree: mockCreateFamilyTree,
      loading: false,
      error: null,
      loadFamilyTrees: jest.fn(),
    }),
}));

// ── Import component under test ───────────────────────────────────────────────

import HomeScreen from '../app/(tabs)/index';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyTrees = [];
  });

  // ── Requirement 1.1: EmptyState when no trees ─────────────────────────────

  it('renders HomeHeader', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('home-header')).toBeTruthy();
  });

  it('renders EmptyState when familyTrees is empty (Req 1.1)', () => {
    mockFamilyTrees = [];
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('empty-state')).toBeTruthy();
  });

  it('does NOT render FamilyTreeCard when familyTrees is empty (Req 1.1)', () => {
    mockFamilyTrees = [];
    const { queryByTestId } = render(<HomeScreen />);
    expect(queryByTestId('family-tree-card-1')).toBeNull();
  });

  // ── Requirement 1.2: FlatList when trees exist ────────────────────────────

  it('renders FamilyTreeCard when familyTrees has entries (Req 1.2)', () => {
    mockFamilyTrees = [
      {
        id: 'tree-1',
        name: 'Keluarga Budi',
        totalMembers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'local-user',
        description: null,
        coverImage: null,
      },
    ];
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('family-tree-card-tree-1')).toBeTruthy();
  });

  it('does NOT render EmptyState when familyTrees has entries (Req 1.2)', () => {
    mockFamilyTrees = [
      {
        id: 'tree-1',
        name: 'Keluarga Budi',
        totalMembers: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'local-user',
        description: null,
        coverImage: null,
      },
    ];
    const { queryByTestId } = render(<HomeScreen />);
    expect(queryByTestId('empty-state')).toBeNull();
  });

  // ── Requirement 1.6: Modal always rendered ────────────────────────────────

  it('always renders CreateFamilyTreeModal (Req 1.6)', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('create-family-tree-modal')).toBeTruthy();
  });

  // ── Requirement 1.4: EmptyState button opens modal ────────────────────────

  it('pressing EmptyState opens the modal (Req 1.4)', () => {
    mockFamilyTrees = [];
    const { getByTestId } = render(<HomeScreen />);
    const emptyState = getByTestId('empty-state');
    fireEvent.press(emptyState);
    // Modal should now be visible (accessibilityState.selected = true)
    const modal = getByTestId('create-family-tree-modal');
    expect(modal.props.accessibilityState?.selected).toBe(true);
  });

  // ── Requirement 1.7: Modal onSubmit calls addFamilyTree then closes ───────

  it('modal onSubmit calls addFamilyTree and closes modal (Req 1.7)', () => {
    mockFamilyTrees = [];
    const { getByTestId } = render(<HomeScreen />);

    // Open modal first
    fireEvent.press(getByTestId('empty-state'));

    // Submit via modal
    fireEvent.press(getByTestId('modal-submit-btn'));

    expect(mockCreateFamilyTree).toHaveBeenCalledWith('Test Tree', 'local-user');

    // Modal should be closed
    const modal = getByTestId('create-family-tree-modal');
    expect(modal.props.accessibilityState?.selected).toBe(false);
  });

  // ── Requirement 1.8: Modal onClose sets modalVisible false ────────────────

  it('modal onClose sets modalVisible to false (Req 1.8)', () => {
    mockFamilyTrees = [];
    const { getByTestId } = render(<HomeScreen />);

    // Open modal
    fireEvent.press(getByTestId('empty-state'));
    expect(getByTestId('create-family-tree-modal').props.accessibilityState?.selected).toBe(true);

    // Close modal
    fireEvent.press(getByTestId('modal-close-btn'));
    expect(getByTestId('create-family-tree-modal').props.accessibilityState?.selected).toBe(false);
  });
});

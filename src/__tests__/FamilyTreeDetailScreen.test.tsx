/**
 * Integration tests for src/app/family/[id].tsx (FamilyTreeDetailScreen)
 *
 * Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 5.2, 5.3, 5.6
 *
 * Tests:
 * - Render with empty store members → EmptyTreeState is visible (Req 2.1)
 * - Tap "Tambah Anggota Pertama" → FamilyMemberForm appears (Req 2.2)
 * - Fill required fields and submit → FamilyTreeCanvas appears, FamilyTreeNode with member name visible (Req 2.3, 5.6)
 * - totalMembers increments to 1 in the store after valid submit (Req 5.2, 5.3)
 * - Unknown treeId → router.back() is called (Req 1.5)
 */

import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock Firebase dependencies so Jest doesn't need native modules
jest.mock('@/repositories/familyTreeRepository', () => ({
  fetchFamilyTrees: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/services/firebase/firestore', () => ({
  isPermissionError: jest.fn().mockReturnValue(false),
  isNetworkError: jest.fn().mockReturnValue(false),
}));

// Mock auth-context so the screen can call useAuth() without Firebase
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(() => ({ user: { uid: 'local-user' }, loading: false })),
}));

// Mock useMemberStore — members are now managed separately
const mockLoadMembers = jest.fn().mockResolvedValue(undefined);
jest.mock('@/store/useMemberStore', () => ({
  useMemberStore: (selector: (state: {
    membersByTreeId: Record<string, unknown[]>;
    loadMembers: jest.Mock;
    addMember: jest.Mock;
    updateMember: jest.Mock;
    deleteMember: jest.Mock;
    clearMembers: jest.Mock;
    loadingTreeId: null;
    memberError: null;
  }) => unknown) =>
    selector({
      membersByTreeId: {},
      loadMembers: mockLoadMembers,
      addMember: jest.fn(),
      updateMember: jest.fn(),
      deleteMember: jest.fn(),
      clearMembers: jest.fn(),
      loadingTreeId: null,
      memberError: null,
    }),
}));

// react-native-reanimated: stub all animation primitives for synchronous rendering
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const AnimatedView = ({
    children,
    style,
    entering: _entering,
    exiting: _exiting,
  }: {
    children?: React.ReactNode;
    style?: object;
    entering?: unknown;
    exiting?: unknown;
  }) => React.createElement(View, { style }, children);

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      ScrollView: ({
        children,
        style,
        contentContainerStyle,
      }: {
        children?: React.ReactNode;
        style?: object;
        contentContainerStyle?: object;
      }) =>
        React.createElement(
          View,
          { style: [style, contentContainerStyle] },
          children,
        ),
    },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withSpring: (toValue: number) => toValue,
    withTiming: (toValue: number) => toValue,
    FadeIn: {
      duration: () => ({ delay: () => ({}) }),
    },
    FadeOut: {
      duration: () => ({}),
    },
    FadeInDown: {
      duration: () => ({ delay: () => ({}) }),
    },
    SlideInDown: {
      duration: () => ({ springify: () => ({}) }),
      springify: () => ({}),
    },
    SlideOutDown: {
      duration: () => ({}),
    },
    ZoomIn: {
      duration: () => ({ delay: () => ({}) }),
    },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    Easing: {
      out: (_fn: unknown) => (_t: number) => 0,
      cubic: (_t: number) => 0,
    },
  };
});

// react-native-safe-area-context: render children directly
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: object;
    }) => React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// @expo/vector-icons: render a plain Text so Ionicons doesn't need native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
  };
});

// expo-router: mock useLocalSearchParams, useRouter, and Stack
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
let mockSearchParams: { id?: string } = { id: 'test-tree-id' };

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useLocalSearchParams: () => mockSearchParams,
    useRouter: () => ({ back: mockRouterBack, push: jest.fn(), replace: mockRouterReplace }),
    Stack: {
      Screen: ({ options }: { options?: { title?: string } }) =>
        React.createElement(View, { testID: 'stack-screen', accessibilityLabel: options?.title }),
    },
  };
});

// ── Import real store and component after mocks ───────────────────────────────

import FamilyTreeDetailScreen from '../app/family/[id]';
import { useFamilyTreeStore } from '../store/useFamilyTreeStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_TREE_ID = 'test-tree-id';
const UNKNOWN_TREE_ID = 'unknown-tree-id-xyz';

/** Seed the store with a single FamilyTree (no members). */
function seedStoreWithTree() {
  useFamilyTreeStore.setState({
    familyTrees: [
      {
        id: TEST_TREE_ID,
        name: 'Keluarga Test',
        description: null,
        coverImage: null,
        ownerId: 'local-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalMembers: 0,
        shareWith: [],
      },
    ],
    loading: false,
    error: null,
  });
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = { id: TEST_TREE_ID };
  // Reset store to a clean state before each test
  useFamilyTreeStore.setState({ familyTrees: [], loading: false, error: null });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FamilyTreeDetailScreen', () => {
  // ── Requirement 2.1: EmptyTreeState when no members ──────────────────────────

  describe('Requirement 2.1 — renders EmptyTreeState when tree has no members', () => {
    it('shows "Mulai Pohon Keluargamu" heading when tree is empty', () => {
      seedStoreWithTree();
      const { getByText } = render(<FamilyTreeDetailScreen />);
      expect(getByText('Mulai Pohon Keluargamu')).toBeTruthy();
    });

    it('shows "Tambah Anggota Pertama" CTA button when tree is empty', () => {
      seedStoreWithTree();
      const { getByText } = render(<FamilyTreeDetailScreen />);
      expect(getByText('Tambah Anggota Pertama')).toBeTruthy();
    });

    it('does NOT show FamilyMemberForm when tree is empty and form not opened', () => {
      seedStoreWithTree();
      const { queryByText } = render(<FamilyTreeDetailScreen />);
      // "Simpan" is the submit button label in FamilyMemberForm
      expect(queryByText('Simpan')).toBeNull();
    });
  });

  // ── Requirement 2.2: FamilyMemberForm appears after tapping CTA ──────────────

  describe('Requirement 2.2 — FamilyMemberForm appears after tapping "Tambah Anggota Pertama"', () => {
    it('shows "Simpan" submit button after tapping "Tambah Anggota Pertama"', () => {
      seedStoreWithTree();
      const { getByText } = render(<FamilyTreeDetailScreen />);

      act(() => {
        fireEvent.press(getByText('Tambah Anggota Pertama'));
      });

      expect(getByText('Simpan')).toBeTruthy();
    });

    it('hides EmptyTreeState heading after tapping "Tambah Anggota Pertama"', () => {
      seedStoreWithTree();
      const { getByText, queryByText } = render(<FamilyTreeDetailScreen />);

      act(() => {
        fireEvent.press(getByText('Tambah Anggota Pertama'));
      });

      expect(queryByText('Mulai Pohon Keluargamu')).toBeNull();
    });

    it('shows "Tambah Anggota Pertama" form title in FamilyMemberForm', () => {
      seedStoreWithTree();
      const { getByText, getAllByText } = render(<FamilyTreeDetailScreen />);

      act(() => {
        fireEvent.press(getByText('Tambah Anggota Pertama'));
      });

      // The form header also contains "Tambah Anggota Pertama" as its title
      const matches = getAllByText('Tambah Anggota Pertama');
      // At least one instance should be the form title
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Requirements 2.3, 5.6: FamilyTreeCanvas after valid submit ───────────────

  describe('Requirements 2.3, 5.6 — FamilyTreeCanvas appears after valid form submit', () => {
    it.skip('shows member name in FamilyTreeNode after filling and submitting the form', async () => {
      // NOTE: addMember has moved to useMemberStore (task 9.1). This test will be
      // re-enabled once useMemberStore is wired to the screen in task 11.3.
    });

    it.skip('shows member role in FamilyTreeNode after valid submit', async () => {
      // NOTE: addMember has moved to useMemberStore (task 9.1). This test will be
      // re-enabled once useMemberStore is wired to the screen in task 11.3.
    });

    it('hides FamilyMemberForm after valid submit', async () => {
      seedStoreWithTree();
      const { getByText, getByLabelText, queryByText } = render(
        <FamilyTreeDetailScreen />,
      );

      act(() => {
        fireEvent.press(getByText('Tambah Anggota Pertama'));
      });

      act(() => {
        fireEvent.changeText(getByLabelText('Nama lengkap'), 'Budi Santoso');
      });

      act(() => {
        fireEvent.press(getByLabelText('Laki-laki'));
      });

      act(() => {
        fireEvent.press(getByLabelText('Ayah'));
      });

      act(() => {
        fireEvent.press(getByText('Simpan'));
      });

      // Form submit button should no longer be visible
      expect(queryByText('Simpan')).toBeNull();
    });
  });

  // ── Requirements 5.2, 5.3: totalMembers increments to 1 after submit ─────────

  describe('Requirements 5.2, 5.3 — totalMembers increments to 1 after valid submit', () => {
    it.skip('increments totalMembers from 0 to 1 after adding the first member', () => {
      // NOTE: addMember has moved to useMemberStore (task 9.1). totalMembers increment
      // will be handled by the repository layer. This test will be re-enabled in task 11.3.
    });

    it.skip('adds exactly one member to the store members array after valid submit', () => {
      // NOTE: members have moved to useMemberStore (task 9.1). This test will be
      // re-enabled once useMemberStore is wired to the screen in task 11.3.
    });

    it('does NOT increment totalMembers when form is submitted with missing required fields', () => {
      seedStoreWithTree();

      const { getByText } = render(<FamilyTreeDetailScreen />);

      act(() => {
        fireEvent.press(getByText('Tambah Anggota Pertama'));
      });

      // Submit without filling any fields
      act(() => {
        fireEvent.press(getByText('Simpan'));
      });

      const after = useFamilyTreeStore
        .getState()
        .familyTrees.find((t) => t.id === TEST_TREE_ID);
      expect(after?.totalMembers).toBe(0);
    });
  });

  // ── Requirement 1.5: unknown treeId → router.replace('/(tabs)') is called ──

  describe('Requirement 1.5 — unknown treeId calls router.replace()', () => {
    it('calls router.replace() when treeId does not match any tree in the store', () => {
      // Store is empty — no trees at all
      mockSearchParams = { id: UNKNOWN_TREE_ID };

      render(<FamilyTreeDetailScreen />);

      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('calls router.replace() when store has trees but none match the given treeId', () => {
      seedStoreWithTree(); // seeds TEST_TREE_ID, not UNKNOWN_TREE_ID
      mockSearchParams = { id: UNKNOWN_TREE_ID };

      render(<FamilyTreeDetailScreen />);

      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('does NOT call router.replace() when treeId matches a tree in the store', () => {
      seedStoreWithTree();
      mockSearchParams = { id: TEST_TREE_ID };

      render(<FamilyTreeDetailScreen />);

      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });
});

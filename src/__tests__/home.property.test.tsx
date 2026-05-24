/**
 * Property tests for src/app/(tabs)/index.tsx (HomeScreen)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9
 *
 * Full property-based tests are implemented in task 11.2.
 * This file is updated as part of task 11.1 to remove stale tests
 * that referenced the old profile/avatar screen structure.
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

jest.mock('@/components/hero-illustration', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HeroIllustration: () => React.createElement(View, { testID: 'hero-illustration' }),
  };
});

jest.mock('@/components/primary-button', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    PrimaryButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(
        Pressable,
        { testID: 'primary-button', onPress },
        React.createElement(Text, null, label)
      ),
  };
});

jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      React.createElement(Text, { style }, children),
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

import HomeScreen from '../app/(tabs)/index';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('HomeScreen property tests', () => {
  /**
   * Property: HomeScreen always renders the required empty-state elements
   * regardless of how many times it is rendered.
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   */
  it('always renders all required empty-state elements across multiple renders', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (renderCount) => {
        let result: ReturnType<typeof render> | null = null;

        for (let i = 0; i < renderCount; i++) {
          if (result) result.unmount();
          result = render(<HomeScreen />);
        }

        if (!result) return;

        const { getByTestId, getByText } = result;

        // Requirement 3.1: HomeHeader always present
        expect(getByTestId('home-header')).toBeTruthy();

        // Requirement 3.2: HeroIllustration always present
        expect(getByTestId('hero-illustration')).toBeTruthy();

        // Requirement 3.3: heading always present
        expect(getByText('Belum ada pohon keluarga')).toBeTruthy();

        // Requirement 3.4: description always present
        expect(
          getByText(
            'Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya'
          )
        ).toBeTruthy();

        // Requirement 3.5: CTA button always present
        expect(getByTestId('primary-button')).toBeTruthy();

        result.unmount();
      }),
      { numRuns: 20 }
    );
  });
});

/**
 * Integration tests for src/app/(tabs)/index.tsx (HomeScreen)
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 *
 * Tests:
 * - Renders HomeHeader
 * - Renders HeroIllustration
 * - Renders "Belum ada pohon keluarga" heading
 * - Renders description text
 * - Renders "Buat Sekarang" PrimaryButton
 * - PrimaryButton onPress is invokable (placeholder handler)
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// react-native-reanimated: mock Animated.View and entering props
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

// react-native-safe-area-context: render children directly
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// @expo/vector-icons: mock Ionicons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) =>
      React.createElement(Text, { testID: testID ?? `icon-${name}` }, name),
  };
});

// HomeHeader: render a simple View with testID
jest.mock('@/components/home-header', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HomeHeader: ({ actionIcon }: { actionIcon?: string }) =>
      React.createElement(View, { testID: 'home-header', accessibilityLabel: actionIcon }),
  };
});

// HeroIllustration: render a simple View with testID
jest.mock('@/components/hero-illustration', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HeroIllustration: () => React.createElement(View, { testID: 'hero-illustration' }),
  };
});

// PrimaryButton: render a Pressable with testID and label text
jest.mock('@/components/primary-button', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    PrimaryButton: ({
      label,
      onPress,
      variant,
    }: {
      label: string;
      onPress: () => void;
      variant?: string;
    }) =>
      React.createElement(
        Pressable,
        { testID: 'primary-button', onPress, accessibilityLabel: label, accessibilityHint: variant },
        React.createElement(Text, null, label)
      ),
  };
});

// ThemedText: render plain Text
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

// ── Import component under test ───────────────────────────────────────────────

import HomeScreen from '../app/(tabs)/index';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Requirement 3.1: HomeHeader ───────────────────────────────────────────

  it('renders HomeHeader', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('home-header')).toBeTruthy();
  });

  // ── Requirement 3.2: HeroIllustration ────────────────────────────────────

  it('renders HeroIllustration', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('hero-illustration')).toBeTruthy();
  });

  // ── Requirement 3.3: heading text ────────────────────────────────────────

  it('renders "Belum ada pohon keluarga" heading', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Belum ada pohon keluarga')).toBeTruthy();
  });

  // ── Requirement 3.4: description text ────────────────────────────────────

  it('renders description text', () => {
    const { getByText } = render(<HomeScreen />);
    expect(
      getByText(
        'Mulai buat pohon keluarga Anda dan hubungkan dengan anggota keluarga lainnya'
      )
    ).toBeTruthy();
  });

  // ── Requirement 3.5: PrimaryButton with correct label ────────────────────

  it('renders "Buat Sekarang" PrimaryButton', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Buat Sekarang')).toBeTruthy();
  });

  // ── Requirement 3.9: PrimaryButton onPress is invokable ──────────────────

  it('PrimaryButton onPress is invokable (placeholder handler)', () => {
    const { getByTestId } = render(<HomeScreen />);
    const button = getByTestId('primary-button');
    // Should not throw when pressed
    expect(() => fireEvent.press(button)).not.toThrow();
  });
});

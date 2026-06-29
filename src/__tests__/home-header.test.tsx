/**
 * Unit tests for src/components/home-header.tsx (HomeHeader)
 * Requirements: 5.30, 5.31, 5.32, 5.33
 *
 * Tests:
 * - Renders "AsalUsul" text
 * - Renders action icon button when `actionIcon` is provided
 * - Does NOT render action icon button when `actionIcon` is omitted
 * - Calls `onActionPress` when icon button is tapped
 */

import { fireEvent, render } from '@testing-library/react-native';

// ── Module mocks ──────────────────────────────────────────────────────────────

// @expo/vector-icons: mock Ionicons so it renders without native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) => (
      <View testID={testID ?? `icon-${name}`} />
    ),
  };
});

// react-native-reanimated: stub all animation primitives for synchronous rendering
// (icon-button.tsx imports useSharedValue, useAnimatedStyle, withSpring)
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: (props: object) => React.createElement(View, props),
    },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withSpring: (toValue: number) => toValue,
    withTiming: (toValue: number) => toValue,
    SlideInDown: {
      duration: () => ({ springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }) }),
      springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }),
    },
    SlideOutDown: {
      duration: () => ({}),
    },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    Easing: { out: () => () => 0, cubic: () => 0 },
  };
});

// ── Import component under test ───────────────────────────────────────────────

import { HomeHeader } from '../components/home-header';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeHeader', () => {
  // ── Requirement 5.30: renders "AsalUsul" text ────────────────────────────────

  it('renders "AsalUsul" text', () => {
    const { getByText } = render(<HomeHeader />);
    expect(getByText('AsalUsul')).toBeTruthy();
  });

  // ── Requirement 5.31: renders action icon button when actionIcon is provided ─

  it('renders action icon button when actionIcon is provided', () => {
    const { getByRole } = render(
      <HomeHeader actionIcon="notifications-outline" onActionPress={() => {}} />
    );
    expect(getByRole('button')).toBeTruthy();
  });

  // ── Requirement 5.32: does NOT render action icon button when actionIcon is omitted

  it('does NOT render action icon button when actionIcon is omitted', () => {
    const { queryByRole } = render(<HomeHeader />);
    expect(queryByRole('button')).toBeNull();
  });

  // ── Requirement 5.33: calls onActionPress when icon button is tapped ─────────

  it('calls onActionPress when icon button is tapped', () => {
    const onActionPress = jest.fn();
    const { getByRole } = render(
      <HomeHeader actionIcon="notifications-outline" onActionPress={onActionPress} />
    );
    fireEvent.press(getByRole('button'));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});

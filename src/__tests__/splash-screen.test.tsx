/**
 * Unit tests for src/components/splash-screen.tsx (SplashScreen)
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.10
 *
 * Tests:
 * - renders full-screen background with AsalUsulColors.backgroundWarm
 * - renders logo image
 * - renders app name "AsalUsul"
 * - renders tagline "Jejak Keluarga dalam Satu Pohon"
 * - renders loading text "Memuat..."
 * - calls onAnimationComplete when isReady becomes true
 */

import { act, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

// ── Module mocks ──────────────────────────────────────────────────────────────

// react-native-reanimated: replace with lightweight stubs so Animated.View
// renders as a plain View and entering/exiting props are silently ignored.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Animated = {
    View: ({ children, style, testID, ...rest }: React.ComponentProps<typeof View>) =>
      <View style={style} testID={testID} {...rest}>{children}</View>,
  };

  const FadeIn = {
    duration: () => ({ delay: () => ({}) }),
  };
  const FadeInDown = {
    duration: () => ({ delay: () => ({}) }),
    springify: () => ({}),
  };
  const FadeOut = {
    duration: () => ({}),
  };

  return {
    __esModule: true,
    default: Animated,
    Animated,
    FadeIn,
    FadeInDown,
    FadeOut,
  };
});

// expo-image: mock Image so it renders in Jest without native modules
jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  return {
    Image: (props: object) => <Image testID="splash-logo-image" {...props} />,
  };
});

// ThemedText: render as plain Text so text content is queryable
jest.mock('@/components/themed-text', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, style, type, ...rest }: { children: React.ReactNode; style?: object; type?: string }) =>
      <Text style={style} {...rest}>{children}</Text>,
  };
});

// ── Import component under test ───────────────────────────────────────────────

import { SplashScreen } from '../components/splash-screen';
import { AsalUsulColors } from '../constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSplash(props: Partial<React.ComponentProps<typeof SplashScreen>> = {}) {
  return render(
    <SplashScreen
      isReady={props.isReady ?? false}
      onAnimationComplete={props.onAnimationComplete ?? jest.fn()}
    />
  );
}

/**
 * Flatten a React Native style array/object into a plain object so we can
 * assert individual style properties regardless of how StyleSheet.create
 * registers them.
 */
function flattenStyle(style: unknown): Record<string, unknown> {
  return StyleSheet.flatten(style as Parameters<typeof StyleSheet.flatten>[0]) ?? {};
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // ── Requirement 1.1: full-screen background with backgroundWarm ───────────────

  describe('Requirement 1.1 — renders full-screen background with AsalUsulColors.backgroundWarm', () => {
    it('root view has backgroundColor equal to AsalUsulColors.backgroundWarm', () => {
      const { toJSON } = renderSplash({ isReady: false });
      const tree = toJSON() as { props: { style: unknown } };
      const style = flattenStyle(tree.props.style);
      expect(style.backgroundColor).toBe(AsalUsulColors.backgroundWarm);
    });

    it('root view has a high zIndex to overlay other content', () => {
      const { toJSON } = renderSplash({ isReady: false });
      const tree = toJSON() as { props: { style: unknown } };
      const style = flattenStyle(tree.props.style);
      // zIndex: 1000 ensures the splash sits above all other content
      expect(style.zIndex).toBe(1000);
    });
  });

  // ── Requirement 1.2: renders logo image ──────────────────────────────────────

  describe('Requirement 1.2 — renders logo image', () => {
    it('renders the logo image when isReady is false', () => {
      const { getByTestId } = renderSplash({ isReady: false });
      expect(getByTestId('splash-logo-image')).toBeTruthy();
    });

    it('logo image has width and height of 96', () => {
      const { getByTestId } = renderSplash({ isReady: false });
      const image = getByTestId('splash-logo-image');
      const style = flattenStyle(image.props.style);
      expect(style.width).toBe(96);
      expect(style.height).toBe(96);
    });
  });

  // ── Requirement 1.3: renders app name "AsalUsul" ─────────────────────────────

  describe('Requirement 1.3 — renders app name "AsalUsul"', () => {
    it('renders "AsalUsul" text when isReady is false', () => {
      const { getByText } = renderSplash({ isReady: false });
      expect(getByText('AsalUsul')).toBeTruthy();
    });
  });

  // ── Requirement 1.4: renders tagline ─────────────────────────────────────────

  describe('Requirement 1.4 — renders tagline "Jejak Keluarga dalam Satu Pohon"', () => {
    it('renders the tagline text when isReady is false', () => {
      const { getByText } = renderSplash({ isReady: false });
      expect(getByText('Jejak Keluarga dalam Satu Pohon')).toBeTruthy();
    });
  });

  // ── Requirement 1.5: renders loading text "Memuat..." ────────────────────────

  describe('Requirement 1.5 — renders loading text "Memuat..."', () => {
    it('renders "Memuat..." text when isReady is false', () => {
      const { getByText } = renderSplash({ isReady: false });
      expect(getByText('Memuat...')).toBeTruthy();
    });
  });

  // ── Requirement 1.10: calls onAnimationComplete when isReady becomes true ─────

  describe('Requirement 1.10 — calls onAnimationComplete when isReady becomes true', () => {
    it('does NOT call onAnimationComplete when isReady is false', () => {
      const onAnimationComplete = jest.fn();
      renderSplash({ isReady: false, onAnimationComplete });
      act(() => {
        jest.runAllTimers();
      });
      expect(onAnimationComplete).not.toHaveBeenCalled();
    });

    it('calls onAnimationComplete after 400ms when isReady is true', () => {
      const onAnimationComplete = jest.fn();
      renderSplash({ isReady: true, onAnimationComplete });

      // Before the 400ms timer fires, callback should not have been called
      expect(onAnimationComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onAnimationComplete exactly once when isReady transitions from false to true', () => {
      const onAnimationComplete = jest.fn();
      const { rerender } = renderSplash({ isReady: false, onAnimationComplete });

      // Transition to ready
      act(() => {
        rerender(
          <SplashScreen isReady={true} onAnimationComplete={onAnimationComplete} />
        );
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onAnimationComplete exactly once even after multiple re-renders with isReady=true', () => {
      const onAnimationComplete = jest.fn();
      const { rerender } = renderSplash({ isReady: true, onAnimationComplete });

      // Re-render several times with isReady still true
      act(() => {
        rerender(<SplashScreen isReady={true} onAnimationComplete={onAnimationComplete} />);
        rerender(<SplashScreen isReady={true} onAnimationComplete={onAnimationComplete} />);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
    });

    it('does NOT render logo, app name, tagline, or loading text when isReady is true', () => {
      const { queryByTestId, queryByText } = renderSplash({ isReady: true });
      expect(queryByTestId('splash-logo-image')).toBeNull();
      expect(queryByText('AsalUsul')).toBeNull();
      expect(queryByText('Jejak Keluarga dalam Satu Pohon')).toBeNull();
      expect(queryByText('Memuat...')).toBeNull();
    });
  });
});

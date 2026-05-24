/**
 * Property tests for SplashScreen component
 *
 * Property 10: `onAnimationComplete` called exactly once
 *   Validates: Requirements 1.10, 1.11
 *
 * For any number of re-renders (1–5) before animation completes,
 * `onAnimationComplete` is called exactly once in total.
 */

import { act, render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock react-native-reanimated: replace Animated.View with a plain View and
// stub animation builders so no worklet/native module is needed in tests.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const noopBuilder: Record<string, unknown> = {};
  noopBuilder.duration = () => noopBuilder;
  noopBuilder.delay = () => noopBuilder;
  noopBuilder.springify = () => noopBuilder;
  noopBuilder.easing = () => noopBuilder;

  const AnimatedView = ({
    children,
    entering: _entering,
    exiting: _exiting,
    ...props
  }: {
    children?: React.ReactNode;
    entering?: unknown;
    exiting?: unknown;
    [key: string]: unknown;
  }) => React.createElement(View, props, children);

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
    },
    FadeIn: noopBuilder,
    FadeInDown: noopBuilder,
    FadeOut: noopBuilder,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: unknown) => v,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  };
});

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

// Mock ThemedText to render a plain Text node so queryByText works correctly.
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

import { SplashScreen } from '@/components/splash-screen';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 10: SplashScreen onAnimationComplete called exactly once', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  /**
   * Property 10: `onAnimationComplete` called exactly once
   * **Validates: Requirements 1.10, 1.11**
   *
   * For any number of re-renders (1–5) before the animation completes,
   * `onAnimationComplete` is called exactly once in total.
   *
   * The component uses a `useRef` guard to prevent double-invocation even
   * when re-rendered multiple times before `isReady` transitions to `true`.
   */
  it(
    'calls onAnimationComplete exactly once regardless of re-render count (1–5) before isReady',
    () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (renderCount) => {
          const onComplete = jest.fn();

          const { rerender, unmount } = render(
            <SplashScreen isReady={false} onAnimationComplete={onComplete} />
          );

          // Re-render multiple times while still not ready
          for (let i = 1; i < renderCount; i++) {
            rerender(<SplashScreen isReady={false} onAnimationComplete={onComplete} />);
          }

          // Transition to ready — this triggers the useEffect with the 400ms timer
          rerender(<SplashScreen isReady={true} onAnimationComplete={onComplete} />);

          // Advance fake timers past the 400ms FadeOut duration
          act(() => {
            jest.runAllTimers();
          });

          expect(onComplete).toHaveBeenCalledTimes(1);

          unmount();
        }),
        { numRuns: 100 }
      );
    }
  );
});

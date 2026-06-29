/**
 * Property tests for CreateFamilyTreeModal component
 *
 * Property 2: Modal submit calls onSubmit with trimmed name
 *   Validates: Requirements 2.4, 5.1
 *
 * For any non-empty, non-whitespace string entered into the modal input,
 * pressing "Buat" invokes `onSubmit` with exactly `name.trim()`.
 *
 * Property 3: Modal blocks submission for whitespace-only input
 *   Validates: Requirements 2.5, 2.6, 5.2, 5.3
 *
 * For any string composed entirely of whitespace characters (including empty
 * string), the submit button SHALL be disabled and `onSubmit` SHALL NOT be
 * invoked.
 */

// ── Module mocks ──────────────────────────────────────────────────────────────

// react-native-reanimated: stub out all animation primitives so the component
// renders synchronously in the test environment without a native UI thread.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View: ({
        children,
        style,
      }: {
        children?: React.ReactNode;
        style?: object;
      }) => React.createElement(View, { style }, children),
    },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withSpring: (toValue: number) => toValue,
    withTiming: (
      toValue: number,
      _options: object,
      callback?: () => void,
    ) => {
      // Immediately invoke the completion callback so onClose fires synchronously
      if (callback) callback();
      return toValue;
    },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    Easing: {
      out: (_fn: unknown) => (_t: number) => 0,
      cubic: (_t: number) => 0,
    },
    SlideInDown: {
      duration: () => ({ springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }) }),
      springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }),
    },
    SlideOutDown: {
      duration: () => ({}),
    },
  };
});

// @expo/vector-icons: mock Ionicons so Button component renders without native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

import { fireEvent, render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

import { CreateFamilyTreeModal } from '@/components/family/CreateFamilyTreeModal';

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Generates strings composed entirely of Unicode whitespace characters.
 * Covers: space, tab, newline, carriage return, form feed, vertical tab,
 * non-breaking space, and other Unicode space separators.
 */
const whitespaceChars = [' ', '\t', '\n', '\r', '\f', '\v', '\u00A0', '\u2003'];

const whitespaceOnlyArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...whitespaceChars), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(''));

/**
 * Combines the empty string with whitespace-only strings to cover all invalid
 * inputs as defined by Requirements 5.2 and 5.3.
 */
const invalidInputArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(''),
  whitespaceOnlyArb,
);

/**
 * Generates valid (non-empty, non-whitespace) names for Property 2.
 */
const validNameArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 64 })
  .filter((s) => s.trim().length >= 1);

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 3: Modal blocks submission for whitespace-only input', () => {
  /**
   * For any string composed entirely of whitespace characters (including the
   * empty string), the "Buat" submit button SHALL be disabled.
   *
   * **Validates: Requirements 2.5, 5.2, 5.3**
   */
  it(
    'disables the submit button for any empty or whitespace-only input',
    () => {
      fc.assert(
        fc.property(invalidInputArb, (invalidInput) => {
          const onSubmit = jest.fn();
          const onClose = jest.fn();

          const { getByLabelText, unmount } = render(
            <CreateFamilyTreeModal
              visible={true}
              onClose={onClose}
              onSubmit={onSubmit}
            />,
          );

          // Type the invalid input into the TextInput
          fireEvent.changeText(
            getByLabelText('Nama pohon keluarga'),
            invalidInput,
          );

          // Requirement 2.5: submit button must be disabled
          const submitButton = getByLabelText('Buat');
          expect(submitButton.props.accessibilityState?.disabled).toBe(true);

          unmount();
        }),
        { numRuns: 100 },
      );
    },
  );

  /**
   * For any string composed entirely of whitespace characters (including the
   * empty string), pressing the submit button SHALL NOT invoke `onSubmit`.
   *
   * **Validates: Requirements 2.6, 5.2, 5.3**
   */
  it(
    'does not invoke onSubmit when submit button is pressed with whitespace-only input',
    () => {
      fc.assert(
        fc.property(invalidInputArb, (invalidInput) => {
          const onSubmit = jest.fn();
          const onClose = jest.fn();

          const { getByLabelText, unmount } = render(
            <CreateFamilyTreeModal
              visible={true}
              onClose={onClose}
              onSubmit={onSubmit}
            />,
          );

          // Type the invalid input
          fireEvent.changeText(
            getByLabelText('Nama pohon keluarga'),
            invalidInput,
          );

          // Attempt to press the submit button
          fireEvent.press(getByLabelText('Buat'));

          // Requirement 2.6: onSubmit must NOT have been called
          expect(onSubmit).not.toHaveBeenCalled();

          unmount();
        }),
        { numRuns: 100 },
      );
    },
  );
});

describe('Property 2: Modal submit calls onSubmit with trimmed name', () => {
  /**
   * For any valid (non-empty, non-whitespace) input, the submit button SHALL
   * be enabled.
   *
   * **Validates: Requirements 2.4, 5.1**
   */
  it(
    'enables the submit button for any valid (non-empty, non-whitespace) input',
    () => {
      fc.assert(
        fc.property(validNameArb, (validName) => {
          const onSubmit = jest.fn();
          const onClose = jest.fn();

          const { getByLabelText, unmount } = render(
            <CreateFamilyTreeModal
              visible={true}
              onClose={onClose}
              onSubmit={onSubmit}
            />,
          );

          fireEvent.changeText(
            getByLabelText('Nama pohon keluarga'),
            validName,
          );

          // Submit button must be enabled
          const submitButton = getByLabelText('Buat');
          expect(submitButton.props.accessibilityState?.disabled).toBe(false);

          unmount();
        }),
        { numRuns: 100 },
      );
    },
  );

  /**
   * For any valid (non-empty, non-whitespace) input, pressing "Buat" SHALL
   * invoke `onSubmit` with exactly `name.trim()`.
   *
   * **Validates: Requirements 2.4, 5.1**
   */
  it(
    'invokes onSubmit with exactly name.trim() when submit button is pressed with a valid name',
    () => {
      fc.assert(
        fc.property(validNameArb, (validName) => {
          const onSubmit = jest.fn();
          const onClose = jest.fn();

          const { getByLabelText, unmount } = render(
            <CreateFamilyTreeModal
              visible={true}
              onClose={onClose}
              onSubmit={onSubmit}
            />,
          );

          fireEvent.changeText(
            getByLabelText('Nama pohon keluarga'),
            validName,
          );

          fireEvent.press(getByLabelText('Buat'));

          // Requirement 2.4: onSubmit called with trimmed name
          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(validName.trim());

          unmount();
        }),
        { numRuns: 100 },
      );
    },
  );
});

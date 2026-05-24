/**
 * Unit tests for src/components/google-sign-in-button.tsx (GoogleSignInButton)
 * Requirements: 5.7, 5.8, 5.9, 5.11, 5.12, 5.14, 5.15, 5.16
 *
 * Tests:
 * - Renders Google icon and default label when not loading
 * - Renders custom label prop text
 * - Renders ActivityIndicator and hides icon+label when isLoading={true}
 * - Calls onPress when tapped and not disabled/loading
 * - Does NOT call onPress when disabled={true}
 * - Does NOT call onPress when isLoading={true}
 * - accessibilityLabel equals label text
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock @expo/vector-icons so AntDesign renders without native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AntDesign: (props: { name: string; testID?: string }) => (
      <View testID={props.testID ?? `antdesign-${props.name}`} />
    ),
  };
});

// ── Import component under test ───────────────────────────────────────────────

import { GoogleSignInButton } from '../components/google-sign-in-button';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_LABEL = 'Masuk dengan Google';

function renderButton(
  props: Partial<React.ComponentProps<typeof GoogleSignInButton>> & {
    onPress?: () => void;
  } = {}
) {
  return render(
    <GoogleSignInButton onPress={props.onPress ?? jest.fn()} {...props} />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GoogleSignInButton', () => {
  // ── Requirement 5.7 & 5.11: renders Google icon and default label ─────────────

  describe('Requirement 5.7, 5.11 — renders Google icon and default label when not loading', () => {
    it('renders the Google icon when isLoading is false (default)', () => {
      const { getByTestId } = renderButton();
      expect(getByTestId('antdesign-google')).toBeTruthy();
    });

    it('renders the default label "Masuk dengan Google" when no label prop given', () => {
      const { getByText } = renderButton();
      expect(getByText(DEFAULT_LABEL)).toBeTruthy();
    });

    it('does NOT render ActivityIndicator when isLoading is false', () => {
      const { queryByTestId } = renderButton({ isLoading: false });
      expect(queryByTestId('activity-indicator')).toBeNull();
    });
  });

  // ── Requirement 5.11: renders custom label prop text ─────────────────────────

  describe('Requirement 5.11 — renders custom label prop text', () => {
    it('renders the custom label when label prop is provided', () => {
      const { getByText } = renderButton({ label: 'Sign in with Google' });
      expect(getByText('Sign in with Google')).toBeTruthy();
    });

    it('does NOT render the default label when a custom label is provided', () => {
      const { queryByText } = renderButton({ label: 'Custom Label' });
      expect(queryByText(DEFAULT_LABEL)).toBeNull();
    });
  });

  // ── Requirement 5.8 & 5.9: loading state ─────────────────────────────────────

  describe('Requirement 5.8, 5.9 — renders ActivityIndicator and hides icon+label when isLoading={true}', () => {
    it('renders ActivityIndicator when isLoading={true}', () => {
      const { getByTestId } = renderButton({ isLoading: true });
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('does NOT render the Google icon when isLoading={true}', () => {
      const { queryByTestId } = renderButton({ isLoading: true });
      expect(queryByTestId('antdesign-google')).toBeNull();
    });

    it('does NOT render the label text when isLoading={true}', () => {
      const { queryByText } = renderButton({ isLoading: true });
      expect(queryByText(DEFAULT_LABEL)).toBeNull();
    });

    it('does NOT render the custom label text when isLoading={true}', () => {
      const { queryByText } = renderButton({ isLoading: true, label: 'Custom' });
      expect(queryByText('Custom')).toBeNull();
    });
  });

  // ── Requirement 5.12: calls onPress when tapped and not disabled/loading ──────

  describe('Requirement 5.12 — calls onPress when tapped and not disabled/loading', () => {
    it('calls onPress when button is pressed and enabled', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({ onPress });
      fireEvent.press(getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  // ── Requirement 5.14: does NOT call onPress when disabled={true} ──────────────

  describe('Requirement 5.14 — does NOT call onPress when disabled={true}', () => {
    it('does NOT call onPress when disabled={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({ onPress, disabled: true });
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 5.15: does NOT call onPress when isLoading={true} ─────────────

  describe('Requirement 5.15 — does NOT call onPress when isLoading={true}', () => {
    it('does NOT call onPress when isLoading={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({ onPress, isLoading: true });
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does NOT call onPress when both disabled={true} and isLoading={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({ onPress, disabled: true, isLoading: true });
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // ── Requirement 5.16: accessibilityLabel equals label text ───────────────────

  describe('Requirement 5.16 — accessibilityLabel equals label text', () => {
    it('accessibilityLabel equals the default label', () => {
      const { getByRole } = renderButton();
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe(DEFAULT_LABEL);
    });

    it('accessibilityLabel equals the custom label when label prop is provided', () => {
      const customLabel = 'Sign in with Google';
      const { getByRole } = renderButton({ label: customLabel });
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe(customLabel);
    });

    it('accessibilityLabel equals the label even when isLoading={true}', () => {
      const { getByRole } = renderButton({ isLoading: true });
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe(DEFAULT_LABEL);
    });
  });
});

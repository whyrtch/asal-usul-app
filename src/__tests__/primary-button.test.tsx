/**
 * Unit tests for src/components/primary-button.tsx (PrimaryButton)
 * Requirements: 5.17, 5.18, 5.19, 5.20, 5.21, 5.22
 *
 * Tests:
 * - Renders label text when not loading
 * - Renders ActivityIndicator (white) when isLoading={true} and variant="filled"
 * - Renders ActivityIndicator (primary color) when isLoading={true} and variant="outline"
 * - filled variant has correct background and shadow styles
 * - outline variant has transparent background and border styles
 * - Applies opacity: 0.5 when disabled={true}
 * - Does NOT call onPress when disabled={true} or isLoading={true}
 */

import { fireEvent, render } from '@testing-library/react-native';

import { PrimaryButton } from '../components/primary-button';
import { AsalUsulColors, Shadows } from '../constants/theme';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PrimaryButton', () => {
  // ── Requirement 5.20: renders label text when not loading ────────────────────

  describe('Requirement 5.20 — renders label text when not loading', () => {
    it('renders the label text when isLoading is false (default)', () => {
      const { getByText } = render(
        <PrimaryButton label="Buat Sekarang" onPress={() => {}} />
      );
      expect(getByText('Buat Sekarang')).toBeTruthy();
    });

    it('renders the label text when isLoading is explicitly false', () => {
      const { getByText } = render(
        <PrimaryButton label="Simpan" onPress={() => {}} isLoading={false} />
      );
      expect(getByText('Simpan')).toBeTruthy();
    });

    it('does NOT render ActivityIndicator when isLoading is false', () => {
      const { UNSAFE_queryByType } = render(
        <PrimaryButton label="Lanjut" onPress={() => {}} isLoading={false} />
      );
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  // ── Requirement 5.21: ActivityIndicator (white) for filled variant ───────────

  describe('Requirement 5.21 — ActivityIndicator (white) when isLoading and variant="filled"', () => {
    it('renders ActivityIndicator when isLoading={true} and variant="filled"', () => {
      const { UNSAFE_getByType } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="filled" />
      );
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('ActivityIndicator has white color for filled variant', () => {
      const { UNSAFE_getByType } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="filled" />
      );
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.color).toBe(AsalUsulColors.textOnPrimary);
    });

    it('does NOT render label text when isLoading={true} and variant="filled"', () => {
      const { queryByText } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="filled" />
      );
      expect(queryByText('Test')).toBeNull();
    });
  });

  // ── Requirement 5.21: ActivityIndicator (primary color) for outline variant ──

  describe('Requirement 5.21 — ActivityIndicator (primary color) when isLoading and variant="outline"', () => {
    it('renders ActivityIndicator when isLoading={true} and variant="outline"', () => {
      const { UNSAFE_getByType } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="outline" />
      );
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('ActivityIndicator has primary color for outline variant', () => {
      const { UNSAFE_getByType } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="outline" />
      );
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.color).toBe(AsalUsulColors.primary);
    });

    it('does NOT render label text when isLoading={true} and variant="outline"', () => {
      const { queryByText } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} variant="outline" />
      );
      expect(queryByText('Test')).toBeNull();
    });
  });

  // ── Requirement 5.17, 5.18: filled variant styles ────────────────────────────

  describe('Requirement 5.17, 5.18 — filled variant has correct background and shadow styles', () => {
    it('filled variant has primary background color', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} variant="filled" />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.backgroundColor).toBe(AsalUsulColors.primary);
    });

    it('filled variant has shadow elevation applied', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} variant="filled" />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.elevation).toBe(Shadows.button.elevation);
    });

    it('filled variant has shadow color applied', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} variant="filled" />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.shadowColor).toBe(Shadows.button.shadowColor);
    });
  });

  // ── Requirement 5.19: outline variant styles ──────────────────────────────────

  describe('Requirement 5.19 — outline variant has transparent background and border styles', () => {
    it('outline variant has transparent background', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} variant="outline" />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.backgroundColor).toBe('transparent');
    });

    it('outline variant has primary border color', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} variant="outline" />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.borderColor).toBe(AsalUsulColors.primary);
    });
  });

  // ── Requirement 5.22: opacity: 0.5 when disabled ─────────────────────────────

  describe('Requirement 5.22 — applies opacity: 0.5 when disabled={true}', () => {
    it('applies opacity 0.5 when disabled={true}', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} disabled={true} />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.opacity).toBe(0.5);
    });

    it('applies opacity 0.5 when isLoading={true}', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} isLoading={true} />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.opacity).toBe(0.5);
    });

    it('does NOT apply opacity 0.5 when neither disabled nor loading', () => {
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={() => {}} />
      );
      const button = getByRole('button');
      const flatStyle = button.props.style
        ? [button.props.style].flat(Infinity)
        : [];
      const merged = Object.assign({}, ...flatStyle.filter(Boolean));
      expect(merged.opacity).toBeUndefined();
    });
  });

  // ── Requirement 5.22: does NOT call onPress when disabled or loading ──────────

  describe('Requirement 5.22 — does NOT call onPress when disabled or loading', () => {
    it('calls onPress when button is enabled and not loading', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={onPress} />
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onPress when disabled={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={onPress} disabled={true} />
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does NOT call onPress when isLoading={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={onPress} isLoading={true} />
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does NOT call onPress when both disabled={true} and isLoading={true}', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <PrimaryButton label="Test" onPress={onPress} disabled={true} isLoading={true} />
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});

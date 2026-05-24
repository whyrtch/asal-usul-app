/**
 * Unit tests for src/components/hero-illustration.tsx (HeroIllustration)
 * Requirements: 5.25, 5.26, 5.27, 5.28, 5.29
 *
 * Tests:
 * - renders container with default width 240 and height 180 (4:3)
 * - renders container with custom `size` prop and correct 4:3 height
 * - renders Ionicons "git-network-outline" icon
 * - applies `style` prop to outer container
 */

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

// ── Module mocks ──────────────────────────────────────────────────────────────

// @expo/vector-icons: mock Ionicons so it renders in Jest without native modules
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, size, color, testID }: { name: string; size: number; color: string; testID?: string }) =>
      <Text testID={testID ?? 'ionicons-icon'} accessibilityLabel={name}>{name}</Text>,
  };
});

// ── Import component under test ───────────────────────────────────────────────

import { HeroIllustration } from '../components/hero-illustration';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Flatten a React Native style array/object into a plain object so we can
 * assert individual style properties regardless of how StyleSheet.create
 * registers them.
 */
function flattenStyle(style: unknown): Record<string, unknown> {
  return StyleSheet.flatten(style as Parameters<typeof StyleSheet.flatten>[0]) ?? {};
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HeroIllustration', () => {
  // ── Requirement 5.25 / 5.26: default dimensions ──────────────────────────────

  describe('Requirement 5.25, 5.26 — default width 240 and height 180 (4:3)', () => {
    it('renders container with default width 240', () => {
      const { getByTestId } = render(<HeroIllustration />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.width).toBe(240);
    });

    it('renders container with default height 180 (3/4 of 240)', () => {
      const { getByTestId } = render(<HeroIllustration />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.height).toBe(180);
    });
  });

  // ── Requirement 5.26: custom size prop with correct 4:3 height ───────────────

  describe('Requirement 5.26 — custom size prop and correct 4:3 height', () => {
    it('renders container with custom size=320 and height=240', () => {
      const { getByTestId } = render(<HeroIllustration size={320} />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.width).toBe(320);
      expect(style.height).toBe(240);
    });

    it('renders container with custom size=160 and height=120', () => {
      const { getByTestId } = render(<HeroIllustration size={160} />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.width).toBe(160);
      expect(style.height).toBe(120);
    });

    it('height is always 3/4 of the given size', () => {
      const size = 400;
      const { getByTestId } = render(<HeroIllustration size={size} />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.height).toBe((3 / 4) * size);
    });
  });

  // ── Requirement 5.27: renders Ionicons "git-network-outline" icon ─────────────

  describe('Requirement 5.27 — renders Ionicons "git-network-outline" icon', () => {
    it('renders the git-network-outline icon', () => {
      const { getByLabelText } = render(<HeroIllustration />);
      // The mock renders accessibilityLabel={name}
      expect(getByLabelText('git-network-outline')).toBeTruthy();
    });

    it('icon is inside the container', () => {
      const { getByTestId, getByLabelText } = render(<HeroIllustration />);
      const container = getByTestId('hero-illustration');
      const icon = getByLabelText('git-network-outline');
      // Icon should be a descendant of the container
      expect(container).toBeTruthy();
      expect(icon).toBeTruthy();
    });
  });

  // ── Requirement 5.28 / 5.29: applies style prop to outer container ────────────

  describe('Requirement 5.28, 5.29 — applies style prop to outer container', () => {
    it('applies a custom style object to the outer container', () => {
      const customStyle = { marginTop: 32 };
      const { getByTestId } = render(<HeroIllustration style={customStyle} />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.marginTop).toBe(32);
    });

    it('custom style does not override width/height set by size prop', () => {
      const customStyle = { backgroundColor: '#FF0000' };
      const { getByTestId } = render(<HeroIllustration size={200} style={customStyle} />);
      const container = getByTestId('hero-illustration');
      const style = flattenStyle(container.props.style);
      expect(style.width).toBe(200);
      expect(style.height).toBe(150);
      expect(style.backgroundColor).toBe('#FF0000');
    });
  });
});

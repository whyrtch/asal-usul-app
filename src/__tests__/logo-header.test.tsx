/**
 * Unit tests for src/components/logo-header.tsx (LogoHeader)
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 *
 * Tests:
 * - renders logo image with default size 96
 * - renders logo image with custom logoSize
 * - renders app name "AsalUsul" always
 * - renders tagline when showTagline={true}
 * - does NOT render tagline when showTagline={false} or omitted
 * - applies style prop to outer container
 */

import { render } from '@testing-library/react-native';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// expo-image: mock Image component so it renders in Jest (no native module needed)
jest.mock('expo-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  return {
    Image: (props: object) => <Image testID="logo-image" {...props} />,
  };
});

// ── Import component under test ───────────────────────────────────────────────

import { LogoHeader } from '../components/logo-header';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogoHeader(props: React.ComponentProps<typeof LogoHeader> = {}) {
  return render(<LogoHeader {...props} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LogoHeader', () => {
  // ── Requirement 5.1: renders logo image ──────────────────────────────────────

  describe('Requirement 5.1 — renders logo image with default size 96', () => {
    it('renders the logo image', () => {
      const { getByTestId } = renderLogoHeader();
      expect(getByTestId('logo-image')).toBeTruthy();
    });

    it('logo image has default width and height of 96', () => {
      const { getByTestId } = renderLogoHeader();
      const image = getByTestId('logo-image');
      expect(image.props.style).toMatchObject({ width: 96, height: 96 });
    });
  });

  // ── Requirement 5.1: renders logo image with custom logoSize ─────────────────

  describe('Requirement 5.1 — renders logo image with custom logoSize', () => {
    it('logo image uses custom logoSize for width and height', () => {
      const { getByTestId } = renderLogoHeader({ logoSize: 64 });
      const image = getByTestId('logo-image');
      expect(image.props.style).toMatchObject({ width: 64, height: 64 });
    });

    it('logo image uses logoSize=120 correctly', () => {
      const { getByTestId } = renderLogoHeader({ logoSize: 120 });
      const image = getByTestId('logo-image');
      expect(image.props.style).toMatchObject({ width: 120, height: 120 });
    });
  });

  // ── Requirement 5.2: renders app name "AsalUsul" always ──────────────────────

  describe('Requirement 5.2 — renders app name "AsalUsul" always', () => {
    it('renders "AsalUsul" with default props', () => {
      const { getByText } = renderLogoHeader();
      expect(getByText('AsalUsul')).toBeTruthy();
    });

    it('renders "AsalUsul" when showTagline is true', () => {
      const { getByText } = renderLogoHeader({ showTagline: true });
      expect(getByText('AsalUsul')).toBeTruthy();
    });

    it('renders "AsalUsul" when showTagline is false', () => {
      const { getByText } = renderLogoHeader({ showTagline: false });
      expect(getByText('AsalUsul')).toBeTruthy();
    });

    it('renders "AsalUsul" with a custom logoSize', () => {
      const { getByText } = renderLogoHeader({ logoSize: 48 });
      expect(getByText('AsalUsul')).toBeTruthy();
    });
  });

  // ── Requirement 5.3 & 5.4: tagline visibility ────────────────────────────────

  describe('Requirement 5.3 — renders tagline when showTagline={true}', () => {
    it('renders tagline text when showTagline is true', () => {
      const { getByText } = renderLogoHeader({ showTagline: true });
      expect(getByText('Jejak Keluarga dalam Satu Pohon')).toBeTruthy();
    });
  });

  describe('Requirement 5.4 — does NOT render tagline when showTagline={false} or omitted', () => {
    it('does NOT render tagline when showTagline is false', () => {
      const { queryByText } = renderLogoHeader({ showTagline: false });
      expect(queryByText('Jejak Keluarga dalam Satu Pohon')).toBeNull();
    });

    it('does NOT render tagline when showTagline is omitted (default)', () => {
      const { queryByText } = renderLogoHeader();
      expect(queryByText('Jejak Keluarga dalam Satu Pohon')).toBeNull();
    });
  });

  // ── Requirement 5.6: applies style prop to outer container ───────────────────

  describe('Requirement 5.6 — applies style prop to outer container', () => {
    it('applies a custom style object to the outer container', () => {
      const customStyle = { marginTop: 32, backgroundColor: '#FF0000' };
      const { toJSON } = renderLogoHeader({ style: customStyle });
      const tree = toJSON() as { props: { style: object[] } };
      // The root element is the outer View — its style array should include customStyle
      const styleArray: object[] = Array.isArray(tree.props.style)
        ? tree.props.style
        : [tree.props.style];
      const merged = Object.assign({}, ...styleArray.filter(Boolean));
      expect(merged).toMatchObject(customStyle);
    });

    it('applies multiple style values to the outer container', () => {
      const customStyle = { paddingHorizontal: 16 };
      const { toJSON } = renderLogoHeader({ style: customStyle });
      const tree = toJSON() as { props: { style: object[] } };
      const styleArray: object[] = Array.isArray(tree.props.style)
        ? tree.props.style
        : [tree.props.style];
      const merged = Object.assign({}, ...styleArray.filter(Boolean));
      expect(merged).toMatchObject(customStyle);
    });
  });
});

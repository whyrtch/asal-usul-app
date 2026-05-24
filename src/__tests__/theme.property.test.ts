// Feature: AsalUsul UI Foundation, Properties 7–9: Theme token invariants

/**
 * Property 7: `AsalUsulColors` hex color format invariant
 * Validates: Requirements 4.2
 *
 * For any key in `AsalUsulColors`, the corresponding value is a valid
 * 6-digit hexadecimal color string matching `#[0-9A-Fa-f]{6}`.
 */

/**
 * Property 8: `Radii` tokens are positive integers invariant
 * Validates: Requirements 4.4
 *
 * For any key in `Radii`, the corresponding value is a positive integer > 0.
 */

/**
 * Property 9: `Shadows` tokens have required shape fields invariant
 * Validates: Requirements 4.6
 *
 * For any key in `Shadows`, the corresponding value contains all required
 * fields: `shadowColor` (string), `shadowOffset` (object with number `width`
 * and `height`), `shadowOpacity` (number), `shadowRadius` (number), and
 * `elevation` (number).
 */

import * as fc from 'fast-check';
import type { AsalUsulColor, RadiusToken, ShadowToken } from '../constants/theme';
import {
    AsalUsulColors,
    Radii,
    Shadows,
} from '../constants/theme';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

describe('Property 7: AsalUsulColors hex color format invariant', () => {
  it('every AsalUsulColors value matches #[0-9A-Fa-f]{6}', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(Object.keys(AsalUsulColors) as AsalUsulColor[])),
        (key) => {
          expect(AsalUsulColors[key]).toMatch(HEX_COLOR_RE);
        }
      )
    );
  });
});

describe('Property 8: Radii tokens are positive integers invariant', () => {
  it('every Radii value is a positive integer greater than 0', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(Object.keys(Radii) as RadiusToken[])),
        (key) => {
          expect(Radii[key]).toBeGreaterThan(0);
          expect(Number.isInteger(Radii[key])).toBe(true);
        }
      )
    );
  });
});

describe('Property 9: Shadows tokens have required shape fields invariant', () => {
  it('every Shadows value contains all required fields with correct types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(Object.keys(Shadows) as ShadowToken[])),
        (key) => {
          const shadow = Shadows[key];
          expect(typeof shadow.shadowColor).toBe('string');
          expect(typeof shadow.shadowOffset.width).toBe('number');
          expect(typeof shadow.shadowOffset.height).toBe('number');
          expect(typeof shadow.shadowOpacity).toBe('number');
          expect(typeof shadow.shadowRadius).toBe('number');
          expect(typeof shadow.elevation).toBe('number');
        }
      )
    );
  });
});

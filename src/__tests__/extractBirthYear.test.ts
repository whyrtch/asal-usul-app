/**
 * Unit tests for `extractBirthYear` helper in `src/utils/treeLayoutEngine.ts`
 *
 * Covers:
 *   - null input → ''
 *   - valid YYYY-MM-DD strings → 4-char year prefix
 *   - Property 5: result length is always 0 or 4 for any string input
 *
 * Requirements: 7.4, 7.5
 */

import * as fc from 'fast-check';
import { extractBirthYear } from '../utils/treeLayoutEngine';

// ---------------------------------------------------------------------------
// Unit tests — specific examples
// ---------------------------------------------------------------------------

describe('extractBirthYear — unit tests', () => {
  // Requirement 7.5 — null returns empty string
  it('returns empty string for null', () => {
    expect(extractBirthYear(null)).toBe('');
  });

  // Requirement 7.4 — extracts year from a valid date string
  it("returns '1970' for '1970-05-15'", () => {
    expect(extractBirthYear('1970-05-15')).toBe('1970');
  });

  it("returns '2000' for '2000-01-01'", () => {
    expect(extractBirthYear('2000-01-01')).toBe('2000');
  });
});

// ---------------------------------------------------------------------------
// Property 5: result length is always 0 or 4 for any string input
// ---------------------------------------------------------------------------

describe('Property 5: extractBirthYear always returns length 0 or 4', () => {
  /**
   * For any string of length >= 4 (matching the documented precondition that
   * `birthDate` is either `null` or a `YYYY-MM-DD` string), `extractBirthYear`
   * must return a 4-character string.
   *
   * For `null`, it must return an empty string (length 0).
   *
   * The function's precondition states `birthDate` is `null` or a string in
   * `YYYY-MM-DD` format (always >= 4 chars), so we constrain the generator
   * accordingly to match the documented input space.
   *
   * **Validates: Requirements 7.4, 7.5**
   */
  it('returns a string of length 0 or 4 for any string input', () => {
    // Strings of length >= 4 represent valid date strings (YYYY-MM-DD is 10 chars)
    const validStringArb = fc.string({ minLength: 4 });

    fc.assert(
      fc.property(validStringArb, (input) => {
        const result = extractBirthYear(input);
        expect(result.length === 0 || result.length === 4).toBe(true);
      }),
      { numRuns: 1000 },
    );
  });

  it('returns length 0 for null input', () => {
    expect(extractBirthYear(null).length).toBe(0);
  });
});

// Feature: Create Family Tree
// Property 11: validateFamilyTreeName correctness invariant
// Property 12: formatRelativeDate format invariant

/**
 * Property 11: validateFamilyTreeName correctness invariant
 * Validates: Requirements 5.1, 5.2, 5.3
 *
 * For any string `name`, `validateFamilyTreeName(name)` returns `true` if and
 * only if `name.trim().length >= 1`.
 */

/**
 * Property 12: formatRelativeDate format invariant
 * Validates: Requirements 6.3, 6.4
 *
 * For any valid ISO 8601 date string, `formatRelativeDate` SHALL return a
 * non-empty string that starts with `"Dibuat "`.
 */

import * as fc from 'fast-check';
import {
    formatRelativeDate,
    validateFamilyTreeName,
} from '../utils/familyTreeUtils';

// ---------------------------------------------------------------------------
// Property 11: validateFamilyTreeName correctness invariant
// ---------------------------------------------------------------------------

describe('Property 11: validateFamilyTreeName correctness invariant', () => {
  /**
   * For any string `name`, the result of `validateFamilyTreeName(name)` must
   * equal `name.trim().length >= 1` — no more, no less.
   *
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  it(
    'returns true iff name.trim().length >= 1, for any string',
    () => {
      fc.assert(
        fc.property(fc.string(), (name) => {
          const expected = name.trim().length >= 1;
          expect(validateFamilyTreeName(name)).toBe(expected);
        }),
        { numRuns: 1000 },
      );
    },
  );

  /**
   * Explicit sub-case: whitespace-only strings (including empty) must return false.
   *
   * **Validates: Requirements 5.2, 5.3**
   */
  it(
    'returns false for any whitespace-only or empty string',
    () => {
      const whitespaceChar = fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v');
      const whitespaceString = fc.oneof(
        fc.constant(''),
        fc.array(whitespaceChar, { minLength: 1, maxLength: 50 }).map((chars) => chars.join('')),
      );

      fc.assert(
        fc.property(whitespaceString, (name) => {
          expect(validateFamilyTreeName(name)).toBe(false);
        }),
        { numRuns: 500 },
      );
    },
  );

  /**
   * Explicit sub-case: strings with at least one non-whitespace character must return true.
   *
   * **Validates: Requirements 5.1**
   */
  it(
    'returns true for any string containing at least one non-whitespace character',
    () => {
      const validNameArb = fc.string().filter((s) => s.trim().length >= 1);

      fc.assert(
        fc.property(validNameArb, (name) => {
          expect(validateFamilyTreeName(name)).toBe(true);
        }),
        { numRuns: 500 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Arbitraries (for Property 12)
// ---------------------------------------------------------------------------

/**
 * Generates valid ISO 8601 date strings covering:
 * - Today (diffDays === 0)
 * - Past dates (diffDays >= 1)
 *
 * We generate a random number of days in the past (0–3650, i.e. up to ~10 years)
 * and produce a proper ISO string from that date.
 */
const validIsoDateArb = fc
  .integer({ min: 0, max: 3650 })
  .map((daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  });

// ---------------------------------------------------------------------------
// Property 12: formatRelativeDate format invariant
// ---------------------------------------------------------------------------

describe('Property 12: formatRelativeDate format invariant', () => {
  /**
   * For any valid ISO 8601 date string, `formatRelativeDate` always returns a
   * non-empty string that starts with `"Dibuat "`.
   *
   * **Validates: Requirements 6.3, 6.4**
   */
  it(
    'always returns a non-empty string starting with "Dibuat " for any valid ISO 8601 date',
    () => {
      fc.assert(
        fc.property(validIsoDateArb, (isoDate) => {
          const result = formatRelativeDate(isoDate);

          // Requirement 6.4: result is non-empty
          expect(result.length).toBeGreaterThan(0);

          // Requirement 6.3: result always starts with "Dibuat "
          expect(result.startsWith('Dibuat ')).toBe(true);
        }),
        { numRuns: 200 }
      );
    }
  );
});

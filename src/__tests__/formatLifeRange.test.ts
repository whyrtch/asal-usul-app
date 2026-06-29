/**
 * Unit + property tests for `extractDeathYear` and `formatLifeRange` helpers
 * in `src/utils/treeLayoutEngine.ts`.
 *
 * Covers the rich-member-details life-span display logic (Phase 1, 4.2):
 *   - living member → birth year alone (or '')
 *   - deceased member → "birth–death" range with sensible fallbacks
 *
 * Requirements: Phase 1 — detail anggota lebih kaya (status + deathDate)
 */

import * as fc from 'fast-check';
import { extractDeathYear, formatLifeRange } from '../utils/treeLayoutEngine';

// ---------------------------------------------------------------------------
// extractDeathYear — unit tests
// ---------------------------------------------------------------------------

describe('extractDeathYear — unit tests', () => {
  it('returns empty string for null', () => {
    expect(extractDeathYear(null)).toBe('');
  });

  it("returns '2010' for '2010-08-20'", () => {
    expect(extractDeathYear('2010-08-20')).toBe('2010');
  });
});

// ---------------------------------------------------------------------------
// formatLifeRange — unit tests
// ---------------------------------------------------------------------------

describe('formatLifeRange — living member', () => {
  it('returns the birth year alone when living with a known birth date', () => {
    expect(formatLifeRange('1945-01-01', null, 'living')).toBe('1945');
  });

  it('returns empty string when living with unknown birth date', () => {
    expect(formatLifeRange(null, null, 'living')).toBe('');
  });

  it('ignores any death date when status is living', () => {
    expect(formatLifeRange('1945-01-01', '2010-01-01', 'living')).toBe('1945');
  });
});

describe('formatLifeRange — deceased member', () => {
  it('returns a full range when both years are known', () => {
    expect(formatLifeRange('1945-01-01', '2010-08-20', 'deceased')).toBe('1945–2010');
  });

  it('returns "birth–" when only birth year is known', () => {
    expect(formatLifeRange('1945-01-01', null, 'deceased')).toBe('1945–');
  });

  it('returns "–death" when only death year is known', () => {
    expect(formatLifeRange(null, '2010-08-20', 'deceased')).toBe('–2010');
  });

  it('returns the dagger marker when neither year is known', () => {
    expect(formatLifeRange(null, null, 'deceased')).toBe('†');
  });
});

// ---------------------------------------------------------------------------
// Property: a living member's range never contains a range separator
// ---------------------------------------------------------------------------

describe('Property: formatLifeRange invariants', () => {
  const isoDateArb = fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 10, maxLength: 10 }),
  );

  it('living member output never contains an en-dash or dagger', () => {
    fc.assert(
      fc.property(isoDateArb, isoDateArb, (birth, death) => {
        const result = formatLifeRange(birth, death, 'living');
        expect(result.includes('–')).toBe(false);
        expect(result.includes('†')).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('deceased member output is always non-empty', () => {
    fc.assert(
      fc.property(isoDateArb, isoDateArb, (birth, death) => {
        const result = formatLifeRange(birth, death, 'deceased');
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 500 },
    );
  });
});

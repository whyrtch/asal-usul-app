/**
 * Property-based tests for TreeLayoutEngine
 *
 * Property 1: output length equals input length
 * **Validates: Requirements 8.4**
 *
 * Property 2: single-node layout is centered
 * **Validates: Requirements 8.3**
 *
 * Property 6: all x-values within canvas bounds
 * **Validates: Requirements 8.6**
 */

import * as fc from 'fast-check';
import type { Member } from '../types/familyTree';
import { defaultTreeLayoutEngine } from '../utils/treeLayoutEngine';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Arbitrary for a single Member object with all required fields */
const memberArbitrary: fc.Arbitrary<Member> = fc.record<Member>({
  id: fc.string({ minLength: 1 }),
  familyTreeId: fc.string({ minLength: 1 }),
  fullName: fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
  gender: fc.oneof(fc.constant('male' as const), fc.constant('female' as const)),
  role: fc.string({ minLength: 1 }),
  birthDate: fc.oneof(fc.constant(null), fc.string({ minLength: 10, maxLength: 10 })),
  photoUrl: fc.constant(null),
  bio: fc.oneof(fc.constant(null), fc.string()),
  fatherId: fc.constant(null),
  motherId: fc.constant(null),
  spouseIds: fc.constant([]),
  childrenIds: fc.constant([]),
  createdAt: fc.constant(new Date().toISOString()),
});

/** Arbitrary for canvas width: positive float between 1 and 2000 */
const canvasWidthArbitrary = fc.float({ min: 1, max: 2000, noNaN: true });

// ---------------------------------------------------------------------------
// Property 1: output length equals input length
// ---------------------------------------------------------------------------

describe('Property 1: output length equals input length', () => {
  /**
   * For any non-null `members` array and any `canvasWidth > 0`,
   * `computeLayout(members, canvasWidth).length === members.length`.
   *
   * **Validates: Requirements 8.4**
   */
  it('computeLayout returns an array with the same length as the input members array', () => {
    fc.assert(
      fc.property(
        fc.array(memberArbitrary),
        canvasWidthArbitrary,
        (members, canvasWidth) => {
          const result = defaultTreeLayoutEngine.computeLayout(members, canvasWidth);
          expect(result.length).toBe(members.length);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: single-node layout is centered
// ---------------------------------------------------------------------------

describe('Property 2: single-node layout is centered', () => {
  /**
   * For any single-element `members` array and any `canvasWidth > 0`,
   * `computeLayout([m], canvasWidth)[0].x === canvasWidth / 2`.
   *
   * **Validates: Requirements 8.3**
   */
  it('single member is placed at x === canvasWidth / 2', () => {
    fc.assert(
      fc.property(
        memberArbitrary,
        canvasWidthArbitrary,
        (member, canvasWidth) => {
          const result = defaultTreeLayoutEngine.computeLayout([member], canvasWidth);
          expect(result.length).toBe(1);
          expect(result[0].x).toBe(canvasWidth / 2);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: all x-values within canvas bounds
// ---------------------------------------------------------------------------

describe('Property 6: all x-values within canvas bounds', () => {
  /**
   * For any non-null `members` array and any `canvasWidth > 0`,
   * every `LayoutNode` returned satisfies `0 <= node.x <= canvasWidth`.
   *
   * **Validates: Requirements 8.6**
   */
  it('every node.x satisfies 0 <= node.x <= canvasWidth', () => {
    fc.assert(
      fc.property(
        fc.array(memberArbitrary, { minLength: 1 }),
        canvasWidthArbitrary,
        (members, canvasWidth) => {
          const result = defaultTreeLayoutEngine.computeLayout(members, canvasWidth);
          for (const node of result) {
            expect(node.x).toBeGreaterThanOrEqual(0);
            expect(node.x).toBeLessThanOrEqual(canvasWidth);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('x-bounds hold for empty array (no nodes to violate bounds)', () => {
    fc.assert(
      fc.property(canvasWidthArbitrary, (canvasWidth) => {
        const result = defaultTreeLayoutEngine.computeLayout([], canvasWidth);
        // Empty result trivially satisfies the bounds property
        expect(result.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});

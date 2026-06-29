/**
 * Property-based tests for TreeLayoutEngine
 *
 * Property 1: output node count equals input member count
 * **Validates: Requirements 8.4**
 *
 * Property 2: single-node layout is horizontally centered on the canvas
 * **Validates: Requirements 8.3**
 *
 * Property 6: all node x-values are within canvas bounds
 * **Validates: Requirements 8.6**
 */

import * as fc from 'fast-check';
import type { Member } from '../types/familyTree';
import { NODE_WIDTH, defaultTreeLayoutEngine } from '../utils/treeLayoutEngine';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Arbitrary for a single Member with no parent/child relationships. */
const memberArbitrary: fc.Arbitrary<Member> = fc.record<Member>({
  id: fc.string({ minLength: 1 }),
  familyTreeId: fc.string({ minLength: 1 }),
  fullName: fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
  gender: fc.oneof(fc.constant('male' as const), fc.constant('female' as const)),
  role: fc.string({ minLength: 1 }),
  birthDate: fc.oneof(fc.constant(null), fc.string({ minLength: 10, maxLength: 10 })),
  status: fc.oneof(fc.constant('living' as const), fc.constant('deceased' as const)),
  deathDate: fc.oneof(fc.constant(null), fc.string({ minLength: 10, maxLength: 10 })),
  photoUrl: fc.constant(null),
  bio: fc.oneof(fc.constant(null), fc.string()),
  fatherId: fc.constant(null),
  motherId: fc.constant(null),
  spouseIds: fc.constant([]),
  childrenIds: fc.constant([]),
  createdAt: fc.constant(new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Property 1: output node count equals input member count
// ---------------------------------------------------------------------------

describe('Property 1: output node count equals input member count', () => {
  it('computeLayout returns a node for every input member', () => {
    fc.assert(
      fc.property(fc.array(memberArbitrary), (members) => {
        const { nodes } = defaultTreeLayoutEngine.computeLayout(members);
        expect(nodes.length).toBe(members.length);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: single-node layout is horizontally centered
// ---------------------------------------------------------------------------

describe('Property 2: single-node layout is horizontally centered', () => {
  it('single member node is centered: node.x + NODE_WIDTH/2 === canvasWidth/2', () => {
    fc.assert(
      fc.property(memberArbitrary, (member) => {
        const { nodes, canvasWidth } = defaultTreeLayoutEngine.computeLayout([member]);
        expect(nodes.length).toBe(1);
        // The node's center x should equal half the canvas width
        const nodeCenterX = nodes[0].x + NODE_WIDTH / 2;
        expect(nodeCenterX).toBeCloseTo(canvasWidth / 2, 5);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: all node x-values are within canvas bounds
// ---------------------------------------------------------------------------

describe('Property 6: all node x-values are within canvas bounds', () => {
  it('every node satisfies 0 <= node.x and node.x + NODE_WIDTH <= canvasWidth', () => {
    fc.assert(
      fc.property(fc.array(memberArbitrary, { minLength: 1 }), (members) => {
        const { nodes, canvasWidth } = defaultTreeLayoutEngine.computeLayout(members);
        for (const node of nodes) {
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.x + NODE_WIDTH).toBeLessThanOrEqual(canvasWidth + 1); // +1 for float rounding
        }
      }),
      { numRuns: 200 },
    );
  });

  it('empty array produces empty nodes and zero canvas dimensions', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const { nodes, canvasWidth, canvasHeight } =
          defaultTreeLayoutEngine.computeLayout([]);
        expect(nodes.length).toBe(0);
        expect(canvasWidth).toBe(0);
        expect(canvasHeight).toBe(0);
      }),
      { numRuns: 10 },
    );
  });
});

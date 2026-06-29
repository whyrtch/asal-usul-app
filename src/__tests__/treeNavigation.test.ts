/**
 * Unit + property tests for src/utils/treeNavigation.ts
 *
 * Covers the pure zoom/pan/search logic backing the tree canvas (Phase 1, 4.3).
 */

import * as fc from 'fast-check';
import type { Member } from '../types/familyTree';
import { NODE_HEIGHT, NODE_WIDTH } from '../utils/treeLayoutEngine';
import {
    clamp,
    computeCenterOnNode,
    computeFitToScreen,
    filterMembersByQuery,
    MAX_SCALE,
    MIN_SCALE,
} from '../utils/treeNavigation';

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps below min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps above max', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it('returns min for NaN', () => {
    expect(clamp(NaN, 0.4, 3)).toBe(0.4);
  });

  it('always returns a value within [min, max] (property)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (v) => {
          const r = clamp(v, MIN_SCALE, MAX_SCALE);
          expect(r).toBeGreaterThanOrEqual(MIN_SCALE);
          expect(r).toBeLessThanOrEqual(MAX_SCALE);
        },
      ),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// computeFitToScreen
// ---------------------------------------------------------------------------

describe('computeFitToScreen', () => {
  it('returns identity for non-positive dimensions', () => {
    expect(computeFitToScreen(0, 0, 100, 100)).toEqual({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  });

  it('never upscales a small canvas beyond scale 1', () => {
    const t = computeFitToScreen(100, 100, 1000, 1000);
    expect(t.scale).toBe(1);
  });

  it('scales a large canvas down to fit', () => {
    const t = computeFitToScreen(2000, 1000, 1000, 1000);
    // limiting dimension is width: 1000/2000 = 0.5
    expect(t.scale).toBeCloseTo(0.5, 5);
  });

  it('centers the scaled canvas in the viewport', () => {
    const vw = 1000;
    const vh = 800;
    const t = computeFitToScreen(400, 400, vw, vh);
    // scale 1 → translateX = (1000-400)/2 = 300, translateY = (800-400)/2 = 200
    expect(t.translateX).toBeCloseTo(300, 5);
    expect(t.translateY).toBeCloseTo(200, 5);
  });

  it('scale is always within [MIN_SCALE, MAX_SCALE] (property)', () => {
    const dim = fc.double({ min: 1, max: 5000, noNaN: true });
    fc.assert(
      fc.property(dim, dim, dim, dim, (cw, ch, vw, vh) => {
        const t = computeFitToScreen(cw, ch, vw, vh);
        expect(t.scale).toBeGreaterThanOrEqual(MIN_SCALE);
        expect(t.scale).toBeLessThanOrEqual(MAX_SCALE);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// computeCenterOnNode
// ---------------------------------------------------------------------------

describe('computeCenterOnNode', () => {
  it('places the node center at the viewport center at scale 1', () => {
    const vw = 1000;
    const vh = 800;
    const nodeX = 200;
    const nodeY = 100;
    const { translateX, translateY } = computeCenterOnNode(nodeX, nodeY, vw, vh, 1);

    // After applying translate, node center should map to viewport center.
    const nodeCenterX = nodeX + NODE_WIDTH / 2;
    const nodeCenterY = nodeY + NODE_HEIGHT / 2;
    expect(nodeCenterX * 1 + translateX).toBeCloseTo(vw / 2, 5);
    expect(nodeCenterY * 1 + translateY).toBeCloseTo(vh / 2, 5);
  });

  it('accounts for scale when centering (property)', () => {
    const coord = fc.double({ min: 0, max: 4000, noNaN: true });
    const scaleArb = fc.double({ min: MIN_SCALE, max: MAX_SCALE, noNaN: true });
    const dim = fc.double({ min: 1, max: 2000, noNaN: true });
    fc.assert(
      fc.property(coord, coord, dim, dim, scaleArb, (x, y, vw, vh, scale) => {
        const { translateX, translateY } = computeCenterOnNode(x, y, vw, vh, scale);
        const cx = (x + NODE_WIDTH / 2) * scale + translateX;
        const cy = (y + NODE_HEIGHT / 2) * scale + translateY;
        expect(cx).toBeCloseTo(vw / 2, 4);
        expect(cy).toBeCloseTo(vh / 2, 4);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// filterMembersByQuery
// ---------------------------------------------------------------------------

function makeMember(id: string, fullName: string): Member {
  return {
    id,
    familyTreeId: 'tree',
    fullName,
    gender: 'male',
    role: 'Anak',
    birthDate: null,
    status: 'living',
    deathDate: null,
    photoUrl: null,
    bio: null,
    fatherId: null,
    motherId: null,
    spouseIds: [],
    childrenIds: [],
    createdAt: new Date().toISOString(),
  };
}

describe('filterMembersByQuery', () => {
  const members = [
    makeMember('1', 'Budi Santoso'),
    makeMember('2', 'Siti Aminah'),
    makeMember('3', 'budiman'),
  ];

  it('returns empty array for a blank query', () => {
    expect(filterMembersByQuery(members, '')).toEqual([]);
    expect(filterMembersByQuery(members, '   ')).toEqual([]);
  });

  it('matches case-insensitively as a substring', () => {
    const result = filterMembersByQuery(members, 'budi');
    expect(result.map((m) => m.id).sort()).toEqual(['1', '3']);
  });

  it('matches a single member', () => {
    const result = filterMembersByQuery(members, 'siti');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('every returned member contains the query (property)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (q) => {
        const result = filterMembersByQuery(members, q);
        const needle = q.trim().toLowerCase();
        if (needle.length === 0) {
          expect(result).toEqual([]);
        } else {
          result.forEach((m) => {
            expect(m.fullName.toLowerCase().includes(needle)).toBe(true);
          });
        }
      }),
      { numRuns: 300 },
    );
  });
});

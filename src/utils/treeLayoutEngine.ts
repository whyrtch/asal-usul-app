/**
 * Tree layout engine for the Family Tree Detail feature.
 *
 * Pure TypeScript module — no React dependencies.
 * Computes display positions (x, y) for family tree nodes.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import type { Member } from '../types/familyTree';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Height of a single tree node card in logical pixels. */
export const NODE_HEIGHT = 120;

/** Vertical padding from the top of the canvas to the first row of nodes. */
export const VERTICAL_PADDING = 32;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A positioned member node produced by `TreeLayoutEngine.computeLayout`.
 *
 * `x` and `y` represent the center of the node in logical pixels.
 */
export interface LayoutNode {
  member: Member;
  /** Horizontal center position in logical pixels. */
  x: number;
  /** Vertical center position in logical pixels. */
  y: number;
}

/**
 * Contract for a layout engine that maps a flat `Member[]` array to
 * positioned `LayoutNode[]` values ready for rendering.
 *
 * Implementations must be pure (no side effects, no React dependencies).
 */
export interface TreeLayoutEngine {
  /**
   * Compute display positions for the given members within a canvas of the
   * specified width.
   *
   * Preconditions:
   *   - `members` is a non-null array (may be empty)
   *   - `canvasWidth > 0`
   *
   * Postconditions:
   *   - `result.length === members.length`
   *   - `result[i].member === members[i]` for all i
   *   - For `members.length === 1`: `result[0].x === canvasWidth / 2`
   *   - All `node.x` values satisfy `0 <= node.x <= canvasWidth`
   */
  computeLayout(members: Member[], canvasWidth: number): LayoutNode[];
}

// ---------------------------------------------------------------------------
// Default implementation
// ---------------------------------------------------------------------------

/**
 * Default single-row layout engine.
 *
 * - Empty array → returns `[]`
 * - Single member → centers the node horizontally at `canvasWidth / 2`
 * - Multiple members → evenly spaces nodes using
 *   `spacing = canvasWidth / (members.length + 1)`, `x = spacing * (i + 1)`
 *
 * All nodes share the same `y = NODE_HEIGHT / 2 + VERTICAL_PADDING`.
 */
export const defaultTreeLayoutEngine: TreeLayoutEngine = {
  computeLayout(members: Member[], canvasWidth: number): LayoutNode[] {
    if (members.length === 0) {
      return [];
    }

    const y = NODE_HEIGHT / 2 + VERTICAL_PADDING;

    if (members.length === 1) {
      return [{ member: members[0], x: canvasWidth / 2, y }];
    }

    const spacing = canvasWidth / (members.length + 1);

    return members.map((member, i) => ({
      member,
      x: spacing * (i + 1),
      y,
    }));
  },
};

// ---------------------------------------------------------------------------
// extractBirthYear helper
// ---------------------------------------------------------------------------

/**
 * Extracts the 4-character year prefix from a `YYYY-MM-DD` birth date string.
 *
 * - Returns `''` when `birthDate` is `null`.
 * - Returns `birthDate.slice(0, 4)` when `birthDate` is a non-null string.
 *
 * No side effects.
 *
 * Requirements: 7.4, 7.5
 */
export function extractBirthYear(birthDate: string | null): string {
  if (birthDate === null) {
    return '';
  }
  return birthDate.slice(0, 4);
}

/**
 * Tree layout engine for the Family Tree Detail feature.
 *
 * Pure TypeScript module — no React dependencies.
 * Computes display positions (x, y) for family tree nodes arranged in a
 * generational hierarchy (parents above children).
 *
 * Requirements: 8.1–8.7
 */

import type { Member } from '../types/familyTree';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Height of a single tree node card in logical pixels. */
export const NODE_HEIGHT = 140;

/** Width of a single tree node card in logical pixels. */
export const NODE_WIDTH = 120;

/** Horizontal gap between sibling nodes on the same row. */
export const H_GAP = 24;

/** Vertical gap between generation rows. */
export const V_GAP = 64;

/** Vertical padding from the top of the canvas to the first row. */
export const VERTICAL_PADDING = 40;

/** Horizontal padding on each side of the canvas. */
export const H_PADDING = 24;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A positioned member node produced by `TreeLayoutEngine.computeLayout`.
 * `x` and `y` represent the TOP-LEFT corner of the node.
 */
export interface LayoutNode {
  member: Member;
  /** Left edge of the node in logical pixels. */
  x: number;
  /** Top edge of the node in logical pixels. */
  y: number;
}

/** A connector line between two nodes (parent → child). */
export interface LayoutEdge {
  /** ID of the parent member. */
  parentId: string;
  /** ID of the child member. */
  childId: string;
  /** x-center of the parent node bottom. */
  x1: number;
  /** y-bottom of the parent node. */
  y1: number;
  /** x-center of the child node top. */
  x2: number;
  /** y-top of the child node. */
  y2: number;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  /** Total canvas width needed. */
  canvasWidth: number;
  /** Total canvas height needed. */
  canvasHeight: number;
}

export interface TreeLayoutEngine {
  computeLayout(members: Member[]): TreeLayout;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assign a generation depth to each member (0 = root, 1 = child, etc.). */
function assignGenerations(members: Member[]): Map<string, number> {
  const genMap = new Map<string, number>();
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // BFS from roots (members with no known parents in this tree)
  const roots = members.filter(
    (m) =>
      (m.fatherId === null || !memberMap.has(m.fatherId)) &&
      (m.motherId === null || !memberMap.has(m.motherId)),
  );

  const queue: { id: string; gen: number }[] = roots.map((r) => ({
    id: r.id,
    gen: 0,
  }));

  while (queue.length > 0) {
    const item = queue.shift()!;
    // Only update if not yet assigned or if we found a deeper path
    if (!genMap.has(item.id) || genMap.get(item.id)! < item.gen) {
      genMap.set(item.id, item.gen);
    }

    const member = memberMap.get(item.id);
    if (!member) continue;

    for (const childId of member.childrenIds) {
      if (memberMap.has(childId)) {
        queue.push({ id: childId, gen: item.gen + 1 });
      }
    }
  }

  // Fallback: any member not yet assigned gets generation 0
  for (const m of members) {
    if (!genMap.has(m.id)) genMap.set(m.id, 0);
  }

  return genMap;
}

// ---------------------------------------------------------------------------
// Default implementation — generational row layout
// ---------------------------------------------------------------------------

export const defaultTreeLayoutEngine: TreeLayoutEngine = {
  computeLayout(members: Member[]): TreeLayout {
    if (members.length === 0) {
      return { nodes: [], edges: [], canvasWidth: 0, canvasHeight: 0 };
    }

    if (members.length === 1) {
      const canvasWidth = NODE_WIDTH + H_PADDING * 2;
      const canvasHeight = NODE_HEIGHT + VERTICAL_PADDING * 2;
      return {
        nodes: [{ member: members[0], x: H_PADDING, y: VERTICAL_PADDING }],
        edges: [],
        canvasWidth,
        canvasHeight,
      };
    }

    // 1. Assign generations
    const genMap = assignGenerations(members);

    // 2. Group members by generation
    const maxGen = Math.max(...genMap.values());
    const rows: Member[][] = Array.from({ length: maxGen + 1 }, () => []);
    for (const m of members) {
      rows[genMap.get(m.id)!].push(m);
    }

    // 3. Compute x positions per row (centered)
    const rowWidths = rows.map(
      (row) => row.length * NODE_WIDTH + (row.length - 1) * H_GAP,
    );
    const totalCanvasWidth =
      Math.max(...rowWidths) + H_PADDING * 2;

    const nodeMap = new Map<string, LayoutNode>();

    for (let gen = 0; gen <= maxGen; gen++) {
      const row = rows[gen];
      const rowWidth = rowWidths[gen];
      const startX = (totalCanvasWidth - rowWidth) / 2;
      const y = VERTICAL_PADDING + gen * (NODE_HEIGHT + V_GAP);

      for (let i = 0; i < row.length; i++) {
        const x = startX + i * (NODE_WIDTH + H_GAP);
        nodeMap.set(row[i].id, { member: row[i], x, y });
      }
    }

    // 4. Build edges (parent bottom-center → child top-center)
    const edges: LayoutEdge[] = [];
    const memberMap = new Map(members.map((m) => [m.id, m]));

    for (const m of members) {
      const parentNode = nodeMap.get(m.id);
      if (!parentNode) continue;

      for (const childId of m.childrenIds) {
        const childNode = nodeMap.get(childId);
        if (!childNode) continue;

        edges.push({
          parentId: m.id,
          childId,
          x1: parentNode.x + NODE_WIDTH / 2,
          y1: parentNode.y + NODE_HEIGHT,
          x2: childNode.x + NODE_WIDTH / 2,
          y2: childNode.y,
        });
      }
    }

    const canvasHeight =
      VERTICAL_PADDING + (maxGen + 1) * NODE_HEIGHT + maxGen * V_GAP + VERTICAL_PADDING;

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
      canvasWidth: totalCanvasWidth,
      canvasHeight,
    };
  },
};

// ---------------------------------------------------------------------------
// extractBirthYear helper
// ---------------------------------------------------------------------------

/**
 * Extracts the 4-character year prefix from a `YYYY-MM-DD` birth date string.
 * Returns `''` when `birthDate` is `null`.
 *
 * Requirements: 7.4, 7.5
 */
export function extractBirthYear(birthDate: string | null): string {
  if (birthDate === null) return '';
  return birthDate.slice(0, 4);
}

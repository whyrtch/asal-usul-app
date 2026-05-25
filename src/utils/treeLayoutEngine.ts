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
  /** ID of the parent member (or couple key "idA|idB" for couple edges). */
  parentId: string;
  /** ID of the child member. */
  childId: string;
  /**
   * x origin of the line coming down from the parent side.
   * For a single parent this is the node's bottom-center.
   * For a couple this is the midpoint of the spouse connector line.
   */
  x1: number;
  /** y-bottom of the parent node (or spouse line y for couple edges). */
  y1: number;
  /** x-center of the child node top. */
  x2: number;
  /** y-top of the child node. */
  y2: number;
  /**
   * When true, x1/y1 is the midpoint of a spouse connector line.
   * The renderer should draw a straight vertical line from (x1, y1) down to
   * a horizontal junction, then down to the child — no elbow needed when
   * x1 === x2.
   */
  fromCouple?: boolean;
}

/** A horizontal connector line between two spouses. */
export interface SpouseEdge {
  /** ID of the first spouse. */
  spouseAId: string;
  /** ID of the second spouse. */
  spouseBId: string;
  /** x-right edge of the left spouse node. */
  x1: number;
  /** x-left edge of the right spouse node. */
  x2: number;
  /** y-center of both spouse nodes. */
  y: number;
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  spouseEdges: SpouseEdge[];
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

  // Spouse alignment: spouses must share the same generation.
  // If a spouse has no parent in the tree (root), pull them to match
  // their partner's generation. Repeat until stable (handles chains).
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of members) {
      const mGen = genMap.get(m.id)!;
      for (const sid of m.spouseIds) {
        if (!memberMap.has(sid)) continue;
        const sGen = genMap.get(sid)!;
        if (mGen === sGen) continue;

        // Only move a spouse that has no parents in this tree (a "root" spouse)
        // — we don't want to override a generation that was set by parentage.
        const spouse = memberMap.get(sid)!;
        const spouseHasParentInTree =
          (spouse.fatherId !== null && memberMap.has(spouse.fatherId)) ||
          (spouse.motherId !== null && memberMap.has(spouse.motherId));

        if (!spouseHasParentInTree) {
          genMap.set(sid, mGen);
          changed = true;
        }
      }
    }
  }

  return genMap;
}

// ---------------------------------------------------------------------------
// Default implementation — generational row layout
// ---------------------------------------------------------------------------

export const defaultTreeLayoutEngine: TreeLayoutEngine = {
  computeLayout(members: Member[]): TreeLayout {
    if (members.length === 0) {
      return { nodes: [], edges: [], spouseEdges: [], canvasWidth: 0, canvasHeight: 0 };
    }

    if (members.length === 1) {
      const canvasWidth = NODE_WIDTH + H_PADDING * 2;
      const canvasHeight = NODE_HEIGHT + VERTICAL_PADDING * 2;
      return {
        nodes: [{ member: members[0], x: H_PADDING, y: VERTICAL_PADDING }],
        edges: [],
        spouseEdges: [],
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

    // 3. Within each row, group spouses together so they appear side-by-side.
    //    A "couple slot" is either a lone member or a [member, spouse] pair.
    //    We use index-based tracking (not ID-based) to handle edge cases where
    //    members might share the same id in tests.
    const orderedRows: Member[][] = rows.map((row) => {
      const placedIndices = new Set<number>();
      const ordered: Member[] = [];

      for (let i = 0; i < row.length; i++) {
        if (placedIndices.has(i)) continue;
        placedIndices.add(i);
        const m = row[i];
        ordered.push(m);

        // Find the first unplaced spouse in the same row (by index)
        const spouseIndex = row.findIndex(
          (r, idx) =>
            !placedIndices.has(idx) && m.spouseIds.includes(r.id),
        );
        if (spouseIndex !== -1) {
          placedIndices.add(spouseIndex);
          ordered.push(row[spouseIndex]);
        }
      }

      return ordered;
    });

    // 4. Compute x positions per row (centered), keeping spouse pairs together
    //    with a smaller gap (H_GAP / 2) between them.
    const SPOUSE_GAP = H_GAP / 2;

    /** Compute the total pixel width of a row, accounting for spouse pairs. */
    function rowPixelWidth(row: Member[]): number {
      let width = 0;
      let i = 0;
      while (i < row.length) {
        if (i > 0) width += H_GAP; // gap between slots
        const m = row[i];
        const nextM = row[i + 1];
        const isSpousePair =
          nextM !== undefined && m.spouseIds.includes(nextM.id);
        if (isSpousePair) {
          // Two nodes + spouse gap between them (no extra H_GAP — they share one slot)
          width += NODE_WIDTH + SPOUSE_GAP + NODE_WIDTH;
          i += 2;
        } else {
          width += NODE_WIDTH;
          i += 1;
        }
      }
      return width;
    }

    const rowWidths = orderedRows.map(rowPixelWidth);
    const totalCanvasWidth = Math.max(...rowWidths) + H_PADDING * 2;

    const nodeMap = new Map<string, LayoutNode>();
    const nodesList: LayoutNode[] = [];

    for (let gen = 0; gen <= maxGen; gen++) {
      const row = orderedRows[gen];
      const rowWidth = rowWidths[gen];
      const startX = (totalCanvasWidth - rowWidth) / 2;
      const y = VERTICAL_PADDING + gen * (NODE_HEIGHT + V_GAP);

      let curX = startX;
      let i = 0;
      while (i < row.length) {
        if (i > 0) curX += H_GAP;
        const m = row[i];
        const nextM = row[i + 1];
        const isSpousePair =
          nextM !== undefined && m.spouseIds.includes(nextM.id);

        const nodeA: LayoutNode = { member: m, x: curX, y };
        nodeMap.set(m.id, nodeA);
        nodesList.push(nodeA);
        curX += NODE_WIDTH;

        if (isSpousePair) {
          curX += SPOUSE_GAP;
          const nodeB: LayoutNode = { member: nextM, x: curX, y };
          nodeMap.set(nextM.id, nodeB);
          nodesList.push(nodeB);
          curX += NODE_WIDTH;
          i += 2;
        } else {
          i += 1;
        }
      }
    }

    // 5. Build parent→child edges.
    //
    //    For children who have BOTH parents in the tree and those parents are
    //    spouses of each other, the edge originates from the midpoint of the
    //    spouse connector line (fromCouple = true).
    //    For children with only one known parent in the tree, the edge
    //    originates from that parent's bottom-center as before.
    const edges: LayoutEdge[] = [];

    // Build a quick lookup: childId → { fatherId, motherId } within this tree
    const memberMap = new Map(members.map((m) => [m.id, m]));

    // Track which children have already been given a couple-edge so we don't
    // also emit a duplicate single-parent edge for the same child.
    const childHandledByCouple = new Set<string>();

    // First pass: emit couple edges for children whose both parents are present
    // and are spouses of each other.
    for (const m of members) {
      const parentNode = nodeMap.get(m.id);
      if (!parentNode) continue;

      for (const childId of m.childrenIds) {
        if (childHandledByCouple.has(childId)) continue;

        const child = memberMap.get(childId);
        if (!child) continue;

        // Find the other parent of this child
        const otherParentId =
          child.fatherId === m.id ? child.motherId :
          child.motherId === m.id ? child.fatherId :
          null;

        if (
          otherParentId !== null &&
          memberMap.has(otherParentId) &&
          m.spouseIds.includes(otherParentId)
        ) {
          // Both parents are in the tree and are spouses — use couple midpoint
          const otherParentNode = nodeMap.get(otherParentId);
          const childNode = nodeMap.get(childId);
          if (!otherParentNode || !childNode) continue;

          // Midpoint x of the entire couple span (left node left-edge → right node right-edge)
          const leftNodeX = Math.min(parentNode.x, otherParentNode.x);
          const rightNodeX = Math.max(parentNode.x, otherParentNode.x);
          const midX = leftNodeX + (rightNodeX + NODE_WIDTH - leftNodeX) / 2;
          // y is the spouse line y (vertical center of the parent row)
          const coupleY = parentNode.y + NODE_HEIGHT / 2;

          edges.push({
            parentId: `${m.id}|${otherParentId}`,
            childId,
            x1: midX,
            y1: coupleY,
            x2: childNode.x + NODE_WIDTH / 2,
            y2: childNode.y,
            fromCouple: true,
          });

          childHandledByCouple.add(childId);
        }
      }
    }

    // Second pass: single-parent edges for children not already handled
    for (const m of members) {
      const parentNode = nodeMap.get(m.id);
      if (!parentNode) continue;

      for (const childId of m.childrenIds) {
        if (childHandledByCouple.has(childId)) continue;

        const childNode = nodeMap.get(childId);
        if (!childNode) continue;

        edges.push({
          parentId: m.id,
          childId,
          x1: parentNode.x + NODE_WIDTH / 2,
          y1: parentNode.y + NODE_HEIGHT,
          x2: childNode.x + NODE_WIDTH / 2,
          y2: childNode.y,
          fromCouple: false,
        });
      }
    }

    // 6. Build spouse edges (horizontal line between side-by-side spouses).
    //    Deduplicate: only emit one edge per pair (A-B, not also B-A).
    const spouseEdges: SpouseEdge[] = [];
    const seenSpousePairs = new Set<string>();

    for (const m of members) {
      for (const sid of m.spouseIds) {
        const pairKey = [m.id, sid].sort().join('|');
        if (seenSpousePairs.has(pairKey)) continue;
        seenSpousePairs.add(pairKey);

        const nodeA = nodeMap.get(m.id);
        const nodeB = nodeMap.get(sid);
        if (!nodeA || !nodeB) continue;

        // Determine left/right node
        const leftNode = nodeA.x < nodeB.x ? nodeA : nodeB;
        const rightNode = nodeA.x < nodeB.x ? nodeB : nodeA;

        spouseEdges.push({
          spouseAId: m.id,
          spouseBId: sid,
          x1: leftNode.x + NODE_WIDTH,
          x2: rightNode.x,
          y: leftNode.y + NODE_HEIGHT / 2,
        });
      }
    }

    const canvasHeight =
      VERTICAL_PADDING + (maxGen + 1) * NODE_HEIGHT + maxGen * V_GAP + VERTICAL_PADDING;

    const result: TreeLayout = {
      nodes: nodesList,
      edges,
      spouseEdges,
      canvasWidth: totalCanvasWidth,
      canvasHeight,
    };

    console.log('[treeLayoutEngine] computeLayout result:', JSON.stringify({
      members: members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        gen: genMap.get(m.id),
        fatherId: m.fatherId,
        motherId: m.motherId,
        spouseIds: m.spouseIds,
        childrenIds: m.childrenIds,
      })),
      nodes: result.nodes.map((n) => ({
        id: n.member.id,
        fullName: n.member.fullName,
        x: n.x,
        y: n.y,
      })),
      edges: result.edges.map((e) => ({
        parentId: e.parentId,
        childId: e.childId,
        x1: e.x1,
        y1: e.y1,
        x2: e.x2,
        y2: e.y2,
        fromCouple: e.fromCouple,
      })),
      spouseEdges: result.spouseEdges.map((s) => ({
        spouseAId: s.spouseAId,
        spouseBId: s.spouseBId,
        x1: s.x1,
        x2: s.x2,
        y: s.y,
      })),
      canvasWidth: result.canvasWidth,
      canvasHeight: result.canvasHeight,
    }, null, 2));

    return result;
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

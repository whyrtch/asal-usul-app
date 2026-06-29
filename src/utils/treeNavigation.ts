/**
 * Pure helpers for the Family Tree canvas navigation (zoom / pan / search).
 *
 * No React or Reanimated dependencies — all functions are deterministic and
 * unit-testable. The canvas component wires these into shared values.
 *
 * Phase 1 — 4.3 Navigasi pohon (zoom/pan, tap-to-detail, search).
 */

import type { Member } from '../types/familyTree';
import { NODE_HEIGHT, NODE_WIDTH } from './treeLayoutEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum zoom scale (most zoomed-out). */
export const MIN_SCALE = 0.4;

/** Maximum zoom scale (most zoomed-in). */
export const MAX_SCALE = 3;

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/**
 * Clamps `value` into the inclusive range `[min, max]`.
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/** A 2D transform describing the canvas position and zoom. */
export interface CanvasTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Computes a transform that fits the whole canvas inside the viewport and
 * centers it. Never upscales beyond 1 (so small trees stay at natural size).
 *
 * Returns an identity-ish transform when any dimension is non-positive.
 */
export function computeFitToScreen(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): CanvasTransform {
  if (
    canvasWidth <= 0 ||
    canvasHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  const rawScale = Math.min(
    viewportWidth / canvasWidth,
    viewportHeight / canvasHeight,
  );
  // Fit but never zoom in past natural size.
  const scale = clamp(Math.min(rawScale, 1), MIN_SCALE, MAX_SCALE);

  const translateX = (viewportWidth - canvasWidth * scale) / 2;
  const translateY = (viewportHeight - canvasHeight * scale) / 2;

  return { scale, translateX, translateY };
}

/**
 * Computes the translation needed to center a given node within the viewport
 * at the supplied scale. The node's center (not its top-left) is centered.
 */
export function computeCenterOnNode(
  nodeX: number,
  nodeY: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
): Pick<CanvasTransform, 'translateX' | 'translateY'> {
  const nodeCenterX = nodeX + NODE_WIDTH / 2;
  const nodeCenterY = nodeY + NODE_HEIGHT / 2;

  return {
    translateX: viewportWidth / 2 - nodeCenterX * scale,
    translateY: viewportHeight / 2 - nodeCenterY * scale,
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Filters members whose `fullName` contains `query` (case-insensitive,
 * trimmed). Returns an empty array for a blank query.
 */
export function filterMembersByQuery(
  members: Member[],
  query: string,
): Member[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return members.filter((m) => m.fullName.toLowerCase().includes(q));
}

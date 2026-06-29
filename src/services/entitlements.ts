/**
 * Entitlements — centralized, swappable access decisions for monetization.
 *
 * Phase 3 (prepare-only): the default provider returns UNLIMITED limits for
 * every plan, so all helpers always allow → ZERO behavior change. Phase 4
 * swaps in a Remote-Config-backed provider with real free limits and wires the
 * user's `plan` from billing — without touching any call site.
 *
 * Pure & total (no throws). No billing SDK, no paywall here.
 *
 * @module src/services/entitlements
 */

/** Account tier. */
export type Plan = 'free' | 'premium';

/** Configurable limits per plan. `null` = unlimited. */
export interface Limits {
  /** Max number of trees a user may own; null = unlimited. */
  maxTrees: number | null;
  /** Max members per tree; null = unlimited. */
  maxMembersPerTree: number | null;
  /** Whether export (PDF/GEDCOM) is enabled. */
  exportEnabled: boolean;
}

/** Source of limit values — swappable (local default now, Remote Config later). */
export interface LimitsProvider {
  getLimits(plan: Plan): Limits;
}

/** Result of an entitlement check. */
export interface EntitlementResult {
  allowed: boolean;
  /** Localized reason when not allowed. */
  reason?: string;
  /** The numeric limit that applied, when relevant. */
  limit?: number | null;
}

// ---------------------------------------------------------------------------
// Default provider — UNLIMITED for every plan (no behavior change)
// ---------------------------------------------------------------------------

const UNLIMITED: Limits = {
  maxTrees: null,
  maxMembersPerTree: null,
  exportEnabled: true,
};

export const DefaultLimitsProvider: LimitsProvider = {
  getLimits: () => UNLIMITED,
};

let activeProvider: LimitsProvider = DefaultLimitsProvider;

/** Swap the active limits provider (call once at startup in Phase 4). */
export function setLimitsProvider(provider: LimitsProvider): void {
  activeProvider = provider;
}

/** Returns the active provider (useful for tests). */
export function getLimitsProvider(): LimitsProvider {
  return activeProvider;
}

// ---------------------------------------------------------------------------
// Generic count-vs-limit check
// ---------------------------------------------------------------------------

/**
 * Allows when `limit` is null (unlimited) or `count < limit`.
 * Defensive: negative/NaN counts are treated as below any positive limit.
 */
function checkCount(
  count: number,
  limit: number | null,
  reason: string,
): EntitlementResult {
  if (limit === null) return { allowed: true };
  if (Number.isNaN(count)) return { allowed: true };
  if (count < limit) return { allowed: true, limit };
  return { allowed: false, reason, limit };
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** May the user create another tree given how many they already own? */
export function canCreateTree(
  plan: Plan,
  currentTreeCount: number,
): EntitlementResult {
  const { maxTrees } = activeProvider.getLimits(plan);
  return checkCount(
    currentTreeCount,
    maxTrees,
    'Batas jumlah pohon keluarga tercapai.',
  );
}

/** May the user add another member to a tree given the current count? */
export function canAddMember(
  plan: Plan,
  currentMemberCount: number,
): EntitlementResult {
  const { maxMembersPerTree } = activeProvider.getLimits(plan);
  return checkCount(
    currentMemberCount,
    maxMembersPerTree,
    'Batas jumlah anggota tercapai.',
  );
}

/** May the user export (PDF/GEDCOM)? */
export function canExport(plan: Plan): EntitlementResult {
  const { exportEnabled } = activeProvider.getLimits(plan);
  return exportEnabled
    ? { allowed: true }
    : { allowed: false, reason: 'Fitur ekspor hanya untuk Premium.' };
}

/**
 * Pure role-derivation and permission helpers for Family Tree Sharing.
 *
 * No React/Firebase deps — deterministic and unit-testable. UI gates controls
 * from `deriveRole` + the `can*` helpers so permissions live in one place.
 *
 * Phase 2 — Family Tree Sharing.
 *
 * @module src/utils/roles
 */

import type { AccessRole, Role } from '../types/sharing';

/**
 * Derives a user's effective role for a tree.
 *
 * - `'owner'` when `ownerId === uid` (takes precedence over any access doc).
 * - the access role (`'editor' | 'viewer'`) when an access entry exists.
 * - `null` when the user has no relationship to the tree.
 *
 * @param ownerId    - The tree's `ownerId`.
 * @param uid        - The current user's UID (or null when signed out).
 * @param accessRole - The user's AccessDoc role, if any.
 */
export function deriveRole(
  ownerId: string,
  uid: string | null | undefined,
  accessRole?: AccessRole | null,
): Role | null {
  if (!uid) return null;
  if (ownerId === uid) return 'owner';
  if (accessRole === 'editor' || accessRole === 'viewer') return accessRole;
  return null;
}

/** True when the role may add/edit/delete members (owner or editor). */
export function canEditMembers(role: Role | null): boolean {
  return role === 'owner' || role === 'editor';
}

/** True when the role may edit/delete the tree itself (owner only). */
export function canManageTree(role: Role | null): boolean {
  return role === 'owner';
}

/** True when the role may manage collaborators / invitations (owner only). */
export function canManageAccess(role: Role | null): boolean {
  return role === 'owner';
}

/** True when the role may view the tree (any known role). */
export function canView(role: Role | null): boolean {
  return role === 'owner' || role === 'editor' || role === 'viewer';
}

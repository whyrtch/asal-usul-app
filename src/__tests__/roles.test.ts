/**
 * Unit + property tests for src/utils/roles.ts (Phase 2 — sharing).
 *
 * These guard the permission model: getting role gating wrong is a security
 * issue, so the pure logic is tested exhaustively.
 */

import * as fc from 'fast-check';
import type { Role } from '../types/sharing';
import {
    canEditMembers,
    canManageAccess,
    canManageTree,
    canView,
    deriveRole,
} from '../utils/roles';

describe('deriveRole', () => {
  it('returns owner when ownerId === uid', () => {
    expect(deriveRole('u1', 'u1')).toBe('owner');
  });

  it('owner takes precedence over an access role', () => {
    expect(deriveRole('u1', 'u1', 'viewer')).toBe('owner');
  });

  it('returns the access role for a non-owner with access', () => {
    expect(deriveRole('owner', 'u2', 'editor')).toBe('editor');
    expect(deriveRole('owner', 'u2', 'viewer')).toBe('viewer');
  });

  it('returns null for a user with no relationship', () => {
    expect(deriveRole('owner', 'u3')).toBeNull();
    expect(deriveRole('owner', 'u3', null)).toBeNull();
  });

  it('returns null when uid is null/undefined', () => {
    expect(deriveRole('owner', null)).toBeNull();
    expect(deriveRole('owner', undefined)).toBeNull();
  });
});

describe('permission helpers', () => {
  it('canEditMembers: owner + editor only', () => {
    expect(canEditMembers('owner')).toBe(true);
    expect(canEditMembers('editor')).toBe(true);
    expect(canEditMembers('viewer')).toBe(false);
    expect(canEditMembers(null)).toBe(false);
  });

  it('canManageTree / canManageAccess: owner only', () => {
    expect(canManageTree('owner')).toBe(true);
    expect(canManageTree('editor')).toBe(false);
    expect(canManageTree('viewer')).toBe(false);
    expect(canManageTree(null)).toBe(false);

    expect(canManageAccess('owner')).toBe(true);
    expect(canManageAccess('editor')).toBe(false);
    expect(canManageAccess('viewer')).toBe(false);
    expect(canManageAccess(null)).toBe(false);
  });

  it('canView: any known role, not null', () => {
    expect(canView('owner')).toBe(true);
    expect(canView('editor')).toBe(true);
    expect(canView('viewer')).toBe(true);
    expect(canView(null)).toBe(false);
  });
});

describe('Property: editor/viewer never gain owner-only powers', () => {
  it('only owner can manage tree/access for any role', () => {
    const roleArb = fc.constantFrom<Role | null>('owner', 'editor', 'viewer', null);
    fc.assert(
      fc.property(roleArb, (role) => {
        if (role !== 'owner') {
          expect(canManageTree(role)).toBe(false);
          expect(canManageAccess(role)).toBe(false);
        }
        // viewer/null can never edit members
        if (role === 'viewer' || role === null) {
          expect(canEditMembers(role)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });
});

describe('Property: deriveRole owner precedence', () => {
  it('whenever ownerId === uid, role is owner regardless of access role', () => {
    const accessArb = fc.constantFrom('editor' as const, 'viewer' as const, null);
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), accessArb, (uid, access) => {
        expect(deriveRole(uid, uid, access)).toBe('owner');
      }),
      { numRuns: 200 },
    );
  });
});

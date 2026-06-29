/**
 * Unit + property tests for src/services/entitlements.ts (Phase 3).
 *
 * Verifies: default provider never denies, null = unlimited, numeric boundary
 * (allowed iff count < limit), and provider swap.
 */

import * as fc from 'fast-check';
import {
    canAddMember,
    canCreateTree,
    canExport,
    DefaultLimitsProvider,
    setLimitsProvider,
    type LimitsProvider,
    type Plan,
} from '../services/entitlements';

afterEach(() => {
  setLimitsProvider(DefaultLimitsProvider);
});

describe('default provider (unlimited) — no behavior change', () => {
  it('never denies for any plan/count', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Plan>('free', 'premium'),
        fc.integer({ min: 0, max: 100000 }),
        (plan, count) => {
          expect(canCreateTree(plan, count).allowed).toBe(true);
          expect(canAddMember(plan, count).allowed).toBe(true);
          expect(canExport(plan).allowed).toBe(true);
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe('numeric limit boundary (allowed iff count < limit)', () => {
  function providerWith(maxTrees: number | null, maxMembers: number | null, exportEnabled = true): LimitsProvider {
    return { getLimits: () => ({ maxTrees, maxMembersPerTree: maxMembers, exportEnabled }) };
  }

  it('allows below the limit, denies at/above', () => {
    setLimitsProvider(providerWith(1, 25));

    expect(canCreateTree('free', 0).allowed).toBe(true);
    expect(canCreateTree('free', 1).allowed).toBe(false);
    expect(canCreateTree('free', 2).allowed).toBe(false);

    expect(canAddMember('free', 24).allowed).toBe(true);
    expect(canAddMember('free', 25).allowed).toBe(false);
  });

  it('includes reason + limit when denied', () => {
    setLimitsProvider(providerWith(1, 25));
    const r = canCreateTree('free', 1);
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(1);
    expect(typeof r.reason).toBe('string');
  });

  it('null limit means unlimited', () => {
    setLimitsProvider(providerWith(null, null));
    expect(canCreateTree('free', 999).allowed).toBe(true);
    expect(canAddMember('free', 999).allowed).toBe(true);
  });

  it('export gated when disabled', () => {
    setLimitsProvider(providerWith(null, null, false));
    expect(canExport('free').allowed).toBe(false);
  });

  it('property: allowed iff count < L for any positive L', () => {
    const provider = (L: number): LimitsProvider => ({
      getLimits: () => ({ maxTrees: L, maxMembersPerTree: L, exportEnabled: true }),
    });
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 2000 }),
        (L, count) => {
          setLimitsProvider(provider(L));
          expect(canCreateTree('free', count).allowed).toBe(count < L);
        },
      ),
      { numRuns: 500 },
    );
  });
});

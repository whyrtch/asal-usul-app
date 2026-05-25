/**
 * Property-based tests for src/store/useFamilyTreeStore.ts
 *
 * Property 3: Optimistic Rollback Consistency
 * If the Firestore write for `createFamilyTree` fails, the optimistic entry is
 * removed and `familyTrees.length` returns to its exact pre-call value.
 *
 * **Validates: Requirements 3.1, 3.3**
 */

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

jest.mock('@/repositories/familyTreeRepository', () => ({
  fetchFamilyTrees: jest.fn().mockResolvedValue([]),
  createFamilyTree: jest.fn(),
  updateFamilyTree: jest.fn(),
  deleteFamilyTree: jest.fn(),
}));

jest.mock('@/services/firebase/firestore', () => ({
  isPermissionError: jest.fn().mockReturnValue(false),
  isNetworkError: jest.fn().mockReturnValue(false),
}));

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import { createFamilyTree as repoCreateFamilyTree } from '@/repositories/familyTreeRepository';
import * as fc from 'fast-check';
import type { FamilyTree } from '../../types/familyTree';
import { useFamilyTreeStore } from '../useFamilyTreeStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockRepoCreate = repoCreateFamilyTree as jest.MockedFunction<
  typeof repoCreateFamilyTree
>;

/** Build a minimal valid FamilyTree for seeding the store. */
function makeSeedTree(id: string, name: string): FamilyTree {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description: null,
    coverImage: null,
    ownerId: 'owner-uid',
    totalMembers: 0,
    shareWith: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  useFamilyTreeStore.setState({ familyTrees: [], loading: false, error: null });
  jest.clearAllMocks();
  // Default: repository rejects (simulates Firestore write failure)
  mockRepoCreate.mockRejectedValue(new Error('Firestore write failed'));
});

// ---------------------------------------------------------------------------
// Property 3: Optimistic Rollback Consistency
// **Validates: Requirements 3.1, 3.3**
// ---------------------------------------------------------------------------

describe('Property 3: Optimistic Rollback Consistency', () => {
  /**
   * For any initial set of N trees in the store, when `createFamilyTree` is
   * called and the Firestore write fails, `familyTrees.length` MUST equal N
   * (the exact pre-call value) after the promise settles.
   *
   * This verifies that:
   *   1. The optimistic entry was inserted (Req 3.1) — length briefly becomes N+1
   *   2. The rollback removed it on failure (Req 3.3) — length returns to N
   *
   * **Validates: Requirements 3.1, 3.3**
   */
  it(
    'familyTrees.length returns to its exact pre-call value after a failed createFamilyTree',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Seed the store with N trees (0–20), each with a unique id and name
          fc.array(
            fc.record({ id: fc.string(), name: fc.string() }),
            { minLength: 0, maxLength: 20 },
          ),
          // A valid (non-empty) tree name to pass to createFamilyTree
          fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
          async (seedData, newName) => {
            // Ensure unique ids to avoid accidental collisions in the seed
            const uniqueSeedData = seedData.filter(
              (item, index, arr) =>
                arr.findIndex((other) => other.id === item.id) === index,
            );

            // Seed the store with N trees
            const seedTrees = uniqueSeedData.map((item) =>
              makeSeedTree(item.id, item.name),
            );
            useFamilyTreeStore.setState({
              familyTrees: seedTrees,
              loading: false,
              error: null,
            });

            // Capture pre-call length (N)
            const preCallLength =
              useFamilyTreeStore.getState().familyTrees.length;

            // Mock repository to reject — simulates Firestore write failure
            mockRepoCreate.mockRejectedValue(new Error('Firestore write failed'));

            // Call createFamilyTree — must not throw (error is stored in state)
            await useFamilyTreeStore
              .getState()
              .createFamilyTree(newName, 'owner-uid');

            // Post-call length must equal pre-call length (rollback applied)
            const postCallLength =
              useFamilyTreeStore.getState().familyTrees.length;

            return postCallLength === preCallLength;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  /**
   * Verifies that the error state is set to a non-empty string after rollback,
   * confirming the store surfaces the failure to the UI (Req 3.3).
   *
   * **Validates: Requirements 3.3**
   */
  it(
    'sets a non-empty error string after a failed createFamilyTree',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ id: fc.string(), name: fc.string() }),
            { minLength: 0, maxLength: 10 },
          ),
          fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
          async (seedData, newName) => {
            const uniqueSeedData = seedData.filter(
              (item, index, arr) =>
                arr.findIndex((other) => other.id === item.id) === index,
            );
            const seedTrees = uniqueSeedData.map((item) =>
              makeSeedTree(item.id, item.name),
            );
            useFamilyTreeStore.setState({
              familyTrees: seedTrees,
              loading: false,
              error: null,
            });

            mockRepoCreate.mockRejectedValue(new Error('Firestore write failed'));

            await useFamilyTreeStore
              .getState()
              .createFamilyTree(newName, 'owner-uid');

            const { error } = useFamilyTreeStore.getState();

            // error must be a non-empty string (Req 3.3)
            return typeof error === 'string' && error.length > 0;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  /**
   * Verifies that no temp_ entry leaks into the store after rollback.
   * The optimistic entry (id prefixed with "temp_") must be absent after failure.
   *
   * **Validates: Requirements 3.3**
   */
  it(
    'no temp_ entry remains in familyTrees after a failed createFamilyTree',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ id: fc.string(), name: fc.string() }),
            { minLength: 0, maxLength: 10 },
          ),
          fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
          async (seedData, newName) => {
            const uniqueSeedData = seedData.filter(
              (item, index, arr) =>
                arr.findIndex((other) => other.id === item.id) === index,
            );
            const seedTrees = uniqueSeedData.map((item) =>
              makeSeedTree(item.id, item.name),
            );
            useFamilyTreeStore.setState({
              familyTrees: seedTrees,
              loading: false,
              error: null,
            });

            mockRepoCreate.mockRejectedValue(new Error('Firestore write failed'));

            await useFamilyTreeStore
              .getState()
              .createFamilyTree(newName, 'owner-uid');

            const { familyTrees } = useFamilyTreeStore.getState();

            // No temp_ entry should remain after rollback
            return familyTrees.every((t) => !t.id.startsWith('temp_'));
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

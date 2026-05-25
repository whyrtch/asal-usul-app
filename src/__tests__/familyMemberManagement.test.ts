/**
 * Property-based tests for Family & Member Management (Step 5)
 *
 * Property 1 — updateFamilyTree idempotency on unknown id
 * Property 2 — deleteFamilyTree removes the tree from familyTrees
 * Property 3 — deleteMember cleans up all relationship references (skipped — moved to useMemberStore)
 * Property 4 — updateMember never changes id, familyTreeId, or createdAt (skipped — moved to useMemberStore)
 * Property 5 — resolveRelationships never throws
 * Property 6 — validateFamilyForm empty name always errors
 * Property 7 — validateFamilyForm non-empty name never errors
 *
 * **Validates: Requirements 2.5, 3.6, 5.6, 6.4, 7.1, 7.2, 7.5**
 */

// Mock Firebase dependencies so Jest doesn't need native modules
jest.mock('@/repositories/familyTreeRepository', () => ({
  fetchFamilyTrees: jest.fn().mockResolvedValue([]),
  updateFamilyTree: jest.fn().mockResolvedValue(undefined),
  deleteFamilyTree: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/firebase/firestore', () => ({
  isPermissionError: jest.fn().mockReturnValue(false),
  isNetworkError: jest.fn().mockReturnValue(false),
}));

import * as fc from 'fast-check';
import { useFamilyTreeStore } from '../store/useFamilyTreeStore';
import type { FamilyTree, Member } from '../types/familyTree';
import { resolveRelationships, validateFamilyForm } from '../utils/validationUtils';

// ---------------------------------------------------------------------------
// Seed data — a known family tree with several members for store-based tests
// ---------------------------------------------------------------------------

const TREE_ID = 'test-tree-1';
const TREE_ID_2 = 'test-tree-2';

const seedTree: FamilyTree = {
  id: TREE_ID,
  name: 'Test Family',
  description: null,
  coverImage: null,
  ownerId: 'owner-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  totalMembers: 3,
  shareWith: [],
};

const seedTree2: FamilyTree = {
  id: TREE_ID_2,
  name: 'Another Family',
  description: null,
  coverImage: null,
  ownerId: 'owner-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  totalMembers: 1,
  shareWith: [],
};

const seedMembers: Member[] = []; // kept for type reference; members now live in useMemberStore

/** Reset the store to the known seed state before each property run */
function resetStore(): void {
  useFamilyTreeStore.setState({
    familyTrees: [{ ...seedTree }, { ...seedTree2 }],
    loading: false,
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetStore();
});

// ---------------------------------------------------------------------------
// Property 1 — updateFamilyTree idempotency on unknown id
// ---------------------------------------------------------------------------

describe('Property 1: updateFamilyTree idempotency on unknown id', () => {
  /**
   * For any string that is NOT one of the existing tree IDs, calling
   * updateFamilyTree(unknownId, patch) leaves familyTrees state unchanged.
   *
   * **Validates: Requirements 2.5**
   */
  it('state is unchanged when id does not exist in familyTrees', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => s !== TREE_ID && s !== TREE_ID_2),
        fc.record({ name: fc.string({ minLength: 1 }) }),
        async (unknownId, patch) => {
          resetStore();

          const before = useFamilyTreeStore.getState().familyTrees;
          await useFamilyTreeStore.getState().updateFamilyTree(unknownId, patch);
          const after = useFamilyTreeStore.getState().familyTrees;

          // familyTrees array must be structurally equal (same trees, same order)
          expect(after.length).toBe(before.length);
          after.forEach((tree, i) => {
            expect(tree.id).toBe(before[i].id);
            expect(tree.name).toBe(before[i].name);
            expect(tree.description).toBe(before[i].description);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2 — deleteFamilyTree removes the tree from familyTrees
// ---------------------------------------------------------------------------

describe('Property 2: deleteFamilyTree removes the tree from familyTrees', () => {
  /**
   * For any valid family tree id, after deleteFamilyTree(id) the tree is no
   * longer present in familyTrees.
   *
   * Note: member cleanup is now handled by useMemberStore (task 9.1).
   *
   * **Validates: Requirements 3.6**
   */
  it('tree is no longer in familyTrees after deleteFamilyTree', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(TREE_ID, TREE_ID_2),
        async (id) => {
          resetStore();

          await useFamilyTreeStore.getState().deleteFamilyTree(id, 'owner-1');

          const remaining = useFamilyTreeStore.getState().familyTrees.filter(
            (t) => t.id === id
          );

          expect(remaining).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('other trees are not affected by deleteFamilyTree', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(TREE_ID, TREE_ID_2),
        async (id) => {
          resetStore();

          const otherTreeId = id === TREE_ID ? TREE_ID_2 : TREE_ID;
          const treesBefore = useFamilyTreeStore
            .getState()
            .familyTrees.filter((t) => t.id === otherTreeId);

          await useFamilyTreeStore.getState().deleteFamilyTree(id, 'owner-1');

          const treesAfter = useFamilyTreeStore
            .getState()
            .familyTrees.filter((t) => t.id === otherTreeId);

          expect(treesAfter).toEqual(treesBefore);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — deleteMember cleans up all relationship references
// ---------------------------------------------------------------------------

describe('Property 3: deleteMember cleans up all relationship references', () => {
  /**
   * NOTE: deleteMember has been moved to useMemberStore (task 9.1).
   * These tests are skipped until useMemberStore is implemented.
   *
   * **Validates: Requirements 6.4**
   */
  it.skip('no other member references the deleted id in any relationship field', () => {
    // Will be re-enabled in task 9.1 when useMemberStore is implemented
  });

  it.skip('the deleted member itself is no longer in the store', () => {
    // Will be re-enabled in task 9.1 when useMemberStore is implemented
  });
});

// ---------------------------------------------------------------------------
// Property 4 — updateMember never changes id, familyTreeId, or createdAt
// ---------------------------------------------------------------------------

describe('Property 4: updateMember never changes id, familyTreeId, or createdAt', () => {
  /**
   * NOTE: updateMember has been moved to useMemberStore (task 9.1).
   * These tests are skipped until useMemberStore is implemented.
   *
   * **Validates: Requirements 5.6**
   */
  it.skip('immutable fields id, familyTreeId, createdAt are unchanged after any patch', () => {
    // Will be re-enabled in task 9.1 when useMemberStore is implemented
  });

  it.skip('patch fields are applied correctly while immutable fields stay the same', () => {
    // Will be re-enabled in task 9.1 when useMemberStore is implemented
  });
});

// ---------------------------------------------------------------------------
// Property 5 — resolveRelationships never throws
// ---------------------------------------------------------------------------

describe('Property 5: resolveRelationships never throws', () => {
  /**
   * For any member shape and any member array (including empty), calling
   * resolveRelationships returns without throwing.
   *
   * **Validates: Requirements 7.5**
   */

  /** Arbitrary for a minimal Member-like object */
  const memberArb = fc.record<Member>({
    id: fc.string(),
    familyTreeId: fc.string(),
    fullName: fc.string(),
    gender: fc.constantFrom('male' as const, 'female' as const),
    role: fc.string(),
    birthDate: fc.option(fc.string(), { nil: null }),
    photoUrl: fc.option(fc.string(), { nil: null }),
    bio: fc.option(fc.string(), { nil: null }),
    fatherId: fc.option(fc.string(), { nil: null }),
    motherId: fc.option(fc.string(), { nil: null }),
    spouseIds: fc.array(fc.string()),
    childrenIds: fc.array(fc.string()),
    createdAt: fc.string(),
  });

  it('never throws for any member shape and any member array', () => {
    fc.assert(
      fc.property(
        memberArb,
        fc.array(memberArb),
        (member, allMembers) => {
          expect(() =>
            resolveRelationships(member, allMembers)
          ).not.toThrow();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('never throws when allMembers is empty', () => {
    fc.assert(
      fc.property(memberArb, (member) => {
        expect(() => resolveRelationships(member, [])).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('returns a valid object with the four expected keys', () => {
    fc.assert(
      fc.property(memberArb, fc.array(memberArb), (member, allMembers) => {
        const result = resolveRelationships(member, allMembers);
        expect(result).toHaveProperty('father');
        expect(result).toHaveProperty('mother');
        expect(result).toHaveProperty('spouses');
        expect(result).toHaveProperty('children');
        expect(Array.isArray(result.spouses)).toBe(true);
        expect(Array.isArray(result.children)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6 — validateFamilyForm empty name always errors
// ---------------------------------------------------------------------------

describe('Property 6: validateFamilyForm empty name always errors', () => {
  /**
   * For any whitespace-only string (including empty string), validateFamilyForm
   * returns an errors object with errors.name defined.
   *
   * **Validates: Requirements 7.1**
   */

  /** Generates whitespace-only strings (spaces, tabs, newlines) */
  const whitespaceOnlyArb = fc.oneof(
    fc.constant(''),
    fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
      .map((chars) => chars.join(''))
  );

  it('errors.name is defined for any whitespace-only name', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (emptyName) => {
        const errors = validateFamilyForm({ name: emptyName, description: '' });
        expect(errors.name).toBeDefined();
      }),
      { numRuns: 200 }
    );
  });

  it('errors.name is defined for the empty string', () => {
    const errors = validateFamilyForm({ name: '', description: '' });
    expect(errors.name).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Property 7 — validateFamilyForm non-empty name never errors
// ---------------------------------------------------------------------------

describe('Property 7: validateFamilyForm non-empty name never errors', () => {
  /**
   * For any string with at least one non-whitespace character, validateFamilyForm
   * returns an errors object without a name key.
   *
   * **Validates: Requirements 7.2**
   */
  it('errors.name is undefined for any name with at least one non-whitespace character', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (name) => {
          const errors = validateFamilyForm({ name, description: '' });
          expect(errors.name).toBeUndefined();
        }
      ),
      { numRuns: 200 }
    );
  });

  it('errors.name is undefined for a plain non-empty name', () => {
    const errors = validateFamilyForm({ name: 'Keluarga Budi', description: '' });
    expect(errors.name).toBeUndefined();
  });
});

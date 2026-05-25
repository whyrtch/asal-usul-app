/**
 * Property-based tests for Family & Member Management (Step 5)
 *
 * Property 1 — updateFamilyTree idempotency on unknown id
 * Property 2 — deleteFamilyTree removes all members of that tree
 * Property 3 — deleteMember cleans up all relationship references
 * Property 4 — updateMember never changes id, familyTreeId, or createdAt
 * Property 5 — resolveRelationships never throws
 * Property 6 — validateFamilyForm empty name always errors
 * Property 7 — validateFamilyForm non-empty name never errors
 *
 * **Validates: Requirements 2.5, 3.6, 5.6, 6.4, 7.1, 7.2, 7.5**
 */

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
};

const seedMembers: Member[] = [
  {
    id: 'member-1',
    familyTreeId: TREE_ID,
    fullName: 'Alice',
    gender: 'female',
    role: 'Ibu',
    birthDate: '1970-01-01',
    photoUrl: null,
    bio: null,
    fatherId: null,
    motherId: null,
    spouseIds: ['member-2'],
    childrenIds: ['member-3'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'member-2',
    familyTreeId: TREE_ID,
    fullName: 'Bob',
    gender: 'male',
    role: 'Ayah',
    birthDate: '1968-05-15',
    photoUrl: null,
    bio: null,
    fatherId: null,
    motherId: null,
    spouseIds: ['member-1'],
    childrenIds: ['member-3'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'member-3',
    familyTreeId: TREE_ID,
    fullName: 'Charlie',
    gender: 'male',
    role: 'Anak',
    birthDate: '2000-03-20',
    photoUrl: null,
    bio: null,
    fatherId: 'member-2',
    motherId: 'member-1',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'member-4',
    familyTreeId: TREE_ID_2,
    fullName: 'Diana',
    gender: 'female',
    role: 'Nenek',
    birthDate: '1945-07-10',
    photoUrl: null,
    bio: null,
    fatherId: null,
    motherId: null,
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/** Reset the store to the known seed state before each property run */
function resetStore(): void {
  useFamilyTreeStore.setState({
    familyTrees: [{ ...seedTree }, { ...seedTree2 }],
    members: seedMembers.map((m) => ({ ...m })),
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
  it('state is unchanged when id does not exist in familyTrees', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== TREE_ID && s !== TREE_ID_2),
        fc.record({ name: fc.string({ minLength: 1 }) }),
        (unknownId, patch) => {
          resetStore();

          const before = useFamilyTreeStore.getState().familyTrees;
          useFamilyTreeStore.getState().updateFamilyTree(unknownId, patch);
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
// Property 2 — deleteFamilyTree removes all members of that tree
// ---------------------------------------------------------------------------

describe('Property 2: deleteFamilyTree removes all members of that tree', () => {
  /**
   * For any valid family tree id, after deleteFamilyTree(id) no member with
   * familyTreeId === id remains in the store.
   *
   * **Validates: Requirements 3.6**
   */
  it('no member with familyTreeId === id remains after deleteFamilyTree', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(TREE_ID, TREE_ID_2),
        (id) => {
          resetStore();

          useFamilyTreeStore.getState().deleteFamilyTree(id);

          const remaining = useFamilyTreeStore.getState().members.filter(
            (m) => m.familyTreeId === id
          );

          expect(remaining).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('members from other trees are not affected by deleteFamilyTree', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(TREE_ID, TREE_ID_2),
        (id) => {
          resetStore();

          const otherTreeId = id === TREE_ID ? TREE_ID_2 : TREE_ID;
          const membersBefore = useFamilyTreeStore
            .getState()
            .members.filter((m) => m.familyTreeId === otherTreeId);

          useFamilyTreeStore.getState().deleteFamilyTree(id);

          const membersAfter = useFamilyTreeStore
            .getState()
            .members.filter((m) => m.familyTreeId === otherTreeId);

          expect(membersAfter).toEqual(membersBefore);
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
   * For any valid member id, after deleteMember(id) no other member in the
   * store references that id in fatherId, motherId, spouseIds, or childrenIds.
   *
   * **Validates: Requirements 6.4**
   */
  it('no other member references the deleted id in any relationship field', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('member-1', 'member-2', 'member-3'),
        (id) => {
          resetStore();

          useFamilyTreeStore.getState().deleteMember(id);

          const members = useFamilyTreeStore.getState().members;

          for (const m of members) {
            expect(m.fatherId).not.toBe(id);
            expect(m.motherId).not.toBe(id);
            expect(m.spouseIds).not.toContain(id);
            expect(m.childrenIds).not.toContain(id);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('the deleted member itself is no longer in the store', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('member-1', 'member-2', 'member-3'),
        (id) => {
          resetStore();

          useFamilyTreeStore.getState().deleteMember(id);

          const found = useFamilyTreeStore.getState().members.find((m) => m.id === id);
          expect(found).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4 — updateMember never changes id, familyTreeId, or createdAt
// ---------------------------------------------------------------------------

describe('Property 4: updateMember never changes id, familyTreeId, or createdAt', () => {
  /**
   * For any valid member id and any patch object, updateMember never mutates
   * id, familyTreeId, or createdAt of the target member.
   *
   * **Validates: Requirements 5.6**
   */
  it('immutable fields id, familyTreeId, createdAt are unchanged after any patch', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('member-1', 'member-2', 'member-3'),
        fc.record({
          fullName: fc.string({ minLength: 1 }),
          role: fc.string({ minLength: 1 }),
          bio: fc.option(fc.string(), { nil: null }),
        }),
        (id, patch) => {
          resetStore();

          const before = useFamilyTreeStore
            .getState()
            .members.find((m) => m.id === id)!;

          useFamilyTreeStore.getState().updateMember(id, patch);

          const after = useFamilyTreeStore
            .getState()
            .members.find((m) => m.id === id)!;

          expect(after).toBeDefined();
          expect(after.id).toBe(before.id);
          expect(after.familyTreeId).toBe(before.familyTreeId);
          expect(after.createdAt).toBe(before.createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('patch fields are applied correctly while immutable fields stay the same', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('member-1', 'member-2', 'member-3'),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (id, newFullName) => {
          resetStore();

          const before = useFamilyTreeStore
            .getState()
            .members.find((m) => m.id === id)!;

          useFamilyTreeStore.getState().updateMember(id, { fullName: newFullName });

          const after = useFamilyTreeStore
            .getState()
            .members.find((m) => m.id === id)!;

          // Immutable fields unchanged
          expect(after.id).toBe(before.id);
          expect(after.familyTreeId).toBe(before.familyTreeId);
          expect(after.createdAt).toBe(before.createdAt);

          // Patch was applied
          expect(after.fullName).toBe(newFullName);
        }
      ),
      { numRuns: 100 }
    );
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

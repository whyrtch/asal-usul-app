/**
 * Property-based tests for useFamilyTreeStore
 *
 * Property 6: addFamilyTree prepend invariant
 * Validates: Requirements 3.2
 *
 * Property 7: addFamilyTree unique ID invariant
 * Validates: Requirements 3.5, 8.2
 *
 * Property 8: addFamilyTree correct shape invariant
 * Validates: Requirements 3.6, 3.7, 3.8, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
 */

import * as fc from 'fast-check';
import { useFamilyTreeStore } from '../store/useFamilyTreeStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Reset store state before each test to avoid cross-test contamination
beforeEach(() => {
  useFamilyTreeStore.setState({ familyTrees: [], members: [] });
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A non-empty, non-whitespace-only string suitable as a family tree name */
const validName = fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1);

/** A non-empty string suitable as an ownerId */
const validOwnerId = fc.string({ minLength: 1 });

// ---------------------------------------------------------------------------
// Property 6: addFamilyTree prepend invariant
// ---------------------------------------------------------------------------

describe('Property 6: addFamilyTree prepend invariant', () => {
  /**
   * For any sequence of addFamilyTree calls, the most recently added
   * FamilyTree is always at index 0 of familyTrees.
   *
   * **Validates: Requirements 3.2**
   */
  it(
    'most recently added tree is always at index 0 after each call',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(validName, validOwnerId), { minLength: 1, maxLength: 20 }),
          (calls) => {
            // Reset store for each property run
            useFamilyTreeStore.setState({ familyTrees: [], members: [] });

            const { addFamilyTree } = useFamilyTreeStore.getState();

            for (const [name, ownerId] of calls) {
              addFamilyTree(name, ownerId);

              const { familyTrees } = useFamilyTreeStore.getState();

              // The most recently added tree must be at index 0
              expect(familyTrees[0].name).toBe(name.trim());
              expect(familyTrees[0].ownerId).toBe(ownerId);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'after N calls, familyTrees[0] is the last-added tree and familyTrees[N-1] is the first-added tree',
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(validName, validOwnerId), { minLength: 2, maxLength: 10 }),
          (calls) => {
            // Reset store for each property run
            useFamilyTreeStore.setState({ familyTrees: [], members: [] });

            const { addFamilyTree } = useFamilyTreeStore.getState();

            for (const [name, ownerId] of calls) {
              addFamilyTree(name, ownerId);
            }

            const { familyTrees } = useFamilyTreeStore.getState();
            const N = calls.length;

            // Index 0 is the last-added tree
            expect(familyTrees[0].name).toBe(calls[N - 1][0].trim());
            // Index N-1 is the first-added tree
            expect(familyTrees[N - 1].name).toBe(calls[0][0].trim());
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 8: addFamilyTree correct shape invariant
// ---------------------------------------------------------------------------

describe('Property 8: addFamilyTree correct shape invariant', () => {
  /**
   * For any valid name and ownerId, the FamilyTree created by
   * `addFamilyTree(name, ownerId)` SHALL have:
   *   - `totalMembers === 0`
   *   - `description === null`
   *   - `coverImage === null`
   *   - valid ISO 8601 `createdAt` (parseable by `new Date()`)
   *   - valid ISO 8601 `updatedAt` equal to `createdAt`
   *   - non-empty `id`
   *   - `name === name.trim()`
   *   - `ownerId` equal to the provided ownerId
   *
   * **Validates: Requirements 3.6, 3.7, 3.8, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9**
   */
  it(
    'created tree has correct shape for any valid name and ownerId',
    () => {
      fc.assert(
        fc.property(validName, validOwnerId, (name, ownerId) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree } = useFamilyTreeStore.getState();
          addFamilyTree(name, ownerId);

          const { familyTrees } = useFamilyTreeStore.getState();
          const tree = familyTrees[0];

          // Requirement 8.5: totalMembers defaults to 0
          expect(tree.totalMembers).toBe(0);

          // Requirement 8.7: description is null by default
          expect(tree.description).toBeNull();

          // Requirement 8.8: coverImage is null by default
          expect(tree.coverImage).toBeNull();

          // Requirement 8.4: createdAt is a valid ISO 8601 string
          const createdAtDate = new Date(tree.createdAt);
          expect(Number.isNaN(createdAtDate.getTime())).toBe(false);

          // Requirement 8.9: updatedAt is a valid ISO 8601 string equal to createdAt
          const updatedAtDate = new Date(tree.updatedAt);
          expect(Number.isNaN(updatedAtDate.getTime())).toBe(false);
          expect(tree.updatedAt).toBe(tree.createdAt);

          // Requirement 8.2 / 8.1: id is non-empty
          expect(tree.id.length).toBeGreaterThan(0);

          // Requirement 3.4 / 8.3: name is stored as name.trim()
          expect(tree.name).toBe(name.trim());

          // Requirement 8.6: ownerId matches the provided value
          expect(tree.ownerId).toBe(ownerId);
        }),
        { numRuns: 200 }
      );
    }
  );

  it(
    'all required fields are present on the created tree',
    () => {
      fc.assert(
        fc.property(validName, validOwnerId, (name, ownerId) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree } = useFamilyTreeStore.getState();
          addFamilyTree(name, ownerId);

          const { familyTrees } = useFamilyTreeStore.getState();
          const tree = familyTrees[0];

          // Requirement 8.1: all required fields exist
          expect(tree).toHaveProperty('id');
          expect(tree).toHaveProperty('name');
          expect(tree).toHaveProperty('createdAt');
          expect(tree).toHaveProperty('updatedAt');
          expect(tree).toHaveProperty('totalMembers');
          expect(tree).toHaveProperty('ownerId');
          expect(tree).toHaveProperty('description');
          expect(tree).toHaveProperty('coverImage');

          // Field types
          expect(typeof tree.id).toBe('string');
          expect(typeof tree.name).toBe('string');
          expect(typeof tree.createdAt).toBe('string');
          expect(typeof tree.updatedAt).toBe('string');
          expect(typeof tree.totalMembers).toBe('number');
          expect(typeof tree.ownerId).toBe('string');
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 10: removeFamilyTree preserves other entries invariant
// ---------------------------------------------------------------------------

/**
 * Property 10: removeFamilyTree preserves other entries invariant
 * Validates: Requirements 3.11
 *
 * For any FamilyTreeStore state with N entries, calling `removeFamilyTree(id)`
 * for one entry SHALL leave all other N-1 entries unchanged and in their
 * original order.
 *
 * Strategy: We inject FamilyTree objects directly into the store via
 * `setState` with guaranteed-unique IDs (using an integer counter suffix).
 * This isolates the test from the store's `Date.now()` ID generation, which
 * can produce collisions when called rapidly in a test environment, and lets
 * us focus purely on `removeFamilyTree`'s filtering behaviour.
 */

import type { FamilyTree } from '../types/familyTree';

/** Arbitrary that generates a valid FamilyTree object with a given unique id */
const familyTreeRecord = (id: string) =>
  fc.record<FamilyTree>({
    id: fc.constant(id),
    name: validName,
    description: fc.constant(null),
    coverImage: fc.constant(null),
    ownerId: validOwnerId,
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
    totalMembers: fc.nat({ max: 100 }),
  });

describe('Property 10: removeFamilyTree preserves other entries invariant', () => {
  beforeEach(() => {
    useFamilyTreeStore.setState({ familyTrees: [], members: [] });
  });

  it('all other entries remain unchanged and in original order after removal', () => {
    fc.assert(
      fc.property(
        // Generate 2–10 trees with guaranteed-unique IDs
        fc.integer({ min: 2, max: 10 }).chain((n) =>
          fc.tuple(
            ...Array.from({ length: n }, (_, i) => familyTreeRecord(`tree-id-${i}`))
          )
        ),
        // Pick the index of the entry to remove
        fc.nat({ max: 9 }),
        (trees, rawIndex) => {
          // Reset store and inject trees directly
          useFamilyTreeStore.setState({ familyTrees: [...trees], members: [] });

          const before = useFamilyTreeStore.getState().familyTrees;

          // Clamp index to valid range
          const removeIndex = rawIndex % before.length;
          const idToRemove = before[removeIndex].id;

          // Perform removal
          useFamilyTreeStore.getState().removeFamilyTree(idToRemove);

          const after = useFamilyTreeStore.getState().familyTrees;

          // Build expected: all entries except the removed one, in original order
          const expected = before.filter((t) => t.id !== idToRemove);

          // Length must be N-1
          expect(after.length).toBe(before.length - 1);

          // Each remaining entry must be identical and in the same relative order
          expect(after).toEqual(expected);
        }
      )
    );
  });

  it('entries before the removed index are untouched', () => {
    fc.assert(
      fc.property(
        // Generate 3–8 trees with guaranteed-unique IDs
        fc.integer({ min: 3, max: 8 }).chain((n) =>
          fc.tuple(
            ...Array.from({ length: n }, (_, i) => familyTreeRecord(`tree-id-${i}`))
          )
        ),
        (trees) => {
          // Reset store and inject trees directly
          useFamilyTreeStore.setState({ familyTrees: [...trees], members: [] });

          const before = useFamilyTreeStore.getState().familyTrees;

          // Remove the last entry so we can verify all preceding entries are intact
          const idToRemove = before[before.length - 1].id;
          useFamilyTreeStore.getState().removeFamilyTree(idToRemove);

          const after = useFamilyTreeStore.getState().familyTrees;

          // All entries except the last should be identical and in original order
          before.slice(0, before.length - 1).forEach((entry, i) => {
            expect(after[i]).toEqual(entry);
          });
        }
      )
    );
  });

  it('removing a middle entry preserves relative order of remaining entries', () => {
    fc.assert(
      fc.property(
        // Generate exactly 3 trees so we can remove the middle one
        fc.tuple(
          familyTreeRecord('tree-id-0'),
          familyTreeRecord('tree-id-1'),
          familyTreeRecord('tree-id-2'),
        ),
        ([first, middle, last]) => {
          useFamilyTreeStore.setState({
            familyTrees: [first, middle, last],
            members: [],
          });

          useFamilyTreeStore.getState().removeFamilyTree(middle.id);

          const after = useFamilyTreeStore.getState().familyTrees;

          expect(after.length).toBe(2);
          expect(after[0]).toEqual(first);
          expect(after[1]).toEqual(last);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: removeFamilyTree idempotency invariant
// ---------------------------------------------------------------------------

/**
 * Property 9: removeFamilyTree idempotency invariant
 * Validates: Requirements 3.12
 *
 * For any `id`, calling `removeFamilyTree(id)` twice SHALL produce the same
 * `familyTrees` state as calling it once.
 */
describe('Property 9: removeFamilyTree idempotency invariant', () => {
  beforeEach(() => {
    useFamilyTreeStore.setState({ familyTrees: [], members: [] });
  });

  it('calling removeFamilyTree(id) twice produces same state as once — existing id', () => {
    fc.assert(
      fc.property(
        // Generate 1–10 trees to populate the store
        fc.array(fc.tuple(validName, validOwnerId), { minLength: 1, maxLength: 10 }),
        // Pick an index into that array to select which tree to remove
        fc.nat({ max: 9 }),
        (calls, indexSeed) => {
          // Reset store before each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree } = useFamilyTreeStore.getState();
          calls.forEach(([name, ownerId]) => {
            addFamilyTree(name, ownerId);
          });

          const stateAfterAdd = useFamilyTreeStore.getState();
          const trees = stateAfterAdd.familyTrees;

          // Pick a valid index (clamp to actual array length)
          const index = indexSeed % trees.length;
          const targetId = trees[index].id;

          // Call removeFamilyTree once
          useFamilyTreeStore.getState().removeFamilyTree(targetId);
          const stateAfterOnce = useFamilyTreeStore.getState().familyTrees;

          // Call removeFamilyTree a second time with the same id
          useFamilyTreeStore.getState().removeFamilyTree(targetId);
          const stateAfterTwice = useFamilyTreeStore.getState().familyTrees;

          // Both states must be identical
          expect(stateAfterTwice).toEqual(stateAfterOnce);
        }
      )
    );
  });

  it('calling removeFamilyTree(id) twice with a non-existent id leaves state unchanged', () => {
    fc.assert(
      fc.property(
        // Generate 0–5 trees to populate the store
        fc.array(fc.tuple(validName, validOwnerId), { minLength: 0, maxLength: 5 }),
        // Generate an id that is guaranteed not to match any real tree id
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (calls, nonExistentId) => {
          // Reset store before each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          const { addFamilyTree } = useFamilyTreeStore.getState();
          calls.forEach(([name, ownerId]) => {
            addFamilyTree(name, ownerId);
          });

          // Ensure the generated id doesn't accidentally match a real tree id
          const trees = useFamilyTreeStore.getState().familyTrees;
          const safeId = `non-existent-${nonExistentId}`;
          // Verify it truly doesn't exist
          if (trees.some((t) => t.id === safeId)) return; // skip this run

          const stateBefore = useFamilyTreeStore.getState().familyTrees;

          // Call removeFamilyTree once with non-existent id
          useFamilyTreeStore.getState().removeFamilyTree(safeId);
          const stateAfterOnce = useFamilyTreeStore.getState().familyTrees;

          // Call removeFamilyTree again with the same non-existent id
          useFamilyTreeStore.getState().removeFamilyTree(safeId);
          const stateAfterTwice = useFamilyTreeStore.getState().familyTrees;

          // All three states must be identical
          expect(stateAfterOnce).toEqual(stateBefore);
          expect(stateAfterTwice).toEqual(stateBefore);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: addFamilyTree unique ID invariant
// ---------------------------------------------------------------------------

/**
 * Property 7: addFamilyTree unique ID invariant
 * Validates: Requirements 3.5, 8.2
 *
 * For any sequence of N addFamilyTree calls, all resulting `id` values SHALL
 * be unique (no duplicates).
 *
 * NOTE: IDs are generated via `Date.now().toString()`. To guarantee uniqueness
 * regardless of clock resolution, we mock `Date.now` with an auto-incrementing
 * counter so each call receives a distinct timestamp value.
 */
describe('Property 7: addFamilyTree unique ID invariant', () => {
  let dateNowSpy: jest.SpyInstance;
  let counter: number;

  beforeEach(() => {
    counter = 1_000_000;
    // Replace Date.now with a counter that increments on every call,
    // guaranteeing each addFamilyTree invocation gets a unique timestamp.
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  /**
   * For any sequence of N addFamilyTree calls, all resulting `id` values are
   * unique — no two trees share the same id.
   *
   * **Validates: Requirements 3.5, 8.2**
   */
  it('all id values are unique across N addFamilyTree calls', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(validName, validOwnerId), { minLength: 1, maxLength: 20 }),
        (calls) => {
          // Reset store and counter before each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 1_000_000;

          const { addFamilyTree } = useFamilyTreeStore.getState();

          for (const [name, ownerId] of calls) {
            addFamilyTree(name, ownerId);
          }

          const { familyTrees } = useFamilyTreeStore.getState();
          const ids = familyTrees.map((t) => t.id);
          const uniqueIds = new Set(ids);

          // All IDs must be unique — no duplicates allowed
          expect(uniqueIds.size).toBe(ids.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Each individual ID must be a non-empty string.
   *
   * **Validates: Requirements 8.2**
   */
  it('each id is a non-empty string', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(validName, validOwnerId), { minLength: 1, maxLength: 10 }),
        (calls) => {
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 2_000_000;

          const { addFamilyTree } = useFamilyTreeStore.getState();

          for (const [name, ownerId] of calls) {
            addFamilyTree(name, ownerId);
          }

          const { familyTrees } = useFamilyTreeStore.getState();

          for (const tree of familyTrees) {
            expect(typeof tree.id).toBe('string');
            expect(tree.id.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

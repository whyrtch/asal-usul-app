/**
 * Property-based tests for src/repositories/memberRepository.ts
 *
 * Covers:
 *   - Property 5: totalMembers Consistency — `FamilyTree.totalMembers` always
 *     equals the count of member documents in its subcollection after any
 *     create/delete operation.
 *
 * **Validates: Requirements 4.6**
 *
 * Strategy:
 *   We mock Firestore's `addDoc`, `deleteDoc`, `getDocs`, `runTransaction`,
 *   and `writeBatch` to track the in-memory state of the members subcollection
 *   and the `totalMembers` counter on the parent tree document.
 *
 *   For each generated sequence of create/delete operations we:
 *     1. Run the operations through the real repository functions.
 *     2. Track the expected member count ourselves.
 *     3. Assert that the `totalMembers` value written by `runTransaction`
 *        always equals the expected count.
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...segments: string[]) => ({
    _path: segments.join('/'),
  })),
  doc: jest.fn((_db: unknown, ...segments: string[]) => ({
    _path: segments.join('/'),
    id: segments[segments.length - 1],
  })),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
  runTransaction: jest.fn(),
  increment: jest.fn((n: number) => ({ _increment: n })),
  arrayRemove: jest.fn((v: unknown) => ({ _arrayRemove: v })),
  Timestamp: {
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
  },
}));

jest.mock('@/services/firebase/config', () => ({
  db: {},
}));

jest.mock('@/services/firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  toISOString: jest.fn((ts: { toDate: () => Date } | null) => {
    if (ts == null) return new Date().toISOString();
    return ts.toDate().toISOString();
  }),
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import {
    addDoc,
    deleteDoc,
    getDoc,
    getDocs,
    runTransaction,
    writeBatch,
} from 'firebase/firestore';
import { createMember, deleteMember } from '../memberRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Counter tracking the current totalMembers value for a tree. */
let totalMembersCounter = 0;

/** Set of member ids currently in the subcollection. */
let memberIds: Set<string> = new Set();

/** Auto-incrementing id generator for mock addDoc. */
let nextMemberId = 0;

/**
 * Reset all in-memory state between test runs.
 */
function resetState() {
  totalMembersCounter = 0;
  memberIds = new Set();
  nextMemberId = 0;
}

/**
 * Build a minimal MemberDocument snapshot for a given id.
 */
function makeMemberSnap(id: string) {
  return {
    id,
    exists: () => true,
    data: () => ({
      familyTreeId: 'tree-test',
      fullName: `Member ${id}`,
      gender: 'male' as const,
      role: 'Ayah',
      birthDate: null,
      fatherId: null,
      motherId: null,
      spouseIds: [],
      childrenIds: [],
      createdAt: { toDate: () => new Date('2024-01-01T00:00:00.000Z') },
      updatedAt: { toDate: () => new Date('2024-01-01T00:00:00.000Z') },
    }),
  };
}

/**
 * Build a mock QuerySnapshot from the current memberIds set.
 */
function makeQuerySnapshot() {
  const docs = Array.from(memberIds).map(id => ({
    id,
    ref: { _path: `family_trees/tree-test/members/${id}`, id },
    data: () => ({
      familyTreeId: 'tree-test',
      fullName: `Member ${id}`,
      gender: 'male' as const,
      role: 'Ayah',
      birthDate: null,
      fatherId: null,
      motherId: null,
      spouseIds: [],
      childrenIds: [],
      createdAt: { toDate: () => new Date('2024-01-01T00:00:00.000Z') },
      updatedAt: { toDate: () => new Date('2024-01-01T00:00:00.000Z') },
    }),
  }));
  return { docs };
}

// ---------------------------------------------------------------------------
// Mock setup helpers
// ---------------------------------------------------------------------------

/**
 * Wire up all Firestore mocks to simulate the in-memory subcollection state.
 * Called once before each property run.
 */
function setupMocks() {
  const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
  const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
  const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
  const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
  const mockRunTransaction = runTransaction as jest.MockedFunction<typeof runTransaction>;
  const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;

  // addDoc: register a new member and return a ref with a fresh id
  mockAddDoc.mockImplementation(async () => {
    const id = `member-${++nextMemberId}`;
    memberIds.add(id);
    return { id, _path: `family_trees/tree-test/members/${id}` } as never;
  });

  // deleteDoc: remove the member from the set (used in post-write self-ref cleanup)
  mockDeleteDoc.mockImplementation(async (ref: { id?: string; _path?: string }) => {
    const id = ref?.id ?? '';
    memberIds.delete(id);
  });

  // getDocs: return the current snapshot of the subcollection
  mockGetDocs.mockImplementation(async () => makeQuerySnapshot() as never);

  // getDoc: return a snapshot for a specific member id (used after addDoc)
  mockGetDoc.mockImplementation(async (ref: { id?: string }) => {
    const id = ref?.id ?? '';
    return makeMemberSnap(id) as never;
  });

  // runTransaction: simulate the increment/decrement logic and record the result
  mockRunTransaction.mockImplementation(
    async (_db: unknown, updateFn: (tx: unknown) => Promise<void>) => {
      // Capture what the transaction writes to totalMembers
      const tx = {
        get: jest.fn(async () => ({
          exists: () => true,
          data: () => ({ totalMembers: totalMembersCounter }),
        })),
        update: jest.fn((_ref: unknown, patch: Record<string, unknown>) => {
          // Handle both increment(1) and explicit numeric values
          const val = patch['totalMembers'];
          if (val && typeof val === 'object' && '_increment' in val) {
            totalMembersCounter += (val as { _increment: number })._increment;
          } else if (typeof val === 'number') {
            totalMembersCounter = val;
          }
        }),
      };
      await updateFn(tx);
    },
  );

  // writeBatch: return a mock batch that tracks deletes and updates
  mockWriteBatch.mockImplementation(() => ({
    delete: jest.fn((ref: { id?: string }) => {
      // Batch delete removes the member from the set
      const id = ref?.id ?? '';
      memberIds.delete(id);
    }),
    update: jest.fn(),
    commit: jest.fn(async () => undefined),
  }));
}

// ---------------------------------------------------------------------------
// Minimal valid CreateMemberInput factory
// ---------------------------------------------------------------------------

function makeCreateInput(treeId: string) {
  return {
    familyTreeId: treeId,
    fullName: 'Test Member',
    gender: 'male' as const,
    role: 'Ayah',
    birthDate: null,
    fatherId: null,
    motherId: null,
    spouseIds: [],
    childrenIds: [],
  };
}

// ---------------------------------------------------------------------------
// Unit tests — concrete examples
// ---------------------------------------------------------------------------

describe('memberRepository — totalMembers consistency (unit)', () => {
  const TREE_ID = 'tree-test';

  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    setupMocks();
  });

  it('totalMembers is 1 after creating one member', async () => {
    await createMember(TREE_ID, makeCreateInput(TREE_ID));
    expect(totalMembersCounter).toBe(1);
    expect(memberIds.size).toBe(1);
    expect(totalMembersCounter).toBe(memberIds.size);
  });

  it('totalMembers is 0 after creating then deleting one member', async () => {
    await createMember(TREE_ID, makeCreateInput(TREE_ID));
    const [memberId] = Array.from(memberIds);
    await deleteMember(TREE_ID, memberId);
    expect(totalMembersCounter).toBe(0);
    expect(memberIds.size).toBe(0);
    expect(totalMembersCounter).toBe(memberIds.size);
  });

  it('totalMembers is 2 after creating three and deleting one', async () => {
    await createMember(TREE_ID, makeCreateInput(TREE_ID));
    await createMember(TREE_ID, makeCreateInput(TREE_ID));
    await createMember(TREE_ID, makeCreateInput(TREE_ID));
    const [firstId] = Array.from(memberIds);
    await deleteMember(TREE_ID, firstId);
    expect(totalMembersCounter).toBe(2);
    expect(memberIds.size).toBe(2);
    expect(totalMembersCounter).toBe(memberIds.size);
  });

  it('totalMembers never goes below 0 when deleting from empty tree', async () => {
    // Simulate a delete on an already-empty tree — totalMembers should floor at 0
    // We manually set up a member id that exists in the set but counter is 0
    memberIds.add('ghost-member');
    totalMembersCounter = 0;
    await deleteMember(TREE_ID, 'ghost-member');
    expect(totalMembersCounter).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Property 5: totalMembers Consistency
// **Validates: Requirements 4.6**
//
// For any sequence of create and delete operations, `totalMembers` on the
// parent FamilyTreeDocument always equals the actual count of member documents
// in the subcollection.
//
// We generate:
//   - `createCount`: number of members to create (0–20)
//   - `deleteCount`: number of those members to subsequently delete (0–createCount)
//
// After running all operations, we assert:
//   totalMembersCounter === memberIds.size
// ---------------------------------------------------------------------------

describe('memberRepository — Property 5: totalMembers Consistency', () => {
  const TREE_ID = 'tree-test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 5: totalMembers Consistency
   *
   * After any sequence of createMember and deleteMember calls,
   * the totalMembers counter tracked by runTransaction always equals
   * the actual count of member documents in the subcollection.
   *
   * **Validates: Requirements 4.6**
   */
  it('property 5: totalMembers always equals actual member count after create/delete operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a create count between 0 and 20
        fc.integer({ min: 0, max: 20 }),
        async (createCount) => {
          // Reset state for each property run
          resetState();
          jest.clearAllMocks();
          setupMocks();

          // STEP 1: Create `createCount` members
          const createdIds: string[] = [];
          for (let i = 0; i < createCount; i++) {
            await createMember(TREE_ID, makeCreateInput(TREE_ID));
            // Capture the id of the most recently added member
            const ids = Array.from(memberIds);
            createdIds.push(ids[ids.length - 1]);
          }

          // INVARIANT after creates: totalMembers === createCount
          if (totalMembersCounter !== memberIds.size) return false;

          // STEP 2: Delete a random subset — use a deterministic half
          const deleteCount = Math.floor(createCount / 2);
          const toDelete = createdIds.slice(0, deleteCount);

          for (const id of toDelete) {
            await deleteMember(TREE_ID, id);
          }

          // INVARIANT after deletes: totalMembers === actual remaining count
          return totalMembersCounter === memberIds.size;
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 5 (extended): totalMembers consistency holds for arbitrary
   * interleaved create/delete sequences.
   *
   * We generate a sequence of operations as an array of booleans:
   *   true  → create a member
   *   false → delete the oldest existing member (if any)
   *
   * **Validates: Requirements 4.6**
   */
  it('property 5 (interleaved): totalMembers equals actual count after arbitrary create/delete sequences', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a sequence of up to 20 operations
        fc.array(fc.boolean(), { minLength: 0, maxLength: 20 }),
        async (ops) => {
          // Reset state for each property run
          resetState();
          jest.clearAllMocks();
          setupMocks();

          const createdIds: string[] = [];

          for (const isCreate of ops) {
            if (isCreate) {
              // CREATE: add a new member
              await createMember(TREE_ID, makeCreateInput(TREE_ID));
              const ids = Array.from(memberIds);
              // Track the newest id (last in set iteration order)
              const newestId = ids[ids.length - 1];
              if (newestId && !createdIds.includes(newestId)) {
                createdIds.push(newestId);
              }
            } else {
              // DELETE: remove the oldest member still in the set (if any)
              const existingIds = Array.from(memberIds);
              if (existingIds.length > 0) {
                const idToDelete = existingIds[0];
                await deleteMember(TREE_ID, idToDelete);
                const idx = createdIds.indexOf(idToDelete);
                if (idx !== -1) createdIds.splice(idx, 1);
              }
              // If no members exist, skip — nothing to delete
            }
          }

          // INVARIANT: totalMembers must always equal the actual subcollection count
          return totalMembersCounter === memberIds.size;
        },
      ),
      { numRuns: 50 },
    );
  });
});

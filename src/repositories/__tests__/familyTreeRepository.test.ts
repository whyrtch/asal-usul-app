/**
 * Property-based tests for src/repositories/familyTreeRepository.ts
 *
 * Covers:
 *   - Property 2: Ownership Invariant — every tree returned by
 *     `fetchFamilyTrees(uid)` satisfies `tree.ownerId === uid`
 *
 * **Validates: Requirements 2.1**
 *
 * Strategy:
 *   Firestore's `where('ownerId', '==', ownerId)` filter is what enforces
 *   ownership server-side. In tests we mock `getDocs` to return a controlled
 *   QuerySnapshot and verify that the repository correctly maps the returned
 *   documents — i.e. every mapped tree carries the ownerId that was stored in
 *   the document data.
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
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

import { getDocs } from 'firebase/firestore';
import { fetchFamilyTrees } from '../familyTreeRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Firestore-like Timestamp from a Date.
 * Matches the shape expected by `mapDocToFamilyTree` via `toISOString`.
 */
function makeTimestamp(date: Date) {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  };
}

/**
 * Build a mock QueryDocumentSnapshot for a FamilyTreeDocument.
 */
function makeFamilyTreeDoc(id: string, ownerId: string) {
  const now = makeTimestamp(new Date('2024-01-01T00:00:00.000Z'));
  return {
    id,
    data: () => ({
      name: `Tree ${id}`,
      description: null,
      ownerId,
      totalMembers: 0,
      shareWith: [],
      createdAt: now,
      updatedAt: now,
    }),
  };
}

/**
 * Build a mock QuerySnapshot from an array of mock docs.
 */
function makeQuerySnapshot(docs: ReturnType<typeof makeFamilyTreeDoc>[]) {
  return { docs };
}

// ---------------------------------------------------------------------------
// Property 2: Ownership Invariant
// **Validates: Requirements 2.1**
//
// For any uid, every tree returned by fetchFamilyTrees(uid) satisfies
// tree.ownerId === uid.
//
// The Firestore query uses where('ownerId', '==', ownerId) to filter
// server-side. In this test we mock getDocs to return only documents whose
// ownerId matches the queried uid (simulating what Firestore would return),
// and assert that the repository maps them correctly — preserving ownerId.
// ---------------------------------------------------------------------------

describe('fetchFamilyTrees — Property 2: Ownership Invariant', () => {
  const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Unit tests — concrete examples
  // -------------------------------------------------------------------------

  it('returns an empty array when getDocs returns no documents', async () => {
    mockGetDocs.mockResolvedValue(makeQuerySnapshot([]) as never);

    const result = await fetchFamilyTrees('user-123');

    expect(result).toEqual([]);
  });

  it('returns an empty array without calling getDocs when ownerId is empty', async () => {
    const result = await fetchFamilyTrees('');

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('returns an empty array without calling getDocs when ownerId is whitespace', async () => {
    const result = await fetchFamilyTrees('   ');

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('maps a single document and preserves ownerId', async () => {
    const uid = 'user-abc';
    mockGetDocs.mockResolvedValue(
      makeQuerySnapshot([makeFamilyTreeDoc('tree-1', uid)]) as never,
    );

    const result = await fetchFamilyTrees(uid);

    expect(result).toHaveLength(1);
    expect(result[0].ownerId).toBe(uid);
  });

  it('maps multiple documents and all have the correct ownerId', async () => {
    const uid = 'user-xyz';
    mockGetDocs.mockResolvedValue(
      makeQuerySnapshot([
        makeFamilyTreeDoc('tree-1', uid),
        makeFamilyTreeDoc('tree-2', uid),
        makeFamilyTreeDoc('tree-3', uid),
      ]) as never,
    );

    const result = await fetchFamilyTrees(uid);

    expect(result).toHaveLength(3);
    result.forEach(tree => {
      expect(tree.ownerId).toBe(uid);
    });
  });

  it('maps document fields correctly (id, name, description, totalMembers, shareWith)', async () => {
    const uid = 'user-detail';
    mockGetDocs.mockResolvedValue(
      makeQuerySnapshot([makeFamilyTreeDoc('tree-detail', uid)]) as never,
    );

    const result = await fetchFamilyTrees(uid);

    expect(result[0]).toMatchObject({
      id: 'tree-detail',
      name: 'Tree tree-detail',
      description: null,
      ownerId: uid,
      totalMembers: 0,
      shareWith: [],
      coverImage: null,
    });
  });

  it('converts Timestamps to ISO strings', async () => {
    const uid = 'user-ts';
    mockGetDocs.mockResolvedValue(
      makeQuerySnapshot([makeFamilyTreeDoc('tree-ts', uid)]) as never,
    );

    const result = await fetchFamilyTrees(uid);

    expect(result[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  // -------------------------------------------------------------------------
  // Property test
  // -------------------------------------------------------------------------

  /**
   * Property 2: Ownership Invariant
   *
   * For any non-empty uid string and any number of documents returned by
   * Firestore (all with ownerId === uid, as Firestore's where filter ensures),
   * every tree in the result satisfies tree.ownerId === uid.
   *
   * **Validates: Requirements 2.1**
   */
  it('property 2: every returned tree satisfies tree.ownerId === uid', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty, non-whitespace uid
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        // Generate 0–10 tree document ids
        fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
        async (uid, treeIds) => {
          // Simulate Firestore returning only documents owned by uid
          // (this is what the where('ownerId', '==', uid) filter guarantees)
          const docs = treeIds.map((id, index) =>
            makeFamilyTreeDoc(`${id}-${index}`, uid),
          );
          mockGetDocs.mockResolvedValue(makeQuerySnapshot(docs) as never);

          const result = await fetchFamilyTrees(uid);

          // INVARIANT: every returned tree must have ownerId === uid
          return result.every(tree => tree.ownerId === uid);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * FamilyTreeRepository — all Firestore reads and writes for the
 * `family_trees/{treeId}` collection.
 *
 * Responsibilities:
 *   - Query family trees by owner with ordering
 *   - Map Firestore Timestamps to ISO strings before returning to callers
 *   - Validate name constraints before any Firestore write
 *   - Cascade-delete all member subcollection docs atomically with the tree doc
 *   - Wrap mutating operations in `withRetry` for transient-error resilience
 *
 * Collection path: `family_trees/{treeId}`
 * Subcollection path: `family_trees/{treeId}/members/{memberId}`
 *
 * Requirements: 2.1, 2.2, 2.3, 2.8, 3.6, 3.8, 3.10, 3.11, 3.12
 *
 * @module src/repositories/familyTreeRepository
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';

import { db } from '@/services/firebase/config';
import {
    serverTimestamp,
    toISOString,
    withRetry,
} from '@/services/firebase/firestore';
import type { FamilyTree } from '@/types/familyTree';
import type {
    CreateFamilyTreeInput,
    FamilyTreeDocument,
    UpdateFamilyTreeInput,
} from '@/types/firestore';
import { fetchSharedTreeRefs } from './accessRepository';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Firestore document id and raw `FamilyTreeDocument` data to the
 * app-level `FamilyTree` interface, converting Timestamps to ISO strings.
 *
 * `shareWith` defaults to `[]` to handle legacy documents that predate the
 * field (Requirements: 3.12).
 *
 * Requirements: 2.8, 3.12
 */
function mapDocToFamilyTree(id: string, data: FamilyTreeDocument): FamilyTree {
  return {
    id,
    name: data.name,
    description: data.description ?? null,
    coverImage: null,
    ownerId: data.ownerId,
    totalMembers: data.totalMembers ?? 0,
    shareWith: data.shareWith ?? [],
    createdAt: data.createdAt ? toISOString(data.createdAt) : new Date().toISOString(),
    updatedAt: data.updatedAt ? toISOString(data.updatedAt) : new Date().toISOString(),
  };
}

/**
 * Validates the `name` field for create and update operations.
 * Throws a descriptive `Error` if validation fails so the caller can surface
 * the message to the user without performing any Firestore write.
 *
 * Requirements: 3.10
 *
 * @param name - The raw name string to validate.
 * @throws {Error} When name is empty after trim or exceeds 100 characters.
 */
function validateName(name: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error(
      'Nama pohon keluarga tidak boleh kosong. Masukkan nama yang valid.',
    );
  }
  if (trimmed.length > 100) {
    throw new Error(
      `Nama pohon keluarga terlalu panjang (${trimmed.length} karakter). Maksimal 100 karakter.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all family trees owned by `ownerId`, ordered by `updatedAt` desc.
 *
 * Returns an empty array immediately (without a Firestore request) when
 * `ownerId` is empty or null/undefined.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.8, 3.12
 *
 * @param ownerId - Firebase Auth UID of the authenticated user.
 * @returns Array of `FamilyTree` objects with ISO string timestamps.
 *
 * @example
 * const trees = await fetchFamilyTrees('uid123');
 * // trees[0].ownerId === 'uid123'
 * // trees sorted by updatedAt descending
 */
export async function fetchFamilyTrees(ownerId: string): Promise<FamilyTree[]> {
  // Guard: return empty array without hitting Firestore for empty/null ownerId.
  if (!ownerId || ownerId.trim().length === 0) {
    return [];
  }

  // Primary query: uses the composite index (ownerId ASC, updatedAt DESC).
  // If the index hasn't been deployed yet Firestore throws a "failed-precondition"
  // error with a link to create the index. In that case we fall back to a simple
  // where-only query and sort client-side so the app stays functional.
  try {
    const q = query(
      collection(db, 'family_trees'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d =>
      mapDocToFamilyTree(d.id, d.data() as FamilyTreeDocument),
    );
  } catch (err: unknown) {
    // Firestore index not yet built — fall back to unordered query + client sort.
    const code = (err as { code?: string })?.code;
    if (code === 'failed-precondition' || code === 'unimplemented') {
      const fallbackQ = query(
        collection(db, 'family_trees'),
        where('ownerId', '==', ownerId),
      );
      const snap = await getDocs(fallbackQ);
      const trees = snap.docs.map(d =>
        mapDocToFamilyTree(d.id, d.data() as FamilyTreeDocument),
      );
      // Sort client-side: newest updatedAt first
      return trees.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    throw err;
  }
}

/**
 * Reads a single family tree document by its Firestore id.
 *
 * @param treeId - Firestore document id of the family tree.
 * @returns The mapped `FamilyTree`, or `null` if the document does not exist.
 *
 * @example
 * const tree = await getFamilyTree('abc123');
 * if (tree === null) {
 *   // document not found
 * }
 */
export async function getFamilyTree(treeId: string): Promise<FamilyTree | null> {
  const ref = doc(db, 'family_trees', treeId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return mapDocToFamilyTree(snap.id, snap.data() as FamilyTreeDocument);
}

/**
 * Creates a new family tree document in Firestore.
 *
 * Validates `name` before writing. Initialises `totalMembers: 0`,
 * `shareWith: data.shareWith ?? []`, and server timestamps for
 * `createdAt`/`updatedAt`. Wrapped in `withRetry` for resilience.
 *
 * Requirements: 3.10, 3.11, 3.12
 *
 * @param data - Input fields for the new family tree.
 * @returns The created `FamilyTree` with the real Firestore-generated id.
 * @throws {Error} When `name` is empty after trim or exceeds 100 characters.
 *
 * @example
 * const tree = await createFamilyTree({
 *   name: 'Keluarga Santoso',
 *   description: null,
 *   ownerId: 'uid123',
 * });
 */
export async function createFamilyTree(
  data: CreateFamilyTreeInput,
): Promise<FamilyTree> {
  // Validate before any Firestore call (Requirements: 3.10).
  validateName(data.name);

  const docRef = await withRetry(() =>
    addDoc(collection(db, 'family_trees'), {
      name: data.name.trim(),
      description: data.description ?? null,
      ownerId: data.ownerId,
      totalMembers: 0,
      shareWith: data.shareWith ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  // Re-read the created document so we return resolved Timestamps as ISO strings.
  const snap = await getDoc(docRef);
  return mapDocToFamilyTree(snap.id, snap.data() as FamilyTreeDocument);
}

/**
 * Updates editable fields on an existing family tree document.
 *
 * Validates `name` if it is present in the patch. Always updates `updatedAt`
 * with a server timestamp. Wrapped in `withRetry` for resilience.
 *
 * Requirements: 3.6, 3.10
 *
 * @param treeId - Firestore document id of the tree to update.
 * @param patch  - Partial set of fields to update.
 * @throws {Error} When `patch.name` is present but fails validation.
 *
 * @example
 * await updateFamilyTree('abc123', { name: 'Keluarga Baru' });
 */
export async function updateFamilyTree(
  treeId: string,
  patch: Partial<UpdateFamilyTreeInput>,
): Promise<void> {
  // Validate name only when it is explicitly provided in the patch.
  if (patch.name !== undefined) {
    validateName(patch.name);
  }

  const ref = doc(db, 'family_trees', treeId);

  // Build the update payload — only include fields present in the patch.
  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.name !== undefined) {
    updatePayload['name'] = patch.name.trim();
  }
  if (patch.description !== undefined) {
    updatePayload['description'] = patch.description;
  }
  if (patch.shareWith !== undefined) {
    updatePayload['shareWith'] = patch.shareWith;
  }

  await withRetry(() => updateDoc(ref, updatePayload));
}

/**
 * Deletes a family tree and all its member subcollection documents atomically
 * in a single Firestore `writeBatch` commit.
 *
 * Steps:
 *   1. Fetch all document references from `family_trees/{treeId}/members`.
 *   2. Queue each member ref for deletion in the batch.
 *   3. Queue the tree document itself for deletion.
 *   4. Commit the batch.
 *
 * Requirements: 3.8
 *
 * @param treeId - Firestore document id of the tree to delete.
 *
 * @example
 * await deleteFamilyTree('abc123');
 * // family_trees/abc123 and all its members are gone
 */
export async function deleteFamilyTree(treeId: string): Promise<void> {
  // STEP 1: Fetch all member document references from the subcollection.
  const membersRef = collection(db, 'family_trees', treeId, 'members');
  const membersSnap = await getDocs(membersRef);

  // STEP 2 & 3: Build a single batch that deletes members + tree doc.
  const batch = writeBatch(db);

  for (const memberDoc of membersSnap.docs) {
    // INVARIANT: all refs processed so far are queued for deletion
    batch.delete(memberDoc.ref);
  }

  const treeRef = doc(db, 'family_trees', treeId);
  batch.delete(treeRef);

  // STEP 4: Commit atomically.
  await batch.commit();
}

/**
 * Fetches family trees shared with `uid` (Phase 2 sharing).
 *
 * Resolves access refs via `fetchSharedTreeRefs` (collectionGroup query), then
 * reads each parent tree and attaches the derived `role`. Trees that no longer
 * exist (stale access docs) are silently skipped.
 *
 * Returns an empty array for an empty/blank `uid`.
 *
 * @param uid - Firebase Auth UID of the current user.
 * @returns Array of shared `FamilyTree` objects, each with `role` set.
 */
export async function fetchSharedFamilyTrees(uid: string): Promise<FamilyTree[]> {
  if (!uid || uid.trim().length === 0) return [];

  const refs = await fetchSharedTreeRefs(uid);

  const trees = await Promise.all(
    refs.map(async ({ treeId, role }): Promise<FamilyTree | null> => {
      const tree = await getFamilyTree(treeId);
      return tree ? { ...tree, role } : null;
    }),
  );

  return trees.filter((t): t is FamilyTree => t !== null);
}

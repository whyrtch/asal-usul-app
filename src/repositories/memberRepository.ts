/**
 * MemberRepository — all Firestore reads and writes for the
 * `family_trees/{treeId}/members/{memberId}` subcollection.
 *
 * Responsibilities:
 *   - Fetch, create, update, and delete member documents
 *   - Validate member input before any Firestore write
 *   - Maintain relationship symmetry via batch writes
 *   - Clean up relationship references on member deletion
 *   - Atomically increment/decrement `totalMembers` on the parent tree doc
 *   - Wrap mutating operations in `withRetry` for transient-error resilience
 *
 * Subcollection path: `family_trees/{treeId}/members/{memberId}`
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.9, 4.10, 4.11
 *
 * @module src/repositories/memberRepository
 */

import {
    addDoc,
    arrayRemove,
    collection,
    deleteDoc,
    doc,
    DocumentReference,
    getDoc,
    getDocs,
    increment,
    runTransaction,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

import { db } from '@/services/firebase/config';
import {
    serverTimestamp,
    toISOString,
    withRetry,
} from '@/services/firebase/firestore';
import type { Member } from '@/types/familyTree';
import type {
    CreateMemberInput,
    MemberDocument,
    RelationshipUpdate,
    UpdateMemberInput,
} from '@/types/firestore';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Firestore collection reference for the members subcollection
 * of a given family tree.
 */
function membersCol(treeId: string) {
  return collection(db, 'family_trees', treeId, 'members');
}

/**
 * Returns the Firestore document reference for a specific member.
 */
function memberDocRef(treeId: string, memberId: string): DocumentReference {
  return doc(db, 'family_trees', treeId, 'members', memberId);
}

/**
 * Returns the Firestore document reference for the parent family tree.
 */
function familyTreeDocRef(treeId: string): DocumentReference {
  return doc(db, 'family_trees', treeId);
}

/**
 * Maps a Firestore document id and raw `MemberDocument` data to the
 * app-level `Member` interface, converting Timestamps to ISO strings.
 *
 * `photoUrl` is not yet stored in `MemberDocument` — it defaults to `null`.
 * `bio`, `status`, and `deathDate` are mapped from the document, defaulting to
 * `null`/`'living'` for legacy documents that predate these fields.
 *
 * Requirements: 4.7
 */
function mapDocToMember(id: string, data: MemberDocument): Member {
  return {
    id,
    familyTreeId: data.familyTreeId,
    fullName: data.fullName,
    gender: data.gender,
    role: data.role,
    birthDate: data.birthDate ?? null,
    status: data.status ?? 'living',
    deathDate: data.deathDate ?? null,
    photoUrl: data.photoUrl ?? null,
    bio: data.bio ?? null,
    fatherId: data.fatherId ?? null,
    motherId: data.motherId ?? null,
    spouseIds: data.spouseIds ?? [],
    childrenIds: data.childrenIds ?? [],
    createdAt: data.createdAt ? toISOString(data.createdAt) : new Date().toISOString(),
  };
}

/**
 * Validates input for `createMember`.
 *
 * Requirements: 4.9, 4.10, 4.11
 *
 * @throws {Error} When `fullName` is empty after trim.
 * @throws {Error} When `gender` is not `'male'` or `'female'`.
 * @throws {Error} When `spouseIds` or `childrenIds` contain the member's own id.
 *   (Note: at creation time the id is not yet known, so this check is performed
 *    against the provided `ownId` parameter when available — the store layer
 *    should pass the temp id; the repository validates against the doc ref id
 *    after `addDoc` if needed. For pre-write validation we check the arrays
 *    for any value that equals the provided `selfId` if given.)
 */
function validateCreateInput(data: CreateMemberInput, selfId?: string): void {
  // Requirement 4.9 — fullName must be non-empty after trim
  if (!data.fullName || data.fullName.trim().length === 0) {
    throw new Error(
      'Nama lengkap anggota tidak boleh kosong. Masukkan nama yang valid.',
    );
  }

  // Requirement 4.10 — gender must be 'male' or 'female'
  if (data.gender !== 'male' && data.gender !== 'female') {
    throw new Error(
      `Jenis kelamin tidak valid: "${data.gender}". Nilai yang diizinkan adalah 'male' atau 'female'.`,
    );
  }

  // Requirement 4.11 — spouseIds and childrenIds must not contain the member's own id
  if (selfId) {
    if (data.spouseIds.includes(selfId)) {
      throw new Error(
        'Anggota tidak dapat menjadi pasangan dari dirinya sendiri.',
      );
    }
    if (data.childrenIds.includes(selfId)) {
      throw new Error(
        'Anggota tidak dapat menjadi anak dari dirinya sendiri.',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all members from the `family_trees/{treeId}/members` subcollection.
 *
 * Maps each `MemberDocument` to a `Member`, converting `createdAt` Timestamp
 * to an ISO 8601 string. `photoUrl` and `bio` default to `null`.
 *
 * Requirements: 4.7
 *
 * @param treeId - Firestore document id of the parent family tree.
 * @returns Array of `Member` objects (may be empty).
 *
 * @example
 * const members = await fetchMembers('tree123');
 */
export async function fetchMembers(treeId: string): Promise<Member[]> {
  const snap = await getDocs(membersCol(treeId));
  return snap.docs.map(d => mapDocToMember(d.id, d.data() as MemberDocument));
}

/**
 * Creates a new member document in the `family_trees/{treeId}/members`
 * subcollection.
 *
 * Validates input before any Firestore write. After `addDoc` succeeds,
 * performs a post-write self-reference check (Requirement 4.11) using the
 * real Firestore-generated id. Wrapped in `withRetry`.
 *
 * Requirements: 4.1, 4.9, 4.10, 4.11
 *
 * @param treeId - Firestore document id of the parent family tree.
 * @param data   - Input fields for the new member.
 * @returns The created `Member` with the real Firestore-generated id.
 * @throws {Error} When validation fails (fullName empty, invalid gender,
 *   self-referencing relationship arrays).
 *
 * @example
 * const member = await createMember('tree123', {
 *   familyTreeId: 'tree123',
 *   fullName: 'Budi Santoso',
 *   gender: 'male',
 *   role: 'Ayah',
 *   birthDate: '1970-05-15',
 *   fatherId: null,
 *   motherId: null,
 *   spouseIds: [],
 *   childrenIds: [],
 * });
 */
export async function createMember(
  treeId: string,
  data: CreateMemberInput,
): Promise<Member> {
  // Pre-write validation (id not yet known — self-reference check deferred)
  validateCreateInput(data);

  const docRef = await withRetry(() =>
    addDoc(membersCol(treeId), {
      familyTreeId: data.familyTreeId,
      fullName: data.fullName.trim(),
      gender: data.gender,
      role: data.role,
      birthDate: data.birthDate ?? null,
      status: data.status ?? 'living',
      deathDate: data.deathDate ?? null,
      photoUrl: data.photoUrl ?? null,
      bio: data.bio ?? null,
      fatherId: data.fatherId ?? null,
      motherId: data.motherId ?? null,
      spouseIds: data.spouseIds ?? [],
      childrenIds: data.childrenIds ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  // Post-write self-reference check using the real Firestore-generated id
  // (Requirement 4.11 — throw if the caller somehow included the real id)
  if (data.spouseIds.includes(docRef.id)) {
    // Clean up the just-created document before throwing
    await deleteDoc(docRef);
    throw new Error('Anggota tidak dapat menjadi pasangan dari dirinya sendiri.');
  }
  if (data.childrenIds.includes(docRef.id)) {
    await deleteDoc(docRef);
    throw new Error('Anggota tidak dapat menjadi anak dari dirinya sendiri.');
  }

  // Atomically increment totalMembers on the parent family tree document.
  // Requirement 4.6 — totalMembers must always equal the actual member count.
  const treeRef = familyTreeDocRef(treeId);
  await runTransaction(db, async (transaction) => {
    transaction.update(treeRef, { totalMembers: increment(1) });
  });

  // Re-read to get resolved server timestamps
  const snap = await getDoc(docRef);
  return mapDocToMember(snap.id, snap.data() as MemberDocument);
}

/**
 * Updates editable fields on an existing member document.
 *
 * Always updates `updatedAt` with a server timestamp. Wrapped in `withRetry`.
 *
 * Requirements: 4.8
 *
 * @param treeId   - Firestore document id of the parent family tree.
 * @param memberId - Firestore document id of the member to update.
 * @param patch    - Partial set of fields to update.
 *
 * @example
 * await updateMember('tree123', 'member456', { fullName: 'Budi Santoso Jr.' });
 */
export async function updateMember(
  treeId: string,
  memberId: string,
  patch: Partial<UpdateMemberInput>,
): Promise<void> {
  const ref = memberDocRef(treeId, memberId);

  // Build update payload — only include fields present in the patch
  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (patch.fullName !== undefined) {
    updatePayload['fullName'] = patch.fullName.trim();
  }
  if (patch.gender !== undefined) {
    updatePayload['gender'] = patch.gender;
  }
  if (patch.role !== undefined) {
    updatePayload['role'] = patch.role;
  }
  if (patch.birthDate !== undefined) {
    updatePayload['birthDate'] = patch.birthDate;
  }
  if (patch.status !== undefined) {
    updatePayload['status'] = patch.status;
  }
  if (patch.deathDate !== undefined) {
    updatePayload['deathDate'] = patch.deathDate;
  }
  if (patch.photoUrl !== undefined) {
    updatePayload['photoUrl'] = patch.photoUrl;
  }
  if (patch.bio !== undefined) {
    updatePayload['bio'] = patch.bio;
  }
  if (patch.fatherId !== undefined) {
    updatePayload['fatherId'] = patch.fatherId;
  }
  if (patch.motherId !== undefined) {
    updatePayload['motherId'] = patch.motherId;
  }
  if (patch.spouseIds !== undefined) {
    updatePayload['spouseIds'] = patch.spouseIds;
  }
  if (patch.childrenIds !== undefined) {
    updatePayload['childrenIds'] = patch.childrenIds;
  }

  await withRetry(() => updateDoc(ref, updatePayload));
}

/**
 * Deletes a member document and removes all references to it from sibling
 * members' relationship fields (`spouseIds`, `childrenIds`, `fatherId`,
 * `motherId`) in a single Firestore batch write.
 *
 * Steps:
 *   1. Fetch all member documents in the tree.
 *   2. Build a batch that:
 *      a. Removes `memberId` from `spouseIds` and `childrenIds` of all siblings.
 *      b. Clears `fatherId` / `motherId` on any member that references `memberId`.
 *      c. Deletes the target member document.
 *   3. Commit the batch.
 *
 * Wrapped in `withRetry`.
 *
 * Requirements: 4.5
 *
 * @param treeId   - Firestore document id of the parent family tree.
 * @param memberId - Firestore document id of the member to delete.
 *
 * @example
 * await deleteMember('tree123', 'member456');
 */
export async function deleteMember(
  treeId: string,
  memberId: string,
): Promise<void> {
  await withRetry(async () => {
    // STEP 1: Fetch all sibling member documents
    const snap = await getDocs(membersCol(treeId));

    const batch = writeBatch(db);

    for (const siblingDoc of snap.docs) {
      if (siblingDoc.id === memberId) continue; // skip the member being deleted

      const siblingData = siblingDoc.data() as MemberDocument;
      const siblingRef = siblingDoc.ref;
      const siblingUpdate: Record<string, unknown> = {};

      // Remove from spouseIds if present
      if (siblingData.spouseIds?.includes(memberId)) {
        siblingUpdate['spouseIds'] = arrayRemove(memberId);
      }

      // Remove from childrenIds if present
      if (siblingData.childrenIds?.includes(memberId)) {
        siblingUpdate['childrenIds'] = arrayRemove(memberId);
      }

      // Clear fatherId if it references the deleted member
      if (siblingData.fatherId === memberId) {
        siblingUpdate['fatherId'] = null;
      }

      // Clear motherId if it references the deleted member
      if (siblingData.motherId === memberId) {
        siblingUpdate['motherId'] = null;
      }

      if (Object.keys(siblingUpdate).length > 0) {
        batch.update(siblingRef, siblingUpdate);
      }
    }

    // STEP 2c: Delete the target member document
    batch.delete(memberDocRef(treeId, memberId));

    // STEP 3: Commit atomically
    await batch.commit();
  });

  // Atomically decrement totalMembers on the parent family tree document,
  // floored at 0 to prevent negative counts.
  // Requirement 4.6 — totalMembers must always equal the actual member count.
  const treeRef = familyTreeDocRef(treeId);
  await runTransaction(db, async (transaction) => {
    const treeSnap = await transaction.get(treeRef);
    if (!treeSnap.exists()) return;
    const current = (treeSnap.data()?.totalMembers as number) ?? 0;
    transaction.update(treeRef, { totalMembers: Math.max(0, current - 1) });
  });
}

/**
 * Applies a list of relationship patches to member documents in a single
 * Firestore `writeBatch` commit.
 *
 * Non-existent member ids are silently skipped (the batch only includes
 * updates for members that actually exist in the subcollection).
 *
 * Requirements: 4.4
 *
 * @param treeId  - Firestore document id of the parent family tree.
 * @param updates - Array of `RelationshipUpdate` descriptors.
 *
 * @example
 * await batchUpdateRelationships('tree123', [
 *   { memberId: 'memberA', patch: { spouseIds: ['memberB'] } },
 *   { memberId: 'memberB', patch: { spouseIds: ['memberA'] } },
 * ]);
 */
export async function batchUpdateRelationships(
  treeId: string,
  updates: RelationshipUpdate[],
): Promise<void> {
  if (updates.length === 0) return;

  const batch = writeBatch(db);

  for (const update of updates) {
    const ref = memberDocRef(treeId, update.memberId);

    // Check existence — skip non-existent member ids silently
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const patchPayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (update.patch.spouseIds !== undefined) {
      patchPayload['spouseIds'] = update.patch.spouseIds;
    }
    if (update.patch.childrenIds !== undefined) {
      patchPayload['childrenIds'] = update.patch.childrenIds;
    }
    if (update.patch.fatherId !== undefined) {
      patchPayload['fatherId'] = update.patch.fatherId;
    }
    if (update.patch.motherId !== undefined) {
      patchPayload['motherId'] = update.patch.motherId;
    }

    batch.update(ref, patchPayload);
  }

  await batch.commit();
}

/**
 * Returns all Firestore `DocumentReference` objects for member documents
 * in the `family_trees/{treeId}/members` subcollection.
 *
 * Used by `FamilyTreeRepository.deleteFamilyTree` for cascade deletion.
 *
 * @param treeId - Firestore document id of the parent family tree.
 * @returns Array of `DocumentReference` objects (may be empty).
 *
 * @example
 * const refs = await getAllMemberRefs('tree123');
 * // refs.length === number of members in the tree
 */
export async function getAllMemberRefs(
  treeId: string,
): Promise<DocumentReference[]> {
  const snap = await getDocs(membersCol(treeId));
  return snap.docs.map(d => d.ref);
}

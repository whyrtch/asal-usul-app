/**
 * AccessRepository — Firestore reads/writes for `family_trees/{treeId}/access/{uid}`.
 *
 * Responsibilities:
 *   - List/read collaborator access docs (owner-gated by rules)
 *   - Grant access (invitee self-grant during accept; rules-validated)
 *   - Change role / revoke access (owner)
 *   - Resolve "shared-with-me" tree refs via collectionGroup
 *
 * SDK calls are isolated here; timestamps mapped to ISO strings before return.
 *
 * Phase 2 — Family Tree Sharing.
 *
 * @module src/repositories/accessRepository
 */

import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/services/firebase/config';
import { serverTimestamp, toISOString, withRetry } from '@/services/firebase/firestore';
import type {
    Access,
    AccessDocument,
    AccessRole,
    CreateAccessInput,
} from '@/types/sharing';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function accessCol(treeId: string) {
  return collection(db, 'family_trees', treeId, 'access');
}

function accessDocRef(treeId: string, uid: string) {
  return doc(db, 'family_trees', treeId, 'access', uid);
}

function mapDocToAccess(data: AccessDocument): Access {
  return {
    uid: data.uid,
    treeId: data.treeId,
    role: data.role,
    invitedBy: data.invitedBy,
    invitedVia: data.invitedVia,
    createdAt: data.createdAt ? toISOString(data.createdAt) : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lists all collaborator access docs for a tree (owner-only by rules).
 */
export async function fetchAccessList(treeId: string): Promise<Access[]> {
  const snap = await getDocs(accessCol(treeId));
  return snap.docs.map((d) => mapDocToAccess(d.data() as AccessDocument));
}

/**
 * Reads the current user's own access doc, or null if none exists.
 */
export async function getMyAccess(
  treeId: string,
  uid: string,
): Promise<Access | null> {
  const snap = await getDoc(accessDocRef(treeId, uid));
  if (!snap.exists()) return null;
  return mapDocToAccess(snap.data() as AccessDocument);
}

/**
 * Grants access by writing the access doc. Used by the invitee during accept
 * (create-once — rules forbid re-create, so re-accept is rejected) and is also
 * usable by the owner. `createdAt` is set server-side.
 */
export async function grantAccess(input: CreateAccessInput): Promise<void> {
  await withRetry(() =>
    setDoc(accessDocRef(input.treeId, input.uid), {
      uid: input.uid,
      treeId: input.treeId,
      role: input.role,
      invitedBy: input.invitedBy,
      invitedVia: input.invitedVia,
      createdAt: serverTimestamp(),
    }),
  );
}

/**
 * Changes a collaborator's role (owner-only by rules).
 */
export async function setAccessRole(
  treeId: string,
  uid: string,
  role: AccessRole,
): Promise<void> {
  await withRetry(() => updateDoc(accessDocRef(treeId, uid), { role }));
}

/**
 * Revokes a collaborator's access (owner-only by rules).
 */
export async function revokeAccess(treeId: string, uid: string): Promise<void> {
  await withRetry(() => deleteDoc(accessDocRef(treeId, uid)));
}

/**
 * Resolves the set of trees shared with `uid` via a `collectionGroup('access')`
 * query. Returns the parent tree id + role for each access doc.
 *
 * Requires a composite index on the `access` collection group (`uid`).
 */
export async function fetchSharedTreeRefs(
  uid: string,
): Promise<{ treeId: string; role: AccessRole }[]> {
  if (!uid || uid.trim().length === 0) return [];

  const q = query(collectionGroup(db, 'access'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as AccessDocument;
    return { treeId: data.treeId, role: data.role };
  });
}

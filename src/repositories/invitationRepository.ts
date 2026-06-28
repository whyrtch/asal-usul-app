/**
 * InvitationRepository — Firestore reads/writes for `invitations/{inviteId}`.
 *
 * Responsibilities:
 *   - Create invitations (validate + normalize email, reject self-invite,
 *     dedupe pending invites per (treeId, email))
 *   - List invitations for a tree (owner) / pending invites for an email (invitee)
 *   - Update invitation status (accept/decline/expire/revoke)
 *
 * The `status` field is the state flag enforced by security rules.
 *
 * Phase 2 — Family Tree Sharing.
 *
 * @module src/repositories/invitationRepository
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/services/firebase/config';
import { serverTimestamp, toISOString, withRetry } from '@/services/firebase/firestore';
import type {
    CreateInvitationInput,
    Invitation,
    InvitationDocument,
    InvitationStatus,
} from '@/types/sharing';

/** Days until a pending invitation expires. */
const INVITE_TTL_DAYS = 14;

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing — Property 6, 7)
// ---------------------------------------------------------------------------

/** Normalizes an email: trimmed + lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Basic email format check (not exhaustive, good enough for an invite gate). */
export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ---------------------------------------------------------------------------
// Internal mapping
// ---------------------------------------------------------------------------

function invitationsCol() {
  return collection(db, 'invitations');
}

function invitationDocRef(id: string) {
  return doc(db, 'invitations', id);
}

function mapDocToInvitation(id: string, data: InvitationDocument): Invitation {
  return {
    id,
    treeId: data.treeId,
    treeName: data.treeName,
    inviterUid: data.inviterUid,
    inviteeEmail: data.inviteeEmail,
    role: data.role,
    status: data.status,
    createdAt: data.createdAt ? toISOString(data.createdAt) : new Date().toISOString(),
    expiresAt: data.expiresAt ? toISOString(data.expiresAt) : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates (or re-uses/updates) a pending invitation.
 *
 * - Validates + normalizes the invitee email.
 * - Rejects inviting yourself (`inviterEmail`).
 * - Dedupes: if a `pending` invitation already exists for `(treeId, email)`,
 *   updates it (role/expiry refreshed) instead of creating a duplicate.
 *
 * @throws {Error} for invalid email or self-invite.
 */
export async function createInvitation(
  input: CreateInvitationInput,
  inviterEmail: string,
): Promise<Invitation> {
  const email = normalizeEmail(input.inviteeEmail);

  if (!isValidEmail(email)) {
    throw new Error('Email tidak valid. Periksa kembali alamat email.');
  }
  if (email === normalizeEmail(inviterEmail)) {
    throw new Error('Anda tidak dapat mengundang diri sendiri.');
  }

  // Dedupe: look for an existing pending invite for this (treeId, email).
  const dupQ = query(
    invitationsCol(),
    where('treeId', '==', input.treeId),
    where('inviteeEmail', '==', email),
    where('status', '==', 'pending'),
  );
  const dupSnap = await getDocs(dupQ);

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  );

  if (!dupSnap.empty) {
    // Refresh the existing pending invite (role + expiry).
    const existing = dupSnap.docs[0];
    await withRetry(() =>
      updateDoc(existing.ref, {
        role: input.role,
        status: 'pending',
        expiresAt,
      }),
    );
    const snap = await getDoc(existing.ref);
    return mapDocToInvitation(snap.id, snap.data() as InvitationDocument);
  }

  const docRef = await withRetry(() =>
    addDoc(invitationsCol(), {
      treeId: input.treeId,
      treeName: input.treeName,
      inviterUid: input.inviterUid,
      inviteeEmail: email,
      role: input.role,
      status: 'pending' as InvitationStatus,
      createdAt: serverTimestamp(),
      expiresAt,
    }),
  );

  const snap = await getDoc(docRef);
  return mapDocToInvitation(snap.id, snap.data() as InvitationDocument);
}

/** Reads a single invitation by id, or null if not found. */
export async function getInvitation(id: string): Promise<Invitation | null> {
  const snap = await getDoc(invitationDocRef(id));
  if (!snap.exists()) return null;
  return mapDocToInvitation(snap.id, snap.data() as InvitationDocument);
}

/** Lists all invitations for a tree (owner-only by rules). */
export async function fetchInvitationsForTree(
  treeId: string,
): Promise<Invitation[]> {
  const q = query(invitationsCol(), where('treeId', '==', treeId));
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapDocToInvitation(d.id, d.data() as InvitationDocument),
  );
}

/** Lists pending invitations addressed to `email` (invitee inbox). */
export async function fetchMyPendingInvitations(
  email: string,
): Promise<Invitation[]> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return [];
  const q = query(
    invitationsCol(),
    where('inviteeEmail', '==', normalized),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapDocToInvitation(d.id, d.data() as InvitationDocument),
  );
}

/** Updates an invitation's status flag (accept/decline/expire/revoke). */
export async function updateInvitationStatus(
  id: string,
  status: InvitationStatus,
): Promise<void> {
  await withRetry(() => updateDoc(invitationDocRef(id), { status }));
}

/** Convenience: mark an invitation declined. */
export async function declineInvitation(id: string): Promise<void> {
  await updateInvitationStatus(id, 'declined');
}

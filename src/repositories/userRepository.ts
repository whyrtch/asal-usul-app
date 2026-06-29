/**
 * UserRepository — all Firestore reads and writes for the `users/{uid}` collection.
 *
 * Responsibilities:
 *   - Map Firestore `DocumentSnapshot` → `UserDocument` (never expose raw SDK types)
 *   - Apply `serverTimestamp()` for all timestamp fields
 *   - Provide `getUser`, `createUser`, and `updateLastLogin` operations
 *
 * Collection path: `users/{uid}`
 *
 * Requirements: 1.2, 1.3, 1.5, 1.6
 *
 * @module src/repositories/userRepository
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/services/firebase/config';
import { serverTimestamp } from '@/services/firebase/firestore';
import type { CreateUserInput, UserDocument } from '@/types/firestore';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Maps a Firestore document id and raw data to a typed `UserDocument`.
 * Never exposes `DocumentSnapshot` or `DocumentReference` to callers.
 *
 * Requirements: 1.5
 */
function mapToUserDocument(
  id: string,
  data: Record<string, unknown>,
): UserDocument {
  return {
    id,
    name: (data['name'] as string) ?? '',
    email: (data['email'] as string) ?? '',
    photoUrl: (data['photoUrl'] as string) ?? '',
    provider: (data['provider'] as 'google') ?? 'google',
    plan: (data['plan'] as 'free' | 'premium') ?? 'free',
    createdAt: data['createdAt'] as UserDocument['createdAt'],
    updatedAt: data['updatedAt'] as UserDocument['updatedAt'],
    lastLoginAt: data['lastLoginAt'] as UserDocument['lastLoginAt'],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads the document at `users/{uid}` and returns a `UserDocument`, or `null`
 * if no document exists at that path.
 *
 * Requirements: 1.5
 *
 * @param uid - Firebase Auth UID of the user to look up.
 * @returns The mapped `UserDocument`, or `null` if not found.
 *
 * @example
 * const user = await getUser('abc123');
 * if (user === null) {
 *   // first sign-in — create the document
 * }
 */
export async function getUser(uid: string): Promise<UserDocument | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return mapToUserDocument(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Creates a new document at `users/{uid}` using `setDoc`.
 * All three timestamp fields (`createdAt`, `updatedAt`, `lastLoginAt`) are set
 * to `serverTimestamp()` so they are generated server-side.
 *
 * Requirements: 1.2, 1.6
 *
 * @param uid  - Firebase Auth UID; becomes the Firestore document id.
 * @param data - Profile fields from the authenticated Google user.
 * @returns The newly created `UserDocument` with server timestamps resolved
 *          via a subsequent `getDoc` call.
 *
 * @example
 * const user = await createUser('abc123', {
 *   name: 'Budi Santoso',
 *   email: 'budi@example.com',
 *   photoUrl: 'https://...',
 *   provider: 'google',
 * });
 */
export async function createUser(
  uid: string,
  data: CreateUserInput,
): Promise<UserDocument> {
  const ref = doc(db, 'users', uid);

  await setDoc(ref, {
    name: data.name,
    email: data.email,
    photoUrl: data.photoUrl,
    provider: data.provider,
    plan: 'free',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  // Re-read the document so the returned UserDocument contains resolved
  // Timestamps rather than FieldValue sentinels.
  const snap = await getDoc(ref);
  return mapToUserDocument(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * Updates only the `lastLoginAt` and `updatedAt` fields on `users/{uid}`.
 * All other fields are left unchanged.
 *
 * Requirements: 1.3, 1.6
 *
 * @param uid - Firebase Auth UID of the user whose login timestamp to update.
 *
 * @example
 * await updateLastLogin('abc123');
 */
export async function updateLastLogin(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid);

  await updateDoc(ref, {
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

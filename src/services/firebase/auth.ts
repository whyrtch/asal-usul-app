/**
 * AuthService — orchestrates post-authentication Firestore side effects.
 *
 * Responsibilities:
 *   - Check whether a `users/{uid}` document already exists
 *   - Create a new UserDocument on first sign-in
 *   - Update `lastLoginAt` on subsequent sign-ins
 *   - Never throw to the caller — all errors are logged internally
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 *
 * @module src/services/firebase/auth
 */

import type { User as FirebaseUser } from 'firebase/auth';

import {
    createUser,
    getUser,
    updateLastLogin,
} from '@/repositories/userRepository';

/**
 * Creates or updates the Firestore user document for the given Firebase user.
 *
 * - If no document exists at `users/{uid}`: creates a new `UserDocument` with
 *   profile fields sourced from the Firebase Auth user object.
 * - If a document already exists: updates only `lastLoginAt` and `updatedAt`.
 *
 * Errors are caught and logged via `console.error`; this function never throws
 * to its caller so that a Firestore failure cannot block sign-in navigation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 *
 * @param firebaseUser - The authenticated Firebase user returned by
 *   `signInWithCredential`. Must be non-null.
 *
 * @example
 * // Called in auth-context.tsx after successful credential exchange:
 * await authService.upsertUserDocument(firebaseUser);
 */
export async function upsertUserDocument(
  firebaseUser: FirebaseUser,
): Promise<void> {
  try {
    const { uid, displayName, email, photoURL } = firebaseUser;

    const existing = await getUser(uid);

    if (existing === null) {
      // First sign-in — create the full user document
      await createUser(uid, {
        name: displayName ?? '',
        email: email!,
        photoUrl: photoURL ?? '',
        provider: 'google',
      });
    } else {
      // Subsequent sign-in — only refresh the login timestamp
      await updateLastLogin(uid);
    }
  } catch (error) {
    // Requirement 1.4: errors must never propagate to the caller
    console.error('[AuthService] upsertUserDocument failed:', error);
  }
}

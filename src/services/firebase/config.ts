/**
 * Firebase service singletons re-exported for use across the service and repository layers.
 * Reuses the existing Firebase app initialized in src/lib/firebase.ts — never calls initializeApp again.
 *
 * @module src/services/firebase/config
 */

import { auth } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/** Re-export the Firebase Auth singleton initialized in src/lib/firebase.ts */
export { auth };

/** The default Firebase App instance */
export const app = getApp();

/** The Cloud Firestore instance bound to the existing Firebase app */
export const db = getFirestore(getApp());

/**
 * Lazily-created Cloud Storage instance.
 *
 * Storage is initialized on first use (not at module load) so the app can run
 * even when Firebase Storage has not been provisioned / the feature is
 * disabled. See `FEATURE_PHOTO_UPLOAD` in `src/constants/features.ts`.
 */
let _storage: FirebaseStorage | null = null;

export function getStorageInstance(): FirebaseStorage {
  if (_storage === null) {
    _storage = getStorage(getApp());
  }
  return _storage;
}

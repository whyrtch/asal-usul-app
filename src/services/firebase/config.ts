/**
 * Firebase service singletons re-exported for use across the service and repository layers.
 * Reuses the existing Firebase app initialized in src/lib/firebase.ts — never calls initializeApp again.
 *
 * @module src/services/firebase/config
 */

import { auth } from '@/lib/firebase';
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/** Re-export the Firebase Auth singleton initialized in src/lib/firebase.ts */
export { auth };

/** The default Firebase App instance */
export const app = getApp();

/** The Cloud Firestore instance bound to the existing Firebase app */
export const db = getFirestore(getApp());

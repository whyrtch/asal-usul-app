/**
 * StorageService — uploads images to Cloud Storage and returns download URLs.
 *
 * Isolates all `firebase/storage` SDK calls so the UI and stores stay
 * Firebase-free. Uploads are wrapped in `withRetry` for transient-error
 * resilience.
 *
 * Phase 1 — 4.1 Foto anggota + cover.
 *
 * @module src/services/firebase/storage
 */

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getStorageInstance } from './config';
import { withRetry } from './firestore';

/**
 * Uploads a local image file (e.g. a `file://` URI from expo-image-picker) to
 * Cloud Storage at `storagePath` and returns its public download URL.
 *
 * Steps:
 *   1. Fetch the local URI into a Blob.
 *   2. Upload the Blob to the given storage path (wrapped in `withRetry`).
 *   3. Resolve the download URL.
 *
 * @param localUri    - Local file URI of the image to upload.
 * @param storagePath - Destination path within the bucket (see storagePaths).
 * @returns The HTTPS download URL of the uploaded object.
 * @throws Propagates upload errors after retries are exhausted.
 *
 * @example
 * const url = await uploadImageAsync(asset.uri, buildMemberPhotoPath(treeId, id));
 */
export async function uploadImageAsync(
  localUri: string,
  storagePath: string,
): Promise<string> {
  // STEP 1: Read the local file into a Blob.
  const response = await fetch(localUri);
  const blob = await response.blob();

  // STEP 2: Upload to Cloud Storage with retry on transient failures.
  const storageRef = ref(getStorageInstance(), storagePath);
  await withRetry(() => uploadBytes(storageRef, blob));

  // STEP 3: Return the public download URL.
  return getDownloadURL(storageRef);
}

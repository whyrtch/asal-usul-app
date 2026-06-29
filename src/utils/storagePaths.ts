/**
 * Pure helpers that build Cloud Storage object paths for the AsalUsul app.
 *
 * Keeping path construction in one tested module guarantees uploads, reads,
 * and security rules all agree on the same layout:
 *
 *   family_trees/{treeId}/member-photos/{fileId}.{ext}
 *   family_trees/{treeId}/cover/{fileId}.{ext}
 *
 * No Firebase imports — deterministic and unit-testable.
 *
 * Phase 1 — 4.1 Foto anggota + cover.
 */

/** Default image extension used for uploaded photos. */
const DEFAULT_EXT = 'jpg';

/**
 * Generates a reasonably-unique file id (timestamp + random suffix).
 * Not cryptographically secure — only needs to avoid collisions for uploads.
 */
export function generateFileId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}_${rand}`;
}

/**
 * Builds the storage path for a member's photo.
 *
 * @param treeId - Firestore id of the parent family tree (must be non-empty).
 * @param fileId - Unique file id (see {@link generateFileId}).
 * @param ext    - File extension without the dot. Defaults to `'jpg'`.
 */
export function buildMemberPhotoPath(
  treeId: string,
  fileId: string,
  ext: string = DEFAULT_EXT,
): string {
  return `family_trees/${treeId}/member-photos/${fileId}.${ext}`;
}

/**
 * Builds the storage path for a family tree's cover image.
 */
export function buildTreeCoverPath(
  treeId: string,
  fileId: string,
  ext: string = DEFAULT_EXT,
): string {
  return `family_trees/${treeId}/cover/${fileId}.${ext}`;
}

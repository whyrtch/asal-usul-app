/**
 * Centralized, localized (Bahasa Indonesia) error messages and a shared
 * error-classification helper used across all Zustand stores.
 *
 * Keeping these in one place removes duplication between stores and prepares
 * the codebase for future internationalization (i18n): swapping or extending
 * the language set only requires changing this module.
 *
 * @module src/constants/errorMessages
 */

import { isNetworkError, isPermissionError } from '@/services/firebase/firestore';

// ---------------------------------------------------------------------------
// Localized error messages
// ---------------------------------------------------------------------------

/** Shown when a Firestore operation fails with a permission/auth error. */
export const ERROR_PERMISSION = 'Akses ditolak. Silakan masuk kembali.';

/** Shown when a Firestore operation fails due to a network/transient error. */
export const ERROR_NETWORK = 'Tidak ada koneksi internet.';

/** Generic fallback for any unclassified error. */
export const ERROR_GENERIC = 'Terjadi kesalahan. Silakan coba lagi.';

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Maps an unknown caught error to a localized, user-facing message.
 *
 * - Permission/auth errors → {@link ERROR_PERMISSION}
 * - Network/transient errors → {@link ERROR_NETWORK}
 * - Everything else → {@link ERROR_GENERIC}
 *
 * @param err - Any value caught from a try/catch block.
 * @returns A localized message string suitable for display in the UI.
 */
export function classifyError(err: unknown): string {
  if (isPermissionError(err)) return ERROR_PERMISSION;
  if (isNetworkError(err)) return ERROR_NETWORK;
  return ERROR_GENERIC;
}

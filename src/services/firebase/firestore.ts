/**
 * Generic Firestore utility functions shared across all repository modules.
 *
 * Provides:
 *   - `toISOString`       — Firestore Timestamp → ISO 8601 UTC string
 *   - `isPermissionError` — classifies Firebase permission-denied errors
 *   - `isNetworkError`    — classifies Firebase network/transient errors
 *   - `isAuthError`       — classifies Firebase auth credential errors
 *   - `serverTimestamp`   — re-exported from firebase/firestore for convenience
 *   - `withRetry`         — wraps a Firestore operation with exponential backoff retry logic
 *
 * @module src/services/firebase/firestore
 */

import { serverTimestamp, Timestamp } from 'firebase/firestore';

// Re-export serverTimestamp so repositories can import it from a single place.
export { serverTimestamp };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Type guard that checks whether a value is a FirebaseError-shaped object.
 * Uses duck-typing rather than `instanceof` to remain resilient across
 * different module resolution paths (CJS vs ESM bundles in Jest).
 *
 * A FirebaseError always has:
 *   - `name === 'FirebaseError'`
 *   - `code` as a non-empty string
 */
function isFirebaseErrorLike(error: unknown): error is { code: string; name: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    (error as Record<string, unknown>)['name'] === 'FirebaseError' &&
    typeof (error as Record<string, unknown>)['code'] === 'string'
  );
}

// ---------------------------------------------------------------------------
// Timestamp conversion
// ---------------------------------------------------------------------------

/**
 * Converts a Firestore `Timestamp` to an ISO 8601 UTC string ending with `Z`.
 *
 * Requirements: 6.2, 2.8
 *
 * @param timestamp - A Firestore `Timestamp` instance. If `null` or `undefined`,
 *   falls back to `new Date().toISOString()` (current time in UTC).
 * @returns ISO 8601 UTC string, e.g. `"2024-01-15T10:30:00.000Z"`.
 *
 * @example
 * const ts = Timestamp.fromDate(new Date('2024-01-15T10:30:00.000Z'));
 * toISOString(ts); // "2024-01-15T10:30:00.000Z"
 *
 * toISOString(null as any); // current time as ISO string
 */
export function toISOString(timestamp: Timestamp): string {
  if (timestamp == null) {
    return new Date().toISOString();
  }
  return timestamp.toDate().toISOString();
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `error` is a `FirebaseError` with code
 * `permission-denied` or `insufficient-permissions`.
 *
 * Requirements: 6.3, 5.1
 *
 * @param error - Any value caught from a try/catch block.
 * @returns `true` for permission-related Firebase errors; `false` otherwise.
 *
 * @example
 * isPermissionError(new FirebaseError('permission-denied', 'msg')); // true
 * isPermissionError(new Error('network'));                           // false
 */
export function isPermissionError(error: unknown): boolean {
  if (!isFirebaseErrorLike(error)) return false;
  return (
    error.code === 'permission-denied' ||
    error.code === 'insufficient-permissions'
  );
}

/**
 * Returns `true` when `error` is a `FirebaseError` with code
 * `unavailable` or `deadline-exceeded`.
 *
 * Requirements: 6.4, 5.2
 *
 * @param error - Any value caught from a try/catch block.
 * @returns `true` for transient network Firebase errors; `false` otherwise.
 *
 * @example
 * isNetworkError(new FirebaseError('unavailable', 'msg'));       // true
 * isNetworkError(new FirebaseError('deadline-exceeded', 'msg')); // true
 * isNetworkError(new Error('network'));                           // false
 */
export function isNetworkError(error: unknown): boolean {
  if (!isFirebaseErrorLike(error)) return false;
  return (
    error.code === 'unavailable' ||
    error.code === 'deadline-exceeded'
  );
}

/**
 * Returns `true` when `error` is a `FirebaseError` with code
 * `invalid-credential` or `user-token-expired`.
 *
 * Requirements: 5.7
 *
 * @param error - Any value caught from a try/catch block.
 * @returns `true` for auth credential Firebase errors; `false` otherwise.
 *
 * @example
 * isAuthError(new FirebaseError('invalid-credential', 'msg'));  // true
 * isAuthError(new FirebaseError('user-token-expired', 'msg'));  // true
 * isAuthError(new Error('auth'));                                // false
 */
export function isAuthError(error: unknown): boolean {
  if (!isFirebaseErrorLike(error)) return false;
  return (
    error.code === 'invalid-credential' ||
    error.code === 'user-token-expired'
  );
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

/**
 * Options for controlling `withRetry` behaviour.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.7
 */
export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff. Default: 500 */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds. Default: 8000 */
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
};

/** Resolves after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps a Firestore operation with exponential backoff retry logic.
 *
 * - Throws immediately (no retry) for permission errors (`isPermissionError`)
 *   and auth errors (`isAuthError`).
 * - Retries on network/transient errors up to `maxAttempts` times.
 * - Delay before attempt `n`: `min(baseDelayMs * 2^(n-1) + jitter, maxDelayMs)`
 *   where `jitter` is a random value in `[0, 100)` ms.
 * - Throws the last error after exhausting all attempts.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.7
 *
 * @param operation - A zero-argument function returning a Promise.
 * @param options   - Optional retry configuration (merged with defaults).
 * @returns The resolved value of `operation` on success.
 *
 * @example
 * const result = await withRetry(() => getDoc(ref));
 *
 * @example
 * const result = await withRetry(() => addDoc(col, data), {
 *   maxAttempts: 5,
 *   baseDelayMs: 200,
 *   maxDelayMs: 4000,
 * });
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };

  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    // INVARIANT: attempt < maxAttempts, all previous attempts failed transiently
    try {
      return await operation();
    } catch (error) {
      attempt++;

      // Never retry permission or auth errors — throw immediately.
      if (isPermissionError(error) || isAuthError(error)) {
        throw error;
      }

      // Exhausted all attempts — throw the last error.
      if (attempt >= opts.maxAttempts) {
        throw error;
      }

      // Exponential backoff with jitter before the next attempt.
      const jitter = Math.random() * 100;
      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt - 1) + jitter,
        opts.maxDelayMs,
      );
      await sleep(delay);
    }
  }

  // This line is unreachable — the loop always returns or throws.
  // TypeScript requires it for exhaustive control-flow analysis.
  /* istanbul ignore next */
  throw new Error('withRetry: unexpected exit from retry loop');
}

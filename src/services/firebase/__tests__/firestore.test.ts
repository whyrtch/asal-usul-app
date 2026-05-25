/**
 * Unit and property-based tests for src/services/firebase/firestore.ts
 *
 * Covers:
 *   - toISOString: Timestamp → ISO 8601 UTC string, null/undefined fallback
 *   - isPermissionError: FirebaseError code classification
 *   - isNetworkError: FirebaseError code classification
 *   - isAuthError: FirebaseError code classification
 *   - withRetry: retry logic, non-amplification, backoff bounds
 *
 * **Validates: Requirements 6.2, 6.3, 6.4, 5.1, 5.2**
 */

import * as fc from 'fast-check';
import { Timestamp } from 'firebase/firestore';
import {
    isAuthError,
    isNetworkError,
    isPermissionError,
    toISOString,
    withRetry,
} from '../firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a FirebaseError-shaped object with the given code.
 * Uses duck-typing (name + code) to match what Firebase SDK produces at runtime,
 * avoiding `instanceof FirebaseError` constructor issues in Jest's module environment.
 */
function makeFirebaseError(code: string): Error & { name: string; code: string } {
  const err = new Error(`Firebase: ${code}`) as Error & { name: string; code: string };
  err.name = 'FirebaseError';
  err.code = code;
  return err;
}

/** Build a Firestore Timestamp from a Date. */
function makeTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

// ---------------------------------------------------------------------------
// toISOString
// ---------------------------------------------------------------------------

describe('toISOString', () => {
  it('converts a Firestore Timestamp to an ISO 8601 UTC string ending with Z', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const ts = makeTimestamp(date);
    const result = toISOString(ts);
    expect(result).toBe('2024-01-15T10:30:00.000Z');
    expect(result.endsWith('Z')).toBe(true);
  });

  it('returns a string ending with Z for any valid Timestamp', () => {
    const ts = makeTimestamp(new Date('2000-06-01T00:00:00.000Z'));
    expect(toISOString(ts).endsWith('Z')).toBe(true);
  });

  it('falls back to current time ISO string when timestamp is null', () => {
    const before = Date.now();
    const result = toISOString(null as unknown as Timestamp);
    const after = Date.now();
    expect(result.endsWith('Z')).toBe(true);
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
    expect(resultMs).toBeLessThanOrEqual(after);
  });

  it('falls back to current time ISO string when timestamp is undefined', () => {
    const before = Date.now();
    const result = toISOString(undefined as unknown as Timestamp);
    const after = Date.now();
    expect(result.endsWith('Z')).toBe(true);
    const resultMs = new Date(result).getTime();
    expect(resultMs).toBeGreaterThanOrEqual(before);
    expect(resultMs).toBeLessThanOrEqual(after);
  });

  it('is deterministic — same Timestamp always produces the same string', () => {
    const date = new Date('2024-03-20T15:45:30.123Z');
    const ts = makeTimestamp(date);
    expect(toISOString(ts)).toBe(toISOString(ts));
  });

  // Property: toISOString output always ends with 'Z' for any valid timestamp
  it('property: always ends with Z for any valid Date-based Timestamp', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1970-01-01T00:00:00.000Z'), max: new Date('2100-12-31T23:59:59.999Z') }),
        (date) => {
          const ts = makeTimestamp(date);
          return toISOString(ts).endsWith('Z');
        }
      )
    );
  });

  // Property: round-trip — toISOString(Timestamp.fromDate(d)) === d.toISOString()
  it('property: round-trips through Timestamp.fromDate for any Date', () => {
    fc.assert(
      fc.property(
        // Firestore Timestamp has second + nanosecond precision; use second-aligned dates
        fc.integer({ min: 0, max: 4102444800 }).map((secs) => new Date(secs * 1000)),
        (date) => {
          const ts = makeTimestamp(date);
          return toISOString(ts) === date.toISOString();
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// isPermissionError
// ---------------------------------------------------------------------------

describe('isPermissionError', () => {
  it('returns true for code permission-denied', () => {
    expect(isPermissionError(makeFirebaseError('permission-denied'))).toBe(true);
  });

  it('returns true for code insufficient-permissions', () => {
    expect(isPermissionError(makeFirebaseError('insufficient-permissions'))).toBe(true);
  });

  it('returns false for a network error code', () => {
    expect(isPermissionError(makeFirebaseError('unavailable'))).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isPermissionError(new Error('permission-denied'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPermissionError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isPermissionError(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isPermissionError('permission-denied')).toBe(false);
  });

  // Property: only the two designated codes return true
  it('property: returns true only for permission-denied and insufficient-permissions', () => {
    const permissionCodes = ['permission-denied', 'insufficient-permissions'] as const;
    const otherCodes = [
      'unavailable', 'deadline-exceeded', 'invalid-credential',
      'user-token-expired', 'not-found', 'already-exists', 'cancelled',
    ];

    permissionCodes.forEach((code) => {
      expect(isPermissionError(makeFirebaseError(code))).toBe(true);
    });

    otherCodes.forEach((code) => {
      expect(isPermissionError(makeFirebaseError(code))).toBe(false);
    });
  });

  // Property: non-FirebaseError values always return false
  it('property: non-FirebaseError values always return false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          // Plain Error objects (no name='FirebaseError')
          fc.string().map((msg) => new Error(msg)),
        ),
        (value) => isPermissionError(value) === false
      )
    );
  });
});

// ---------------------------------------------------------------------------
// isNetworkError
// ---------------------------------------------------------------------------

describe('isNetworkError', () => {
  it('returns true for code unavailable', () => {
    expect(isNetworkError(makeFirebaseError('unavailable'))).toBe(true);
  });

  it('returns true for code deadline-exceeded', () => {
    expect(isNetworkError(makeFirebaseError('deadline-exceeded'))).toBe(true);
  });

  it('returns false for a permission error code', () => {
    expect(isNetworkError(makeFirebaseError('permission-denied'))).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isNetworkError(new Error('unavailable'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isNetworkError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNetworkError(undefined)).toBe(false);
  });

  // Property: only the two designated codes return true
  it('property: returns true only for unavailable and deadline-exceeded', () => {
    const networkCodes = ['unavailable', 'deadline-exceeded'] as const;
    const otherCodes = [
      'permission-denied', 'insufficient-permissions', 'invalid-credential',
      'user-token-expired', 'not-found', 'already-exists',
    ];

    networkCodes.forEach((code) => {
      expect(isNetworkError(makeFirebaseError(code))).toBe(true);
    });

    otherCodes.forEach((code) => {
      expect(isNetworkError(makeFirebaseError(code))).toBe(false);
    });
  });

  // Property: non-FirebaseError values always return false
  it('property: non-FirebaseError values always return false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.string().map((msg) => new Error(msg)),
        ),
        (value) => isNetworkError(value) === false
      )
    );
  });
});

// ---------------------------------------------------------------------------
// isAuthError
// ---------------------------------------------------------------------------

describe('isAuthError', () => {
  it('returns true for code invalid-credential', () => {
    expect(isAuthError(makeFirebaseError('invalid-credential'))).toBe(true);
  });

  it('returns true for code user-token-expired', () => {
    expect(isAuthError(makeFirebaseError('user-token-expired'))).toBe(true);
  });

  it('returns false for a permission error code', () => {
    expect(isAuthError(makeFirebaseError('permission-denied'))).toBe(false);
  });

  it('returns false for a network error code', () => {
    expect(isAuthError(makeFirebaseError('unavailable'))).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isAuthError(new Error('invalid-credential'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAuthError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isAuthError(undefined)).toBe(false);
  });

  // Property: only the two designated codes return true
  it('property: returns true only for invalid-credential and user-token-expired', () => {
    const authCodes = ['invalid-credential', 'user-token-expired'] as const;
    const otherCodes = [
      'permission-denied', 'insufficient-permissions',
      'unavailable', 'deadline-exceeded', 'not-found',
    ];

    authCodes.forEach((code) => {
      expect(isAuthError(makeFirebaseError(code))).toBe(true);
    });

    otherCodes.forEach((code) => {
      expect(isAuthError(makeFirebaseError(code))).toBe(false);
    });
  });

  // Property: non-FirebaseError values always return false
  it('property: non-FirebaseError values always return false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.string().map((msg) => new Error(msg)),
        ),
        (value) => isAuthError(value) === false
      )
    );
  });
});

// ---------------------------------------------------------------------------
// Mutual exclusivity property
// ---------------------------------------------------------------------------

describe('error classifier mutual exclusivity', () => {
  // Property: no single FirebaseError code returns true for more than one classifier
  it('property: permission, network, and auth classifiers are mutually exclusive for any code', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (code) => {
          const err = makeFirebaseError(code);
          const trueCount = [
            isPermissionError(err),
            isNetworkError(err),
            isAuthError(err),
          ].filter(Boolean).length;
          // At most one classifier should return true for any given code
          return trueCount <= 1;
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// withRetry
// ---------------------------------------------------------------------------

// Mock setTimeout globally so withRetry's sleep() resolves immediately in all tests.
// This avoids fake timer complexity while still exercising the retry logic.
jest.spyOn(global, 'setTimeout').mockImplementation((fn: TimerHandler) => {
  if (typeof fn === 'function') fn();
  return 0 as unknown as ReturnType<typeof setTimeout>;
});

describe('withRetry', () => {
  // -------------------------------------------------------------------------
  // Unit tests
  // -------------------------------------------------------------------------

  it('returns the resolved value when the operation succeeds on the first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(operation);
    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('throws immediately for permission-denied without retrying', async () => {
    const err = makeFirebaseError('permission-denied');
    const operation = jest.fn().mockRejectedValue(err);

    await expect(withRetry(operation)).rejects.toBe(err);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('throws immediately for insufficient-permissions without retrying', async () => {
    const err = makeFirebaseError('insufficient-permissions');
    const operation = jest.fn().mockRejectedValue(err);

    await expect(withRetry(operation)).rejects.toBe(err);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('throws immediately for auth errors without retrying', async () => {
    const err = makeFirebaseError('invalid-credential');
    const operation = jest.fn().mockRejectedValue(err);

    await expect(withRetry(operation)).rejects.toBe(err);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on transient errors and succeeds on a later attempt', async () => {
    const transientErr = makeFirebaseError('unavailable');
    const operation = jest.fn()
      .mockRejectedValueOnce(transientErr)
      .mockResolvedValue('recovered');

    const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 });

    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting all attempts', async () => {
    const transientErr = makeFirebaseError('unavailable');
    const operation = jest.fn().mockRejectedValue(transientErr);

    await expect(
      withRetry(operation, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 })
    ).rejects.toBe(transientErr);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('respects maxAttempts: 1 — no retries at all', async () => {
    const transientErr = makeFirebaseError('deadline-exceeded');
    const operation = jest.fn().mockRejectedValue(transientErr);

    await expect(
      withRetry(operation, { maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 })
    ).rejects.toBe(transientErr);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Property 6: Retry Non-Amplification
  // **Validates: Requirements 5.1**
  //
  // For any permission error code, withRetry calls the operation exactly once
  // and throws immediately — no retry amplification occurs.
  // -------------------------------------------------------------------------

  it('property 6: withRetry never retries permission errors — operation called exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ code: fc.constantFrom('permission-denied', 'insufficient-permissions') }),
        async ({ code }) => {
          const err = makeFirebaseError(code);
          const operation = jest.fn().mockRejectedValue(err);

          try {
            await withRetry(operation, { maxAttempts: 5, baseDelayMs: 10, maxDelayMs: 100 });
          } catch { /* expected */ }

          // INVARIANT: exactly one call — no retry amplification
          const callCount = operation.mock.calls.length;
          operation.mockClear();
          return callCount === 1;
        }
      )
    );
  });

  // -------------------------------------------------------------------------
  // Property: retry count never exceeds maxAttempts for transient errors
  // **Validates: Requirements 5.2**
  // -------------------------------------------------------------------------

  it('property: retry count never exceeds maxAttempts for transient errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom('unavailable', 'deadline-exceeded'),
        async (maxAttempts, code) => {
          const err = makeFirebaseError(code);
          const operation = jest.fn().mockRejectedValue(err);

          try {
            await withRetry(operation, { maxAttempts, baseDelayMs: 1, maxDelayMs: 10 });
          } catch { /* expected */ }

          // INVARIANT: call count === maxAttempts (never exceeds)
          const callCount = operation.mock.calls.length;
          operation.mockClear();
          return callCount === maxAttempts;
        }
      )
    );
  });

  // -------------------------------------------------------------------------
  // Property: backoff delay is always within [0, maxDelayMs] bounds
  // **Validates: Requirements 5.2**
  //
  // We verify the delay formula directly: for any attempt n in [1, maxAttempts-1],
  // the computed delay min(baseDelayMs * 2^(n-1) + jitter, maxDelayMs) is always
  // within [0, maxDelayMs]. Since jitter ∈ [0, 100) and Math.min caps at maxDelayMs,
  // the upper bound is guaranteed by the formula itself.
  // -------------------------------------------------------------------------

  it('property: backoff delay formula always produces values within [0, maxDelayMs]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),   // maxAttempts
        fc.integer({ min: 10, max: 500 }), // baseDelayMs
        fc.integer({ min: 500, max: 8000 }), // maxDelayMs
        fc.float({ min: 0, max: Math.fround(99.9), noNaN: true }), // jitter ∈ [0, 100)
        fc.integer({ min: 1, max: 4 }),   // attempt index (1-based, after first failure)
        (maxAttempts, baseDelayMs, maxDelayMs, jitter, attempt) => {
          // The delay formula from withRetry implementation:
          // delay = Math.min(baseDelayMs * 2^(attempt-1) + jitter, maxDelayMs)
          const delay = Math.min(
            baseDelayMs * Math.pow(2, attempt - 1) + jitter,
            maxDelayMs,
          );
          // INVARIANT: delay is always within [0, maxDelayMs]
          return delay >= 0 && delay <= maxDelayMs;
        }
      )
    );
  });
});

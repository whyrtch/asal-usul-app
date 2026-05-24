// Feature: expo-firebase-boilerplate, Property 1: Auth state listener cleanup

/**
 * Property 1: Auth state listener cleanup
 * Validates: Requirements 3.1
 *
 * For any instance of AuthProvider, mounting then unmounting the component
 * should result in the onAuthStateChanged listener being unsubscribed exactly
 * once, leaving no active listeners after unmount.
 */

import { act, renderHook } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('firebase/auth');
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Alert.alert = jest.fn();
  return rn;
});

import {
    _getUnsubscribeMock,
    _resetAuthMocks,
    _simulateAuthStateChange,
    onAuthStateChanged,
} from 'firebase/auth';

import { AuthProvider, useAuth } from '../context/auth-context';

// ── Wrapper ───────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 1: Auth state listener cleanup', () => {
  beforeEach(() => {
    (_resetAuthMocks as jest.Mock)();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it(
    'unsubscribe is called exactly once after unmount, regardless of auth state at unmount time',
    async () => {
      // Generator: optional auth state to simulate before unmounting.
      // null  → signed-out state
      // object → signed-in state with arbitrary user fields
      const authStateArb = fc.option(
        fc.record({
          uid: fc.string({ minLength: 1, maxLength: 28 }),
          email: fc.option(fc.emailAddress(), { nil: null }),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          photoURL: fc.option(fc.webUrl(), { nil: null }),
        }),
        { nil: null }
      );

      await fc.assert(
        fc.asyncProperty(authStateArb, async (authState) => {
          // Reset mocks for each property run to ensure isolation
          (_resetAuthMocks as jest.Mock)();

          const { unmount } = renderHook(() => useAuth(), { wrapper });

          // Optionally simulate an auth state change before unmounting
          if (authState !== null) {
            act(() => {
              (_simulateAuthStateChange as (user: object | null) => void)(authState);
            });
          }

          // Capture the unsubscribe mock that was returned during mount
          const unsubscribe = (_getUnsubscribeMock as () => jest.Mock)();

          // Unmount the component — this should trigger the useEffect cleanup
          unmount();

          // Core property: unsubscribe must be called exactly once
          expect(unsubscribe).toHaveBeenCalledTimes(1);

          // Ensure onAuthStateChanged was registered exactly once per mount
          expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'unsubscribe is called exactly once even when component unmounts before auth state resolves (loading=true)',
    async () => {
      // Generator: delay in ms before unmount (0 to 9999 ms, before the 10s timeout)
      const delayArb = fc.integer({ min: 0, max: 9_999 });

      await fc.assert(
        fc.asyncProperty(delayArb, async (delayMs) => {
          (_resetAuthMocks as jest.Mock)();

          const { unmount } = renderHook(() => useAuth(), { wrapper });

          // Advance time without resolving auth state — component is still loading
          act(() => {
            jest.advanceTimersByTime(delayMs);
          });

          const unsubscribe = (_getUnsubscribeMock as () => jest.Mock)();

          // Unmount while still in loading state
          unmount();

          // Core property: unsubscribe must still be called exactly once
          expect(unsubscribe).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: expo-firebase-boilerplate, Property 3: Logout always clears user state

/**
 * Property 3: Logout always clears user state
 * Validates: Requirements 5.3, 5.5
 *
 * For any authenticated user and any combination of errors from
 * GoogleSignin.signOut() or Firebase signOut(), calling signOut() in
 * AuthContext should always result in `user` becoming null, ensuring the
 * local session is always cleared regardless of remote sign-out success or
 * failure.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signOut as firebaseSignOut } from 'firebase/auth';

describe('Property 3: Logout always clears user state', () => {
  beforeEach(() => {
    (_resetAuthMocks as jest.Mock)();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it(
    'user is always null after signOut(), regardless of GoogleSignin or Firebase signOut errors',
    async () => {
      // Generator: valid user objects (non-null, simulating a logged-in user)
      const validUserArb = fc.record({
        uid: fc.string({ minLength: 1, maxLength: 28 }),
        email: fc.option(fc.emailAddress(), { nil: null }),
        displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
        photoURL: fc.option(fc.webUrl(), { nil: null }),
      });

      // Generator: error outcome for GoogleSignin.signOut — either resolves or throws
      const googleSignOutOutcomeArb = fc.oneof(
        fc.constant({ throws: false as const }),
        fc.string({ minLength: 1, maxLength: 80 }).map((msg) => ({ throws: true as const, message: msg }))
      );

      // Generator: error outcome for Firebase signOut — either resolves or throws
      const firebaseSignOutOutcomeArb = fc.oneof(
        fc.constant({ throws: false as const }),
        fc.string({ minLength: 1, maxLength: 80 }).map((msg) => ({ throws: true as const, message: msg }))
      );

      await fc.assert(
        fc.asyncProperty(
          validUserArb,
          googleSignOutOutcomeArb,
          firebaseSignOutOutcomeArb,
          async (authUser, googleOutcome, firebaseOutcome) => {
            // Reset mocks for each property run
            (_resetAuthMocks as jest.Mock)();
            (GoogleSignin.configure as jest.Mock).mockClear();

            // Configure GoogleSignin.signOut mock based on outcome
            if (googleOutcome.throws) {
              (GoogleSignin.signOut as jest.Mock).mockRejectedValue(
                new Error(googleOutcome.message)
              );
            } else {
              (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
            }

            // Configure Firebase signOut mock based on outcome
            if (firebaseOutcome.throws) {
              (firebaseSignOut as jest.Mock).mockRejectedValue(
                new Error(firebaseOutcome.message)
              );
            } else {
              (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);
            }

            // Render AuthProvider and resolve auth state with a logged-in user
            const { result } = renderHook(() => useAuth(), { wrapper });

            act(() => {
              (_simulateAuthStateChange as (user: object | null) => void)(authUser);
            });

            // Verify user is set before logout
            expect(result.current.user).not.toBeNull();

            // Call signOut — must not throw (errors are handled internally)
            await act(async () => {
              await result.current.signOut();
            });

            // Core property: user must always be null after signOut()
            expect(result.current.user).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: expo-firebase-boilerplate, Property 6: idToken forwarded to Firebase credential

/**
 * Property 6: idToken forwarded to Firebase credential
 * Validates: Requirements 2.3
 *
 * For any successful Google Sign-In response containing a non-empty idToken
 * string, the signInWithGoogle function should call signInWithCredential with
 * a GoogleAuthProvider credential constructed from that exact idToken.
 */

import {
    GoogleAuthProvider,
    _resetAuthMocks as _resetAuthMocksForP6,
    signInWithCredential,
} from 'firebase/auth';

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 6: idToken forwarded to Firebase credential', () => {
  beforeEach(() => {
    (_resetAuthMocksForP6 as jest.Mock)();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it(
    'signInWithCredential is always called with the credential built from the exact same idToken',
    async () => {
      // Generator: non-empty idToken strings (printable ASCII, at least 1 char)
      const idTokenArb = fc.string({ minLength: 1, maxLength: 256 }).filter(
        (s) => s.trim().length > 0
      );

      await fc.assert(
        fc.asyncProperty(idTokenArb, async (idToken) => {
          // Reset mocks for each run to ensure isolation
          (_resetAuthMocksForP6 as jest.Mock)();
          (GoogleSignin.configure as jest.Mock).mockClear();
          (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
          (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
            type: 'success',
            data: { idToken },
          });

          // The mock credential object that GoogleAuthProvider.credential returns
          const mockCredential = {
            providerId: 'google.com',
            signInMethod: 'google.com',
            idToken,
          };
          (GoogleAuthProvider.credential as jest.Mock).mockReturnValue(mockCredential);
          (signInWithCredential as jest.Mock).mockResolvedValue({
            user: {
              uid: 'mock-uid',
              email: 'mock@example.com',
              displayName: 'Mock User',
              photoURL: null,
            },
          });

          // Render AuthProvider and call signInWithGoogle
          const { result } = renderHook(() => useAuth(), { wrapper });

          // Resolve the onAuthStateChanged so loading becomes false
          act(() => {
            (_simulateAuthStateChange as (user: object | null) => void)(null);
          });

          // Call signInWithGoogle
          await act(async () => {
            await result.current.signInWithGoogle();
          });

          // Property: GoogleAuthProvider.credential must be called with the exact idToken
          expect(GoogleAuthProvider.credential).toHaveBeenCalledWith(idToken);

          // Property: signInWithCredential must be called with the credential
          // that was built from the exact same idToken
          expect(signInWithCredential).toHaveBeenCalledWith(
            expect.anything(),
            mockCredential
          );

          // Verify the credential passed to signInWithCredential contains the same idToken
          const credentialArg = (signInWithCredential as jest.Mock).mock.calls[0][1];
          expect(credentialArg).toBe(mockCredential);
          expect(credentialArg.idToken).toBe(idToken);
        }),
        { numRuns: 100 }
      );
    }
  );
});

/**
 * Unit tests for AuthProvider in src/context/auth-context.tsx
 * Requirements: 3.1, 3.4, 3.5, 3.6, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9
 */

import { act, renderHook } from '@testing-library/react-native';
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
jest.mock('@react-native-google-signin/google-signin');

// ── Import mocked helpers from the mocked module itself ───────────────────────
import * as firebaseAuth from 'firebase/auth';

const {
    _getUnsubscribeMock,
    _resetAuthMocks,
    _simulateAuthStateChange,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
} = firebaseAuth as typeof firebaseAuth & {
    _getUnsubscribeMock: () => jest.Mock;
    _resetAuthMocks: () => void;
    _simulateAuthStateChange: (user: object | null) => void;
};

// Reference to the mocked Firebase signOut (aliased to avoid collision with useAuth().signOut)
const firebaseSignOut = (firebaseAuth as unknown as { signOut: jest.Mock }).signOut;

import {
    GoogleSignin,
    isErrorWithCode,
    statusCodes,
} from '@react-native-google-signin/google-signin';

// ── Import component under test ───────────────────────────────────────────────
import { AuthProvider, useAuth } from '../context/auth-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── useAuth hook (Requirements: 3.1) ─────────────────────────────────────────

describe('useAuth', () => {
  it('throws a descriptive error when used outside AuthProvider', () => {
    // Suppress the expected React error boundary console output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });

  it('returns the auth context value when used inside AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signInWithGoogle');
    expect(result.current).toHaveProperty('signOut');
  });
});

describe('AuthProvider', () => {
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

  // ── Requirement 3.1: listener registration ──────────────────────────────────

  describe('Requirement 3.1 — onAuthStateChanged listener lifecycle', () => {
    it('registers onAuthStateChanged listener on mount', () => {
      renderHook(() => useAuth(), { wrapper });
      expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes the listener on unmount', () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });
      const unsubscribe = (_getUnsubscribeMock as () => jest.Mock)();
      unmount();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ── Requirement 3.4 / 3.5: loading resolves when auth state arrives ─────────

  describe('Requirement 3.4 / 3.5 — loading resolves after auth state', () => {
    it('starts with loading=true and user=null', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('sets loading=false and user=null when Firebase resolves with null (signed out)', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)(null);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('sets loading=false and maps user fields when Firebase resolves with a user', () => {
      const firebaseUser = {
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)(firebaseUser);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual({
        uid: 'uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('maps only the four AuthUser fields (uid, email, displayName, photoURL)', () => {
      const firebaseUser = {
        uid: 'uid-abc',
        email: 'user@example.com',
        displayName: 'User',
        photoURL: null,
        emailVerified: true,
        providerData: [],
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)(firebaseUser);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual({
        uid: 'uid-abc',
        email: 'user@example.com',
        displayName: 'User',
        photoURL: null,
      });
      expect(result.current.user).not.toHaveProperty('emailVerified');
      expect(result.current.user).not.toHaveProperty('providerData');
    });
  });

  // ── Requirement 3.6: 10-second timeout ──────────────────────────────────────

  describe('Requirement 3.6 — 10-second timeout forces loading=false', () => {
    it('forces loading=false and user=null after 10 seconds if auth never resolves', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('does NOT trigger timeout if auth resolves before 10 seconds', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        jest.advanceTimersByTime(5_000);
        (_simulateAuthStateChange as (user: object | null) => void)(null);
      });

      expect(result.current.loading).toBe(false);

      act(() => {
        jest.advanceTimersByTime(6_000);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  // ── signInWithGoogle (Requirements: 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9) ────

  describe('signInWithGoogle', () => {
    beforeEach(() => {
      // Reset Google Sign-In mocks before each test
      (GoogleSignin.configure as jest.Mock).mockClear();
      (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
        type: 'success',
        data: { idToken: 'mock-id-token' },
      });
      (signInWithCredential as jest.Mock).mockResolvedValue({
        user: { uid: 'uid-1', email: 'a@b.com', displayName: 'A', photoURL: null },
      });
      (GoogleAuthProvider.credential as jest.Mock).mockReturnValue({
        providerId: 'google.com',
        idToken: 'mock-id-token',
      });
      (isErrorWithCode as jest.Mock).mockImplementation(
        (err: unknown) =>
          typeof err === 'object' && err !== null && 'code' in err
      );
    });

    it('calls GoogleSignin.configure with webClientId before sign-in (Requirement 2.9)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(GoogleSignin.configure).toHaveBeenCalledWith(
        expect.objectContaining({ webClientId: expect.any(String) })
      );
    });

    it('calls hasPlayServices then signIn in order (Requirement 2.2)', async () => {
      const callOrder: string[] = [];
      (GoogleSignin.hasPlayServices as jest.Mock).mockImplementation(async () => {
        callOrder.push('hasPlayServices');
        return true;
      });
      (GoogleSignin.signIn as jest.Mock).mockImplementation(async () => {
        callOrder.push('signIn');
        return { type: 'success', data: { idToken: 'tok' } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(callOrder).toEqual(['hasPlayServices', 'signIn']);
    });

    it('calls signInWithCredential with GoogleAuthProvider credential from idToken (Requirement 2.3)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith('mock-id-token');
      expect(signInWithCredential).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ idToken: 'mock-id-token' })
      );
    });

    it('returns without error when user cancels (response.type === cancelled) (Requirement 2.4)', async () => {
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ type: 'cancelled', data: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).resolves.toBeUndefined();
      });

      expect(signInWithCredential).not.toHaveBeenCalled();
    });

    it('throws "Authentication failed" when idToken is null (Requirement 2.6)', async () => {
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
        type: 'success',
        data: { idToken: null },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Authentication failed. Please try again.'
        );
      });
    });

    it('throws "Authentication failed" when idToken is empty string (Requirement 2.6)', async () => {
      (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
        type: 'success',
        data: { idToken: '' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Authentication failed. Please try again.'
        );
      });
    });

    it('ignores IN_PROGRESS error silently (Requirement 2.7)', async () => {
      const inProgressError = { code: statusCodes.IN_PROGRESS, message: 'in progress' };
      (GoogleSignin.hasPlayServices as jest.Mock).mockRejectedValue(inProgressError);
      (isErrorWithCode as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).resolves.toBeUndefined();
      });
    });

    it('throws "Google Play Services not available" for PLAY_SERVICES_NOT_AVAILABLE (Requirement 2.7)', async () => {
      const playServicesError = {
        code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
        message: 'play services not available',
      };
      (GoogleSignin.hasPlayServices as jest.Mock).mockRejectedValue(playServicesError);
      (isErrorWithCode as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Google Play Services not available'
        );
      });
    });

    it('throws network error message for auth/network-request-failed (Requirement 2.8)', async () => {
      const networkError = Object.assign(
        new Error('Firebase: Network request failed (auth/network-request-failed).'),
        { code: 'auth/network-request-failed' }
      );
      (signInWithCredential as jest.Mock).mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Network error. Please check your connection.'
        );
      });
    });

    it('throws "Invalid credentials" for auth/invalid-credential (Requirement 2.8)', async () => {
      const credError = Object.assign(new Error('Invalid credential'), {
        code: 'auth/invalid-credential',
      });
      (signInWithCredential as jest.Mock).mockRejectedValue(credError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Invalid credentials. Please try again.'
        );
      });
    });

    it('throws "This account has been disabled" for auth/user-disabled (Requirement 2.8)', async () => {
      const disabledError = Object.assign(new Error('User disabled'), {
        code: 'auth/user-disabled',
      });
      (signInWithCredential as jest.Mock).mockRejectedValue(disabledError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'This account has been disabled.'
        );
      });
    });

    it('throws generic "Sign-in failed" for unknown Firebase error codes (Requirement 2.8)', async () => {
      const unknownError = Object.assign(new Error('Unknown Firebase error'), {
        code: 'auth/unknown-error',
      });
      (signInWithCredential as jest.Mock).mockRejectedValue(unknownError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Sign-in failed. Please try again.'
        );
      });
    });

    it('throws timeout error after 30 seconds (Requirement 2.8)', async () => {
      // signInWithCredential never resolves — simulates a Firebase hang
      (signInWithCredential as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Collect the error thrown by signInWithGoogle
      let signInError: Error | undefined;
      const signInPromise = result.current.signInWithGoogle().catch((e: Error) => {
        signInError = e;
      });

      // Flush all pending microtasks so the async chain inside signInWithGoogle
      // runs up to the point where it registers the 30-second setTimeout.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Now advance fake timers past the 30-second mark to fire the timeout.
      act(() => {
        jest.advanceTimersByTime(31_000);
      });

      // Flush the rejection from the timeout promise.
      await act(async () => {
        await signInPromise;
      });

      expect(signInError).toBeDefined();
      expect(signInError?.message).toBe('Sign-in timed out. Please try again.');
    }, 10_000);

    it('calls all four steps in order: configure → hasPlayServices → signIn → signInWithCredential (Requirement 2.2, 2.9)', async () => {
      const callOrder: string[] = [];
      (GoogleSignin.configure as jest.Mock).mockImplementation(() => {
        callOrder.push('configure');
      });
      (GoogleSignin.hasPlayServices as jest.Mock).mockImplementation(async () => {
        callOrder.push('hasPlayServices');
        return true;
      });
      (GoogleSignin.signIn as jest.Mock).mockImplementation(async () => {
        callOrder.push('signIn');
        return { type: 'success', data: { idToken: 'tok' } };
      });
      (signInWithCredential as jest.Mock).mockImplementation(async () => {
        callOrder.push('signInWithCredential');
        return { user: { uid: 'u', email: 'e@e.com', displayName: 'E', photoURL: null } };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(callOrder).toEqual(['configure', 'hasPlayServices', 'signIn', 'signInWithCredential']);
    });
  });

  // ── signOut (Requirements: 5.2, 5.3, 5.5) ────────────────────────────────────

  describe('signOut', () => {
    beforeEach(() => {
      (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);
    });

    it('calls GoogleSignin.signOut then Firebase signOut in order (Requirement 5.2)', async () => {
      const callOrder: string[] = [];
      (GoogleSignin.signOut as jest.Mock).mockImplementation(async () => {
        callOrder.push('googleSignOut');
        return null;
      });
      (firebaseSignOut as jest.Mock).mockImplementation(async () => {
        callOrder.push('firebaseSignOut');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(callOrder).toEqual(['googleSignOut', 'firebaseSignOut']);
    });

    it('sets user=null even when GoogleSignin.signOut throws (Requirement 5.3, 5.5)', async () => {
      // First set a user so we can verify it gets cleared
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)({
          uid: 'uid-1',
          email: 'a@b.com',
          displayName: 'A',
          photoURL: null,
        });
      });
      expect(result.current.user).not.toBeNull();

      (GoogleSignin.signOut as jest.Mock).mockRejectedValue(new Error('Google sign-out failed'));

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
    });

    it('sets user=null even when Firebase signOut throws (Requirement 5.3, 5.5)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)({
          uid: 'uid-2',
          email: 'b@c.com',
          displayName: 'B',
          photoURL: null,
        });
      });
      expect(result.current.user).not.toBeNull();

      (firebaseSignOut as jest.Mock).mockRejectedValue(new Error('Firebase sign-out failed'));

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
    });

    it('sets user=null even when both GoogleSignin.signOut and Firebase signOut throw (Requirement 5.3, 5.5)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      act(() => {
        (_simulateAuthStateChange as (user: object | null) => void)({
          uid: 'uid-3',
          email: 'c@d.com',
          displayName: 'C',
          photoURL: null,
        });
      });
      expect(result.current.user).not.toBeNull();

      (GoogleSignin.signOut as jest.Mock).mockRejectedValue(new Error('Google error'));
      (firebaseSignOut as jest.Mock).mockRejectedValue(new Error('Firebase error'));

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
    });
  });
});

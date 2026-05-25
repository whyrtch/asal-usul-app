import {
    GoogleSignin,
    isErrorWithCode,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    type User,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { auth } from '../lib/firebase';
import { upsertUserDocument } from '../services/firebase/auth';
import { useAuthStore } from '../store/useAuthStore';

// Web client ID for Google Sign-In (from env or placeholder)
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID ?? 'YOUR_WEB_CLIENT_ID_HERE';

/** Timeout in milliseconds before resetting isSigningIn. Requirements: 2.8 */
const SIGN_IN_TIMEOUT_MS = 30_000;

// ─── Interfaces ──────────────────────────────────────────────────────────────

/**
 * Subset of Firebase User fields exposed to the rest of the app.
 * Requirements: 3.1
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Shape of the value provided by AuthContext.
 * Requirements: 3.1, 3.5
 */
export interface AuthContextValue {
  /** Currently authenticated user, or null when signed out. */
  user: AuthUser | null;
  /** True while the initial auth state is being resolved from Firebase. */
  loading: boolean;
  /** Initiates the Google Sign-In flow and authenticates with Firebase. */
  signInWithGoogle: () => Promise<void>;
  /** Signs out from both Google and Firebase, clearing local session. */
  signOut: () => Promise<void>;
}

// ─── Default context value ────────────────────────────────────────────────────

/**
 * Stub implementations used as the default context value.
 * These are replaced by the real implementations inside AuthProvider (task 3.2+).
 * Calling them outside of an AuthProvider will throw a descriptive error (task 3.9).
 */
const defaultContextValue: AuthContextValue = {
  user: null,
  loading: true,
  signInWithGoogle: async () => {
    throw new Error('signInWithGoogle must be used within an AuthProvider');
  },
  signOut: async () => {
    throw new Error('signOut must be used within an AuthProvider');
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * AuthContext distributes authentication state and actions to the component tree.
 * Wrap your app (or the relevant subtree) with AuthProvider to supply real values.
 */
export const AuthContext = createContext<AuthContextValue>(defaultContextValue);

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Maps a Firebase User object to the leaner AuthUser interface. */
function mapFirebaseUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

/** Timeout in milliseconds before forcing loading to false. Requirements: 3.6 */
const AUTH_TIMEOUT_MS = 10_000;

/**
 * Provides real authentication state and actions to the component tree.
 * Requirements: 3.1, 3.4, 3.5, 3.6
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep a ref to track whether the component is still mounted, so we avoid
  // calling setState after unmount (e.g. if the timeout fires late).
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ── Timeout: force loading=false after 10 s (Requirements: 3.6) ──────────
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setUser(null);
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    // ── onAuthStateChanged listener (Requirements: 3.1, 3.4, 3.5) ────────────
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mountedRef.current) return;

      clearTimeout(timeoutId);
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
      // Sync uid into useAuthStore (Requirements: 6.5)
      useAuthStore.getState().setUid(firebaseUser?.uid ?? null);
    });

    // ── Cleanup on unmount (Requirements: 3.1) ────────────────────────────────
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // ── signInWithGoogle (Requirements: 2.2, 2.3, 2.4, 2.6, 2.7, 2.8, 2.9) ────

  const signInWithGoogle = async (): Promise<void> => {
    // Configure Google Sign-In with the web client ID before every sign-in
    // attempt so the call is always safe to make (configure is synchronous).
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

    let signInTimeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Ensure Google Play Services are available (Android requirement).
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Kick off the native Google Sign-In UI.
      const response = await GoogleSignin.signIn();

      // User cancelled — return silently without surfacing an error.
      if (response.type === 'cancelled') {
        return;
      }

      // At this point response.type === 'success'.
      const { idToken } = response.data;

      // Guard: idToken must be present to authenticate with Firebase.
      if (!idToken) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Start the 30-second timeout to reset isSigningIn if Firebase hangs.
      // (isSigningIn is managed by the caller — we throw a timeout error so
      //  the caller can reset its own loading state.)
      const timeoutPromise = new Promise<never>((_, reject) => {
        signInTimeoutId = setTimeout(() => {
          reject(new Error('Sign-in timed out. Please try again.'));
        }, SIGN_IN_TIMEOUT_MS);
      });

      // Race Firebase credential exchange against the timeout.
      const firebaseUser = await Promise.race([
        signInWithCredential(auth, GoogleAuthProvider.credential(idToken)),
        timeoutPromise,
      ]);

      // Sync uid into useAuthStore (Requirements: 6.5)
      useAuthStore.getState().setUid(firebaseUser.user.uid);

      // Upsert Firestore user document — failure must not block navigation (Requirement 1.4)
      try {
        await upsertUserDocument(firebaseUser.user);
      } catch (upsertError) {
        console.error('[AuthContext] upsertUserDocument failed:', upsertError);
      }
    } catch (error: unknown) {
      if (isErrorWithCode(error)) {
        // Sign-in already in progress — ignore silently.
        if (error.code === statusCodes.IN_PROGRESS) {
          return;
        }

        // Google Play Services not available on this device.
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error('Google Play Services not available');
        }
      }

      // Re-throw errors that already have a user-facing message
      // (our own throws above, or the timeout error).
      if (error instanceof Error) {
        // Map Firebase auth error codes to user-friendly messages.
        const firebaseCode = (error as { code?: string }).code;
        if (firebaseCode) {
          switch (firebaseCode) {
            case 'auth/network-request-failed':
              throw new Error('Network error. Please check your connection.');
            case 'auth/invalid-credential':
              throw new Error('Invalid credentials. Please try again.');
            case 'auth/user-disabled':
              throw new Error('This account has been disabled.');
            default:
              throw new Error('Sign-in failed. Please try again.');
          }
        }

        // Network errors (no Firebase code, but message contains "network").
        if (
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('fetch')
        ) {
          throw new Error('Network error. Please check your connection.');
        }

        // Re-throw our own descriptive errors unchanged.
        throw error;
      }

      // Unknown error type — surface a generic message.
      throw new Error('Sign-in failed. Please try again.');
    } finally {
      if (signInTimeoutId !== undefined) {
        clearTimeout(signInTimeoutId);
      }
    }
  };

  // ── signOut (Requirements: 5.2, 5.3, 5.5) ────────────────────────────────────
  const signOut = async (): Promise<void> => {
    // Step 1: Sign out from Google — log any error and continue (Requirement 5.2)
    try {
      await GoogleSignin.signOut();
    } catch (googleError: unknown) {
      console.error('GoogleSignin.signOut error:', googleError);
    }

    // Step 2: Sign out from Firebase — show alert on error (Requirement 5.2)
    try {
      await firebaseSignOut(auth);
    } catch (firebaseError: unknown) {
      const message =
        firebaseError instanceof Error
          ? firebaseError.message
          : 'Sign-out failed. Please try again.';
      Alert.alert('Sign-out error', message);
    } finally {
      // Step 3: Always clear local session regardless of errors (Requirements: 5.3, 5.5)
      setUser(null);
      // Clear useAuthStore auth state (Requirements: 6.5)
      useAuthStore.getState().clearAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

/**
 * Convenience hook that reads from AuthContext.
 * Throws a descriptive error when used outside of AuthProvider.
 * Requirements: 3.1
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === defaultContextValue) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

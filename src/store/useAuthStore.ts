import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  uid: string | null;
  isAuthenticated: boolean;
  authError: string | null;
}

interface AuthActions {
  /**
   * Sets the authenticated user's uid.
   * Automatically derives isAuthenticated: uid !== null.
   */
  setUid(uid: string | null): void;
  /**
   * Sets the auth error message. Pass null to clear the error.
   */
  setAuthError(error: string | null): void;
  /**
   * Clears all auth state — uid: null, isAuthenticated: false, authError: null.
   */
  clearAuth(): void;
}

type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()((set) => ({
  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  uid: null,
  isAuthenticated: false,
  authError: null,

  // ---------------------------------------------------------------------------
  // setUid — sets uid and derives isAuthenticated
  // ---------------------------------------------------------------------------
  setUid: (uid: string | null): void => {
    set({
      uid,
      isAuthenticated: uid !== null,
    });
  },

  // ---------------------------------------------------------------------------
  // setAuthError — sets or clears the auth error message
  // ---------------------------------------------------------------------------
  setAuthError: (error: string | null): void => {
    set({ authError: error });
  },

  // ---------------------------------------------------------------------------
  // clearAuth — resets all auth state to initial values
  // ---------------------------------------------------------------------------
  clearAuth: (): void => {
    set({
      uid: null,
      isAuthenticated: false,
      authError: null,
    });
  },
}));

import {
    fetchFamilyTrees,
    createFamilyTree as repoCreateFamilyTree,
    deleteFamilyTree as repoDeleteFamilyTree,
    updateFamilyTree as repoUpdateFamilyTree,
} from '@/repositories/familyTreeRepository';
import { isNetworkError, isPermissionError } from '@/services/firebase/firestore';
import { create } from 'zustand';
import type { FamilyTree, FamilyTreeStore } from '../types/familyTree';

// ---------------------------------------------------------------------------
// Localized error messages (Requirements: 5.4, 5.6)
// ---------------------------------------------------------------------------

const ERROR_PERMISSION = 'Akses ditolak. Silakan masuk kembali.';
const ERROR_NETWORK = 'Tidak ada koneksi internet.';
const ERROR_GENERIC = 'Terjadi kesalahan. Silakan coba lagi.';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFamilyTreeStore = create<FamilyTreeStore>()((set) => ({
  // ---------------------------------------------------------------------------
  // Initial state — empty; populated via loadFamilyTrees (Requirements: 2.4)
  // ---------------------------------------------------------------------------
  familyTrees: [],
  loading: false,
  error: null,

  // ---------------------------------------------------------------------------
  // loadFamilyTrees — fetches family trees from Firestore for the given uid
  // Requirements: 2.4, 2.5, 2.6, 2.7, 2.9, 5.4, 5.5, 5.6
  // ---------------------------------------------------------------------------
  loadFamilyTrees: async (uid: string): Promise<void> => {
    // Guard: empty/null uid — clear trees without hitting Firestore (Req 2.9)
    if (!uid || uid.trim().length === 0) {
      set({ loading: false, familyTrees: [] });
      return;
    }

    // STEP 1: Set loading state (Req 2.5)
    set({ loading: true, error: null });

    try {
      // STEP 2: Fetch from Firestore via repository
      const trees = await fetchFamilyTrees(uid);

      // STEP 3: Replace store state with fetched data (Req 2.6)
      set({ familyTrees: trees, loading: false });
    } catch (err) {
      // STEP 4: Classify error and preserve existing familyTrees (Req 2.7)
      let message: string;

      if (isPermissionError(err)) {
        // Req 5.4: permission-denied → localized message
        // Note: signOut is handled by the screen layer (cannot import AuthContext here)
        message = ERROR_PERMISSION;
      } else if (isNetworkError(err)) {
        // Req 5.6: network error → localized message
        message = ERROR_NETWORK;
      } else {
        message = ERROR_GENERIC;
      }

      // Preserve existing familyTrees on error (Req 2.7)
      set((state) => ({ loading: false, error: message, familyTrees: state.familyTrees }));
    }
  },

  // ---------------------------------------------------------------------------
  // createFamilyTree — Firestore-backed with optimistic insert
  // Requirements: 3.1, 3.2, 3.3, 3.11
  // ---------------------------------------------------------------------------
  createFamilyTree: async (name: string, uid: string): Promise<void> => {
    // STEP 1: Generate temp id for optimistic update (Req 3.1)
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticTree: FamilyTree = {
      id: tempId,
      name: name.trim(),
      description: null,
      coverImage: null,
      ownerId: uid,
      totalMembers: 0,
      shareWith: [],
      createdAt: now,
      updatedAt: now,
    };

    // STEP 2: Optimistic insert — prepend for immediate UI feedback (Req 3.1)
    set((state) => ({
      familyTrees: [optimisticTree, ...state.familyTrees],
    }));

    try {
      // STEP 3: Persist to Firestore via repository
      const realTree = await repoCreateFamilyTree({
        name: name.trim(),
        description: null,
        ownerId: uid,
        shareWith: [],
      });

      // STEP 4: Replace temp entry with real Firestore document (Req 3.2)
      set((state) => ({
        familyTrees: state.familyTrees.map((t) =>
          t.id === tempId ? realTree : t
        ),
      }));
    } catch (err) {
      // STEP 5: Rollback — remove optimistic entry, restore pre-call state (Req 3.3)
      let message: string;

      if (isPermissionError(err)) {
        message = ERROR_PERMISSION;
      } else if (isNetworkError(err)) {
        message = ERROR_NETWORK;
      } else {
        message = ERROR_GENERIC;
      }

      set((state) => ({
        familyTrees: state.familyTrees.filter((t) => t.id !== tempId),
        error: message,
      }));
    }
  },

  // ---------------------------------------------------------------------------
  // removeFamilyTree — idempotent: no-op when id does not exist
  // ---------------------------------------------------------------------------
  removeFamilyTree: (id: string): void => {
    set((state) => ({
      familyTrees: state.familyTrees.filter((tree) => tree.id !== id),
    }));
  },

  // ---------------------------------------------------------------------------
  // updateFamilyTree — Firestore-backed with optimistic patch
  // Requirements: 3.4, 3.5, 3.6, 3.7
  // ---------------------------------------------------------------------------
  updateFamilyTree: async (treeId: string, patch: Partial<Pick<FamilyTree, 'name' | 'description'>>): Promise<void> => {
    // STEP 1: Capture pre-call state for rollback on failure (Req 3.5)
    let previousEntry: FamilyTree | undefined;

    // STEP 2: Optimistic patch — apply immediately before Firestore write (Req 3.4)
    set((state) => {
      const entry = state.familyTrees.find((t) => t.id === treeId);
      previousEntry = entry;
      if (!entry) return state;
      const now = new Date().toISOString();
      return {
        familyTrees: state.familyTrees.map((t) =>
          t.id === treeId ? { ...t, ...patch, updatedAt: now } : t
        ),
      };
    });

    try {
      // STEP 3: Persist to Firestore via repository (Req 3.6)
      await repoUpdateFamilyTree(treeId, patch);
    } catch (err) {
      // STEP 4: Revert to pre-call state on failure (Req 3.5)
      let message: string;

      if (isPermissionError(err)) {
        message = ERROR_PERMISSION;
      } else if (isNetworkError(err)) {
        message = ERROR_NETWORK;
      } else {
        message = ERROR_GENERIC;
      }

      set((state) => ({
        familyTrees: previousEntry
          ? state.familyTrees.map((t) => (t.id === treeId ? previousEntry! : t))
          : state.familyTrees,
        error: message,
      }));
    }
  },

  // ---------------------------------------------------------------------------
  // deleteFamilyTree — Firestore-backed with optimistic removal
  // Requirements: 3.7, 3.8, 3.9
  // ---------------------------------------------------------------------------
  deleteFamilyTree: async (treeId: string, uid: string): Promise<void> => {
    // STEP 1: Optimistic removal — remove from store immediately (Req 3.7)
    // Note: useMemberStore.clearMembers(treeId) is intentionally NOT called here
    // to avoid a circular import (useMemberStore imports nothing from here, but
    // importing useMemberStore here would create a circular dependency).
    // The screen layer (family/[id].tsx) is responsible for calling clearMembers.
    set((state) => ({
      familyTrees: state.familyTrees.filter((t) => t.id !== treeId),
    }));

    try {
      // STEP 2: Delete from Firestore via repository (cascade deletes members) (Req 3.8)
      await repoDeleteFamilyTree(treeId);
    } catch (err) {
      // STEP 3: Rollback — reload from Firestore to restore consistent state (Req 3.9)
      try {
        // Use the store's own get() to call loadFamilyTrees
        await useFamilyTreeStore.getState().loadFamilyTrees(uid);
      } catch (reloadErr) {
        // If reload also fails, set error (Req 3.9)
        let message: string;

        if (isPermissionError(reloadErr)) {
          message = ERROR_PERMISSION;
        } else if (isNetworkError(reloadErr)) {
          message = ERROR_NETWORK;
        } else {
          message = ERROR_GENERIC;
        }

        set({ error: message });
      }
    }
  },
}));

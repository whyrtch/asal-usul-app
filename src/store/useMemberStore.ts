/**
 * useMemberStore — Zustand store for member state, keyed by treeId.
 *
 * Organizes member state as `membersByTreeId: Record<string, Member[]>` so
 * that members for different trees are loaded and cleared independently.
 *
 * All Firestore operations use optimistic updates with rollback on failure.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.7, 4.8, 5.8, 6.6
 *
 * @module src/store/useMemberStore
 */

import { classifyError } from '@/constants/errorMessages';
import {
    fetchMembers,
    createMember as repoCreateMember,
    deleteMember as repoDeleteMember,
    updateMember as repoUpdateMember,
} from '@/repositories/memberRepository';
import { AnalyticsEvents, logEvent, recordError } from '@/services/analytics';
import type { Member } from '@/types/familyTree';
import type { CreateMemberInput } from '@/types/firestore';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Store state and actions interfaces
// ---------------------------------------------------------------------------

interface MemberState {
  /** Members keyed by treeId — each tree's members are independent (Req 6.6) */
  membersByTreeId: Record<string, Member[]>;
  /** The treeId currently being loaded, or null when idle (Req 4.7) */
  loadingTreeId: string | null;
  /** Non-null when the last member operation failed (Req 4.3, 4.7, 4.8) */
  memberError: string | null;
}

interface MemberActions {
  /** Fetch all members for a tree from Firestore (Req 4.7) */
  loadMembers(treeId: string): Promise<void>;
  /** Optimistic insert + Firestore create (Req 4.1, 4.2, 4.3) */
  addMember(treeId: string, data: Omit<Member, 'id' | 'createdAt'>): Promise<void>;
  /** Optimistic patch + Firestore update (Req 4.8) */
  updateMember(treeId: string, memberId: string, patch: Partial<Member>): Promise<void>;
  /** Optimistic removal + Firestore delete (Req 4.5) */
  deleteMember(treeId: string, memberId: string): Promise<void>;
  /** Remove all members for a tree from local state (Req 3.7, 6.6) */
  clearMembers(treeId: string): void;
}

export type MemberStore = MemberState & MemberActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMemberStore = create<MemberStore>()((set, get) => ({
  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  membersByTreeId: {},
  loadingTreeId: null,
  memberError: null,

  // ---------------------------------------------------------------------------
  // loadMembers — fetches all members for a tree from Firestore
  // Requirements: 4.7
  // ---------------------------------------------------------------------------
  loadMembers: async (treeId: string): Promise<void> => {
    // STEP 1: Set loading state (Req 4.7)
    set({ loadingTreeId: treeId, memberError: null });

    try {
      // STEP 2: Fetch from Firestore via repository
      const members = await fetchMembers(treeId);

      // STEP 3: Store members keyed by treeId, clear loading (Req 4.7)
      set((state) => ({
        membersByTreeId: { ...state.membersByTreeId, [treeId]: members },
        loadingTreeId: null,
      }));
    } catch (err) {
      // STEP 4: Set error and clear loading (Req 4.7)
      set({ loadingTreeId: null, memberError: classifyError(err) });
    }
  },

  // ---------------------------------------------------------------------------
  // addMember — optimistic insert + Firestore create
  // Requirements: 4.1, 4.2, 4.3
  // ---------------------------------------------------------------------------
  addMember: async (
    treeId: string,
    data: Omit<Member, 'id' | 'createdAt'>,
  ): Promise<void> => {
    // STEP 1: Generate temp id for optimistic update (Req 4.1)
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticMember: Member = {
      ...data,
      id: tempId,
      createdAt: now,
    };

    // STEP 2: Optimistic insert — immediate UI feedback (Req 4.1)
    set((state) => {
      const existing = state.membersByTreeId[treeId] ?? [];
      return {
        membersByTreeId: {
          ...state.membersByTreeId,
          [treeId]: [...existing, optimisticMember],
        },
        memberError: null,
      };
    });

    try {
      // STEP 3: Build CreateMemberInput from the data (Req 4.7)
      const input: CreateMemberInput = {
        familyTreeId: data.familyTreeId,
        fullName: data.fullName,
        gender: data.gender,
        role: data.role,
        birthDate: data.birthDate ?? null,
        status: data.status ?? 'living',
        deathDate: data.deathDate ?? null,
        photoUrl: data.photoUrl ?? null,
        bio: data.bio ?? null,
        fatherId: data.fatherId ?? null,
        motherId: data.motherId ?? null,
        spouseIds: data.spouseIds ?? [],
        childrenIds: data.childrenIds ?? [],
      };

      // STEP 4: Persist to Firestore via repository
      const realMember = await repoCreateMember(treeId, input);

      // STEP 5: Replace temp entry with real Firestore document (Req 4.2)
      set((state) => {
        const members = state.membersByTreeId[treeId] ?? [];
        return {
          membersByTreeId: {
            ...state.membersByTreeId,
            [treeId]: members.map((m) => (m.id === tempId ? realMember : m)),
          },
        };
      });

      // Analytics: member successfully added (funnel + photo-attach signal)
      logEvent(AnalyticsEvents.MEMBER_ADDED, { hasPhoto: !!data.photoUrl });
    } catch (err) {
      // STEP 6: Rollback — remove optimistic entry, set error (Req 4.3)
      recordError(err, { op: 'addMember', treeId });
      set((state) => {
        const members = state.membersByTreeId[treeId] ?? [];
        return {
          membersByTreeId: {
            ...state.membersByTreeId,
            [treeId]: members.filter((m) => m.id !== tempId),
          },
          memberError: classifyError(err),
        };
      });
    }
  },

  // ---------------------------------------------------------------------------
  // updateMember — optimistic patch + Firestore update
  // Requirements: 4.8
  // ---------------------------------------------------------------------------
  updateMember: async (
    treeId: string,
    memberId: string,
    patch: Partial<Member>,
  ): Promise<void> => {
    // STEP 1: Capture pre-call state for rollback on failure (Req 4.8)
    let previousMember: Member | undefined;

    // STEP 2: Optimistic patch — apply immediately before Firestore write (Req 4.8)
    set((state) => {
      const members = state.membersByTreeId[treeId] ?? [];
      const entry = members.find((m) => m.id === memberId);
      previousMember = entry;
      if (!entry) return state;
      return {
        membersByTreeId: {
          ...state.membersByTreeId,
          [treeId]: members.map((m) =>
            m.id === memberId ? { ...m, ...patch } : m
          ),
        },
        memberError: null,
      };
    });

    try {
      // STEP 3: Persist to Firestore via repository (Req 4.8)
      await repoUpdateMember(treeId, memberId, patch);
    } catch (err) {
      // STEP 4: Revert to pre-call state on failure (Req 4.8, 5.8)
      set((state) => {
        const members = state.membersByTreeId[treeId] ?? [];
        return {
          membersByTreeId: {
            ...state.membersByTreeId,
            [treeId]: previousMember
              ? members.map((m) => (m.id === memberId ? previousMember! : m))
              : members,
          },
          memberError: classifyError(err),
        };
      });
    }
  },

  // ---------------------------------------------------------------------------
  // deleteMember — optimistic removal + Firestore delete
  // Requirements: 4.5
  // ---------------------------------------------------------------------------
  deleteMember: async (treeId: string, memberId: string): Promise<void> => {
    // STEP 1: Optimistic removal — remove from store immediately
    set((state) => {
      const members = state.membersByTreeId[treeId] ?? [];
      return {
        membersByTreeId: {
          ...state.membersByTreeId,
          [treeId]: members.filter((m) => m.id !== memberId),
        },
        memberError: null,
      };
    });

    try {
      // STEP 2: Delete from Firestore via repository (handles relationship cleanup)
      await repoDeleteMember(treeId, memberId);
      logEvent(AnalyticsEvents.MEMBER_DELETED);
    } catch (err) {
      // STEP 3: Rollback — reload from Firestore to restore consistent state
      recordError(err, { op: 'deleteMember', treeId, memberId });
      try {
        await get().loadMembers(treeId);
      } catch {
        // If reload also fails, the loadMembers error handler already set memberError
      }
      set({ memberError: classifyError(err) });
    }
  },

  // ---------------------------------------------------------------------------
  // clearMembers — remove all members for a tree from local state
  // Requirements: 3.7, 6.6
  // ---------------------------------------------------------------------------
  clearMembers: (treeId: string): void => {
    set((state) => {
      const updated = { ...state.membersByTreeId };
      delete updated[treeId];
      return { membersByTreeId: updated };
    });
  },
}));

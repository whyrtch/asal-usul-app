/**
 * useSharingStore — Zustand store for collaboration state (Phase 2).
 *
 * Holds collaborators per tree, sent invitations per tree, and the current
 * user's invitation inbox. All Firestore work goes through the access/invitation
 * repositories; errors are localized (`classifyError`) and reported
 * (`recordError`). Optimistic updates with rollback where it is safe.
 *
 * Accept is rules-only: the invitee writes their own access doc (validated by
 * security rules) then marks the invitation accepted.
 *
 * @module src/store/useSharingStore
 */

import { create } from 'zustand';

import { classifyError } from '@/constants/errorMessages';
import {
    fetchAccessList,
    grantAccess,
    revokeAccess as repoRevokeAccess,
    setAccessRole as repoSetAccessRole,
} from '@/repositories/accessRepository';
import {
    createInvitation,
    fetchInvitationsForTree,
    fetchMyPendingInvitations,
    declineInvitation as repoDeclineInvitation,
    updateInvitationStatus,
} from '@/repositories/invitationRepository';
import { AnalyticsEvents, logEvent, recordError } from '@/services/analytics';
import type { Access, AccessRole, Invitation } from '@/types/sharing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SharingState {
  /** Collaborators (access docs) keyed by treeId. */
  collaboratorsByTree: Record<string, Access[]>;
  /** Invitations sent for a tree, keyed by treeId (owner view). */
  invitationsByTree: Record<string, Invitation[]>;
  /** The current user's pending invitations (invitee inbox). */
  myInvitations: Invitation[];
  /** True while a sharing operation is in flight. */
  loading: boolean;
  /** Non-null when the last operation failed. */
  error: string | null;
}

interface SharingActions {
  loadCollaborators(treeId: string): Promise<void>;
  loadInvitations(treeId: string): Promise<void>;
  loadMyInvitations(email: string): Promise<void>;
  invite(args: {
    treeId: string;
    treeName: string;
    inviterUid: string;
    inviterEmail: string;
    inviteeEmail: string;
    role: AccessRole;
  }): Promise<boolean>;
  changeRole(treeId: string, uid: string, role: AccessRole): Promise<void>;
  revoke(treeId: string, uid: string): Promise<void>;
  accept(invitation: Invitation, uid: string): Promise<boolean>;
  decline(inviteId: string): Promise<void>;
  clearError(): void;
}

export type SharingStore = SharingState & SharingActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSharingStore = create<SharingStore>()((set, get) => ({
  collaboratorsByTree: {},
  invitationsByTree: {},
  myInvitations: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadCollaborators: async (treeId) => {
    set({ loading: true, error: null });
    try {
      const list = await fetchAccessList(treeId);
      set((s) => ({
        collaboratorsByTree: { ...s.collaboratorsByTree, [treeId]: list },
        loading: false,
      }));
    } catch (err) {
      recordError(err, { op: 'loadCollaborators', treeId });
      set({ loading: false, error: classifyError(err) });
    }
  },

  loadInvitations: async (treeId) => {
    set({ loading: true, error: null });
    try {
      const list = await fetchInvitationsForTree(treeId);
      set((s) => ({
        invitationsByTree: { ...s.invitationsByTree, [treeId]: list },
        loading: false,
      }));
    } catch (err) {
      recordError(err, { op: 'loadInvitations', treeId });
      set({ loading: false, error: classifyError(err) });
    }
  },

  loadMyInvitations: async (email) => {
    set({ loading: true, error: null });
    try {
      const list = await fetchMyPendingInvitations(email);
      set({ myInvitations: list, loading: false });
    } catch (err) {
      recordError(err, { op: 'loadMyInvitations' });
      set({ loading: false, error: classifyError(err) });
    }
  },

  invite: async ({ treeId, treeName, inviterUid, inviterEmail, inviteeEmail, role }) => {
    set({ loading: true, error: null });
    try {
      const inv = await createInvitation(
        { treeId, treeName, inviterUid, inviteeEmail, role },
        inviterEmail,
      );
      // Refresh the tree's invitation list (merge/replace by id).
      set((s) => {
        const existing = s.invitationsByTree[treeId] ?? [];
        const next = [inv, ...existing.filter((i) => i.id !== inv.id)];
        return {
          invitationsByTree: { ...s.invitationsByTree, [treeId]: next },
          loading: false,
        };
      });
      logEvent(AnalyticsEvents.INVITE_SENT, { role });
      return true;
    } catch (err) {
      recordError(err, { op: 'invite', treeId });
      // createInvitation throws descriptive validation errors (email/self) —
      // surface those directly; otherwise localize.
      const message =
        err instanceof Error && err.message ? err.message : classifyError(err);
      set({ loading: false, error: message });
      return false;
    }
  },

  changeRole: async (treeId, uid, role) => {
    // Optimistic patch.
    let previous: Access[] | undefined;
    set((s) => {
      previous = s.collaboratorsByTree[treeId];
      const list = (previous ?? []).map((a) => (a.uid === uid ? { ...a, role } : a));
      return { collaboratorsByTree: { ...s.collaboratorsByTree, [treeId]: list }, error: null };
    });
    try {
      await repoSetAccessRole(treeId, uid, role);
      logEvent(AnalyticsEvents.ROLE_CHANGED, { role });
    } catch (err) {
      recordError(err, { op: 'changeRole', treeId, uid });
      set((s) => ({
        collaboratorsByTree: previous
          ? { ...s.collaboratorsByTree, [treeId]: previous }
          : s.collaboratorsByTree,
        error: classifyError(err),
      }));
    }
  },

  revoke: async (treeId, uid) => {
    // Optimistic removal.
    let previous: Access[] | undefined;
    set((s) => {
      previous = s.collaboratorsByTree[treeId];
      const list = (previous ?? []).filter((a) => a.uid !== uid);
      return { collaboratorsByTree: { ...s.collaboratorsByTree, [treeId]: list }, error: null };
    });
    try {
      await repoRevokeAccess(treeId, uid);
      logEvent(AnalyticsEvents.ACCESS_REVOKED);
    } catch (err) {
      recordError(err, { op: 'revoke', treeId, uid });
      set((s) => ({
        collaboratorsByTree: previous
          ? { ...s.collaboratorsByTree, [treeId]: previous }
          : s.collaboratorsByTree,
        error: classifyError(err),
      }));
    }
  },

  accept: async (invitation, uid) => {
    set({ loading: true, error: null });
    try {
      // Rules-only accept: write own access doc, then mark invitation accepted.
      await grantAccess({
        uid,
        treeId: invitation.treeId,
        role: invitation.role,
        invitedBy: invitation.inviterUid,
        invitedVia: invitation.id,
      });
      await updateInvitationStatus(invitation.id, 'accepted');

      set((s) => ({
        myInvitations: s.myInvitations.filter((i) => i.id !== invitation.id),
        loading: false,
      }));
      logEvent(AnalyticsEvents.INVITE_ACCEPTED, { role: invitation.role });
      return true;
    } catch (err) {
      recordError(err, { op: 'accept', treeId: invitation.treeId });
      set({ loading: false, error: classifyError(err) });
      return false;
    }
  },

  decline: async (inviteId) => {
    // Optimistic removal from inbox.
    let previous: Invitation[] = [];
    set((s) => {
      previous = s.myInvitations;
      return { myInvitations: s.myInvitations.filter((i) => i.id !== inviteId), error: null };
    });
    try {
      await repoDeclineInvitation(inviteId);
      logEvent(AnalyticsEvents.INVITE_DECLINED);
    } catch (err) {
      recordError(err, { op: 'decline', inviteId });
      set({ myInvitations: previous, error: classifyError(err) });
    }
  },
}));

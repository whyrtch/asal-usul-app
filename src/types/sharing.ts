/**
 * Type definitions for Family Tree Sharing (Phase 2).
 *
 * Firestore paths:
 *   AccessDocument     → family_trees/{treeId}/access/{uid}
 *   InvitationDocument → invitations/{inviteId}
 *
 * Firestore-native (`Timestamp`) document shapes live alongside app-level
 * variants (ISO strings) — mirroring the existing familyTree/firestore split.
 *
 * @module src/types/sharing
 */

import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/** All roles a user can have on a tree. `owner` is implicit via `ownerId`. */
export type Role = 'owner' | 'editor' | 'viewer';

/** Roles that can be granted to a collaborator (never `owner`). */
export type AccessRole = Exclude<Role, 'owner'>;

/** Lifecycle status of an invitation; acts as the state flag enforced by rules. */
export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'expired';

// ---------------------------------------------------------------------------
// AccessDocument — family_trees/{treeId}/access/{uid}
// ---------------------------------------------------------------------------

/** Firestore shape stored at `family_trees/{treeId}/access/{uid}`. */
export interface AccessDocument {
  /** Collaborator's Firebase Auth UID — equals the document id. */
  uid: string;
  /** References the parent `family_trees/{treeId}` document id. */
  treeId: string;
  /** Granted role — never `'owner'`. */
  role: AccessRole;
  /** UID of the owner who invited this collaborator. */
  invitedBy: string;
  /** Invitation document id this grant was created from (for rules validation). */
  invitedVia: string;
  /** Server timestamp set once at creation. */
  createdAt: Timestamp;
}

/** App-level access record (ISO string timestamps). */
export interface Access {
  uid: string;
  treeId: string;
  role: AccessRole;
  invitedBy: string;
  invitedVia: string;
  createdAt: string;
}

/** Input for granting access (timestamps applied by the repository). */
export interface CreateAccessInput {
  uid: string;
  treeId: string;
  role: AccessRole;
  invitedBy: string;
  invitedVia: string;
}

// ---------------------------------------------------------------------------
// InvitationDocument — invitations/{inviteId}
// ---------------------------------------------------------------------------

/** Firestore shape stored at `invitations/{inviteId}`. */
export interface InvitationDocument {
  /** Firestore-generated document id. */
  id: string;
  /** References the `family_trees/{treeId}` being shared. */
  treeId: string;
  /** Denormalized tree name for display in the invite screen. */
  treeName: string;
  /** UID of the owner who created the invitation. */
  inviterUid: string;
  /** Invitee email, normalized to lowercase + trimmed. */
  inviteeEmail: string;
  /** Role to grant on accept — never `'owner'`. */
  role: AccessRole;
  /** Lifecycle status flag. */
  status: InvitationStatus;
  /** Server timestamp set once at creation. */
  createdAt: Timestamp;
  /** Server timestamp; 14 days after creation. */
  expiresAt: Timestamp;
}

/** App-level invitation record (ISO string timestamps). */
export interface Invitation {
  id: string;
  treeId: string;
  treeName: string;
  inviterUid: string;
  inviteeEmail: string;
  role: AccessRole;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

/** Input for creating an invitation (timestamps + status applied by repository). */
export interface CreateInvitationInput {
  treeId: string;
  treeName: string;
  inviterUid: string;
  /** Raw invitee email — repository normalizes to lowercase + trimmed. */
  inviteeEmail: string;
  role: AccessRole;
}

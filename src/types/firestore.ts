/**
 * Firestore document type definitions for the AsalUsul app.
 *
 * Each interface maps to a specific Firestore collection path:
 *   UserDocument        → users/{uid}
 *   FamilyTreeDocument  → family_trees/{treeId}
 *   MemberDocument      → family_trees/{treeId}/members/{memberId}
 *
 * These types use Firestore-native `Timestamp` and `FieldValue` rather than
 * ISO strings, keeping the repository layer responsible for conversion before
 * handing data to Zustand stores.
 */

import { FieldValue, Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/**
 * Firestore document shape stored at `users/{uid}`.
 * Created on first Google Sign-In; `lastLoginAt` updated on subsequent logins.
 */
export interface UserDocument {
  /** Firebase Auth UID — matches the Firestore document id */
  id: string;
  /** Display name from Google account; empty string if unavailable */
  name: string;
  /** Primary email address from Google account */
  email: string;
  /** Profile photo URL from Google account; empty string if unavailable */
  photoUrl: string;
  /** Authentication provider — always 'google' for this app */
  provider: 'google';
  /**
   * Account tier for monetization. Defaults to 'free'. Read-only on the client;
   * upgrades are server/billing-driven (Phase 4).
   */
  plan: 'free' | 'premium';
  /** Server timestamp set once at document creation */
  createdAt: Timestamp;
  /** Server timestamp updated on every write to this document */
  updatedAt: Timestamp;
  /** Server timestamp updated on every successful sign-in */
  lastLoginAt: Timestamp;
}

/**
 * Input for creating a new document at `users/{uid}`.
 * Timestamps are applied server-side by UserRepository.
 */
export interface CreateUserInput {
  /** Display name from Google account; empty string if unavailable */
  name: string;
  /** Primary email address from Google account */
  email: string;
  /** Profile photo URL from Google account; empty string if unavailable */
  photoUrl: string;
  /** Authentication provider — always 'google' for this app */
  provider: 'google';
}

/**
 * Partial update input for `users/{uid}`.
 * Only editable profile fields are included; timestamps are managed by the repository.
 */
export interface UpdateUserInput {
  /** Updated display name */
  name: string;
  /** Updated profile photo URL */
  photoUrl: string;
}

// ---------------------------------------------------------------------------
// FamilyTree
// ---------------------------------------------------------------------------

/**
 * Firestore document shape stored at `family_trees/{treeId}`.
 * Owned by a single authenticated user; `shareWith` is reserved for future sharing.
 */
export interface FamilyTreeDocument {
  /** Firestore-generated document id */
  id: string;
  /** Trimmed, non-empty display name of the family tree */
  name: string;
  /** Optional description; null if not provided */
  description: string | null;
  /** Firebase Auth UID of the user who owns this tree */
  ownerId: string;
  /** Denormalized count of member documents in the subcollection */
  totalMembers: number;
  /**
   * Array of Firebase Auth UIDs the owner has shared this tree with.
   * Defaults to `[]` on creation. Reserved for future read-only sharing;
   * no sharing UI is implemented in Step 6.
   */
  shareWith: string[];
  /** Server timestamp set once at document creation */
  createdAt: Timestamp;
  /** Server timestamp updated on every write to this document */
  updatedAt: Timestamp;
}

/**
 * Input for creating a new document at `family_trees/{treeId}`.
 * `totalMembers`, `createdAt`, and `updatedAt` are set by FamilyTreeRepository.
 */
export interface CreateFamilyTreeInput {
  /** Trimmed, non-empty display name; max 100 characters */
  name: string;
  /** Optional description; null if not provided */
  description: string | null;
  /** Firebase Auth UID of the authenticated user creating the tree */
  ownerId: string;
  /**
   * Array of Firebase Auth UIDs to share the tree with.
   * Defaults to `[]` when omitted.
   */
  shareWith?: string[];
}

/**
 * Partial update input for `family_trees/{treeId}`.
 * `updatedAt` is applied server-side by FamilyTreeRepository.
 */
export interface UpdateFamilyTreeInput {
  /** Updated display name; must be non-empty after trim, max 100 characters */
  name: string;
  /** Updated description; null to clear */
  description: string | null;
  /**
   * Updated share list — full replacement of the `shareWith` array.
   * Pass `[]` to remove all shares.
   */
  shareWith: string[];
}

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------

/**
 * Firestore document shape stored at `family_trees/{treeId}/members/{memberId}`.
 * Relationship fields (`spouseIds`, `childrenIds`, `fatherId`, `motherId`) are
 * kept symmetric via batch writes in MemberRepository.
 */
export interface MemberDocument {
  /** Firestore-generated document id */
  id: string;
  /** References the parent `family_trees/{treeId}` document id */
  familyTreeId: string;
  /** Non-empty full name of the member */
  fullName: string;
  /** Strict gender enum */
  gender: 'male' | 'female';
  /** Non-empty role label, e.g. "Ayah", "Ibu", "Anak", "Cucu", "Kakek" */
  role: string;
  /** Date of birth in "YYYY-MM-DD" format, or null if unknown */
  birthDate: string | null;
  /** Living/deceased status of the member. Defaults to 'living' for legacy docs */
  status: 'living' | 'deceased';
  /** Date of death in "YYYY-MM-DD" format, or null if living/unknown */
  deathDate: string | null;
  /** Optional photo download URL; null if not provided */
  photoUrl: string | null;
  /** Optional biography text; null if not provided */
  bio: string | null;
  /** References the father's `memberId` within the same tree, or null */
  fatherId: string | null;
  /** References the mother's `memberId` within the same tree, or null */
  motherId: string | null;
  /** Array of spouse `memberId` values within the same tree */
  spouseIds: string[];
  /** Array of children `memberId` values within the same tree */
  childrenIds: string[];
  /** Server timestamp set once at document creation */
  createdAt: Timestamp;
  /** Server timestamp updated on every write to this document */
  updatedAt: Timestamp;
}

/**
 * Input for creating a new document at `family_trees/{treeId}/members/{memberId}`.
 * `createdAt` and `updatedAt` are set by MemberRepository.
 */
export interface CreateMemberInput {
  /** References the parent `family_trees/{treeId}` document id */
  familyTreeId: string;
  /** Non-empty full name of the member */
  fullName: string;
  /** Strict gender enum */
  gender: 'male' | 'female';
  /** Non-empty role label */
  role: string;
  /** Date of birth in "YYYY-MM-DD" format, or null if unknown */
  birthDate: string | null;
  /** Living/deceased status; defaults to 'living' when omitted */
  status?: 'living' | 'deceased';
  /** Date of death in "YYYY-MM-DD" format, or null if living/unknown */
  deathDate?: string | null;
  /** Optional photo download URL; null if not provided */
  photoUrl?: string | null;
  /** Optional biography text; null if not provided */
  bio?: string | null;
  /** References the father's `memberId` within the same tree, or null */
  fatherId: string | null;
  /** References the mother's `memberId` within the same tree, or null */
  motherId: string | null;
  /** Array of spouse `memberId` values; must not contain the new member's own id */
  spouseIds: string[];
  /** Array of children `memberId` values; must not contain the new member's own id */
  childrenIds: string[];
}

/**
 * Partial update input for `family_trees/{treeId}/members/{memberId}`.
 * `updatedAt` is applied server-side by MemberRepository.
 */
export interface UpdateMemberInput {
  /** Updated full name */
  fullName: string;
  /** Updated gender */
  gender: 'male' | 'female';
  /** Updated role label */
  role: string;
  /** Updated date of birth, or null to clear */
  birthDate: string | null;
  /** Updated living/deceased status */
  status: 'living' | 'deceased';
  /** Updated date of death, or null to clear */
  deathDate: string | null;
  /** Updated photo download URL, or null to clear */
  photoUrl: string | null;
  /** Updated biography text, or null to clear */
  bio: string | null;
  /** Updated father reference, or null to clear */
  fatherId: string | null;
  /** Updated mother reference, or null to clear */
  motherId: string | null;
  /** Updated spouse id array */
  spouseIds: string[];
  /** Updated children id array */
  childrenIds: string[];
}

// ---------------------------------------------------------------------------
// Relationship batch update
// ---------------------------------------------------------------------------

/**
 * Descriptor for a single member's relationship patch within a batch write.
 * Used by `MemberRepository.batchUpdateRelationships` to maintain symmetry
 * across multiple members in a single Firestore batch commit.
 *
 * Applies to documents at `family_trees/{treeId}/members/{memberId}`.
 */
export interface RelationshipUpdate {
  /** The `memberId` of the document to patch */
  memberId: string;
  /** Subset of relationship fields to update on the member document */
  patch: Partial<Pick<MemberDocument, 'spouseIds' | 'childrenIds' | 'fatherId' | 'motherId'>>;
}

// ---------------------------------------------------------------------------
// Re-export Firestore primitives used across the service/repository layers
// ---------------------------------------------------------------------------

export type { FieldValue, Timestamp };


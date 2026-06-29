/**
 * FamilyTree and Member TypeScript interfaces for the AsalUsul app.
 *
 * Data shape is Firebase-ready:
 *   FamilyTree → Firestore: users/{uid}/familyTrees/{id}
 *   Member     → Firestore: users/{uid}/familyTrees/{familyTreeId}/members/{id}
 */

import type { Role } from './sharing';

// ---------------------------------------------------------------------------
// FamilyTree
// ---------------------------------------------------------------------------

export interface FamilyTree {
  /** Unique identifier — timestamp-based (Date.now().toString()) */
  id: string;
  /** Trimmed, non-empty display name provided by the user */
  name: string;
  /** Optional description of the family tree; null by default */
  description: string | null;
  /** Optional cover image URL; null by default */
  coverImage: string | null;
  /** Non-empty string referencing the user who owns this tree */
  ownerId: string;
  /** ISO 8601 date string representing creation time */
  createdAt: string;
  /** ISO 8601 date string; equals createdAt at creation, updated on mutations */
  updatedAt: string;
  /** Non-negative integer; incremented/decremented as members are added/removed */
  totalMembers: number;
  /**
   * Array of Firebase Auth UIDs that the owner has shared this tree with.
   * Empty array by default. Used for future read-only sharing/collaboration.
   *
   * @deprecated Replaced by the `family_trees/{treeId}/access/{uid}` subcollection
   * in Phase 2 sharing. Kept for backward-compatible reads only.
   */
  shareWith: string[];
  /**
   * The current user's effective role for this tree, derived at load time.
   * Not persisted. `'owner'` for owned trees; `'editor' | 'viewer'` for shared
   * trees; `undefined`/omitted when role is not relevant.
   */
  role?: Role;
}

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------

export interface Member {
  /** Unique member identifier */
  id: string;
  /** References the parent FamilyTree.id */
  familyTreeId: string;
  /** Non-empty full name of the member */
  fullName: string;
  /** Strict gender enum */
  gender: 'male' | 'female';
  /** Non-empty role in the family, e.g. "Ayah", "Ibu", "Anak", "Cucu", "Kakek" */
  role: string;
  /** Date of birth in "YYYY-MM-DD" format, or null if unknown */
  birthDate: string | null;
  /** Living/deceased status of the member. Defaults to 'living'. */
  status: 'living' | 'deceased';
  /** Date of death in "YYYY-MM-DD" format, or null if living/unknown */
  deathDate: string | null;
  /** Optional photo URL; null if not provided */
  photoUrl: string | null;
  /** Optional biography text; null if not provided */
  bio: string | null;
  /** References the father's Member.id within the same FamilyTree, or null */
  fatherId: string | null;
  /** References the mother's Member.id within the same FamilyTree, or null */
  motherId: string | null;
  /** Array of spouse Member.id values within the same FamilyTree */
  spouseIds: string[];
  /** Array of children Member.id values within the same FamilyTree */
  childrenIds: string[];
  /** ISO 8601 date string representing when this member record was created */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Store interfaces
// ---------------------------------------------------------------------------

interface FamilyTreeState {
  familyTrees: FamilyTree[];
  /** True while a Firestore fetch is in progress */
  loading: boolean;
  /** Non-null when the last Firestore operation failed; null otherwise */
  error: string | null;
}

interface FamilyTreeActions {
  /** Step 6 — create a family tree in Firestore with optimistic insert */
  createFamilyTree: (name: string, uid: string) => Promise<void>;
  removeFamilyTree: (id: string) => void;
  /** Step 6 — load family trees from Firestore for the given uid */
  loadFamilyTrees: (uid: string) => Promise<void>;
  /** Step 6 — update a family tree's name and/or description in Firestore with optimistic patch */
  updateFamilyTree: (treeId: string, patch: Partial<Pick<FamilyTree, 'name' | 'description'>>) => Promise<void>;
  /** Step 6 — delete a family tree and all its members from Firestore with optimistic removal */
  deleteFamilyTree: (treeId: string, uid: string) => Promise<void>;
}

/** Combined Zustand store type — state + actions */
export type FamilyTreeStore = FamilyTreeState & FamilyTreeActions;

// ---------------------------------------------------------------------------
// Form value / error interfaces — Step 5
// ---------------------------------------------------------------------------

export interface EditFamilyFormValues {
  /** Required; must be non-empty after trim */
  name: string;
  /** Optional; empty string is treated as null in the store */
  description: string;
}

export interface EditFamilyFormErrors {
  name?: string;
}

export interface EditMemberFormValues {
  /** Required; must be non-empty after trim */
  fullName: string;
  /** Required */
  gender: 'male' | 'female';
  /** Required; non-empty role label */
  role: string;
  /** Optional; "YYYY-MM-DD" format or empty string */
  birthDate: string;
  /** Living/deceased status */
  status: 'living' | 'deceased';
  /** Optional; "YYYY-MM-DD" format or empty string. Only relevant when status is 'deceased' */
  deathDate: string;
  /** Optional biography text */
  bio: string;
}

export interface EditMemberFormErrors {
  fullName?: string;
  gender?: string;
  role?: string;
  birthDate?: string;
  deathDate?: string;
}

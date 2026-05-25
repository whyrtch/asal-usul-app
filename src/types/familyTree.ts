/**
 * FamilyTree and Member TypeScript interfaces for the AsalUsul app.
 *
 * Data shape is Firebase-ready:
 *   FamilyTree → Firestore: users/{uid}/familyTrees/{id}
 *   Member     → Firestore: users/{uid}/familyTrees/{familyTreeId}/members/{id}
 */

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
  members: Member[];
}

interface FamilyTreeActions {
  addFamilyTree: (name: string, ownerId: string) => void;
  removeFamilyTree: (id: string) => void;
  addMember: (member: Omit<Member, 'id' | 'createdAt'>) => void;
  removeMember: (memberId: string) => void;
  /** Step 5 — update a family tree's name and/or description */
  updateFamilyTree: (id: string, patch: Partial<Pick<FamilyTree, 'name' | 'description'>>) => void;
  /** Step 5 — delete a family tree and all its members */
  deleteFamilyTree: (id: string) => void;
  /** Step 5 — update editable fields of a member (never mutates id, familyTreeId, createdAt) */
  updateMember: (memberId: string, patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>) => void;
  /** Step 5 — delete a member and clean up all relationship references */
  deleteMember: (memberId: string) => void;
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
  /** Optional biography text */
  bio: string;
}

export interface EditMemberFormErrors {
  fullName?: string;
  gender?: string;
  role?: string;
  birthDate?: string;
}

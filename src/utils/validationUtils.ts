/**
 * Validation and relationship utility functions for family and member management.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import type {
    EditFamilyFormErrors,
    EditFamilyFormValues,
    EditMemberFormErrors,
    EditMemberFormValues,
    Member,
} from '../types/familyTree';

// ---------------------------------------------------------------------------
// Family form validation
// ---------------------------------------------------------------------------

/**
 * Validates the edit-family form values.
 *
 * Returns `{ name: 'Nama keluarga wajib diisi' }` when `name.trim()` is empty,
 * otherwise returns an empty object (no errors).
 *
 * Requirements: 7.1, 7.2
 */
export function validateFamilyForm(values: EditFamilyFormValues): EditFamilyFormErrors {
  const errors: EditFamilyFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Nama keluarga wajib diisi';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Member form validation
// ---------------------------------------------------------------------------

/** Regex for the optional YYYY-MM-DD birth date format */
const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates the edit-member form values.
 *
 * Rules:
 * - `fullName` — required; must be non-empty after trim
 * - `gender`   — required; must be `'male'` or `'female'`
 * - `role`     — required; must be non-empty after trim
 * - `birthDate`— optional; when provided (non-empty string) must match `YYYY-MM-DD`
 *
 * Requirements: 7.3, 7.4
 */
export function validateMemberForm(values: EditMemberFormValues): EditMemberFormErrors {
  const errors: EditMemberFormErrors = {};

  if (values.fullName.trim().length === 0) {
    errors.fullName = 'Nama lengkap wajib diisi';
  }

  if (!values.gender || (values.gender !== 'male' && values.gender !== 'female')) {
    errors.gender = 'Jenis kelamin wajib dipilih';
  }

  if (values.role.trim().length === 0) {
    errors.role = 'Peran wajib diisi';
  }

  if (values.birthDate && values.birthDate.trim().length > 0) {
    if (!BIRTH_DATE_REGEX.test(values.birthDate.trim())) {
      errors.birthDate = 'Format tanggal lahir harus YYYY-MM-DD';
    }
  }

  // deathDate is optional; only relevant when status is 'deceased'.
  // When provided it must match YYYY-MM-DD.
  if (values.deathDate && values.deathDate.trim().length > 0) {
    if (!BIRTH_DATE_REGEX.test(values.deathDate.trim())) {
      errors.deathDate = 'Format tanggal meninggal harus YYYY-MM-DD';
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Relationship resolver
// ---------------------------------------------------------------------------

export interface ResolvedRelationships {
  father: Member | null;
  mother: Member | null;
  spouses: Member[];
  children: Member[];
}

/**
 * Resolves a member's relationship IDs into full `Member` objects.
 *
 * Builds a `Map<id, Member>` from `allMembers` for O(1) lookups, then resolves
 * each relationship field. Stale IDs (referencing members that no longer exist)
 * are silently filtered out — the function never throws.
 *
 * Requirements: 7.5, 7.6
 */
export function resolveRelationships(
  member: Member,
  allMembers: Member[],
): ResolvedRelationships {
  const memberMap = new Map<string, Member>(allMembers.map((m) => [m.id, m]));

  const father: Member | null =
    member.fatherId != null ? (memberMap.get(member.fatherId) ?? null) : null;

  const mother: Member | null =
    member.motherId != null ? (memberMap.get(member.motherId) ?? null) : null;

  const spouses: Member[] = (member.spouseIds ?? [])
    .map((id) => memberMap.get(id))
    .filter((m): m is Member => m !== undefined);

  const children: Member[] = (member.childrenIds ?? [])
    .map((id) => memberMap.get(id))
    .filter((m): m is Member => m !== undefined);

  return { father, mother, spouses, children };
}

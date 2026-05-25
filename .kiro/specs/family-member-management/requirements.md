# Requirements Document

## Introduction

This document defines the requirements for Step 5 of the AsalUsul app — full CRUD management for family trees and individual members. The feature extends the existing app with the ability to edit and delete family trees, view detailed member profiles, and edit and delete individual members, all backed by a local Zustand store with no Firebase dependency.

## Glossary

| Term | Definition |
|---|---|
| Family Tree | A named collection of members representing a family lineage |
| Member | An individual person within a family tree |
| FamilySettingsSheet | A bottom sheet UI component presenting edit/delete actions for a family tree |
| MemberDetailScreen | A dedicated screen displaying a member's full profile and relationships |
| Relationship | A directional link between members: father, mother, spouse, or child |
| Patch | A partial update object containing only the fields to be changed |
| Stale ID | A relationship reference pointing to a member that no longer exists in the store |

---

## Requirements

### Requirement 1: Family Settings Entry Point

**User Story:** As a user, I want to access family management options from the Family Detail screen, so that I can edit or delete a family tree without leaving the current context.

#### Acceptance Criteria

1. WHEN the user is on the Family Detail screen, THEN a settings icon (⚙️) SHALL be visible in the top-right area of the header.
2. WHEN the user taps the settings icon, THEN the FamilySettingsSheet SHALL slide up from the bottom of the screen with an animated entrance.
3. WHEN the FamilySettingsSheet is open, THEN it SHALL display two action rows: "Edit Keluarga" and "Hapus Keluarga".
4. WHEN the user taps the overlay behind the FamilySettingsSheet, THEN the sheet SHALL close with an animated exit.
5. WHEN the user taps the "Batal" button in the FamilySettingsSheet, THEN the sheet SHALL close.
6. WHEN the FamilySettingsSheet is displayed, THEN the "Hapus Keluarga" row SHALL be visually distinguished with a danger red color (#C0392B).

---

### Requirement 2: Edit Family Tree

**User Story:** As a user, I want to edit the name and description of a family tree, so that I can keep the family information accurate and up to date.

#### Acceptance Criteria

1. WHEN the user taps "Edit Keluarga" in the FamilySettingsSheet, THEN the EditFamilyModal SHALL open pre-filled with the current family name and description.
2. WHEN the EditFamilyModal is open, THEN the name field SHALL be required and the description field SHALL be optional.
3. IF the user clears the name field and taps "Simpan", THEN the system SHALL display an inline validation error ("Nama keluarga wajib diisi") and SHALL NOT update the store.
4. WHEN the user enters a valid name and taps "Simpan", THEN the system SHALL call `updateFamilyTree(id, { name, description })` and the Family Detail screen header SHALL reflect the updated name immediately.
5. WHEN `updateFamilyTree` is called with an id that does not exist in the store, THEN the store state SHALL remain unchanged (idempotent behavior).
6. WHEN `updateFamilyTree` successfully updates a tree, THEN the `updatedAt` timestamp of that tree SHALL be refreshed to the current time.
7. WHEN `updateFamilyTree` is called, THEN all other family trees in the store SHALL remain unchanged.

---

### Requirement 3: Delete Family Tree

**User Story:** As a user, I want to delete a family tree and all its members, so that I can remove outdated or incorrect family data from the app.

#### Acceptance Criteria

1. WHEN the user taps "Hapus Keluarga" in the FamilySettingsSheet, THEN the DeleteFamilyDialog SHALL appear with a confirmation message including the family name.
2. WHEN the DeleteFamilyDialog is displayed, THEN it SHALL show the sub-copy "Semua anggota keluarga akan ikut terhapus."
3. WHEN the user taps "Hapus" in the DeleteFamilyDialog, THEN the system SHALL call `deleteFamilyTree(id)`, which SHALL remove the family tree AND all members whose `familyTreeId` matches the deleted tree's id.
4. WHEN the user taps "Batal" in the DeleteFamilyDialog, THEN the dialog SHALL close and no data SHALL be modified.
5. AFTER `deleteFamilyTree` completes, THEN the app SHALL navigate to the Home tab using `router.replace('/(tabs)')`.
6. WHEN `deleteFamilyTree` is called with an id that does not exist, THEN the operation SHALL be idempotent and the store state SHALL remain unchanged.
7. WHEN `deleteFamilyTree` is called, THEN all family trees and members NOT belonging to the deleted tree SHALL remain unchanged.

---

### Requirement 4: Member Detail Screen

**User Story:** As a user, I want to view a dedicated profile page for each family member, so that I can see their full details and relationships in one place.

#### Acceptance Criteria

1. WHEN the user taps a node in the FamilyTreeCanvas, THEN the app SHALL navigate to `app/member/[id].tsx` for the tapped member.
2. WHEN the MemberDetailScreen loads, THEN it SHALL display the MemberProfileCard with the member's avatar initials, full name, role badge, birth date, and gender icon.
3. WHEN the member has a bio, THEN the MemberDetailScreen SHALL display a collapsible bio section.
4. WHEN the member has no bio, THEN the bio section SHALL be hidden.
5. WHEN the MemberDetailScreen loads, THEN it SHALL display the RelationshipSection showing Ayah, Ibu, Pasangan, and Anak rows.
6. WHEN a relationship field (fatherId, motherId, spouseId, childId) references a member that no longer exists, THEN the corresponding row SHALL display "—" without crashing.
7. WHEN the user taps a relationship name in the RelationshipSection, THEN the app SHALL navigate to that member's detail page.
8. IF the member id in the route does not exist in the store, THEN the screen SHALL automatically navigate back using `router.back()`.
9. WHEN the MemberDetailScreen renders, THEN it SHALL use `FadeIn.duration(300)` for the screen entrance animation.
10. WHEN the birth date is null or unknown, THEN the MemberProfileCard SHALL display "Tidak diketahui".

---

### Requirement 5: Edit Member

**User Story:** As a user, I want to edit a family member's profile information, so that I can correct or update their details over time.

#### Acceptance Criteria

1. WHEN the user taps the edit icon (✏️) on the MemberDetailScreen, THEN the EditMemberModal SHALL open pre-filled with the member's current data.
2. WHEN the EditMemberModal is open, THEN it SHALL allow editing: fullName, gender, role, birthDate, and bio.
3. WHEN the EditMemberModal is open, THEN it SHALL NOT expose relationship fields (fatherId, motherId, spouseIds, childrenIds) for editing.
4. IF the user clears the fullName field and taps "Simpan", THEN the system SHALL display a validation error and SHALL NOT update the store.
5. WHEN the user taps "Simpan" with valid data, THEN the system SHALL call `updateMember(memberId, patch)` and the MemberDetailScreen SHALL reflect the updated data immediately.
6. WHEN `updateMember` is called, THEN the `id`, `familyTreeId`, and `createdAt` fields of the target member SHALL NOT be modified.
7. WHEN `updateMember` successfully updates a member, THEN the parent family tree's `updatedAt` timestamp SHALL be refreshed.
8. WHEN `updateMember` is called, THEN all other members in the store SHALL remain unchanged.
9. WHEN the EditMemberModal is open, THEN it SHALL handle keyboard appearance using `KeyboardAvoidingView` and `ScrollView`.

---

### Requirement 6: Delete Member

**User Story:** As a user, I want to delete a family member from the tree, so that I can remove incorrect or duplicate entries.

#### Acceptance Criteria

1. WHEN the user taps the delete icon (🗑️) on the MemberDetailScreen, THEN the DeleteMemberDialog SHALL appear with a confirmation message including the member's name.
2. WHEN the DeleteMemberDialog is displayed, THEN it SHALL show the sub-copy "Semua referensi hubungan akan ikut dihapus."
3. WHEN the user taps "Hapus" in the DeleteMemberDialog, THEN the system SHALL call `deleteMember(memberId)`.
4. WHEN `deleteMember` is called, THEN the deleted member SHALL be removed from the store.
5. WHEN `deleteMember` is called, THEN all other members' `fatherId` fields that reference the deleted member SHALL be set to null.
6. WHEN `deleteMember` is called, THEN all other members' `motherId` fields that reference the deleted member SHALL be set to null.
7. WHEN `deleteMember` is called, THEN the deleted member's id SHALL be removed from all other members' `spouseIds` arrays.
8. WHEN `deleteMember` is called, THEN the deleted member's id SHALL be removed from all other members' `childrenIds` arrays.
9. AFTER `deleteMember` completes, THEN the app SHALL navigate back using `router.back()`.
10. WHEN the user taps "Batal" in the DeleteMemberDialog, THEN the dialog SHALL close and no data SHALL be modified.

---

### Requirement 7: Validation Utilities

**User Story:** As a developer, I want shared validation functions for family and member forms, so that form validation logic is consistent and reusable across the app.

#### Acceptance Criteria

1. WHEN `validateFamilyForm` is called with a name that is empty or whitespace-only, THEN it SHALL return an errors object with a `name` key containing an error message.
2. WHEN `validateFamilyForm` is called with a name containing at least one non-whitespace character, THEN it SHALL return an errors object without a `name` key.
3. WHEN `validateMemberForm` is called with an empty fullName, THEN it SHALL return an errors object with a `fullName` key.
4. WHEN `validateMemberForm` is called with a valid fullName, gender, and role, THEN it SHALL return an empty errors object.
5. WHEN `resolveRelationships` is called with any member and any array of members (including empty), THEN it SHALL return a valid `{ father, mother, spouses, children }` object without throwing.
6. WHEN `resolveRelationships` encounters a stale relationship ID (references a deleted member), THEN it SHALL silently filter out the stale reference and return null or an empty array for that relationship.

---

### Requirement 8: Animation and Visual Design

**User Story:** As a user, I want smooth, polished animations throughout the family and member management flows, so that the app feels premium and culturally warm.

#### Acceptance Criteria

1. WHEN the FamilySettingsSheet opens, THEN it SHALL animate using `SlideInDown.springify()` (~350ms).
2. WHEN the FamilySettingsSheet closes, THEN it SHALL animate using `SlideOutDown.duration(250)`.
3. WHEN the EditFamilyModal opens, THEN it SHALL animate using `SlideInDown.duration(350).springify()`.
4. WHEN the DeleteFamilyDialog or DeleteMemberDialog appears, THEN it SHALL animate using `ZoomIn.duration(250)`.
5. WHEN the MemberProfileCard renders, THEN it SHALL animate using `FadeInDown.duration(400).delay(100)`.
6. WHEN the RelationshipSection renders, THEN it SHALL animate using `FadeInDown.duration(400).delay(200)`.
7. WHEN a FamilyTreeNode is pressed, THEN it SHALL provide haptic-style spring feedback using `withSpring(0.95)` → `withSpring(1)`.
8. WHEN the edit or delete icon is pressed, THEN it SHALL animate using `withSpring(0.9)` → `withSpring(1)`.
9. WHEN any new screen or component renders, THEN it SHALL use the established color palette: beige surfaces, dark forest-green accents (`AsalUsulColors.primary`), and rounded cards.

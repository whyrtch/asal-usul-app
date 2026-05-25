# Implementation Plan: Family & Member Management

## Overview

Implements Step 5 of the AsalUsul app: full CRUD management for family trees and individual members. Extends the Zustand store with update/delete actions, adds a settings bottom sheet and edit/delete flows for families, creates a dedicated Member Detail screen with profile and relationship views, and adds edit/delete flows for members — all with Reanimated animations and no Firebase dependency.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Extend TypeScript types — foundation for all other tasks"
    },
    {
      "wave": 2,
      "tasks": ["2", "3"],
      "description": "Store actions and validation utilities — can be built in parallel"
    },
    {
      "wave": 3,
      "tasks": ["4", "5", "6", "8", "9"],
      "description": "UI components — family sheet/modals and member card/section in parallel"
    },
    {
      "wave": 4,
      "tasks": ["11", "12"],
      "description": "Edit and delete modals for members"
    },
    {
      "wave": 5,
      "tasks": ["7", "10"],
      "description": "Screen-level wiring — family detail update and new member detail screen"
    },
    {
      "wave": 6,
      "tasks": ["13"],
      "description": "Wire canvas node press navigation"
    },
    {
      "wave": 7,
      "tasks": ["14"],
      "description": "Property-based tests"
    }
  ]
}
```

## Tasks

- [x] 1. Extend TypeScript types for new store actions
  - Open `src/types/familyTree.ts`
  - Add `updateFamilyTree(id: string, patch: Partial<Pick<FamilyTree, 'name' | 'description'>>): void` to `FamilyTreeActions`
  - Add `deleteFamilyTree(id: string): void` to `FamilyTreeActions`
  - Add `updateMember(memberId: string, patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>): void` to `FamilyTreeActions`
  - Add `deleteMember(memberId: string): void` to `FamilyTreeActions`
  - Add `EditFamilyFormValues`, `EditFamilyFormErrors`, `EditMemberFormValues`, `EditMemberFormErrors` interfaces
  - Verify `FamilyTreeStore` export type picks up the new actions automatically
  - _Requirements: 2.1, 3.3, 5.5, 6.3_

- [x] 2. Implement new Zustand store actions
  - Open `src/store/useFamilyTreeStore.ts`
  - Add `updateFamilyTree`: map over `familyTrees`, apply patch and refresh `updatedAt` for matching id; no-op if id not found
  - Add `deleteFamilyTree`: filter out tree by id and all members with `familyTreeId === id` in a single `set()` call
  - Add `updateMember`: map over `members`, apply patch (never overwrite `id`, `familyTreeId`, `createdAt`), refresh parent tree `updatedAt`; no-op if memberId not found
  - Add `deleteMember` as an alias that calls `removeMember(memberId)` — existing `removeMember` already handles relationship cleanup and `totalMembers` decrement
  - Verify no TypeScript errors
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.3, 3.6, 3.7, 5.5, 5.6, 5.7, 5.8, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 3. Add validation and relationship utilities
  - Create `src/utils/validationUtils.ts`
  - Export `validateFamilyForm(values: EditFamilyFormValues): EditFamilyFormErrors` — return `{ name: 'Nama keluarga wajib diisi' }` if `name.trim()` is empty, else `{}`
  - Export `validateMemberForm(values: EditMemberFormValues): EditMemberFormErrors` — validate `fullName` (required), `gender` (required), `role` (required), `birthDate` (optional, `YYYY-MM-DD` format if provided)
  - Export `resolveRelationships(member: Member, allMembers: Member[]): { father: Member | null; mother: Member | null; spouses: Member[]; children: Member[] }` — build a `Map` from `allMembers`, resolve each field, silently filter stale IDs, never throw
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 4. Create `FamilySettingsSheet` component
  - Create `src/components/family/FamilySettingsSheet.tsx`
  - Props: `visible: boolean`, `onClose: () => void`, `onEditPress: () => void`, `onDeletePress: () => void`
  - Use `Modal` with `transparent` and `animationType="none"` as outer wrapper
  - Render full-screen `Pressable` overlay (`rgba(0,0,0,0.45)`) that calls `onClose`
  - Render sheet panel as `Animated.View` with `entering={SlideInDown.springify()}` and `exiting={SlideOutDown.duration(250)}`
  - Sheet: `borderTopLeftRadius: Radii.lg`, `borderTopRightRadius: Radii.lg`, `backgroundColor: AsalUsulColors.backgroundCard`, anchored to bottom
  - Add decorative drag handle bar (centered, `width: 40`, `height: 4`, `borderRadius: 2`)
  - Add "Edit Keluarga" row with pencil icon (`Ionicons "create-outline"`) calling `onEditPress`
  - Add subtle horizontal divider between rows
  - Add "Hapus Keluarga" row with trash icon (`Ionicons "trash-outline"`) in `#C0392B` calling `onDeletePress`
  - Add "Batal" button at bottom calling `onClose`
  - Add `accessibilityRole="button"` and `accessibilityLabel` to each pressable
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2_

- [x] 5. Create `EditFamilyModal` component
  - Create `src/components/family/EditFamilyModal.tsx`
  - Props: `visible: boolean`, `initialName: string`, `initialDescription: string | null`, `onSave: (name: string, description: string | null) => void`, `onClose: () => void`
  - Use `Modal` with `transparent` and `animationType="none"`
  - Wrap content in `KeyboardAvoidingView` (behavior `"padding"` on iOS, `"height"` on Android)
  - Render panel as `Animated.View` with `entering={SlideInDown.duration(350).springify()}`
  - Initialize local state from `initialName` and `initialDescription`
  - Render `TextInput` for name (required) and `TextInput` for description (optional, multiline)
  - On "Simpan": call `validateFamilyForm`; show inline error below name input if invalid; if valid call `onSave(trimmedName, description.trim() || null)` then `onClose()`
  - Render cancel button calling `onClose`
  - Match field styles from existing `FamilyMemberForm`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.3_

- [x] 6. Create `DeleteFamilyDialog` component
  - Create `src/components/family/DeleteFamilyDialog.tsx`
  - Props: `visible: boolean`, `familyName: string`, `onConfirm: () => void`, `onCancel: () => void`
  - Use `Modal` with `transparent` and `animationType="none"`
  - Render centered full-screen overlay (`rgba(0,0,0,0.5)`)
  - Render dialog card as `Animated.View` with `entering={ZoomIn.duration(250)}`
  - Card: `borderRadius: Radii.lg`, `backgroundColor: AsalUsulColors.backgroundCard`, `padding: Spacing.five`
  - Primary copy: "Apakah Anda yakin ingin menghapus pohon keluarga **{familyName}**?"
  - Sub-copy: "Semua anggota keluarga akan ikut terhapus."
  - "Batal" button: outline style, calls `onCancel`
  - "Hapus" button: filled `#C0392B`, calls `onConfirm`
  - Add `accessibilityRole="button"` to both buttons
  - _Requirements: 3.1, 3.2, 3.4, 8.4_

- [x] 7. Update `app/family/[id].tsx` with settings button and sheet orchestration
  - Add local state: `settingsVisible`, `editFamilyVisible`, `deleteFamilyVisible` (all `boolean`, default `false`)
  - Add settings icon button (`Ionicons "settings-outline"`, size 22) to `Stack.Screen` `headerRight` with spring press feedback; on press set `settingsVisible = true`
  - Import and render `FamilySettingsSheet` — wire `onEditPress` to open `EditFamilyModal`, `onDeletePress` to open `DeleteFamilyDialog`
  - Import and render `EditFamilyModal` — on save call `updateFamilyTree(treeId, { name, description })`
  - Import and render `DeleteFamilyDialog` — on confirm call `deleteFamilyTree(treeId)` then `router.replace('/(tabs)')`
  - Wire `updateFamilyTree` and `deleteFamilyTree` from the Zustand store
  - Update existing `useEffect` guard to use `router.replace('/(tabs)')` instead of `router.back()` when `!tree`
  - Pass `onNodePress={(memberId) => router.push(\`/member/\${memberId}\`)}` to `FamilyTreeCanvas`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 3.3, 3.5, 8.1, 8.2, 8.8_

- [x] 8. Create `MemberProfileCard` component
  - Create `src/components/member/MemberProfileCard.tsx`
  - Props: `member: Member`
  - Wrap card in `Animated.View` with `entering={FadeInDown.duration(400).delay(100)}`
  - Card: `backgroundColor: AsalUsulColors.backgroundCard`, `borderRadius: Radii.lg`, padding, shadow
  - Avatar: circular `View` (80px), `backgroundColor: AsalUsulColors.primary`, first 2 initials of `fullName` (uppercase, white, `fontSize: 28`, `fontWeight: '700'`)
  - Gender icon: `♂` or `♀` in `AsalUsulColors.primaryMuted`
  - Full name: `fontSize: 20`, `fontWeight: '700'`, `color: AsalUsulColors.textHeading`
  - Role badge: pill chip (`borderRadius: Radii.pill`, `backgroundColor: AsalUsulColors.backgroundOverlay`)
  - Birth date: format with `Intl.DateTimeFormat` locale `'id-ID'` `{ day: 'numeric', month: 'long', year: 'numeric' }`; display "Tidak diketahui" if `birthDate` is null
  - _Requirements: 4.2, 4.10, 8.5, 8.9_

- [x] 9. Create `RelationshipSection` component
  - Create `src/components/member/RelationshipSection.tsx`
  - Props: `member: Member`, `allMembers: Member[]`
  - Call `resolveRelationships(member, allMembers)` to get `{ father, mother, spouses, children }`
  - Wrap section in `Animated.View` with `entering={FadeInDown.duration(400).delay(200)}`
  - Render section card with title "Hubungan Keluarga"
  - Render four rows: Ayah, Ibu, Pasangan, Anak
  - Each row: label left, resolved name(s) right as `Pressable` navigating to `/member/${id}` via `useRouter`
  - Multiple spouses/children: comma-separated `Pressable` names
  - Empty relationship: display "—" as plain text
  - _Requirements: 4.5, 4.6, 4.7, 7.5, 7.6, 8.6_

- [x] 10. Create `MemberDetailScreen` at `app/member/[id].tsx`
  - Create `src/app/member/[id].tsx`
  - Read `id` from `useLocalSearchParams<{ id: string }>()`
  - Select `members` from Zustand store; derive `member = members.find(m => m.id === id)`
  - Add `useEffect` guard: if `!member`, call `router.back()`; return `null` early
  - Wrap screen in `SafeAreaView` (`backgroundColor: AsalUsulColors.backgroundWarm`)
  - Wrap main content in `Animated.View` with `entering={FadeIn.duration(300)}`
  - Configure `Stack.Screen`: `title: member.fullName`, `headerRight` with edit (`"create-outline"`) and delete (`"trash-outline"`) icon buttons using spring press feedback
  - Render `MemberProfileCard` with `member={member}`
  - Render bio section (collapsible `Pressable` toggling expanded state) only when `member.bio` is non-null and non-empty
  - Render `RelationshipSection` with `member={member}` and `allMembers={members}`
  - Render `EditMemberModal` and `DeleteMemberDialog` with appropriate props
  - Wire `updateMember` and `deleteMember` from Zustand store
  - On delete confirm: call `deleteMember(id)` then `router.back()`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 5.1, 6.1, 8.7, 8.8_

- [x] 11. Create `EditMemberModal` component
  - Create `src/components/member/EditMemberModal.tsx`
  - Props: `visible: boolean`, `member: Member`, `onSave: (patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>) => void`, `onClose: () => void`
  - Use `Modal` with `transparent` and `animationType="none"`
  - Wrap content in `KeyboardAvoidingView` + `ScrollView`
  - Render panel as `Animated.View` with `entering={SlideInDown.duration(350).springify()}`
  - Initialize local state from `member` fields
  - Render fields: `fullName` (required), `gender` (toggle male/female), `role` (required), `birthDate` (optional, `YYYY-MM-DD`), `bio` (optional, multiline)
  - Do NOT render relationship fields
  - On "Simpan": call `validateMemberForm`; show inline errors if invalid; if valid call `onSave(patch)` with only changed fields then `onClose()`
  - Render cancel button calling `onClose`
  - Reuse field styles from `FamilyMemberForm`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.9, 8.3_

- [x] 12. Create `DeleteMemberDialog` component
  - Create `src/components/member/DeleteMemberDialog.tsx`
  - Props: `visible: boolean`, `memberName: string`, `onConfirm: () => void`, `onCancel: () => void`
  - Use `Modal` with `transparent` and `animationType="none"`
  - Render centered full-screen overlay (`rgba(0,0,0,0.5)`)
  - Render dialog card as `Animated.View` with `entering={ZoomIn.duration(250)}`
  - Card: `borderRadius: Radii.lg`, `backgroundColor: AsalUsulColors.backgroundCard`, `padding: Spacing.five`
  - Primary copy: "Apakah Anda yakin ingin menghapus **{memberName}** dari pohon keluarga?"
  - Sub-copy: "Semua referensi hubungan akan ikut dihapus."
  - "Batal" button: outline style, calls `onCancel`
  - "Hapus" button: filled `#C0392B`, calls `onConfirm`
  - Add `accessibilityRole="button"` to both buttons
  - _Requirements: 6.1, 6.2, 6.10, 8.4_

- [x] 13. Wire `FamilyTreeCanvas` node press navigation
  - Confirm `FamilyTreeCanvas` already accepts `onNodePress?: (memberId: string) => void` and forwards it to each `FamilyTreeNode` — no changes needed to canvas or node components
  - Confirm Task 7 passes `onNodePress={(memberId) => router.push(\`/member/\${memberId}\`)}` from `family/[id].tsx`
  - Smoke-test the full navigation path: tap node → `MemberDetailScreen` loads with correct member data
  - _Requirements: 4.1_

- [x] 14. Write property-based tests
  - Create `src/__tests__/familyMemberManagement.test.ts`
  - Import `fast-check` and the store / utils
  - Property 1 — `updateFamilyTree` idempotency on unknown id: for any string not in `familyTrees`, state is unchanged after call
  - Property 2 — `deleteFamilyTree` removes all members of that tree: after call, no member with `familyTreeId === id` remains
  - Property 3 — `deleteMember` cleans up all relationship references: after call, no other member references the deleted id in `fatherId`, `motherId`, `spouseIds`, or `childrenIds`
  - Property 4 — `updateMember` never changes `id`, `familyTreeId`, or `createdAt`: immutable fields are unchanged after any patch
  - Property 5 — `resolveRelationships` never throws: for any member shape and any member array (including empty), returns without throwing
  - Property 6 — `validateFamilyForm` empty name always errors: for any whitespace-only string, `errors.name` is defined
  - Property 7 — `validateFamilyForm` non-empty name never errors: for any string with at least one non-whitespace character, `errors.name` is undefined
  - Run with `npx jest --testPathPattern=familyMemberManagement --passWithNoTests`
  - _Requirements: 2.5, 3.6, 5.6, 6.4, 7.1, 7.2, 7.5_

## Notes

- All new components must use `AsalUsulColors`, `Radii`, `Spacing`, and `Shadows` from `src/constants/theme.ts` — no hardcoded color values except the danger red `#C0392B` which is not in the theme palette.
- `deleteMember` is intentionally an alias for `removeMember` to maintain API consistency for Step 5 without breaking existing callers of `removeMember`.
- Relationship editing (fatherId, motherId, spouseIds, childrenIds) is intentionally excluded from `EditMemberModal` — reserved for a future step.
- All `Modal` components use `transparent + animationType="none"` so Reanimated controls the entrance/exit animations exclusively.
- Read the Expo v56 docs at https://docs.expo.dev/versions/v56.0.0/ before writing any screen or navigation code.

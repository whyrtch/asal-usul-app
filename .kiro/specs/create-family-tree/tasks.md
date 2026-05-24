# Implementation Plan: Create Family Tree

## Overview

Implement the "Create Family Tree" flow for the AsalUsul mobile app. This covers TypeScript data models, a Zustand store, utility functions, three new UI components (`EmptyState`, `FamilyTreeCard`, `CreateFamilyTreeModal`), and an updated Home Screen with conditional rendering. All state is local (no Firebase in this step), but the data shape is Firebase-ready. Property-based tests use `fast-check`.

---

## Tasks

- [x] 1. Define TypeScript data models
  - [x] 1.1 Create `src/types/familyTree.ts` with `FamilyTree` and `Member` interfaces
    - Define `FamilyTree` interface with all required fields: `id`, `name`, `description`, `coverImage`, `ownerId`, `createdAt`, `updatedAt`, `totalMembers`
    - Define `Member` interface with all required fields: `id`, `familyTreeId`, `fullName`, `gender`, `role`, `birthDate`, `photoUrl`, `bio`, `fatherId`, `motherId`, `spouseIds`, `childrenIds`, `createdAt`
    - Export `FamilyTreeStore` type combining state and actions interfaces
    - _Requirements: 8.1, 9.1_

- [x] 2. Implement utility functions
  - [x] 2.1 Create `src/utils/familyTreeUtils.ts` with `validateFamilyTreeName` and `formatRelativeDate`
    - Implement `validateFamilyTreeName(name: string): boolean` — returns `true` iff `name.trim().length >= 1`
    - Implement `formatRelativeDate(isoDate: string): string` — returns `"Dibuat hari ini"` for today, `"Dibuat N hari lalu"` for past dates
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Write property test for `validateFamilyTreeName`
    - **Property 11: validateFamilyTreeName correctness invariant** — for any string `name`, returns `true` iff `name.trim().length >= 1`
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 2.3 Write property test for `formatRelativeDate`
    - **Property 12: formatRelativeDate format invariant** — for any valid ISO 8601 date string, result always starts with `"Dibuat "` and is non-empty
    - **Validates: Requirements 6.3, 6.4**

- [x] 3. Implement `useFamilyTreeStore` Zustand store
  - [x] 3.1 Create `src/store/useFamilyTreeStore.ts` with initial state and `addFamilyTree` / `removeFamilyTree` actions
    - Initialize `familyTrees: []` and `members: []`
    - Implement `addFamilyTree(name, ownerId)`: generate timestamp-based `id`, trim name, set `createdAt` and `updatedAt` to same ISO string, `totalMembers: 0`, `description: null`, `coverImage: null`; prepend to array
    - Implement `removeFamilyTree(id)`: filter out matching entry (idempotent)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

  - [x] 3.2 Write property test for `addFamilyTree` length invariant
    - **Property 4: addFamilyTree length invariant** — for any N valid calls, `familyTrees.length === N`
    - **Validates: Requirements 3.3**

  - [x] 3.3 Write property test for `addFamilyTree` name preservation invariant
    - **Property 5: addFamilyTree name preservation invariant** — stored tree's `name === name.trim()`
    - **Validates: Requirements 3.4, 8.3**

  - [x] 3.4 Write property test for `addFamilyTree` prepend invariant
    - **Property 6: addFamilyTree prepend invariant** — most recently added tree is always at index 0
    - **Validates: Requirements 3.2**

  - [x] 3.5 Write property test for `addFamilyTree` unique ID invariant
    - **Property 7: addFamilyTree unique ID invariant** — all `id` values across N calls are unique
    - **Validates: Requirements 3.5, 8.2**

  - [x] 3.6 Write property test for `addFamilyTree` correct shape invariant
    - **Property 8: addFamilyTree correct shape invariant** — created tree has `totalMembers === 0`, `description === null`, `coverImage === null`, valid ISO `createdAt` and `updatedAt` (equal), non-empty `id`, `name === name.trim()`, correct `ownerId`
    - **Validates: Requirements 3.6, 3.7, 3.8, 8.1, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9**

  - [x] 3.7 Write property test for `removeFamilyTree` idempotency invariant
    - **Property 9: removeFamilyTree idempotency invariant** — calling `removeFamilyTree(id)` twice produces same state as once
    - **Validates: Requirements 3.12**

  - [x] 3.8 Write property test for `removeFamilyTree` preserves other entries invariant
    - **Property 10: removeFamilyTree preserves other entries invariant** — all other N-1 entries remain unchanged and in original order
    - **Validates: Requirements 3.11**

  - [x] 3.9 Extend store with `addMember` and `removeMember` actions
    - Implement `addMember(member)`: generate `id` and `createdAt`; append to `members`; increment `totalMembers` on corresponding FamilyTree; enforce spouse symmetry and parent-child bidirectional links
    - Implement `removeMember(memberId)`: remove member; clean up all `spouseIds`, `childrenIds`, `fatherId`, `motherId` references in sibling members; decrement `totalMembers` on corresponding FamilyTree
    - _Requirements: 3.13, 3.14, 3.15, 3.16, 3.17, 10.1, 10.2, 10.3, 10.4_

  - [x] 3.10 Write property test for `addMember` totalMembers invariant
    - **Property 17: addMember increments totalMembers invariant** — for any N `addMember` calls on the same tree, `totalMembers === N`
    - **Validates: Requirements 3.15**

  - [x] 3.11 Write property test for Member correct shape invariant
    - **Property 15: Member correct shape invariant** — created member has non-empty `id`, non-empty `fullName`, `gender` is `"male"` or `"female"`, non-empty `role`, `spouseIds` and `childrenIds` are arrays, valid ISO `createdAt`
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6, 9.12, 9.13, 9.14**

  - [x] 3.12 Write property test for Member familyTreeId consistency invariant
    - **Property 16: Member familyTreeId consistency invariant** — `member.familyTreeId` equals the target FamilyTree's `id`
    - **Validates: Requirements 9.3, 10.3**

  - [x] 3.13 Write property test for spouse relationship symmetry invariant
    - **Property 19: Spouse relationship symmetry invariant** — if A's `spouseIds` contains B's `id`, then B's `spouseIds` contains A's `id`
    - **Validates: Requirements 10.1**

  - [x] 3.14 Write property test for parent-child relationship consistency invariant
    - **Property 20: Parent-child relationship consistency invariant** — if A's `childrenIds` contains B's `id`, then B's `fatherId` or `motherId` equals A's `id`
    - **Validates: Requirements 10.2**

  - [x] 3.15 Write property test for Member birthDate format invariant
    - **Property 18: Member birthDate format invariant** — for any Member with non-null `birthDate`, value matches `"YYYY-MM-DD"` pattern and is a valid calendar date
    - **Validates: Requirements 9.7**

- [x] 4. Checkpoint — Ensure all store and utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `EmptyState` component
  - [x] 5.1 Create `src/components/family/EmptyState.tsx`
    - Render `HeroIllustration`, heading `"Belum ada pohon keluarga"`, description text, and `PrimaryButton variant="filled"` labeled `"Buat Sekarang"`
    - Apply `FadeInDown` stagger entrance animations using `react-native-reanimated`
    - Invoke `onCreatePress` prop when button is pressed
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 6. Implement `FamilyTreeCard` component
  - [x] 6.1 Create `src/components/family/FamilyTreeCard.tsx`
    - Render `item.name` as primary heading (`ThemedText type="subtitle"`, fontSize 18)
    - Render member count as `"${item.totalMembers} Anggota"` (`ThemedText type="small"`, muted color)
    - Render relative date via `formatRelativeDate(item.createdAt)`
    - Left avatar: rounded square with `Ionicons "git-network-outline"` on `AsalUsulColors.backgroundOverlay`
    - Right: `Ionicons "chevron-forward"` in `AsalUsulColors.textMuted`
    - Apply `borderRadius: Radii.lg`, `backgroundColor: AsalUsulColors.backgroundCard`, `Shadows.card`
    - Wrap in `Pressable`; invoke `onPress(item.id)` when pressed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 6.2 Write property test for FamilyTreeCard renders all required data
    - **Property 13: FamilyTreeCard renders all required data** — for any valid `FamilyTree`, card renders `item.name`, `"${item.totalMembers} Anggota"`, and a string starting with `"Dibuat "`
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 6.3 Write property test for FamilyTreeCard onPress passes correct id
    - **Property 14: FamilyTreeCard onPress passes correct id** — pressing the card invokes `onPress` with exactly `item.id`
    - **Validates: Requirements 4.4**

- [x] 7. Implement `CreateFamilyTreeModal` component
  - [x] 7.1 Create `src/components/family/CreateFamilyTreeModal.tsx`
    - Render React Native `<Modal transparent={true} animationType="none">`
    - Render full-screen `Pressable` overlay with `rgba(0,0,0,0.5)` background (tap to dismiss)
    - Render animated bottom sheet using `useSharedValue`, `useAnimatedStyle`, `withSpring` (open) and `withTiming` (close, 250ms)
    - Render title `"Buat Pohon Keluarga"`, helper description, `TextInput` with placeholder `"Contoh: Keluarga Sastrawinata"`, `autoFocus`, `returnKeyType="done"`
    - Render `PrimaryButton variant="outline"` labeled `"Batal"` and `PrimaryButton variant="filled"` labeled `"Buat"`
    - Derive `isNameValid` from `validateFamilyTreeName(inputValue)`; disable submit button when invalid
    - On "Buat" press: invoke `onSubmit(inputValue.trim())` only when valid
    - On "Batal" press or overlay tap: run close animation then invoke `onClose` via `runOnJS`; reset `inputValue` to `""`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

  - [x] 7.2 Write property test for modal submit calls onSubmit with trimmed name
    - **Property 2: Modal submit calls onSubmit with trimmed name** — for any non-empty, non-whitespace input, pressing "Buat" invokes `onSubmit` with exactly `name.trim()`
    - **Validates: Requirements 2.4, 5.1**

  - [x] 7.3 Write property test for modal blocks submission for whitespace-only input
    - **Property 3: Modal blocks submission for whitespace-only input** — for any whitespace-only or empty string, submit button is disabled and `onSubmit` is not invoked
    - **Validates: Requirements 2.5, 2.6, 5.2, 5.3**

- [x] 8. Update Home Screen with conditional rendering
  - [x] 8.1 Update `src/app/(tabs)/index.tsx` to wire all components together
    - Read `familyTrees` and `addFamilyTree` from `useFamilyTreeStore`
    - Manage `modalVisible: boolean` local state via `useState`
    - When `familyTrees.length === 0`: render `<EmptyState onCreatePress={() => setModalVisible(true)} />`
    - When `familyTrees.length > 0`: render `FlatList` of `FamilyTreeCard` with `keyExtractor={item => item.id}` + a "Buat" create button in the header area
    - Always render `<CreateFamilyTreeModal visible={modalVisible} onClose={...} onSubmit={...} />`
    - On modal submit: call `addFamilyTree(name, ownerId)` then `setModalVisible(false)`
    - On modal close: call `setModalVisible(false)`
    - Memoize `onClose` and `onSubmit` callbacks with `useCallback`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 8.2 Write property test for Home Screen conditional rendering invariant
    - **Property 1: Home Screen conditional rendering invariant** — renders `EmptyState` iff `familyTrees.length === 0`; renders `FlatList` of `FamilyTreeCard` iff `familyTrees.length > 0`
    - **Validates: Requirements 1.1, 1.2**

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already installed as devDependency)
- Unit tests use `@testing-library/react-native` and `jest`
- Run tests with `npm test` (maps to `jest --watchAll=false`)
- `Date.now().toString()` is used for ID generation — no external UUID dependency needed
- `ownerId` should be a placeholder string (e.g., `"local-user"`) until Firebase auth is integrated
- The store shape is Firebase-ready: `FamilyTree` → `users/{uid}/familyTrees/{id}`, `Member` → `users/{uid}/familyTrees/{familyTreeId}/members/{id}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8"] },
    { "id": 3, "tasks": ["3.9"] },
    { "id": 4, "tasks": ["3.10", "3.11", "3.12", "3.13", "3.14", "3.15", "5.1", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```

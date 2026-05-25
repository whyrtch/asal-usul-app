# Implementation Plan: Family Tree Detail (STEP 4)

## Overview

Implement the Family Tree Detail screen for the AsalUsul app. The feature covers three states: empty-tree onboarding (`EmptyTreeState`), first-member form (`FamilyMemberForm`), and tree canvas (`FamilyTreeCanvas` + `FamilyTreeNode`). A pure `TreeLayoutEngine` utility handles layout computation. All state is local Zustand only — no Firebase calls.

Implementation order: foundation utilities → leaf components → composite components → route screen → navigation wiring → tests.

---

## Tasks

- [x] 1. Implement `TreeLayoutEngine` utility and `extractBirthYear` helper
  - [x] 1.1 Create `src/utils/treeLayoutEngine.ts` with `LayoutNode` interface and `defaultTreeLayoutEngine`
    - Define `LayoutNode` interface: `{ member: Member; x: number; y: number }`
    - Define `TreeLayoutEngine` interface with `computeLayout(members: Member[], canvasWidth: number): LayoutNode[]`
    - Implement `defaultTreeLayoutEngine.computeLayout`:
      - Return `[]` when `members` is empty
      - Return `[{ member: members[0], x: canvasWidth / 2, y: NODE_HEIGHT / 2 + VERTICAL_PADDING }]` for single member
      - For N members: evenly space with `spacing = canvasWidth / (members.length + 1)`, `x = spacing * (i + 1)`
    - Export constants `NODE_HEIGHT = 120` and `VERTICAL_PADDING = 32`
    - No React imports — pure TypeScript module
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 1.2 Add `extractBirthYear` function to `src/utils/treeLayoutEngine.ts`
    - Signature: `export function extractBirthYear(birthDate: string | null): string`
    - Return `''` when `birthDate` is `null`
    - Return `birthDate.slice(0, 4)` when `birthDate` is a non-null string
    - No side effects
    - _Requirements: 7.4, 7.5_

  - [x] 1.3 Write property tests for `TreeLayoutEngine` — Properties 1, 2, 6
    - Create `src/__tests__/treeLayoutEngine.property.test.ts`
    - Use `fast-check` arbitraries: `fc.array(memberArbitrary)` and `fc.float({ min: 1, max: 2000 })`
    - **Property 1: output length equals input length** — `computeLayout(members, w).length === members.length` for all `members` and `w > 0`
    - **Property 2: single-node layout is centered** — `computeLayout([m], w)[0].x === w / 2` for all `m` and `w > 0`
    - **Property 6: all x-values within canvas bounds** — every `node.x` satisfies `0 <= node.x <= canvasWidth` for all inputs
    - _Requirements: 8.3, 8.4, 8.6_

  - [x] 1.4 Write unit tests for `extractBirthYear` — Property 5
    - Create `src/__tests__/extractBirthYear.test.ts`
    - Test: `null` → `''`
    - Test: `'1970-05-15'` → `'1970'`
    - Test: `'2000-01-01'` → `'2000'`
    - Test: any string input always returns length 0 or 4
    - _Requirements: 7.4, 7.5_

- [x] 2. Implement `FamilyTreeNode` leaf component
  - [x] 2.1 Create `src/components/family/FamilyTreeNode.tsx`
    - Accept props: `member: Member`, `onPress?: (memberId: string) => void`
    - Render circular avatar placeholder (48×48) showing initials from `member.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()`
    - Render `member.fullName` as primary label using `ThemedText type="subtitle"`
    - Render `member.role` as secondary label using `ThemedText type="small"`
    - Render birth year via `extractBirthYear(member.birthDate)` — show empty string when `null`
    - Apply `FadeIn.duration(400).delay(100)` entering animation on outer `Animated.View`
    - Apply `ZoomIn.duration(300).delay(150)` entering animation (compose via `layout` or second `Animated.View`)
    - Implement press scale feedback: `useSharedValue(1)` + `withSpring({ damping: 10, stiffness: 300 })` + `useAnimatedStyle`
    - Wrap component in `React.memo`
    - Use `AsalUsulColors`, `Radii`, `Shadows`, `Spacing` from `@/constants/theme`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 9.5_

- [x] 3. Implement `EmptyTreeState` leaf component
  - [x] 3.1 Create `src/components/family/EmptyTreeState.tsx`
    - Accept props: `onAddFirstMember: () => void`
    - Display icon placeholder using `Ionicons` (e.g., `"people-outline"`, size 80, color `AsalUsulColors.primaryMuted`)
    - Display heading in Indonesian (e.g., `"Mulai Pohon Keluargamu"`)
    - Display explanatory copy in Indonesian (e.g., `"Tambahkan dirimu sebagai anggota pertama untuk memulai perjalanan silsilah keluarga."`)
    - Render CTA `Pressable` labelled `"Tambah Anggota Pertama"` that calls `onAddFirstMember`
    - Apply `FadeInDown.duration(400)` with staggered delays: icon at `delay(0)`, heading at `delay(80)`, body copy at `delay(160)`, CTA at `delay(240)` — each child wrapped in its own `Animated.View`
    - Use `AsalUsulColors`, `Radii`, `Shadows`, `Spacing` from `@/constants/theme`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.2_

- [x] 4. Implement `FamilyMemberForm` composite component
  - [x] 4.1 Create `src/components/family/FamilyMemberForm.tsx` — form structure and state
    - Accept props: `familyTreeId: string`, `onSuccess: () => void`, `onDismiss: () => void`
    - Define `FormValues` type: `{ fullName: string; gender: 'male' | 'female' | null; role: string; birthDate: string; bio: string }`
    - Define `FormErrors` type: `{ fullName?: string; gender?: string; role?: string; birthDate?: string }`
    - Initialize state: `formValues` with empty defaults, `formErrors` as `{}`
    - Render `KeyboardAvoidingView` as root container (behavior `'padding'` on iOS, `'height'` on Android)
    - Render controlled `TextInput` for `fullName` — show red border + error message below when `formErrors.fullName` is set
    - Render gender selector row with two `Pressable` options (`'male'` / `'female'`) — highlight selected, show error below when `formErrors.gender` is set
    - Render role selector with options `['Anak', 'Ayah', 'Ibu', 'Kakek', 'Nenek']` — show error below when `formErrors.role` is set
    - Render optional `TextInput` for `birthDate` with placeholder `"YYYY-MM-DD"`
    - Render optional `TextInput` for `bio` (multiline)
    - Apply `SlideInDown.duration(350).springify()` entering animation on the outer `Animated.View` container
    - Use `AsalUsulColors`, `Radii`, `Shadows`, `Spacing` from `@/constants/theme`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.14, 9.3_

  - [x] 4.2 Implement `validateForm` and submit handler in `FamilyMemberForm`
    - Extract `validateForm(values: FormValues): FormErrors` as a module-level pure function (no React deps)
    - Validate: `fullName.trim().length < 1` → `errors.fullName = "Nama lengkap wajib diisi"`
    - Validate: `gender === null` → `errors.gender = "Jenis kelamin wajib dipilih"`
    - Validate: `role.length < 1` → `errors.role = "Peran dalam keluarga wajib dipilih"`
    - Validate: `birthDate` non-empty and not matching `/^\d{4}-\d{2}-\d{2}$/` → `errors.birthDate = "Format tanggal: YYYY-MM-DD"`
    - Implement `handleSubmit`: call `validateForm`, set `formErrors`; if no errors call `addMember` then `onSuccess()`
    - Pass `birthDate: formValues.birthDate.trim() === '' ? null : formValues.birthDate` to `addMember`
    - Pass `fullName: formValues.fullName.trim()` to `addMember`
    - Implement submit button with `useSharedValue(1)` + `withSpring({ damping: 10, stiffness: 300 })` scale animation on press
    - Wire `useFamilyTreeStore` selector for `addMember` action
    - _Requirements: 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 5.1, 9.6, 10.2, 10.5_

  - [x] 4.3 Write property tests for `validateForm` — Property 3
    - Create `src/__tests__/validateForm.property.test.ts`
    - Import `validateForm` from `FamilyMemberForm` (export it for testing)
    - Use `fast-check` to generate arbitrary `FormValues` objects
    - **Property 3: no errors iff all required fields valid** — `Object.keys(validateForm(v)).length === 0` iff `v.fullName.trim().length >= 1 && v.gender !== null && v.role.length >= 1`
    - Also test: whitespace-only `fullName` produces `fullName` error
    - Also test: valid `birthDate` format `YYYY-MM-DD` does not produce `birthDate` error
    - Also test: invalid `birthDate` format produces `birthDate` error
    - _Requirements: 4.7, 4.8, 4.9, 4.10, 4.11_

- [x] 5. Implement `FamilyTreeCanvas` composite component
  - [x] 5.1 Create `src/components/family/FamilyTreeCanvas.tsx`
    - Accept props: `members: Member[]`, `onNodePress?: (memberId: string) => void`
    - Use `useWindowDimensions()` to get `canvasWidth`
    - Memoize layout: `const layoutNodes = useMemo(() => defaultTreeLayoutEngine.computeLayout(members, canvasWidth), [members, canvasWidth])`
    - Render `ScrollView` with `contentContainerStyle` as root (set `removeClippedSubviews` for future large trees)
    - Render each `LayoutNode` as `<FamilyTreeNode>` positioned absolutely at `{ left: node.x - NODE_WIDTH / 2, top: node.y - NODE_HEIGHT / 2 }`
    - Apply `FadeIn.duration(500)` entering animation on the outer `Animated.View` container
    - Use `AsalUsulColors`, `Spacing` from `@/constants/theme`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.4_

- [x] 6. Implement `src/app/family/[id].tsx` detail screen
  - [x] 6.1 Create `src/app/family/[id].tsx` — route setup and store wiring
    - Use `useLocalSearchParams<{ id: string }>()` to read `treeId`
    - Select `familyTrees` and `members` from `useFamilyTreeStore` with selector functions
    - Derive `tree = familyTrees.find(t => t.id === treeId)` and `treeMembers = members.filter(m => m.familyTreeId === treeId)`
    - Guard: if `tree` is `undefined` after mount, call `router.back()` and return `null`
    - Configure `<Stack.Screen options={{ title: tree.name }} />` for header title
    - Manage `showForm: boolean` local state (default `false`)
    - Implement `handleShowForm`, `handleFormSuccess`, `handleFormDismiss` callbacks
    - Render `SafeAreaView` as root with `backgroundColor: AsalUsulColors.backgroundWarm`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.4, 10.1, 10.4_

  - [x] 6.2 Wire conditional rendering logic in `src/app/family/[id].tsx`
    - When `treeMembers.length === 0 && !showForm`: render `<EmptyTreeState onAddFirstMember={handleShowForm} />`
    - When `treeMembers.length === 0 && showForm`: render `<FamilyMemberForm familyTreeId={treeId} onSuccess={handleFormSuccess} onDismiss={handleFormDismiss} />`
    - When `treeMembers.length > 0`: render `<FamilyTreeCanvas members={treeMembers} />`
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.6, 5.7_

- [x] 7. Wire navigation in `src/app/(tabs)/index.tsx`
  - [x] 7.1 Modify `src/app/(tabs)/index.tsx` to navigate to detail screen on card press
    - Import `useRouter` from `expo-router`
    - Instantiate `const router = useRouter()` inside `HomeScreen`
    - Update `renderItem` callback to pass `onPress={(id) => router.push(\`/family/\${id}\`)}` to `<FamilyTreeCard>`
    - Ensure `router` is included in `useCallback` dependency array for `renderItem`
    - _Requirements: 1.1_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integration tests for the detail screen
  - [x] 9.1 Write integration tests for `FamilyTreeDetailScreen`
    - Create `src/__tests__/FamilyTreeDetailScreen.test.tsx`
    - Use `@testing-library/react-native` with `renderRouter` or `render` + mocked store
    - Test: render with empty store members → `EmptyTreeState` is visible
    - Test: tap "Tambah Anggota Pertama" → `FamilyMemberForm` appears
    - Test: fill required fields and submit → `FamilyTreeCanvas` appears, `FamilyTreeNode` with member name is visible
    - Test: `totalMembers` increments to `1` in the store after valid submit
    - Test: unknown `treeId` → `router.back()` is called
    - _Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 5.2, 5.3, 5.6_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `validateForm` must be exported from `FamilyMemberForm.tsx` so property tests can import it directly
- `extractBirthYear` must be exported from `treeLayoutEngine.ts` so unit tests can import it directly
- All animations use `react-native-reanimated` 4.x — import `FadeIn`, `FadeInDown`, `SlideInDown`, `ZoomIn` from `'react-native-reanimated'`
- `withSpring` + `useSharedValue` + `useAnimatedStyle` for press feedback (submit button and node press)
- No new npm dependencies — `fast-check` is already in `devDependencies`
- Run tests with `npm test` (maps to `jest --watchAll=false`)
- Theme tokens: `AsalUsulColors`, `Radii`, `Shadows`, `Spacing` all from `@/constants/theme`
- The existing `addMember` store action already handles `totalMembers` increment and `updatedAt` update — no store changes needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1"] },
    { "id": 3, "tasks": ["4.2"] },
    { "id": 4, "tasks": ["4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["9.1"] }
  ]
}
```

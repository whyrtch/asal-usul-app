# Requirements Document

## Introduction

This document specifies the requirements for the **Family Tree Detail** feature (STEP 4) of the AsalUsul mobile app. The feature covers the screen users land on after tapping a family tree card from the Home list. It handles three distinct states: an empty-tree onboarding experience that prompts the user to add themselves as the first member, a form for capturing that first member's identity, and a minimal tree canvas that renders the first node once the member is saved. All state is local (Zustand only); no Firebase integration is included in this step.

---

## Glossary

- **DetailScreen**: The `src/app/family/[id].tsx` Expo Router dynamic route that orchestrates the family tree detail view.
- **EmptyTreeState**: The `src/components/family/EmptyTreeState.tsx` component that renders the onboarding UI when a family tree has no members.
- **FamilyMemberForm**: The `src/components/family/FamilyMemberForm.tsx` animated form component for capturing the first family member's identity.
- **FamilyTreeCanvas**: The `src/components/family/FamilyTreeCanvas.tsx` viewport component that renders the tree visualization.
- **FamilyTreeNode**: The `src/components/family/FamilyTreeNode.tsx` pure presentational card for a single family member in the tree.
- **FamilyTreeCard**: The existing `src/components/family/FamilyTreeCard.tsx` card component rendered in the Home Screen list.
- **HomeScreen**: The `src/app/(tabs)/index.tsx` screen that lists all family trees.
- **TreeLayoutEngine**: The `src/utils/treeLayoutEngine.ts` pure utility module that computes display positions for tree nodes.
- **LayoutNode**: The output record of `TreeLayoutEngine.computeLayout`, containing a `Member` reference and `x`/`y` coordinates.
- **Store**: The `useFamilyTreeStore` Zustand store defined in `src/store/useFamilyTreeStore.ts`.
- **Member**: The `Member` TypeScript interface defined in `src/types/familyTree.ts`.
- **FamilyTree**: The `FamilyTree` TypeScript interface defined in `src/types/familyTree.ts`.
- **FormValues**: The internal form state shape in `FamilyMemberForm` with fields `fullName`, `gender`, `role`, `birthDate`, and `bio`.
- **FormErrors**: The internal validation error shape in `FamilyMemberForm` with optional keys `fullName`, `gender`, and `role`.
- **Router**: The Expo Router navigation instance obtained via `useRouter()`.
- **Reanimated**: The `react-native-reanimated` 4.x library used for all animations.

---

## Requirements

### Requirement 1: Navigation from Home Screen to Detail Screen

**User Story:** As a user, I want to tap a family tree card on the Home Screen and be taken to that tree's detail page, so that I can view and manage the members of that specific tree.

#### Acceptance Criteria

1. WHEN a user taps a `FamilyTreeCard` on the HomeScreen, THE HomeScreen SHALL call `router.push('/family/{treeId}')` with the tapped tree's `id`.
2. WHEN the Router navigates to `/family/{treeId}`, THE DetailScreen SHALL mount with `params.id` equal to the `treeId` resolved via `useLocalSearchParams<{ id: string }>()`.
3. WHEN the DetailScreen mounts with a valid `treeId`, THE DetailScreen SHALL resolve the matching `FamilyTree` from the Store's `familyTrees` array.
4. WHEN the DetailScreen mounts with a valid `treeId`, THE DetailScreen SHALL configure `Stack.Screen` with a title equal to the matching `FamilyTree.name`.
5. IF `params.id` does not match any `FamilyTree` in the Store, THEN THE DetailScreen SHALL call `router.back()` immediately after mount and halt further rendering.

---

### Requirement 2: Detail Screen State Management

**User Story:** As a user, I want the detail screen to show the right content based on whether my family tree has members or not, so that I always see a relevant and helpful interface.

#### Acceptance Criteria

1. WHEN the DetailScreen mounts and `treeMembers.length === 0` and `showForm` is `false`, THE DetailScreen SHALL render `EmptyTreeState`.
2. WHEN the DetailScreen mounts and `treeMembers.length === 0` and `showForm` is `true`, THE DetailScreen SHALL render `FamilyMemberForm` instead of `EmptyTreeState`.
3. WHEN `treeMembers.length > 0`, THE DetailScreen SHALL render `FamilyTreeCanvas` and SHALL NOT render `EmptyTreeState` or `FamilyMemberForm`.
4. THE DetailScreen SHALL derive `treeMembers` by filtering the Store's `members` array where `member.familyTreeId === treeId`.
5. WHEN the Store's `members` array is updated, THE DetailScreen SHALL re-evaluate `treeMembers` and update the rendered state accordingly.

---

### Requirement 3: Empty Tree Onboarding Experience

**User Story:** As a user, I want to see a welcoming onboarding screen when my family tree is empty, so that I understand what to do next and feel encouraged to add my first family member.

#### Acceptance Criteria

1. THE `EmptyTreeState` SHALL display a heading and explanatory copy written in Indonesian.
2. THE `EmptyTreeState` SHALL render a CTA button labelled "Tambah Anggota Pertama".
3. WHEN the user taps the "Tambah Anggota Pertama" CTA, THE `EmptyTreeState` SHALL invoke the `onAddFirstMember` callback prop.
4. WHEN `EmptyTreeState` mounts, THE `EmptyTreeState` SHALL apply a `FadeInDown` entering animation with staggered delay per child element using Reanimated.
5. WHEN `onAddFirstMember` is invoked, THE DetailScreen SHALL set `showForm` to `true`, causing `FamilyMemberForm` to render.

---

### Requirement 4: Initial Member Form — Fields and Validation

**User Story:** As a user, I want to fill in a form to add myself as the first member of my family tree, so that the tree has a starting point with accurate information about me.

#### Acceptance Criteria

1. THE `FamilyMemberForm` SHALL render a controlled text input for `fullName` (required).
2. THE `FamilyMemberForm` SHALL render a gender selector for `gender` with options `'male'` and `'female'` (required).
3. THE `FamilyMemberForm` SHALL render a role selector for `role` with options including `'Anak'`, `'Ayah'`, `'Ibu'`, `'Kakek'`, and `'Nenek'` (required).
4. THE `FamilyMemberForm` SHALL render a text input for `birthDate` in `YYYY-MM-DD` format (optional).
5. THE `FamilyMemberForm` SHALL render a text input for `bio` (optional).
6. THE `FamilyMemberForm` SHALL wrap all inputs in a `KeyboardAvoidingView` to prevent the keyboard from obscuring the form.
7. WHEN the user taps the submit button, THE `FamilyMemberForm` SHALL run `validateForm(formValues)` and set `formErrors` state before calling `addMember`.
8. IF `formValues.fullName.trim().length < 1`, THEN THE `FamilyMemberForm` SHALL set `formErrors.fullName` to `"Nama lengkap wajib diisi"` and render it below the `fullName` input with a red border on the field.
9. IF `formValues.gender` is `null`, THEN THE `FamilyMemberForm` SHALL set `formErrors.gender` to `"Jenis kelamin wajib dipilih"` and render it below the gender selector.
10. IF `formValues.role` is empty, THEN THE `FamilyMemberForm` SHALL set `formErrors.role` to `"Peran dalam keluarga wajib dipilih"` and render it below the role selector.
11. IF `formValues.birthDate` is non-empty and does not match the pattern `^\d{4}-\d{2}-\d{2}$`, THEN THE `FamilyMemberForm` SHALL set a `birthDate` format error and render it below the `birthDate` input.
12. WHEN `validateForm(formValues)` returns an empty errors object, THE `FamilyMemberForm` SHALL proceed to call `addMember` on the Store.
13. WHEN `formValues.birthDate` is an empty string, THE `FamilyMemberForm` SHALL pass `null` for `birthDate` in the `addMember` payload.
14. WHEN `FamilyMemberForm` mounts, THE `FamilyMemberForm` SHALL apply a `SlideInDown.duration(350).springify()` entering animation on the outer container using Reanimated.

---

### Requirement 5: Submit Flow — Store Update and Transition

**User Story:** As a user, I want the form submission to save my information and immediately show me the family tree canvas, so that I can see the result of adding myself as the first member.

#### Acceptance Criteria

1. WHEN `validateForm(formValues)` returns no errors, THE `FamilyMemberForm` SHALL call `addMember` on the Store with a complete `Omit<Member, 'id' | 'createdAt'>` payload including `familyTreeId`, `fullName`, `gender`, `role`, `birthDate` (or `null`), `photoUrl: null`, `bio` (or `null`), `fatherId: null`, `motherId: null`, `spouseIds: []`, and `childrenIds: []`.
2. WHEN `addMember` is called, THE Store SHALL append the new `Member` to the `members` array with a generated `id` and `createdAt` timestamp.
3. WHEN `addMember` is called for a given `familyTreeId`, THE Store SHALL increment `totalMembers` by exactly 1 on the matching `FamilyTree` record.
4. WHEN `addMember` is called, THE Store SHALL update `updatedAt` on the matching `FamilyTree` to the current ISO 8601 timestamp.
5. AFTER `addMember` completes, THE `FamilyMemberForm` SHALL call the `onSuccess` callback prop.
6. WHEN `onSuccess` is called, THE DetailScreen SHALL set `showForm` to `false`, causing `FamilyTreeCanvas` to render in place of `FamilyMemberForm`.
7. WHEN `FamilyTreeCanvas` mounts after the first member is added, THE `FamilyTreeCanvas` SHALL apply a `FadeIn.duration(500)` entering animation using Reanimated.

---

### Requirement 6: Tree Canvas Rendering

**User Story:** As a user, I want to see my family tree visualized as a canvas with positioned nodes after adding the first member, so that I have a clear graphical representation of my family.

#### Acceptance Criteria

1. THE `FamilyTreeCanvas` SHALL accept a `members: Member[]` prop containing all members belonging to the current family tree.
2. WHEN `FamilyTreeCanvas` renders, THE `FamilyTreeCanvas` SHALL call `TreeLayoutEngine.computeLayout(members, canvasWidth)` to obtain a `LayoutNode[]` array.
3. THE `FamilyTreeCanvas` SHALL memoize the result of `computeLayout` using `useMemo` keyed on the `members` reference to avoid redundant recomputation.
4. THE `FamilyTreeCanvas` SHALL render exactly one `FamilyTreeNode` component for each `LayoutNode` returned by `computeLayout`.
5. WHEN `members.length === 1`, THE `FamilyTreeCanvas` SHALL position the single `FamilyTreeNode` at the horizontal center of the available canvas space.
6. THE `FamilyTreeCanvas` SHALL use a `ScrollView` with `contentContainerStyle` as the root container to support future pan and zoom capabilities.

---

### Requirement 7: Tree Node Display

**User Story:** As a user, I want each family member to be displayed as a visually distinct node card in the tree, so that I can quickly identify members by their name, role, and birth year.

#### Acceptance Criteria

1. THE `FamilyTreeNode` SHALL display a circular avatar placeholder showing the member's initials derived from `member.fullName`.
2. THE `FamilyTreeNode` SHALL display `member.fullName` as the primary label.
3. THE `FamilyTreeNode` SHALL display `member.role` as a secondary label.
4. WHEN `member.birthDate` is a non-null `YYYY-MM-DD` string, THE `FamilyTreeNode` SHALL display the 4-character year prefix extracted by `extractBirthYear(member.birthDate)`.
5. WHEN `member.birthDate` is `null`, THE `FamilyTreeNode` SHALL display an empty string in place of the birth year.
6. WHEN `FamilyTreeNode` mounts, THE `FamilyTreeNode` SHALL apply `FadeIn.duration(400).delay(100)` and `ZoomIn.duration(300).delay(150)` entering animations using Reanimated.
7. WHEN the user presses a `FamilyTreeNode`, THE `FamilyTreeNode` SHALL apply a scale press feedback animation using `useSharedValue` and `withSpring` with `damping: 10` and `stiffness: 300`.
8. THE `FamilyTreeNode` SHALL be wrapped in `React.memo` to prevent re-renders when sibling nodes update.

---

### Requirement 8: TreeLayoutEngine — Layout Computation

**User Story:** As a developer, I want a pure, independently testable layout engine that computes node positions, so that the rendering layer stays decoupled from layout logic and can be upgraded without touching UI components.

#### Acceptance Criteria

1. THE `TreeLayoutEngine` SHALL expose a `computeLayout(members: Member[], canvasWidth: number): LayoutNode[]` function.
2. WHEN `members` is an empty array, THE `TreeLayoutEngine` SHALL return an empty array.
3. WHEN `members.length === 1`, THE `TreeLayoutEngine` SHALL return a single `LayoutNode` with `x === canvasWidth / 2`.
4. FOR ALL valid `members` arrays and `canvasWidth > 0`, THE `TreeLayoutEngine` SHALL return a `LayoutNode[]` whose length equals `members.length`.
5. FOR ALL valid `members` arrays and `canvasWidth > 0`, THE `TreeLayoutEngine` SHALL return `LayoutNode[]` where each `result[i].member` is strictly equal to `members[i]`.
6. FOR ALL valid `members` arrays and `canvasWidth > 0`, THE `TreeLayoutEngine` SHALL return `LayoutNode[]` where every `node.x` satisfies `0 <= node.x <= canvasWidth`.
7. THE `TreeLayoutEngine` SHALL be a pure utility module with no React dependencies, enabling independent unit and property-based testing.

---

### Requirement 9: Animation Specifications

**User Story:** As a user, I want smooth, premium-feeling animations when navigating and interacting with the family tree detail screen, so that the app feels polished and responsive.

#### Acceptance Criteria

1. THE DetailScreen SHALL use `react-native-reanimated` 4.x layout animation API for all entering and exiting animations.
2. WHEN `EmptyTreeState` mounts, THE `EmptyTreeState` SHALL apply `FadeInDown.duration(400)` with a staggered delay between `0` and `240` ms per child element.
3. WHEN `FamilyMemberForm` becomes visible, THE `FamilyMemberForm` SHALL apply `SlideInDown.duration(350).springify()` on the outer container, matching the spring feel of `CreateFamilyTreeModal`.
4. WHEN `FamilyTreeCanvas` mounts after the first member is added, THE `FamilyTreeCanvas` SHALL apply `FadeIn.duration(500)` for a smooth crossfade from the form.
5. WHEN a `FamilyTreeNode` mounts, THE `FamilyTreeNode` SHALL apply `FadeIn.duration(400).delay(100)` followed by `ZoomIn.duration(300).delay(150)` for a layered premium entrance.
6. WHEN the submit button is pressed, THE `FamilyMemberForm` SHALL animate the button scale from `1.0` to `0.95` and back to `1.0` using `useAnimatedStyle` and `withSpring` with `damping: 10` and `stiffness: 300`.

---

### Requirement 10: Local State Only — No Firebase

**User Story:** As a developer, I want this feature to operate entirely on local Zustand state without any Firebase calls, so that the implementation is self-contained and can be tested without network dependencies.

#### Acceptance Criteria

1. THE DetailScreen SHALL read all `FamilyTree` and `Member` data exclusively from the `useFamilyTreeStore` Zustand store.
2. THE `FamilyMemberForm` SHALL write new member data exclusively via the `addMember` action on the `useFamilyTreeStore` Zustand store.
3. THE feature SHALL NOT make any network requests or Firebase SDK calls.
4. THE `familyTreeId` SHALL be validated against the Store's `familyTrees` array before rendering any member-related UI, to prevent rendering orphaned members.
5. WHEN user input is submitted, THE `FamilyMemberForm` SHALL trim `fullName` before passing it to `addMember` to prevent whitespace-only names from being stored.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: `computeLayout` output length equals input length

For any non-null `members` array and any `canvasWidth > 0`, calling `TreeLayoutEngine.computeLayout(members, canvasWidth)` SHALL return an array whose length equals `members.length`.

**Validates: Requirements 8.4**

---

### Property 2: Single-node layout is centered

For any single-element `members` array and any `canvasWidth > 0`, calling `TreeLayoutEngine.computeLayout(members, canvasWidth)` SHALL return a single `LayoutNode` where `node.x === canvasWidth / 2`.

**Validates: Requirements 8.3**

---

### Property 3: `validateForm` returns no errors if and only if all required fields are valid

For any `FormValues` object, `Object.keys(validateForm(values)).length === 0` if and only if `values.fullName.trim().length >= 1` AND `values.gender !== null` AND `values.role.length >= 1`.

**Validates: Requirements 4.7, 4.8, 4.9, 4.10**

---

### Property 4: `addMember` increments `totalMembers` by exactly 1

For any `FamilyTree` in the Store and any valid `Omit<Member, 'id' | 'createdAt'>` payload referencing that tree, calling `addMember(payload)` SHALL increment `totalMembers` on the matching `FamilyTree` by exactly 1.

**Validates: Requirements 5.3**

---

### Property 5: `extractBirthYear` always returns a 4-character string or empty string

For any `birthDate` value that is either `null` or a string, `extractBirthYear(birthDate)` SHALL return a string whose length is either `0` or `4`.

**Validates: Requirements 7.4, 7.5**

---

### Property 6: `computeLayout` all x-values are within canvas bounds

For any non-null `members` array and any `canvasWidth > 0`, every `LayoutNode` returned by `TreeLayoutEngine.computeLayout(members, canvasWidth)` SHALL satisfy `0 <= node.x <= canvasWidth`.

**Validates: Requirements 8.6**

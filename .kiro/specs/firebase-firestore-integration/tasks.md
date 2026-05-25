# Implementation Plan: Firebase Firestore Integration (Step 6)

## Overview

Replace local-only Zustand state with a layered Firebase service architecture: Firebase services → repositories → Zustand stores → screens. All Firebase SDK calls are isolated in the service and repository layers; UI components remain Firebase-free. Tasks follow a strict dependency order: types and config first, then repositories, then stores, then context and screen wiring.

## Tasks

- [x] 1. Create Firestore type definitions and service config
  - [x] 1.1 Create `src/types/firestore.ts` with all Firestore document interfaces
    - Define `UserDocument`, `CreateUserInput`, `FamilyTreeDocument`, `CreateFamilyTreeInput`, `UpdateFamilyTreeInput`, `MemberDocument`, `CreateMemberInput`, `RelationshipUpdate` interfaces
    - `FamilyTreeDocument` and `FamilyTree` SHALL include `shareWith: string[]` (array of Firebase Auth UIDs); default to `[]`
    - `CreateFamilyTreeInput` SHALL include optional `shareWith?: string[]` (defaults to `[]` when omitted)
    - `UpdateFamilyTreeInput` SHALL include `shareWith: string[]` to allow updating the share list
    - Import `Timestamp` and `FieldValue` from `firebase/firestore`
    - Add JSDoc comments for each interface describing the Firestore path it maps to
    - _Requirements: 6.1, 3.12_

  - [x] 1.2 Create `src/services/firebase/config.ts` re-exporting Firebase singletons
    - Re-export `auth` from `src/lib/firebase`
    - Initialize and export `db` via `getFirestore(getApp())` — reuse existing app, do not call `initializeApp` again
    - Export `app` via `getApp()`
    - _Requirements: 6.1_

- [x] 2. Implement FirestoreHelpers service
  - [x] 2.1 Create `src/services/firebase/firestore.ts` with utility functions
    - Implement `toISOString(timestamp: Timestamp): string` — converts Firestore Timestamp to ISO 8601 UTC string ending with `Z`; falls back to `new Date().toISOString()` when timestamp is null/undefined
    - Implement `isPermissionError(error: unknown): boolean` — returns `true` for `FirebaseError` with code `permission-denied` or `insufficient-permissions`
    - Implement `isNetworkError(error: unknown): boolean` — returns `true` for `FirebaseError` with code `unavailable` or `deadline-exceeded`
    - Implement `isAuthError(error: unknown): boolean` — returns `true` for `FirebaseError` with code `invalid-credential` or `user-token-expired`
    - Re-export `serverTimestamp` from `firebase/firestore` for convenience
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 2.2 Implement `withRetry` in `src/services/firebase/firestore.ts`
    - Signature: `withRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>`
    - Default options: `maxAttempts: 3`, `baseDelayMs: 500`, `maxDelayMs: 8000`
    - Throw immediately (no retry) for permission errors (`isPermissionError`) and auth errors (`isAuthError`)
    - Retry on network/transient errors with delay: `min(baseDelayMs * 2^(attempt-1) + random(0,100), maxDelayMs)`
    - Throw last error after exhausting all attempts
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

  - [x] 2.3 Write property tests for `withRetry`
    - **Property 6: Retry Non-Amplification** — `withRetry` with a `permission-denied` error calls the operation exactly once and throws immediately
    - **Validates: Requirements 5.1**
    - Test that retry count never exceeds `maxAttempts` for transient errors
    - Test that backoff delay is always within `[0, maxDelayMs]` bounds
    - Use `fast-check` with `fc.record({ code: fc.constantFrom('permission-denied', 'insufficient-permissions') })`
    - _Requirements: 5.1, 5.2_

- [x] 3. Implement UserRepository and AuthService
  - [x] 3.1 Create `src/repositories/userRepository.ts`
    - Implement `getUser(uid: string): Promise<UserDocument | null>` — reads `users/{uid}`, returns null if not found, maps `DocumentSnapshot` to `UserDocument`
    - Implement `createUser(uid: string, data: CreateUserInput): Promise<UserDocument>` — calls `setDoc` with `serverTimestamp()` for `createdAt`, `updatedAt`, `lastLoginAt`
    - Implement `updateLastLogin(uid: string): Promise<void>` — calls `updateDoc` with `serverTimestamp()` for `lastLoginAt` and `updatedAt` only
    - Never expose raw Firestore `DocumentSnapshot` or `DocumentReference` to callers
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [x] 3.2 Create `src/services/firebase/auth.ts` — AuthService
    - Implement `upsertUserDocument(firebaseUser: FirebaseUser): Promise<void>`
    - Call `userRepository.getUser(uid)` to check existence
    - If null: call `userRepository.createUser(uid, { name: displayName ?? '', email: email!, photoUrl: photoURL ?? '', provider: 'google' })`
    - If exists: call `userRepository.updateLastLogin(uid)`
    - Wrap entire function in try/catch — log errors with `console.error`, never throw to caller
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement FamilyTreeRepository
  - [x] 4.1 Create `src/repositories/familyTreeRepository.ts`
    - Implement `fetchFamilyTrees(ownerId: string): Promise<FamilyTree[]>` — query with `where('ownerId', '==', ownerId)` and `orderBy('updatedAt', 'desc')`; return empty array for empty/null `ownerId` without making a Firestore request; map Timestamps to ISO strings via `toISOString`; map `shareWith` field (default to `[]` if missing in legacy documents)
    - Implement `createFamilyTree(data: CreateFamilyTreeInput): Promise<FamilyTree>` — validate `name.trim().length > 0` and `name.trim().length <= 100` (throw descriptive error otherwise); call `addDoc` with `serverTimestamp()` for `createdAt`/`updatedAt`, `totalMembers: 0`, and `shareWith: data.shareWith ?? []`; wrap in `withRetry`
    - Implement `updateFamilyTree(treeId: string, patch: Partial<UpdateFamilyTreeInput>): Promise<void>` — validate name if present; call `updateDoc` with `serverTimestamp()` for `updatedAt`; wrap in `withRetry`
    - Implement `deleteFamilyTree(treeId: string): Promise<void>` — fetch all member doc refs from subcollection, batch delete all members + tree doc in a single `writeBatch` commit
    - Implement `getFamilyTree(treeId: string): Promise<FamilyTree | null>`
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 3.6, 3.8, 3.10, 3.11, 3.12_

  - [x] 4.2 Write property test for `fetchFamilyTrees` ownership invariant
    - **Property 2: Ownership Invariant** — every tree returned by `fetchFamilyTrees(uid)` satisfies `tree.ownerId === uid`
    - **Validates: Requirements 2.1**
    - Mock Firestore `getDocs` to return a mix of trees with different `ownerId` values; assert the repository filters correctly
    - Use `fc.string()` for uid generation
    - _Requirements: 2.1_

- [x] 5. Implement MemberRepository
  - [x] 5.1 Create `src/repositories/memberRepository.ts`
    - Implement `fetchMembers(treeId: string): Promise<Member[]>` — query `family_trees/{treeId}/members` subcollection; map `MemberDocument` to `Member` (convert `createdAt` Timestamp to ISO string)
    - Implement `createMember(treeId: string, data: CreateMemberInput): Promise<Member>` — validate `fullName.trim().length > 0`, `gender` is `'male'|'female'`, `spouseIds`/`childrenIds` do not contain the new member's own id (throw descriptive errors); call `addDoc`; wrap in `withRetry`
    - Implement `updateMember(treeId: string, memberId: string, patch: Partial<UpdateMemberInput>): Promise<void>` — call `updateDoc` with `serverTimestamp()` for `updatedAt`; wrap in `withRetry`
    - Implement `deleteMember(treeId: string, memberId: string): Promise<void>` — batch write to remove deleted member's id from all `spouseIds`, `childrenIds`, `fatherId`, `motherId` fields of sibling members; wrap in `withRetry`
    - Implement `batchUpdateRelationships(treeId: string, updates: RelationshipUpdate[]): Promise<void>` — single `writeBatch` commit for all relationship updates; skip non-existent member ids silently
    - Implement `getAllMemberRefs(treeId: string): Promise<DocumentReference[]>` — returns all doc refs in the members subcollection (used by cascade delete)
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.9, 4.10, 4.11_

  - [x] 5.2 Add `totalMembers` transaction to `createMember` and `deleteMember`
    - In `createMember`: after `addDoc` succeeds, use a Firestore `runTransaction` to atomically increment `totalMembers` on the parent `family_trees/{treeId}` document
    - In `deleteMember`: after batch relationship cleanup, use a Firestore `runTransaction` to atomically decrement `totalMembers` (floor at 0)
    - _Requirements: 4.6_

  - [x] 5.3 Write property test for relationship symmetry
    - **Property 4: Relationship Symmetry** — after `batchUpdateRelationships`, if member A lists member B as a spouse, member B lists member A as a spouse
    - **Validates: Requirements 4.4**
    - Generate arbitrary pairs of member ids with `fc.tuple(fc.string(), fc.string())` and assert bidirectionality
    - _Requirements: 4.4_

  - [x] 5.4 Write property test for `totalMembers` consistency
    - **Property 5: totalMembers Consistency** — `FamilyTree.totalMembers` always equals the count of member documents in its subcollection after any create/delete operation
    - **Validates: Requirements 4.6**
    - Use `fc.integer({ min: 0, max: 20 })` to generate member counts; simulate creates and deletes; assert `totalMembers === actual count`
    - _Requirements: 4.6_

- [x] 6. Create useAuthStore
  - [x] 6.1 Create `src/store/useAuthStore.ts`
    - State fields: `uid: string | null`, `isAuthenticated: boolean`, `authError: string | null`
    - Actions: `setUid(uid: string | null): void` — sets `uid` and `isAuthenticated: uid !== null`
    - Actions: `setAuthError(error: string | null): void`
    - Actions: `clearAuth(): void` — sets `uid: null`, `isAuthenticated: false`, `authError: null`
    - Initial state: `uid: null`, `isAuthenticated: false`, `authError: null`
    - _Requirements: 6.5_

- [x] 7. Checkpoint — Foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Extend useFamilyTreeStore with Firestore actions
  - [x] 8.1 Add Firestore state fields and `loadFamilyTrees` to `src/store/useFamilyTreeStore.ts`
    - Add state fields: `loading: boolean` (initial: `false`), `error: string | null` (initial: `null`)
    - Add `loadFamilyTrees(uid: string): Promise<void>` action:
      - If `uid` is empty/null: set `loading: false`, `familyTrees: []`, return without Firestore call
      - Set `loading: true`, `error: null`
      - Call `familyTreeRepository.fetchFamilyTrees(uid)`; on success set `familyTrees` and `loading: false`
      - On error: classify with `isPermissionError`/`isNetworkError`; set `loading: false`, preserve existing `familyTrees`, set `error` to localized string
      - On `permission-denied`: set `error: 'Akses ditolak. Silakan masuk kembali.'` and call `AuthContext.signOut()`
      - On network error: set `error: 'Tidak ada koneksi internet.'`
    - Remove dummy Jokowi data and `members` array from initial state (members now live in `useMemberStore`)
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.9, 5.4, 5.5, 5.6_

  - [x] 8.2 Add `createFamilyTree` (Firestore) to `src/store/useFamilyTreeStore.ts`
    - Replace existing local-only `addFamilyTree` with `createFamilyTree(name: string, uid: string): Promise<void>`
    - Optimistic insert: generate `tempId = 'temp_' + Date.now()`, prepend optimistic `FamilyTree` to `familyTrees` with `shareWith: []`
    - Call `familyTreeRepository.createFamilyTree({ name: name.trim(), description: null, ownerId: uid, shareWith: [] })`
    - On success: replace temp entry (matched by `tempId`) with real `FamilyTree` from repository
    - On failure: remove temp entry, restore pre-call state, set `error` to localized message
    - _Requirements: 3.1, 3.2, 3.3, 3.11_

  - [x] 8.3 Add `updateFamilyTree` and `deleteFamilyTree` (Firestore) to `src/store/useFamilyTreeStore.ts`
    - Replace existing local-only `updateFamilyTree` with Firestore-backed version:
      - Optimistic patch: apply patch immediately to matching entry
      - Call `familyTreeRepository.updateFamilyTree(treeId, patch)`
      - On failure: revert entry to pre-call state, set `error`
    - Replace existing local-only `deleteFamilyTree` with Firestore-backed version:
      - Optimistic removal: remove tree from `familyTrees`, call `useMemberStore.clearMembers(treeId)`
      - Call `familyTreeRepository.deleteFamilyTree(treeId)`
      - On failure: call `loadFamilyTrees(uid)` to restore state; if reload also fails, set `error`
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 8.4 Write property test for `createFamilyTree` optimistic rollback
    - **Property 3: Optimistic Rollback Consistency** — if the Firestore write fails, `familyTrees.length` returns to its exact pre-call value
    - **Validates: Requirements 3.3**
    - Seed store with `fc.array(fc.record({ id: fc.string(), name: fc.string() }))` trees; mock repository to reject; assert length unchanged after failed `createFamilyTree`
    - _Requirements: 3.1, 3.3_

- [x] 9. Create useMemberStore
  - [x] 9.1 Create `src/store/useMemberStore.ts`
    - State fields: `membersByTreeId: Record<string, Member[]>` (initial: `{}`), `loadingTreeId: string | null` (initial: `null`), `memberError: string | null` (initial: `null`)
    - Implement `loadMembers(treeId: string): Promise<void>` — set `loadingTreeId: treeId`; fetch from `memberRepository.fetchMembers(treeId)`; store in `membersByTreeId[treeId]`; set `loadingTreeId: null`; on error set `memberError` and `loadingTreeId: null`
    - Implement `addMember(treeId: string, data: Omit<Member, 'id' | 'createdAt'>): Promise<void>` — optimistic insert with `temp_` id; call `memberRepository.createMember`; replace temp with real; on failure remove temp and set `memberError`
    - Implement `updateMember(treeId: string, memberId: string, patch: Partial<Member>): Promise<void>` — optimistic patch; call `memberRepository.updateMember`; on failure revert and set `memberError`
    - Implement `deleteMember(treeId: string, memberId: string): Promise<void>` — optimistic removal; call `memberRepository.deleteMember`; on failure reload via `loadMembers` and set `memberError`
    - Implement `clearMembers(treeId: string): void` — delete `membersByTreeId[treeId]` key
    - Organize state as `membersByTreeId: Record<string, Member[]>` so different trees are independent
    - _Requirements: 4.1, 4.2, 4.3, 4.7, 4.8, 5.8, 6.6_

- [x] 10. Checkpoint — Stores complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Extend auth-context and wire screens
  - [x] 11.1 Extend `src/context/auth-context.tsx` to call `upsertUserDocument` after sign-in
    - Import `authService` from `src/services/firebase/auth`
    - After `signInWithCredential` resolves successfully (before the `finally` block), call `await authService.upsertUserDocument(firebaseUser)` where `firebaseUser` is the result of `signInWithCredential`
    - Wrap the call in try/catch — failure must not block navigation (Requirement 1.4)
    - Also call `useAuthStore.getState().setUid(firebaseUser.uid)` after successful sign-in
    - In `onAuthStateChanged` callback: call `useAuthStore.getState().setUid(firebaseUser?.uid ?? null)`
    - In `signOut`: call `useAuthStore.getState().clearAuth()` after clearing local session
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.5_

  - [x] 11.2 Wire `loadFamilyTrees` on mount in `src/app/(tabs)/index.tsx`
    - Import `useAuth` from `src/context/auth-context` and `useFamilyTreeStore` from store
    - Add `useEffect` that calls `loadFamilyTrees(user.uid)` when `user?.uid` changes (including on mount)
    - Replace hardcoded `OWNER_ID` with `user?.uid` in `handleModalSubmit` — call `createFamilyTree(name, user.uid)` instead of `addFamilyTree`
    - Show loading indicator when `loading === true` (use `ActivityIndicator` from `react-native`)
    - Show error banner when `error` is non-null
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

  - [x] 11.3 Wire `loadMembers` on mount in `src/app/family/[id].tsx`
    - Import `useMemberStore` from `src/store/useMemberStore`
    - Replace `members` selector from `useFamilyTreeStore` with `useMemberStore(s => s.membersByTreeId[treeId] ?? [])`
    - Add `useEffect` that calls `loadMembers(treeId)` when `treeId` changes
    - Wire `updateFamilyTree` and `deleteFamilyTree` to the Firestore-backed store actions (pass `user.uid` to `deleteFamilyTree` for reload on failure)
    - _Requirements: 4.7_

  - [x] 11.4 Wire `useMemberStore` in `src/app/member/[id].tsx`
    - Replace `members` selector from `useFamilyTreeStore` with `useMemberStore`
    - Derive `member` from `useMemberStore(s => s.membersByTreeId[treeId] ?? []).find(m => m.id === id)`
    - Wire `updateMember` and `deleteMember` to `useMemberStore` actions (pass `treeId` as first argument)
    - Read `treeId` from the member object or route params as needed
    - _Requirements: 4.8_

- [x] 12. Create Firestore security rules and indexes
  - [x] 12.1 Create `firestore.rules`
    - Allow read/write on `users/{uid}` only when `request.auth != null && request.auth.uid == uid`
    - Allow read, update, delete on `family_trees/{treeId}` only when `request.auth != null && request.auth.uid == resource.data.ownerId`
    - Allow create on `family_trees/{treeId}` only when `request.auth != null && request.auth.uid == request.resource.data.ownerId`
    - Allow read, create, update, delete on `family_trees/{treeId}/members/{memberId}` only when `request.auth != null` and `get(/databases/$(database)/documents/family_trees/$(treeId)).data.ownerId == request.auth.uid`; deny if parent document does not exist
    - Deny all other paths with a default deny rule
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 12.2 Create `firestore.indexes.json`
    - Define compound index on `family_trees` collection: `ownerId ASC`, `updatedAt DESC`
    - This index is required for `fetchFamilyTrees` query to succeed without a Firestore index error
    - _Requirements: 6.7_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript throughout — all code examples and implementations use TypeScript
- `withRetry` wraps all repository Firestore calls; repositories import it from `src/services/firebase/firestore.ts`
- `useMemberStore` replaces the `members` array that was previously co-located in `useFamilyTreeStore` — the old `members` state and related actions (`addMember`, `removeMember`, `deleteMember`, `updateMember`) are removed from `useFamilyTreeStore` after `useMemberStore` is wired
- Localized error strings: `'Akses ditolak. Silakan masuk kembali.'` for permission errors, `'Tidak ada koneksi internet.'` for network errors
- `firestore.rules` and `firestore.indexes.json` are deployed via `firebase deploy --only firestore` — not executed by the coding agent
- Property tests use `fast-check` v4 (`fc.assert`, `fc.asyncProperty`) — already installed in devDependencies
- Each property test file should be co-located with its implementation (e.g., `src/services/firebase/__tests__/firestore.test.ts`)
- `shareWith: string[]` is stored on every `FamilyTree` and `FamilyTreeDocument`; it defaults to `[]` on creation and is mapped from Firestore with a `?? []` fallback for legacy documents that predate this field. No sharing UI is implemented in Step 6 — the field is schema-only groundwork for a future sharing feature.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1"] },
    { "id": 6, "tasks": ["5.2"] },
    { "id": 7, "tasks": ["5.3", "5.4", "6.1"] },
    { "id": 8, "tasks": ["8.1"] },
    { "id": 9, "tasks": ["8.2"] },
    { "id": 10, "tasks": ["8.3"] },
    { "id": 11, "tasks": ["8.4", "9.1"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["11.2", "11.3"] },
    { "id": 14, "tasks": ["11.4", "12.1", "12.2"] }
  ]
}
```

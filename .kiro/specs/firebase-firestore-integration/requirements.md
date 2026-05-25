# Requirements Document

## Introduction

This document specifies the requirements for integrating Firebase Authentication user documents and Cloud Firestore persistence into the AsalUsul mobile app (Step 6). The integration replaces local-only Zustand state with a layered service architecture — Firebase services → repositories → Zustand stores → screens — ensuring all Firebase SDK calls remain outside UI components. The scope covers authenticated single-user CRUD for user documents, family trees, and members. Collaboration, media upload, push notifications, and advanced permissions are explicitly out of scope.

## Glossary

- **AuthService**: The service module at `src/services/firebase/auth.ts` responsible for orchestrating post-authentication Firestore side effects.
- **FirestoreHelpers**: The utility module at `src/services/firebase/firestore.ts` providing retry logic, error classification, and Timestamp conversion shared across all repositories.
- **UserRepository**: The repository module at `src/repositories/userRepository.ts` responsible for all Firestore reads and writes to the `users/{uid}` collection.
- **FamilyTreeRepository**: The repository module at `src/repositories/familyTreeRepository.ts` responsible for all Firestore reads and writes to the `family_trees/{treeId}` collection.
- **MemberRepository**: The repository module at `src/repositories/memberRepository.ts` responsible for all Firestore reads and writes to the `family_trees/{treeId}/members/{memberId}` subcollection.
- **useAuthStore**: The Zustand store at `src/store/useAuthStore.ts` holding auth state (uid, isAuthenticated, authError) accessible outside React components.
- **useFamilyTreeStore**: The extended Zustand store at `src/store/useFamilyTreeStore.ts` syncing family tree state with Firestore.
- **useMemberStore**: The new Zustand store at `src/store/useMemberStore.ts` holding member state keyed by treeId.
- **UserDocument**: The Firestore document shape stored at `users/{uid}` containing user profile and timestamp fields.
- **FamilyTreeDocument**: The Firestore document shape stored at `family_trees/{treeId}` containing tree metadata and ownership.
- **MemberDocument**: The Firestore document shape stored at `family_trees/{treeId}/members/{memberId}` containing member profile and relationship fields.
- **upsertUserDocument**: The AuthService operation that creates a UserDocument on first sign-in or updates `lastLoginAt` on subsequent sign-ins.
- **withRetry**: The FirestoreHelpers function that wraps a Firestore operation with exponential backoff retry logic for transient errors.
- **optimistic update**: A UI pattern where the store is updated immediately before the Firestore write completes, with rollback on failure.
- **cascade delete**: The operation that deletes a family tree document and all its member subcollection documents atomically.
- **relationship symmetry**: The invariant that if member A lists member B as a spouse, member B also lists member A as a spouse.
- **totalMembers**: The denormalized integer field on FamilyTreeDocument that must always equal the count of documents in its members subcollection.
- **shareWith**: An array of Firebase Auth UIDs stored on FamilyTreeDocument representing users the owner has chosen to share the tree with. Empty array by default. Reserved for future read-only sharing; no sharing UI is implemented in Step 6.

---

## Requirements

### Requirement 1: User Authentication & Document Management

**User Story:** As a user, I want my profile to be automatically created or updated in Firestore when I sign in with Google, so that my account data is persisted and available across sessions.

#### Acceptance Criteria

1. WHEN a user successfully completes Google Sign-In and Firebase credential exchange succeeds, THE system SHALL ensure the Firestore user document upsert completes before the user is navigated to the home screen.
2. WHEN `upsertUserDocument` is called and no document exists at `users/{uid}`, THE UserRepository SHALL create a new UserDocument with `name` set to `firebaseUser.displayName ?? ''`, `email` set to `firebaseUser.email`, `photoUrl` set to `firebaseUser.photoURL ?? ''`, `provider: 'google'`, and server timestamps for `createdAt`, `updatedAt`, and `lastLoginAt`.
3. WHEN `upsertUserDocument` is called and a document already exists at `users/{uid}`, THE UserRepository SHALL update only the `lastLoginAt` and `updatedAt` fields using server timestamps, leaving all other fields unchanged.
4. IF `upsertUserDocument` encounters any error, THEN THE system SHALL allow sign-in navigation to proceed normally, without surfacing the error to the user.
5. THE UserRepository SHALL map Firestore `DocumentSnapshot` data to `UserDocument` without exposing raw Firestore SDK types to callers.
6. THE UserRepository SHALL apply `serverTimestamp()` for all timestamp fields (`createdAt`, `updatedAt`, `lastLoginAt`) rather than client-generated timestamps.

---

### Requirement 2: Family Tree Firestore Persistence

**User Story:** As an authenticated user, I want my family trees to be loaded from Firestore when I open the app, so that my data persists across sessions and devices.

#### Acceptance Criteria

1. WHEN `fetchFamilyTrees(uid)` is called, THE FamilyTreeRepository SHALL return only `FamilyTree` objects where `ownerId` equals the provided `uid`.
2. WHEN `fetchFamilyTrees(uid)` is called, THE FamilyTreeRepository SHALL return results ordered by `updatedAt` descending.
3. WHEN `fetchFamilyTrees(uid)` is called and no trees exist for the given `uid`, THE FamilyTreeRepository SHALL return an empty array.
4. WHILE a user is authenticated and WHEN the home screen mounts or the authenticated `uid` changes, THE useFamilyTreeStore SHALL call `loadFamilyTrees(uid)` to replace the current in-memory family trees with data fetched from Firestore.
5. WHEN `loadFamilyTrees` is in progress, THE useFamilyTreeStore SHALL set `loading` to `true` and `error` to `null`.
6. WHEN `loadFamilyTrees` completes successfully, THE useFamilyTreeStore SHALL set `loading` to `false` and replace `familyTrees` with the fetched array.
7. IF `loadFamilyTrees` encounters an error, THEN THE useFamilyTreeStore SHALL set `loading` to `false`, preserve the existing `familyTrees` value, and set `error` to a non-empty string describing the failure.
8. THE FamilyTreeRepository SHALL convert Firestore `Timestamp` fields (`createdAt`, `updatedAt`) to ISO 8601 strings in UTC format (ending in `Z`) before returning `FamilyTree` objects to the store; if a Timestamp field is null or missing, the corresponding string field SHALL be set to the current time in ISO 8601 UTC format.
9. IF `loadFamilyTrees` is called with an empty or null `uid`, THEN THE useFamilyTreeStore SHALL set `loading` to `false` and `familyTrees` to an empty array without making any Firestore request.

---

### Requirement 3: Family Tree CRUD Operations

**User Story:** As an authenticated user, I want to create, update, and delete family trees with immediate UI feedback, so that the app feels responsive even on slow connections.

#### Acceptance Criteria

1. WHEN `createFamilyTree(name, uid)` is called, THE useFamilyTreeStore SHALL immediately insert an optimistic `FamilyTree` entry with a temporary id prefixed `temp_` into `familyTrees` before the Firestore write begins.
2. WHEN the Firestore write for `createFamilyTree` succeeds, THE useFamilyTreeStore SHALL replace the optimistic entry (matched by the `temp_` id) with the real `FamilyTree` returned by FamilyTreeRepository, preserving the real Firestore-generated id.
3. IF the Firestore write for `createFamilyTree` fails, THEN THE useFamilyTreeStore SHALL remove the optimistic entry from `familyTrees` and set `error` to a non-technical, localized error message, so that `familyTrees` returns to its exact pre-call state.
4. WHEN `updateFamilyTree(treeId, patch)` is called, THE useFamilyTreeStore SHALL immediately apply the patch to the matching entry in `familyTrees` before the Firestore write begins.
5. IF the Firestore write for `updateFamilyTree` fails, THEN THE useFamilyTreeStore SHALL revert the matching entry in `familyTrees` to its pre-call state and set `error` to a non-technical, localized error message.
6. WHEN `updateFamilyTree(treeId, patch)` Firestore write succeeds, THE FamilyTreeRepository SHALL persist the updated `name` and/or `description` to Firestore and update `updatedAt` with a server timestamp.
7. WHEN `deleteFamilyTree(treeId)` is called, THE useFamilyTreeStore SHALL immediately remove the tree from `familyTrees` and call `useMemberStore.clearMembers(treeId)` before the Firestore operation begins.
8. WHEN `deleteFamilyTree(treeId)` is executed, THE FamilyTreeRepository SHALL delete all documents in the `family_trees/{treeId}/members` subcollection and the `family_trees/{treeId}` document atomically in a single Firestore batch commit.
9. IF the Firestore batch commit for `deleteFamilyTree` fails, THEN THE useFamilyTreeStore SHALL call `loadFamilyTrees(uid)` to restore consistent state; if that reload also fails, `error` SHALL be set to a non-technical, localized error message.
10. IF `createFamilyTree` or `updateFamilyTree` is called with a `name` that is empty after trimming or exceeds 100 characters, THEN THE FamilyTreeRepository SHALL throw an error indicating the specific validation violation, without performing any Firestore write.
11. WHEN a new `FamilyTree` is created, THE FamilyTreeRepository SHALL initialize `shareWith` to an empty array `[]` in the Firestore document.
12. THE `FamilyTree` interface and `FamilyTreeDocument` SHALL include a `shareWith: string[]` field representing the array of Firebase Auth UIDs the owner has shared the tree with; this field SHALL default to `[]` and SHALL be persisted to and read from Firestore.

---

### Requirement 4: Member Firestore Persistence

**User Story:** As an authenticated user, I want to add, update, and delete family members with relationship data persisted to Firestore, so that the family tree structure is accurately stored and retrieved.

#### Acceptance Criteria

1. WHEN `addMember(treeId, memberData)` is called, THE useMemberStore SHALL immediately insert an optimistic `Member` entry with a temporary id (prefixed `temp_`) into `membersByTreeId[treeId]` before the Firestore write begins.
2. WHEN the Firestore write for `addMember` succeeds, THE useMemberStore SHALL replace the optimistic entry with the real `Member` returned by MemberRepository, preserving the real Firestore-generated id.
3. IF the Firestore write for `addMember` fails, THEN THE useMemberStore SHALL remove the optimistic entry from `membersByTreeId[treeId]` and set `memberError` to a non-technical, localized error message.
4. WHEN a member is created with `spouseIds` referencing existing members, THE MemberRepository SHALL use a Firestore batch write to update each referenced member's `spouseIds` array to include the new member's id; IF any referenced `spouseId` does not exist in the subcollection, THEN the batch SHALL still commit for the members that do exist, and the non-existent id SHALL be silently skipped.
5. WHEN a member is deleted, THE MemberRepository SHALL use a Firestore batch write to remove the deleted member's id from all `spouseIds`, `childrenIds`, `fatherId`, and `motherId` fields of other members in the same tree; IF the batch write fails, THEN `memberError` SHALL be set to a non-technical, localized error message.
6. WHEN a member is created or deleted, THE MemberRepository SHALL atomically increment or decrement the `totalMembers` field on the parent `FamilyTreeDocument` using a Firestore transaction, so that `totalMembers` always equals the actual count of member documents in the subcollection.
7. WHEN `loadMembers(treeId)` is called, THE useMemberStore SHALL set `loadingTreeId` to `treeId`, fetch all members from the `family_trees/{treeId}/members` subcollection, store them in `membersByTreeId[treeId]`, and then set `loadingTreeId` to `null`; IF the fetch fails, THEN `memberError` SHALL be set to a non-technical, localized error message and `loadingTreeId` SHALL be set to `null`.
8. WHEN `updateMember(treeId, memberId, patch)` is called, THE useMemberStore SHALL immediately apply the patch to the matching entry in `membersByTreeId[treeId]` before the Firestore write begins; IF the Firestore write fails, THEN the entry SHALL be reverted to its pre-call state and `memberError` SHALL be set to a non-technical, localized error message.
9. IF `createMember` is called with a `fullName` that is empty after trimming, THEN THE MemberRepository SHALL throw a validation error without performing any Firestore write.
10. IF `createMember` is called with a `gender` value that is not `'male'` or `'female'`, THEN THE MemberRepository SHALL throw a validation error without performing any Firestore write.
11. IF `createMember` is called with `spouseIds` or `childrenIds` containing the member's own id, THEN THE MemberRepository SHALL throw a validation error without performing any Firestore write.

---

### Requirement 5: Error Handling & Resilience

**User Story:** As a user, I want the app to handle network failures and permission errors gracefully, so that I receive clear feedback and the app remains usable under adverse conditions.

#### Acceptance Criteria

1. WHEN `withRetry` wraps a Firestore operation that fails with a `permission-denied` error code, THE FirestoreHelpers SHALL throw the error immediately without performing any retry attempts.
2. WHEN `withRetry` wraps a Firestore operation that fails with a Firebase error code of `unavailable`, `deadline-exceeded`, or a `TypeError` (network fetch failure), THE FirestoreHelpers SHALL retry the operation up to `maxAttempts` times (default: 3) using exponential backoff where the delay before attempt `n` is `min(baseDelayMs * 2^(n-1) + jitter, maxDelayMs)` with `baseDelayMs = 500`, `maxDelayMs = 8000`, and `jitter` being a random value in `[0, 100)` ms.
3. WHEN `withRetry` exhausts all retry attempts, THE FirestoreHelpers SHALL throw the last error to the caller without swallowing it.
4. WHEN any Firestore operation returns a `permission-denied` error, THE useFamilyTreeStore or useMemberStore SHALL set the error state to `'Akses ditolak. Silakan masuk kembali.'`.
5. WHEN any Firestore operation returns a `permission-denied` error, THE system SHALL trigger `AuthContext.signOut()` to clear the invalid session.
6. WHEN any Firestore operation returns a network error after all retries are exhausted, THE useFamilyTreeStore or useMemberStore SHALL set the error state to `'Tidak ada koneksi internet.'`.
7. WHEN `withRetry` wraps a Firestore operation that fails with a Firebase error code of `invalid-credential` or `user-token-expired` (as classified by `isAuthError()`), THE FirestoreHelpers SHALL throw the error immediately without performing any retry attempts.
8. IF a Firestore operation fails after an optimistic update has been applied, THEN THE store SHALL restore the affected state slice to its exact pre-call value and set the error field to a non-empty string.

---

### Requirement 6: Firebase Service Architecture

**User Story:** As a developer, I want all Firebase SDK calls isolated in the service and repository layers, so that UI components remain free of Firebase dependencies and the codebase is maintainable and testable.

#### Acceptance Criteria

1. THE Firebase service layer SHALL expose `app`, `auth`, and `db` (Firestore instance) as singletons re-exported from `src/services/firebase/config.ts`, reusing the existing Firebase app initialized in `src/lib/firebase.ts`.
2. THE FirestoreHelpers SHALL provide a `toISOString(timestamp: Timestamp): string` function that converts Firestore `Timestamp` objects to ISO 8601 strings in UTC format ending with the `Z` suffix (e.g., `"2024-01-15T10:30:00.000Z"`); the function SHALL be deterministic for the same input Timestamp value.
3. THE FirestoreHelpers SHALL provide an `isPermissionError(error: unknown): boolean` function that returns `true` when the error is a `FirebaseError` with code `permission-denied` or `insufficient-permissions`, and returns `false` for all other inputs including non-Firebase errors.
4. THE FirestoreHelpers SHALL provide an `isNetworkError(error: unknown): boolean` function that returns `true` when the error is a `FirebaseError` with code `unavailable` or `deadline-exceeded`, and returns `false` for all other inputs including non-Firebase errors.
5. THE useAuthStore SHALL expose `uid: string | null`, `isAuthenticated: boolean`, and `authError: string | null` state fields, and `setUid(uid: string | null): void`, `setAuthError(error: string | null): void`, and `clearAuth(): void` action functions; WHEN `clearAuth()` is called, THEN `uid` SHALL be set to `null`, `isAuthenticated` SHALL be set to `false`, and `authError` SHALL be set to `null`.
6. THE useMemberStore SHALL organize member state as `membersByTreeId: Record<string, Member[]>` so that members for different trees are loaded and cleared independently.
7. WHERE the Firestore compound index on `(ownerId ASC, updatedAt DESC)` is not present, THE FamilyTreeRepository query for `fetchFamilyTrees` SHALL reject with a `FirebaseError` (Firestore index error) rather than returning incorrect or unordered results; the `firestore.indexes.json` file SHALL define this compound index.

---

### Requirement 7: Security

**User Story:** As a user, I want my family tree data to be protected by server-side security rules, so that no other user can read or modify my data even if they know my tree ids.

#### Acceptance Criteria

1. THE Firestore security rules SHALL allow a user to read and write `users/{uid}` only when `request.auth != null && request.auth.uid == uid`; all other access SHALL be denied.
2. THE Firestore security rules SHALL allow a user to read, update, and delete `family_trees/{treeId}` only when `request.auth != null && request.auth.uid == resource.data.ownerId`.
3. THE Firestore security rules SHALL allow a user to create `family_trees/{treeId}` only when `request.auth != null && request.auth.uid == request.resource.data.ownerId`.
4. THE Firestore security rules SHALL allow a user to read, create, update, and delete `family_trees/{treeId}/members/{memberId}` only when `request.auth != null` and the authenticated user is the owner of the parent `family_trees/{treeId}` document, verified via a `get()` call in the rule; IF the parent document does not exist, THEN the operation SHALL be denied.
5. THE Firestore security rules SHALL deny all reads and writes to any collection path not explicitly covered by the rules above, including unauthenticated requests to any path.
6. WHEN a Firestore operation is attempted by a user who does not own the target document, THE Firestore security rules SHALL reject the operation with a `permission-denied` error before any data is read or written.
7. WHEN a Firestore operation is attempted without a valid authentication token (unauthenticated), THE Firestore security rules SHALL reject the operation with a `permission-denied` error for all collection paths.

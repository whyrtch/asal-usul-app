# Design Document — Family Tree Sharing (Phase 2)

## Overview

Sharing memperluas arsitektur berlapis yang ada (UI → store → repository → service → Firebase) dengan:
- koleksi/subkoleksi baru (`access`, `invitations`),
- security rules berbasis peran (menegakkan semua grant — **tanpa Cloud Functions**),
- field `status` pada `invitations` sebagai "flag" state yang transisinya dijaga rules,
- derivasi `role` per pohon untuk gating UI.

Mengikuti pola yang sudah mapan: SDK Firebase diisolasi di repository/service; store memakai optimistic update + rollback + `classifyError` + `recordError`. Berjalan penuh di plan gratis (Spark).

## Architecture

Aliran sama seperti fitur lain, dengan penambahan layer akses (semua di klien + rules, tanpa server):

```
UI (gated by role) → useSharingStore / useFamilyTreeStore
   → accessRepository / invitationRepository / familyTreeRepository
      → firebase/firestore
Security Rules → role-based read/write enforcement + invitee self-grant validation
```

Prinsip: pembacaan/penulisan dibatasi rules berbasis peran. Pemberian peran (AccessDoc) saat menerima undangan dilakukan oleh **klien penerima** namun **divalidasi ketat oleh rules** terhadap dokumen undangan (email terverifikasi + peran sama + belum kedaluwarsa) — sehingga klien tidak bisa memberi dirinya peran tanpa undangan sah.

## Data Models

### Firestore paths
```
family_trees/{treeId}                          # existing (ownerId, ...)
family_trees/{treeId}/members/{memberId}       # existing
family_trees/{treeId}/access/{uid}             # NEW — AccessDoc
invitations/{inviteId}                         # NEW — Invitation
```

### Types (src/types/sharing.ts — NEW)
```ts
export type Role = 'owner' | 'editor' | 'viewer';
export type AccessRole = Exclude<Role, 'owner'>; // 'editor' | 'viewer'

export interface AccessDocument {
  uid: string;          // == doc id
  treeId: string;
  role: AccessRole;
  invitedBy: string;
  createdAt: Timestamp;
}

export type InvitationStatus =
  | 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface InvitationDocument {
  id: string;
  treeId: string;
  treeName: string;
  inviterUid: string;
  inviteeEmail: string; // normalized lowercase
  role: AccessRole;
  status: InvitationStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

App-level (ISO strings) variants mirror the existing `familyTree.ts`/`firestore.ts` split. `FamilyTree` gains an optional derived `role?: Role` (not persisted) populated when listing shared trees.

> `shareWith: string[]` on `family_trees` is **deprecated** — kept for backward-compat read, no longer written.

## Components and Interfaces

### Layers

### Repository (src/repositories/)
- **accessRepository.ts**
  - `fetchAccessList(treeId): Promise<AccessDocument[]>` (owner-only by rules)
  - `setAccessRole(treeId, uid, role): Promise<void>`
  - `revokeAccess(treeId, uid): Promise<void>`
  - `getMyAccess(treeId, uid): Promise<AccessDocument | null>`
  - `fetchSharedTreeRefs(uid): Promise<{ treeId: string; role: AccessRole }[]>` via `collectionGroup('access')` where `uid == uid`
- **invitationRepository.ts**
  - `createInvitation(input): Promise<InvitationDocument>` (validates email, dedupes pending)
  - `fetchInvitationsForTree(treeId): Promise<InvitationDocument[]>` (owner)
  - `fetchMyPendingInvitations(email): Promise<InvitationDocument[]>` (invitee)
  - `declineInvitation(inviteId): Promise<void>`
- **familyTreeRepository.ts** (extend)
  - `fetchSharedFamilyTrees(uid): Promise<FamilyTree[]>` — resolve refs from `fetchSharedTreeRefs`, `getDoc` each tree, attach `role`.

### Accept flow (rules-only, no Cloud Functions)

The invitation's `status` field is the state "flag"; security rules enforce all transitions and the AccessDoc grant. No server code / Blaze plan required.

Accept (client, in a single `writeBatch`):
1. `set` `family_trees/{treeId}/access/{uid}` = `{ uid, treeId, role, invitedBy, createdAt: serverTimestamp() }` (create-once).
2. `update` `invitations/{inviteId}` → `status: 'accepted'`.

Rules gate the AccessDoc create by `get()`-ing the referenced invitation and verifying:
- `request.auth.token.email == invitation.inviteeEmail` (email is Google-verified),
- `invitation.treeId == treeId`,
- `request.resource.data.role == invitation.role` (no privilege escalation),
- `invitation.status == 'pending'` and `invitation.expiresAt > request.time`,
- `request.resource.data.role != 'owner'`.

The invitee passes `inviteId` (carried in the AccessDoc payload as `invitedVia` or supplied to the repository) so rules can locate the invitation deterministically via `get(/invitations/$(inviteId))`.

Decline / expire: client `update`s `invitations/{inviteId}.status` to `'declined'`/`'expired'`; rules allow only when email matches.

Idempotency: AccessDoc uses **create-once** semantics — re-accepting fails the create (already exists), so no duplicates.

> Invite delivery is manual: owner shares a link/code `asalusul://invite/{inviteId}`. No automatic email (would need Functions/email provider). If the project later upgrades to Blaze, an optional `acceptInvitation` Cloud Function + email trigger can replace the client write without changing the data model.

### Stores (src/store/)
- **useSharingStore.ts** (NEW): `collaborators` (per treeId), `invitationsByTree`, `myInvitations`, loading/error; actions: `loadCollaborators`, `invite`, `revoke`, `changeRole`, `loadMyInvitations`, `accept`, `decline`. Optimistic where safe; `classifyError` + `recordError`.
- **useFamilyTreeStore.ts** (extend): `loadFamilyTrees` also loads shared trees and merges; each tree carries derived `role`.

### Role derivation (src/utils/roles.ts — NEW, pure + tested)
```ts
export function deriveRole(tree, uid, access?): Role | null
// owner if tree.ownerId === uid
// else access.role if present
// else null (no access)
export function canEditMembers(role): boolean   // owner | editor
export function canManageTree(role): boolean     // owner
export function canManageAccess(role): boolean   // owner
```
Pure functions → unit + property tests (gating logic must be correct).

## Security Rules (firestore.rules — extend)

Helper functions:
```
function isSignedIn() { return request.auth != null; }
function treeData(treeId) { return get(/databases/$(db)/documents/family_trees/$(treeId)).data; }
function isOwner(treeId) { return isSignedIn() && treeData(treeId).ownerId == request.auth.uid; }
function accessRole(treeId) {
  return get(/databases/$(db)/documents/family_trees/$(treeId)/access/$(request.auth.uid)).data.role;
}
function hasAccess(treeId) {
  return isSignedIn() && exists(/databases/$(db)/documents/family_trees/$(treeId)/access/$(request.auth.uid));
}
function isEditor(treeId) { return hasAccess(treeId) && accessRole(treeId) == 'editor'; }
```

Rules sketch:
- `family_trees/{treeId}`: `read` if `isOwner || hasAccess`; `create` if owner of new doc; `update,delete` if `isOwner` (and ownerId immutable on update).
- `.../members/{memberId}`: `read` if `isOwner || hasAccess`; `write` if `isOwner || isEditor`.
- `.../access/{uid}`:
  - `read` if `isOwner(treeId) || request.auth.uid == uid`.
  - `update,delete,list` if `isOwner(treeId)`.
  - `create` if `isOwner(treeId)` OR invitee self-grant: `request.auth.uid == uid` AND a referenced pending, non-expired invitation matches (email + treeId + role). Deny if incoming `role == 'owner'`.
- `invitations/{inviteId}`:
  - `create` if `isOwner(request.resource.data.treeId)` and inviter == auth uid.
  - `read` if inviter owner OR `request.auth.token.email == resource.data.inviteeEmail`.
  - `update` if invitee email matches (status → accepted/declined/expired) OR owner (status → revoked); constrained transitions only.
  - AccessDoc grant on accept is performed by the invitee client and validated by the access `create` rule above (no Cloud Function).

> Note: heavy `get()` usage in rules costs reads; acceptable at this scale. Must be audited (`firebase-security-rules-auditor`) and covered by emulator tests before release.

## UI

- **CollaboratorsScreen / Sheet** (owner): list collaborators + role + revoke; invite form (email + role). Reachable from `FamilySettingsSheet`.
- **InvitationsScreen / inbox**: list my pending invitations (accept/decline). Entry point: Home badge or Settings.
- **Home**: section/labels for owned vs shared trees; "Dibagikan" badge with role.
- **Deep link**: `asalusul://invite/{inviteId}` → opens accept screen (uses existing `scheme`).
- **Detail screen gating**: derive `role`; hide controls per Requirement 8.

## Observability

Add events: `invite_sent`, `invite_accepted`, `invite_declined`, `access_revoked`, `role_changed`, `shared_tree_opened`. `recordError` in all catch blocks.

## Error Handling

- Semua operasi sharing memakai `classifyError` (pesan lokal) + `recordError` (observability) di blok catch; kegagalan tidak boleh meng-crash app.
- Kasus spesifik dengan pesan khusus: email tidak valid, mengundang diri sendiri, sudah punya akses, undangan kedaluwarsa, undangan tidak ditemukan/akses ditolak.
- Operasi optimistic (invite/revoke) melakukan rollback state lokal saat gagal.
- Cloud Function `acceptInvitation` mengembalikan kode error yang dipetakan ke pesan lokal di klien.

## Correctness Properties

Properti pure (role logic, email normalization) diuji via fast-check; properti rules diuji via emulator. Definisi lengkap di `requirements.md`.

### Property 1: Role enum invariant
For any AccessDoc, `role` is `'editor'` or `'viewer'` (never `'owner'`).
**Validates: Requirements 1.3, 7.9**

### Property 2: Access implies membership
A user with read access is the owner OR has an AccessDoc.
**Validates: Requirements 7.1, 7.3**

### Property 3: Editor cannot manage access
Editors cannot create/modify/delete AccessDocs or delete the tree.
**Validates: Requirements 5.5, 7.2, 7.5**

### Property 4: Accept idempotency
Accepting an invitation N times yields exactly one AccessDoc.
**Validates: Requirements 4.4**

### Property 5: Revoke removes access
Deleting an AccessDoc removes all read/write access and shared-with-me visibility.
**Validates: Requirements 5.2, 6.3**

### Property 6: Email normalization
Stored `inviteeEmail` equals `email.trim().toLowerCase()`.
**Validates: Requirements 2.4**

### Property 7: Self-invite rejection
Inviting your own email is rejected.
**Validates: Requirements 3.3**

### Property 8: Single pending invite per pair
At most one `pending` invitation per `(treeId, inviteeEmail)`.
**Validates: Requirements 2.5**

## Testing Strategy

- **Pure**: `roles.ts` (deriveRole, can* helpers) — unit + property tests.
- **Repositories**: mock `firebase/firestore` (existing pattern) — query shape, email normalization, dedupe.
- **Store**: optimistic + rollback for invite/revoke.
- **Rules**: Firestore emulator tests per role (owner/editor/viewer/none) for trees, members, access, invitations — this is the critical safety net. Includes the **invitee self-grant** path: accept succeeds only with a valid pending invitation (email + role + not expired), and is rejected for email mismatch, role escalation, expired, or already-accepted (create-once).
- **Accept flow**: covered by emulator tests (no Cloud Function to unit-test).

## Rollout / Flags

- Gate the feature behind `FEATURE_SHARING` (default off) like `FEATURE_PHOTO_UPLOAD`, so it can ship dark until rules are deployed + audited and Functions are live.

## Owner Actions (infra — cannot be done from code alone)
- Deploy updated `firestore.rules` + composite index for `collectionGroup('access')` on `uid`.
- No Cloud Functions / Blaze plan required (rules-only accept). Works on the free Spark plan.
- Invite delivery is manual (owner shares the link/code); automatic email can be added later if upgraded to Blaze.

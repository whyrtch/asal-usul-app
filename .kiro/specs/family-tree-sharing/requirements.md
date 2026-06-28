# Requirements Document

_Feature: Family Tree Sharing (Phase 2)_

## Introduction

Fitur "Family Tree Sharing" memungkinkan pemilik (owner) sebuah pohon keluarga mengundang pengguna lain untuk **melihat** (Viewer) atau **berkontribusi** (Editor) ke pohon keluarganya. Ini adalah fondasi kolaborasi AsalUsul: silsilah adalah pengetahuan kolektif, sehingga sesepuh/anggota keluarga lain dapat ikut melengkapi data.

Saat ini akses bersifat **owner-only** (lihat `firestore.rules`) dan field `shareWith: string[]` pada `family_trees` belum berfungsi. Fitur ini menggantikan/menambah model akses tersebut, memperluas security rules, dan menambah alur undangan.

> Catatan: dokumen ini menetapkan **keputusan yang direkomendasikan** (ditandai 🟢 KEPUTUSAN). Semua dapat diubah saat review sebelum implementasi.

## Glossary

- **Owner**: Pengguna yang membuat pohon (`family_trees/{treeId}.ownerId`). Hak penuh.
- **Editor**: Pengguna yang diberi akses tulis anggota (tambah/ubah/hapus), tetapi tidak bisa menghapus pohon atau mengelola akses.
- **Viewer**: Pengguna yang hanya bisa membaca pohon dan anggotanya.
- **AccessDoc**: Dokumen di subkoleksi `family_trees/{treeId}/access/{uid}` berisi peran seorang kolaborator.
- **Invitation**: Dokumen di koleksi `invitations/{inviteId}` yang merepresentasikan undangan yang belum/ sudah diterima.
- **Role**: Salah satu dari `'owner' | 'editor' | 'viewer'`.
- **Shared-with-me**: Daftar pohon milik orang lain yang dibagikan ke pengguna saat ini.

## Keputusan Arsitektur (🟢 untuk direview)

- 🟢 **KEPUTUSAN 1 — Model data akses**: gunakan **subkoleksi** `family_trees/{treeId}/access/{uid}` (Opsi B), bukan array `shareWith`. Alasan: skalabel untuk banyak kolaborator, peran per-pengguna, rules bersih, dan mendukung query "shared-with-me" via `collectionGroup`.
- 🟢 **KEPUTUSAN 2 — Peran**: tiga peran `owner` / `editor` / `viewer`. Owner implisit dari `ownerId` (tidak disimpan sebagai AccessDoc).
- 🟢 **KEPUTUSAN 3 — Kanal undangan**: berbasis **email sebagai identitas** + **link/kode undangan** yang dibagikan owner secara manual (mis. WhatsApp). Tidak ada pengiriman email otomatis (menghindari kebutuhan Functions/layanan email). Deep link `asalusul://invite/{inviteId}` membuka layar "Terima Undangan". Undangan kedaluwarsa setelah 14 hari.
- 🟢 **KEPUTUSAN 4 — Pemrosesan terima undangan (tanpa Cloud Functions)**: **rules-only**. Field `status` pada dokumen `invitations` berfungsi sebagai "flag" state, dan **security rules** menegakkan transisi + pembuatan AccessDoc. Saat menerima, klien menulis AccessDoc untuk UID-nya sendiri; rules hanya mengizinkan jika ada undangan `pending` yang cocok (email terverifikasi + peran sama + belum kedaluwarsa). Tidak perlu plan Blaze/billing. Field `shareWith` lama tidak dipakai (deprecated).

---

## Requirements

### Requirement 1: Model Data AccessDoc

**User Story:** Sebagai pengembang, saya ingin model akses per-pengguna yang konsisten, sehingga peran kolaborator tersimpan dan dapat divalidasi rules.

#### Acceptance Criteria

1. THE AccessDoc SHALL be stored at path `family_trees/{treeId}/access/{uid}` where `{uid}` is the collaborator's Firebase Auth UID.
2. THE AccessDoc SHALL contain fields: `uid` (string, equals doc id), `treeId` (string), `role` (`'editor' | 'viewer'`), `invitedBy` (string, inviter UID), `createdAt` (Timestamp).
3. THE AccessDoc `role` field SHALL be exactly `'editor'` or `'viewer'` (never `'owner'`; ownership is tracked by `family_trees.ownerId`).
4. WHEN an AccessDoc is created, THE system SHALL set `uid` equal to the document id and `createdAt` to a server timestamp.
5. THE system SHALL treat the absence of an AccessDoc (and not being owner) as "no access".

### Requirement 2: Model Data Invitation

**User Story:** Sebagai owner, saya ingin undangan tercatat dengan status yang jelas, sehingga saya bisa melacak dan mencabutnya.

#### Acceptance Criteria

1. THE Invitation SHALL be stored at path `invitations/{inviteId}` with Firestore-generated id.
2. THE Invitation SHALL contain fields: `treeId` (string), `treeName` (string), `inviterUid` (string), `inviteeEmail` (string, lowercase-normalized), `role` (`'editor' | 'viewer'`), `status` (`'pending' | 'accepted' | 'declined' | 'revoked' | 'expired'`), `createdAt` (Timestamp), `expiresAt` (Timestamp).
3. WHEN an Invitation is created, THE system SHALL set `status` to `'pending'` and `expiresAt` to 14 days after `createdAt`.
4. THE system SHALL normalize `inviteeEmail` to lowercase, trimmed.
5. THE system SHALL NOT allow two `pending` invitations for the same `(treeId, inviteeEmail)` pair (re-invite updates the existing one).

### Requirement 3: Membuat Undangan

**User Story:** Sebagai owner, saya ingin mengundang seseorang via email dengan peran tertentu, sehingga mereka bisa mengakses pohon saya.

#### Acceptance Criteria

1. WHEN the owner submits an invite with a valid email and role, THE system SHALL create (or update an existing pending) Invitation with `status: 'pending'`.
2. IF the email is empty or invalid, THEN THE system SHALL reject the invite with a localized validation message and SHALL NOT write to Firestore.
3. IF the invitee email equals the owner's own email, THEN THE system SHALL reject the invite (cannot invite yourself).
4. IF an AccessDoc already exists for the invitee, THEN THE system SHALL reject the invite as "already has access".
5. WHILE an invite is being created, THE UI SHALL show a loading state and disable the submit control.
6. WHEN invite creation fails, THE system SHALL surface a localized error and SHALL NOT leave a partial/duplicate Invitation.

### Requirement 4: Menerima / Menolak Undangan

**User Story:** Sebagai pengguna yang diundang, saya ingin menerima atau menolak undangan, sehingga saya mendapat (atau menolak) akses ke pohon.

#### Acceptance Criteria

1. WHEN an authenticated user whose verified email matches a `pending` Invitation accepts it, THE client SHALL create an AccessDoc (`access/{own uid}`) with the invitation's `role` and set the Invitation `status` to `'accepted'`, both gated by security rules.
2. WHEN a user declines a `pending` Invitation addressed to them, THE system SHALL set its `status` to `'declined'` and SHALL NOT create an AccessDoc.
3. IF an Invitation is past `expiresAt` when an accept is attempted, THEN THE rules SHALL reject the AccessDoc write; the client SHALL set `status` to `'expired'`.
4. THE accept operation SHALL be idempotent: AccessDoc creation SHALL be create-once (rules forbid re-create), so accepting an already-accepted invitation SHALL NOT create duplicate AccessDocs.
5. THE rules SHALL only permit the AccessDoc self-grant when `request.auth.token.email == invitation.inviteeEmail`, `invitation.treeId` matches, `invitation.role` equals the role being written, and `invitation.status == 'pending'` and not expired.

### Requirement 5: Mengelola & Mencabut Akses

**User Story:** Sebagai owner, saya ingin melihat daftar kolaborator dan mencabut akses kapan saja, sehingga saya mengontrol siapa yang bisa mengakses pohon.

#### Acceptance Criteria

1. THE system SHALL allow the owner to list all AccessDocs (collaborators) of a tree.
2. WHEN the owner revokes a collaborator, THE system SHALL delete that AccessDoc, after which the collaborator immediately loses read/write access (enforced by rules).
3. WHEN the owner revokes access, THE system SHALL also mark any related `accepted` Invitation as `'revoked'` (best-effort).
4. THE system SHALL allow the owner to change a collaborator's role between `'editor'` and `'viewer'`.
5. THE system SHALL NOT allow a non-owner to list, create, modify, or delete AccessDocs.

### Requirement 6: Daftar "Dibagikan ke Saya"

**User Story:** Sebagai pengguna, saya ingin melihat pohon yang dibagikan ke saya di Home, sehingga saya dapat membukanya.

#### Acceptance Criteria

1. THE system SHALL query AccessDocs where `uid == currentUser.uid` (via `collectionGroup('access')`) to determine shared trees.
2. THE Home screen SHALL present trees the user owns and trees shared with the user, visually distinguishing shared trees (e.g. a "Dibagikan" badge with the role).
3. WHEN a shared tree's access is revoked, THE next load SHALL NOT include that tree for the affected user.
4. WHEN the user has no shared trees, THE system SHALL render only owned trees (no error).

### Requirement 7: Security Rules — Firestore

**User Story:** Sebagai pemilik data keluarga, saya ingin akses dibatasi ketat sesuai peran, sehingga data hanya bisa dibaca/ditulis pihak berwenang.

#### Acceptance Criteria

1. THE rules SHALL allow `read` on `family_trees/{treeId}` when the requester is the owner OR has any AccessDoc (`owner | editor | viewer`).
2. THE rules SHALL allow `update`/`delete` on `family_trees/{treeId}` only for the owner.
3. THE rules SHALL allow `read` on `family_trees/{treeId}/members/{memberId}` for owner, editor, or viewer.
4. THE rules SHALL allow `create`/`update`/`delete` on members only for owner or editor.
5. THE rules SHALL allow the owner to create/update/delete/list AccessDocs under `family_trees/{treeId}/access`.
6. THE rules SHALL allow an invitee to **create their own** AccessDoc (`access/{request.auth.uid}`) ONLY when a referenced Invitation is `pending`, not expired, its `inviteeEmail == request.auth.token.email`, its `treeId` matches, and the written `role` equals the invitation's `role`.
7. THE rules SHALL allow a collaborator to `read` their own AccessDoc (`access/{request.auth.uid}`) and SHALL NOT allow non-owners to read other users' AccessDocs.
8. THE rules SHALL allow an invitee to `read` an Invitation and to `update` its `status` to `'accepted'`/`'declined'`/`'expired'` only when `request.auth.token.email == invitation.inviteeEmail`; only the owner may `create` invitations (for a tree they own) and set `status` to `'revoked'`.
9. THE rules SHALL deny all other access by default and SHALL forbid clients from changing `family_trees.ownerId`.
10. THE rules SHALL forbid setting an AccessDoc `role` to `'owner'`.

### Requirement 8: Read-only UI untuk Viewer

**User Story:** Sebagai Viewer, saya ingin UI yang jelas read-only, sehingga saya tidak mencoba aksi yang tidak diizinkan.

#### Acceptance Criteria

1. WHEN the current user's role for a tree is `'viewer'`, THE detail screen SHALL hide add/edit/delete member controls and tree settings (edit/delete tree).
2. WHEN the current user's role is `'editor'`, THE UI SHALL show member add/edit/delete controls but SHALL hide tree-deletion and access-management controls.
3. WHEN the current user is `'owner'`, THE UI SHALL show all controls including access management.
4. THE UI SHALL derive a single `role` value per opened tree and gate controls from it.

### Requirement 9: Lokalisasi & Error Handling

**User Story:** Sebagai pengguna Indonesia, saya ingin pesan yang jelas dalam Bahasa Indonesia, sehingga saya paham status undangan/akses.

#### Acceptance Criteria

1. THE system SHALL reuse the centralized error messages (`src/constants/errorMessages.ts`) for permission/network/generic errors.
2. THE system SHALL show localized messages for sharing-specific cases (email tidak valid, sudah punya akses, undangan kedaluwarsa, dll.).
3. THE sharing operations SHALL report failures via `recordError` (observability) without crashing the app.

---

## Correctness Properties

### Property 1: Role enum invariant
*For any* AccessDoc, `role` SHALL be exactly `'editor'` or `'viewer'` (never `'owner'`). **Validates: 1.3, 7.9**

### Property 2: Access ⇒ membership invariant
*For any* user U with read access to a tree T's members, U SHALL be the owner of T OR have an AccessDoc at `family_trees/T/access/U`. **Validates: 7.1, 7.3**

### Property 3: Editor cannot manage access
*For any* user with role `'editor'`, attempts to create/modify/delete AccessDocs or delete the tree SHALL be denied. **Validates: 5.5, 7.2, 7.5**

### Property 4: Accept idempotency
*For any* invitation accepted one or more times, the number of AccessDocs created for `(treeId, uid)` SHALL be exactly 1. **Validates: 4.4**

### Property 5: Revoke removes access
*For any* collaborator whose AccessDoc is deleted, subsequent reads/writes by that collaborator SHALL be denied and the tree SHALL NOT appear in their shared-with-me list. **Validates: 5.2, 6.3**

### Property 6: Invite email normalization
*For any* invitee email input, the stored `inviteeEmail` SHALL equal `email.trim().toLowerCase()`. **Validates: 2.4**

### Property 7: Self-invite rejection
*For any* invite where invitee email equals the owner's email, the invite SHALL be rejected. **Validates: 3.3**

### Property 8: Single pending invite per pair
*For any* `(treeId, inviteeEmail)`, there SHALL be at most one Invitation with `status == 'pending'`. **Validates: 2.5**

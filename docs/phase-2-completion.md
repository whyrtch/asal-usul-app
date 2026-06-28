# Phase 2 — Laporan Penyelesaian (Kolaborasi / Sharing)

> Status: ✅ **Selesai (kode)** · Tanggal: 28 Juni 2026
> Spec: `.kiro/specs/family-tree-sharing/` · Rencana: `docs/phase-2-kolaborasi.md` · Roadmap: `docs/roadmap.md`

Fase 2 menambahkan kolaborasi: pemilik pohon dapat mengundang pengguna lain sebagai **Editor** atau **Viewer**. Dibangun **tanpa Cloud Functions** (akun masih plan gratis/Spark) — seluruh keamanan ditegakkan oleh **Firestore Security Rules**, dengan field `status` pada undangan sebagai "flag" state.

Seluruh fitur dikirim **dark** di balik `FEATURE_SHARING` (default off) sampai rules di-deploy & diuji.

---

## 1. Ringkasan Task

| Task | Status |
|------|--------|
| 1 Types & feature flag (`src/types/sharing.ts`, `FEATURE_SHARING`) | ✅ |
| 2 Role logic murni (`src/utils/roles.ts`) | ✅ |
| 3 accessRepository | ✅ |
| 4 invitationRepository | ✅ |
| 5 Shared trees (`fetchSharedFamilyTrees`) | ✅ |
| 6 `useSharingStore` + integrasi `useFamilyTreeStore` | ✅ |
| 7 Security rules + emulator tests + audit | ✅ kode (7.4 jalankan emulator = aksi pemilik) |
| 8 Accept/decline rules-only | ✅ |
| 9 UI (kelola akses, inbox, badge, gating, deep link) | ✅ |
| 10 Observability + gating flag | ✅ |
| 11 Checkpoint (deploy + enable) | ⬜ aksi pemilik |

---

## 2. Keputusan Arsitektur

- **Model akses**: subkoleksi `family_trees/{treeId}/access/{uid}` (`role`, `invitedBy`, `invitedVia`, `createdAt`). `shareWith` lama → deprecated.
- **Peran**: `owner` (implisit dari `ownerId`) / `editor` / `viewer`.
- **Undangan**: koleksi `invitations/{inviteId}` dengan `status` flag; dibagikan manual via link `asalusul://invite/{inviteId}` (tanpa email otomatis).
- **Terima undangan**: **rules-only** — penerima menulis access doc-nya sendiri, divalidasi rules terhadap undangan (email terverifikasi + peran sama + belum kedaluwarsa). Tidak ada Cloud Function / Blaze.
- **"Dibagikan ke saya"**: `collectionGroup('access')` where `uid == me`.

---

## 3. Yang Dibangun (per layer)

**Data & logika**
- `src/types/sharing.ts` — `Role`/`AccessRole`, `AccessDocument`/`Access`, `InvitationDocument`/`Invitation`, status.
- `src/utils/roles.ts` — `deriveRole`, `canEditMembers`, `canManageTree`, `canManageAccess`, `canView`.
- `src/repositories/accessRepository.ts` — list/get/grant/setRole/revoke + `fetchSharedTreeRefs`.
- `src/repositories/invitationRepository.ts` — create (validasi + normalisasi email + dedupe pending), queries, status update, decline.
- `src/repositories/familyTreeRepository.ts` — `fetchSharedFamilyTrees` (refs → trees + role).
- `src/store/useSharingStore.ts` — collaborators/invitations/inbox + actions (optimistic + rollback + `classifyError`/`recordError` + event analytics).
- `src/store/useFamilyTreeStore.ts` — `loadFamilyTrees` merge owned + shared (gated flag).

**Keamanan**
- `firestore.rules` — aturan berbasis peran (trees/members/access/invitations), ownerId immutable, tolak role `owner`, self-grant tervalidasi.
- `firestore.indexes.json` + `firebase.json` (rules/indexes/storage + emulator).
- `__rules_tests__/sharing.rules.test.ts` + `jest.rules.config.js` + `npm run test:rules`.

**UI** (semua gated `FEATURE_SHARING`)
- `/collaborators/[treeId]` — kelola kolaborator + form undang.
- `/invitations` — inbox terima/tolak (entry: tab Pengaturan → "Undangan Saya").
- `/invite/[inviteId]` — layar terima via deep link.
- `FamilyTreeCard` — badge "Dibagikan · Editor/Lihat".
- `family/[id].tsx` — gating kontrol per peran; `FamilySettingsSheet` → "Kelola Akses".
- `EmptyTreeState` — varian read-only untuk viewer.

---

## 4. Audit Keamanan (penting — keamanan 100% di rules)

Audit oleh `security-reviewer` menemukan **2 Critical + 1 High + 2 Medium**, **semua sudah diperbaiki**:
- 🔴 **email_verified** kini wajib di semua cek email (cegah penyamaran via email/password tak terverifikasi).
- 🔴 **Transisi status undangan satu arah** (pending → accepted/declined/expired) — cegah serangan revoke→re-grant.
- 🟠 **Integritas field self-grant** (uid/treeId/invitedBy/createdAt dipin ke nilai sah).
- 🟡 Status invitee dibatasi + email wajib string non-kosong & ternormalisasi.

Emulator tests ditambahkan untuk kasus email tak terverifikasi & revoke→re-grant.

---

## 5. Status Verifikasi

- **App test suite**: 432 passed, 24 skipped (456 total), 47 suite hijau.
- **Diagnostics**: bersih di seluruh file sumber.
- **Test baru**: `roles`, `accessRepository`, `invitationRepository`, `useSharingStore` + emulator suite `sharing.rules.test.ts`.
- **Tanpa regresi**: `FEATURE_SHARING` off → perilaku app tidak berubah.

### Tidak bisa diverifikasi tanpa aksi pemilik (jujur)
- Eksekusi emulator rules tests (butuh Java + emulator + `@firebase/rules-unit-testing`).
- Alur undangan end-to-end di device.
- Tampilan layar baru (collaborators / inbox / accept) secara visual.

---

## 6. Aksi Pemilik (Task 11 — tidak bisa dari kode)

1. **Uji rules**: `npm i -D @firebase/rules-unit-testing` lalu `npm run test:rules` (butuh Java). Harus hijau.
2. **Deploy** (gratis, tanpa Blaze): `firebase deploy --only firestore` (rules + index `collectionGroup('access')`).
3. **Aktifkan**: set `EXPO_PUBLIC_ENABLE_SHARING=true` di `.env`, lalu rebuild dev client.
4. (Opsional, butuh Blaze nanti) email undangan otomatis via Cloud Functions — tanpa mengubah model data.

---

## 7. Catatan Teknis

- Berulang kali terjadi anomali **dropped import** (baris import hilang di disk meski edit sukses & diagnostics bersih); semua terdeteksi via test/grep dan diperbaiki. Perlu diawasi pada edit berikutnya.
- Tidak ada backend/dependency baru selain pemakaian Firestore yang sudah ada. Tetap Expo + Firebase + Zustand.
- Catatan keamanan: setiap perubahan `firestore.rules` ke depan harus melewati audit (`security-reviewer`) + emulator tests sebelum deploy.

---

## 8. Definisi "Selesai" Phase 2

- [x] Semua task kode (1–10) terimplementasi.
- [x] App test suite hijau + test baru untuk logika baru.
- [x] Audit keamanan dilakukan & temuan Critical/High diperbaiki.
- [x] Fitur gated di balik `FEATURE_SHARING` (ship dark).
- [x] Dokumentasi diperbarui (spec, dokumen ini).
- [ ] Emulator rules tests dijalankan & hijau — *aksi pemilik.*
- [ ] Rules + index ter-deploy, lalu `FEATURE_SHARING` diaktifkan — *aksi pemilik.*

---

## 9. Berikutnya

- Selesaikan Task 11 (aksi pemilik di atas) untuk merilis kolaborasi.
- Kumpulkan sinyal penggunaan (event `invite_*`) sebelum **Phase 3 (siapkan monetisasi)**.

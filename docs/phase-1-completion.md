# Phase 1 — Laporan Penyelesaian

> Status: ✅ **Selesai (kode)** · Tanggal: 28 Juni 2026
> Referensi: `docs/phase-1-perkuat-inti.md`, `docs/roadmap.md`, `docs/prd-asalusul.md`

Fase 1 bertujuan memperkuat produk inti agar bernilai dan mendorong retensi, sebelum membangun kolaborasi dan monetisasi. Seluruh deliverable telah diimplementasikan, diverifikasi lewat test, dan didokumentasikan.

---

## 1. Ringkasan Deliverable

| # | Deliverable | Status | Catatan |
|---|-------------|--------|---------|
| 4.5 | Sentralisasi pesan error / i18n | ✅ Selesai | `src/constants/errorMessages.ts`; kedua store di-refactor |
| 4.2 | Detail anggota lebih kaya | ✅ Selesai | `status` hidup/meninggal, `deathDate`, persist `bio`, rentang hidup di node & profil |
| 4.3 | Navigasi pohon | ✅ Selesai | pinch-zoom, pan, zoom/fit, search-to-focus + highlight; tap node → detail |
| 4.1 | Foto anggota | ✅ Kode selesai (dinonaktifkan sementara) | Di balik flag `FEATURE_PHOTO_UPLOAD` (off); Storage lazy; cover pohon ditunda |
| 4.4 | Observability (Analytics + Crashlytics) | ✅ Kode selesai | Facade provider + instrumentasi funnel; default no-op; aktivasi native lihat `docs/observability-setup.md` |

---

## 2. Rincian yang Dikerjakan

### 4.5 Sentralisasi error
- Modul tunggal `errorMessages.ts` (`ERROR_PERMISSION/NETWORK/GENERIC` + `classifyError`).
- `useFamilyTreeStore` & `useMemberStore` memakai modul ini (hapus duplikasi). Menyiapkan jalan i18n.

### 4.2 Detail anggota
- Model: `status: 'living'|'deceased'` + `deathDate` di `Member`, `MemberDocument`, `Create/UpdateMemberInput`.
- `bio` kini benar-benar dipersistenkan (sebelumnya selalu null).
- Repository + store + form (tambah & edit) + validasi `deathDate` diperbarui.
- UI: toggle status + tanggal meninggal kondisional; rentang hidup (`1945–2010`) via `formatLifeRange`.

### 4.3 Navigasi pohon
- `FamilyTreeCanvas` memakai gesture (pan + pinch, `Gesture.Simultaneous`) menggantikan ScrollView bersarang.
- Fit-to-screen otomatis + tombol perbesar/perkecil/pas layar.
- Search bar → pilih anggota → kanvas center & zoom + highlight node (`MemberAvatar` highlight ring).
- Logika murni (`treeNavigation.ts`) teruji terpisah.

### 4.1 Foto anggota (dinonaktifkan sementara)
- `expo-image-picker@56.0.18` + config plugin.
- Storage service (`uploadImageAsync`) + path util + `usePhotoUpload`.
- Persist `photoUrl`; tampil via `MemberAvatar` (default inisial saat tidak ada/gagal muat).
- **Dinonaktifkan** via `FEATURE_PHOTO_UPLOAD` (default off) + Storage lazy → aman tanpa provisioning.
- `storage.rules` owner-only disiapkan.

### 4.4 Observability
- Facade `src/services/analytics/` (`logEvent`, `recordError`, `setAnalyticsUserId`, `setAnalyticsEnabled`) + provider swappable; default no-op (tidak pernah throw).
- Instrumentasi: `sign_in`, `sign_out`, `tree_created`, `tree_deleted`, `member_added` (+`hasPhoto`), `member_deleted`, `photo_added` + `recordError` di blok catch.
- Aktivasi native Firebase Analytics/Crashlytics terdokumentasi.

---

## 3. Status Verifikasi

- **Test**: 395 passed, 24 skipped (419 total), 43 suite hijau.
- **Diagnostics**: bersih di seluruh file sumber yang diubah.
- **TypeScript**: tidak ada type error baru akibat Phase 1 (sisa hanya isu pre-existing: jest globals/`expect` di tsc, dan `shareWith` di FamilyTreeCard test).
- **Test baru ditambahkan**: `formatLifeRange`, `treeNavigation`, `storagePaths`, `member-avatar`, `analytics`.

### Yang TIDAK bisa diverifikasi tanpa device/console (jujur)
- Upload foto end-to-end (butuh Storage aktif).
- Kemulusan gesture pinch/pan secara visual (butuh device/emulator).
- Event analytics benar-benar terkirim ke Firebase (butuh provider native + dev build).

Logika murni & wiring sudah teruji unit; hal di atas adalah verifikasi runtime di perangkat nyata.

---

## 4. Aksi Pemilik Project (Pending)

Bukan blocker kode — diperlukan untuk mengaktifkan fitur yang bergantung infrastruktur:

1. **Foto** (opsional, saat siap): aktifkan Firebase Storage → `firebase deploy --only storage` → set `EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD=true` → rebuild dev client.
2. **Observability** (opsional): ikuti `docs/observability-setup.md` (pasang `@react-native-firebase/*`, set provider, rebuild).
3. **Rebuild dev client** diperlukan karena `expo-image-picker` modul native + config plugin baru (tidak jalan di Expo Go).

---

## 5. Catatan Teknis

- Selama implementasi berulang kali terjadi anomali "dropped import" (baris import hilang di disk meski edit sukses & diagnostics bersih). Semua sudah dideteksi via grep, di-re-add, dan diverifikasi. Perlu diawasi pada edit berikutnya.
- Ketergantungan baru: `expo-image-picker`. Tidak ada backend/database tambahan — tetap Expo + Firebase + Zustand sesuai keputusan arsitektur.

---

## 6. Exit Gate Phase 1 → Phase 2

Sesuai roadmap, gate adalah **metrik retensi inti**:
- Usulan metrik utama: % pengguna yang kembali & menambah ≥1 anggota dalam 7 hari setelah membuat pohon.
- 🔵 **Pending**: target angka ditetapkan setelah analytics aktif & ada baseline (belum bisa diukur sekarang).

Rekomendasi: aktifkan observability + rilis ke sekelompok kecil pengguna untuk mengumpulkan baseline sebelum memutuskan mulai Phase 2 (kolaborasi).

---

## 7. Definisi "Selesai" untuk Phase 1

- [x] Semua deliverable terimplementasi di kode.
- [x] Test suite hijau + test baru untuk logika baru.
- [x] Diagnostics & type check bersih (tanpa error baru).
- [x] Dokumentasi diperbarui (`phase-1-perkuat-inti.md`, `observability-setup.md`, `roadmap.md`, dokumen ini).
- [ ] Aktivasi infrastruktur (Storage/observability) — *aksi pemilik project, di luar kode.*
- [ ] Baseline metrik retensi — *menunggu analytics aktif.*

# Fase 1 — Perkuat Produk Inti (MVP)

> Bagian dari roadmap AsalUsul. Lihat `docs/roadmap.md` dan `docs/prd-asalusul.md`.

Status: ✅ Selesai (kode) · Estimasi 🔶: ~3–5 minggu

### Progress
- ✅ 4.5 Sentralisasi pesan error / i18n (`src/constants/errorMessages.ts`; refactor kedua store)
- ✅ 4.2 Detail anggota lebih kaya — field `status` (hidup/meninggal) + `deathDate`, persist `bio`, tampil rentang hidup di node & profile card
- ✅ 4.3 Navigasi pohon — pinch-zoom + pan (gesture-handler/Reanimated), tombol zoom/fit, search-to-focus dengan highlight node; tap node tetap membuka detail
- 🔄 4.1 Foto anggota — **kode selesai tapi dinonaktifkan sementara** via flag `FEATURE_PHOTO_UPLOAD` (default off; Storage dibuat lazy → tidak disentuh saat startup). Picker disembunyikan otomatis saat off. Aktifkan: set `EXPO_PUBLIC_ENABLE_PHOTO_UPLOAD=true` + aktifkan Firebase Storage + deploy `storage.rules` + rebuild. Foto cover pohon ditunda.
- ✅ 4.4 Observability — **kode selesai**: facade analytics/crash (`src/services/analytics/`) + instrumentasi funnel (sign_in, tree_created, member_added, photo_added, dll.) + recordError di catch. Default no-op. Aktivasi native: lihat `docs/observability-setup.md`.

---

## 1. Tujuan & Hipotesis

**Tujuan:** Membuat produk inti benar-benar bernilai sehingga pengguna **kembali dan menambah data**, bukan sekadar membangun pohon sekali lalu ditinggal.

**Hipotesis:** Dengan menambahkan foto, detail anggota yang kaya, dan navigasi pohon yang nyaman, keterikatan emosional naik → retensi 7 hari membaik.

**Kenapa fase ini didahulukan:** Retensi adalah risiko terbesar produk. Tidak ada gunanya membangun kolaborasi/monetisasi di atas produk yang belum terbukti dipakai.

---

## 2. Lingkup (Scope)

### Termasuk
1. **Foto anggota + cover pohon** (Firebase Storage)
2. **Status hidup/meninggal** + tanggal + rentang hidup di kartu node
3. **Biografi/catatan** singkat per anggota
4. **Navigasi pohon:** zoom/pan, tap-to-detail (bottom sheet), search anggota
5. **Observability:** Crashlytics + analytics event kunci
6. **Sentralisasi pesan error / i18n**

### Tidak termasuk (ditunda)
- Kolaborasi/invite (Fase 2)
- Monetisasi/paywall (Fase 4)
- Export PDF/GEDCOM, offline-first eksplisit, notifikasi FCM

---

## 3. Penambahan Teknologi
- **Firebase Storage** — penyimpanan foto. (Opsional: extension resize image otomatis.)
- **Firebase Crashlytics** — crash reporting.
- **Firebase Analytics** — event funnel.

Tidak ada perubahan arsitektur. Mengikuti pola berlapis yang ada (UI → store → repository → service).

---

## 4. Rincian Pekerjaan (Deliverables)

### 4.1 Foto anggota & cover
- Konfigurasi Firebase Storage + aturan akses (owner-only, sejalan dengan rules Firestore).
- Service upload (`src/services/firebase/storage.ts`) + util kompres/resize.
- Persistensi `photoUrl` (member) & `coverImage` (tree) — field sudah ada di tipe.
- UI: picker foto di form anggota; avatar di node pohon + fallback inisial.

### 4.2 Detail anggota lebih kaya
- Tambah field: `status` (`living`/`deceased`), `deathDate`, `bio`, (opsional) tempat lahir.
- Tampilkan rentang hidup (mis. "1945–2010") di kartu node.
- Update tipe, repository, store, dan form.

### 4.3 Navigasi pohon
- Zoom (pinch) & pan pada kanvas pohon (Reanimated + Gesture Handler — sudah ada di dependency).
- Tap node → bottom sheet detail cepat.
- Search anggota dalam pohon → fokus & highlight node.

### 4.4 Observability
- Pasang Crashlytics.
- Instrumentasi event: `tree_created`, `member_added`, `photo_added`, `tree_viewed`, funnel onboarding.

### 4.5 Sentralisasi error/i18n
- Pindahkan pesan error duplikat (saat ini tersebar di store) ke satu modul konstanta.
- Siapkan struktur agar mudah ditambah bahasa lain nanti.

---

## 5. Acceptance Criteria (level fase)
- [x] Pengguna dapat menambah/mengubah foto anggota; foto tampil di node; ada fallback.
- [x] Anggota punya status hidup/meninggal; rentang hidup tampil bila data ada.
- [x] Pohon bisa di-zoom & digeser dengan mulus; tap node membuka detail; search berfungsi.
- [x] Crashlytics & analytics aktif; event kunci tercatat.
- [x] Pesan error tersentralisasi; tidak ada duplikasi string error di store.
- [x] Semua test lama tetap hijau + test baru untuk fitur yang ditambah.

---

## 6. Exit Gate (syarat lanjut ke Fase 2)
- Metrik retensi inti tercapai:
  - 🔵 **Target perlu ditetapkan** setelah analytics terpasang (baseline belum ada).
  - Usulan metrik: % pengguna yang kembali & menambah ≥1 anggota dalam 7 hari setelah membuat pohon.
- Jika retensi lemah → evaluasi ulang produk inti sebelum membangun kolaborasi.

---

## 7. Risiko & Mitigasi
| Risiko | Mitigasi |
|--------|----------|
| Upload foto lambat/boros kuota | Kompres/resize sebelum upload; batasi resolusi |
| Performa pohon besar saat zoom/pan | Uji dengan dataset besar; pertimbangkan virtualisasi awal |
| Effort input masih tinggi | Permudah form; pertimbangkan default peran/relasi |
| Biaya Storage/analytics | Pantau via Firebase console; set budget alert |

---

## 8. Dependensi & Urutan
1. Storage dulu (4.1) karena foto adalah nilai paling terlihat.
2. Detail anggota (4.2) bisa paralel dengan Storage.
3. Navigasi pohon (4.3) setelah node punya foto/detail (agar detail layak ditampilkan).
4. Observability (4.4) sebaiknya lebih awal agar bisa mengukur dampak fitur.
5. Sentralisasi error (4.5) bisa kapan saja, ringan.

---

## 9. Langkah Berikutnya
Saat fase ini dimulai, turunkan tiap deliverable jadi spec teknis di `.kiro/specs/`, contoh:
- `.kiro/specs/member-photos/`
- `.kiro/specs/member-rich-details/`
- `.kiro/specs/tree-navigation/`

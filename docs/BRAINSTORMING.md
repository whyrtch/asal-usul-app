# AsalUsul — Brainstorming & Roadmap Improvement

> Dokumen eksploratif untuk arah pengembangan AsalUsul. Bukan keputusan final — bahan diskusi untuk memutuskan prioritas.

Terakhir diperbarui: 28 Juni 2026

---

## 1. Konteks & Tujuan

AsalUsul saat ini: aplikasi pencatat silsilah keluarga single-owner — user login Google, buat pohon, tambah anggota & relasi, lihat visualisasi pohon generasional.

Tiga arah strategis:
1. **Memperkuat produk inti** (pencatatan silsilah) supaya benar-benar enak dipakai.
2. **Kolaborasi** — invite user lain untuk mengakses/berkontribusi ke pohon keluarga (fondasi `shareWith` sudah ada).
3. **Monetisasi** — belum sekarang, tapi arsitektur & data model mulai disiapkan agar tidak perlu migrasi besar nanti.

---

## 2. Penilaian Kondisi Saat Ini (Honest Review)

### Yang sudah kuat 💪
- Arsitektur berlapis yang bersih (UI → store → repository → service). Ini fondasi yang sangat baik untuk skala.
- Optimistic update + rollback yang konsisten di semua store.
- Error handling terklasifikasi + pesan lokal Bahasa Indonesia.
- `withRetry` untuk ketahanan jaringan.
- Tree layout engine yang murni & teruji (mudah di-test & dipertahankan).
- Security rules owner-only + default deny (aman sebagai baseline).
- Cakupan test yang serius (termasuk property-based testing).

### Celah / risiko ⚠️
- **Belum ada foto** anggota/cover tree (field ada tapi tidak dipersistenkan, Storage belum dikonfigurasi). Untuk app silsilah, foto adalah fitur emosional yang penting.
- **Sharing belum nyata**: `shareWith` ada di data tapi tidak ada UI, dan **security rules belum mengizinkan akses non-owner** — artinya fitur invite saat ini tidak akan berfungsi tanpa update rules.
- **Tidak ada analytics & crash reporting** — sulit mengambil keputusan produk berbasis data.
- **Tidak ada offline-first eksplisit** (Firestore punya cache, tapi belum diaktifkan/diatur secara sadar).
- **Relasi terbatas** pada gender biner (`male`/`female`) dan relasi inti; belum menangani kasus seperti adopsi, perceraian/pasangan ganda berurutan, atau anggota yang sudah meninggal.
- **Skalabilitas tree besar**: layout & rendering belum diuji untuk ratusan anggota (kanvas, virtualisasi, zoom).
- **Belum ada export/backup** (PDF/gambar/GEDCOM) — pengguna silsilah biasanya ingin mencetak/berbagi.

---

## 3. Improvement: Produk Inti (Prioritas Tinggi)

Ini yang membuat app benar-benar dipakai, sebaiknya didahulukan sebelum sharing & monetisasi.

### 3.1 Foto anggota & cover pohon
- Aktifkan Firebase Storage; upload foto profil anggota + cover tree.
- Persistenkan `photoUrl` (member) & `coverImage` (tree) yang field-nya sudah ada.
- Tampilkan avatar di node pohon → jauh lebih hidup dan personal.

### 3.2 Detail anggota yang lebih kaya
- Tambah field opsional: tanggal & tempat meninggal, status hidup/meninggal, tempat lahir, catatan/biografi (`bio` sudah ada di tipe), nickname.
- Tampilkan rentang hidup (mis. "1945–2010") di kartu node.

### 3.3 Navigasi & UX pohon
- Zoom & pan yang mulus, "fit to screen", dan mini-map untuk pohon besar.
- Tap node → bottom sheet detail anggota cepat (tanpa pindah halaman penuh).
- Pencarian anggota dalam satu pohon (lompat & highlight ke node).
- Fokus/center ke anggota tertentu sebagai akar tampilan.

### 3.4 Robustness model relasi
- Dukung anggota tanpa orang tua di tree (sudah ditangani sebagai root) + multiple roots yang lebih rapi.
- Pertimbangkan kasus pasangan ganda (mis. menikah lagi) dan label relasi yang lebih fleksibel.
- Validasi siklus relasi (mencegah seseorang jadi leluhur dirinya sendiri).

### 3.5 Export & berbagi pasif
- Export pohon ke gambar/PDF untuk dicetak atau dibagikan.
- Pertimbangkan dukungan format **GEDCOM** (standar silsilah) untuk import/export — pembeda kuat & memudahkan migrasi data masuk.

---

## 4. Improvement: Fondasi Teknis (Mendukung Semua Roadmap)

### 4.1 Observability
- Pasang **Crashlytics** (skill `firebase-crashlytics` sudah tersedia di repo) + analytics event (buat tree, tambah anggota, share, dll.).
- Logging terstruktur untuk error repository.

### 4.2 Offline-first
- Aktifkan persistensi offline Firestore secara sadar; uji skenario tanpa koneksi.
- Pastikan optimistic update tetap konsisten saat sinkronisasi tertunda.

### 4.3 Performa tree besar
- Virtualisasi/culling node di luar viewport.
- Benchmark layout engine untuk 200–1000+ anggota; pertimbangkan memoisasi layout.

### 4.4 Remote Config & feature flag
- Pakai **Firebase Remote Config** (skill tersedia) untuk menyalakan/mematikan fitur (sharing, paywall) tanpa rilis baru — krusial untuk rollout bertahap monetisasi.

### 4.5 Kualitas & rilis
- Siapkan EAS Build/Update + workflow CI (skill `expo-cicd-workflows`, `eas-update-insights` tersedia).
- Tambah test E2E untuk alur kritis (login, buat tree, tambah anggota).

---

## 5. Fitur Kolaborasi (Invite User) — Desain Awal

Tujuan: pemilik pohon dapat meng-*invite* user lain untuk mengakses pohon keluarganya, dengan peran berbeda.

### 5.1 Model peran (role-based access)
Usulkan minimal 3 peran:
| Peran | Hak |
|-------|-----|
| **Owner** | Penuh: edit, hapus, kelola anggota, kelola sharing, hapus tree |
| **Editor** | Tambah/edit/hapus anggota & relasi; tidak bisa hapus tree / kelola sharing |
| **Viewer** | Hanya melihat pohon (read-only) |

### 5.2 Perubahan data model
`shareWith: string[]` saat ini terlalu sederhana untuk peran. Opsi:
- **Opsi A (cepat)**: ubah jadi map `sharedWith: { [uid]: 'editor' | 'viewer' }` di dokumen tree.
- **Opsi B (skalabel)**: subkoleksi `family_trees/{treeId}/members_access/{uid}` dengan field `role`, `invitedBy`, `joinedAt`. Lebih scalable untuk banyak kolaborator & query "tree yang dibagikan ke saya".

Rekomendasi: **Opsi B** bila menargetkan kolaborasi serius; **Opsi A** bila ingin MVP cepat.

### 5.3 Alur invite
1. Owner kirim undangan via email/UID/link.
2. Buat dokumen `invitations/{inviteId}` (status: pending/accepted/declined, tree, role, expiry).
3. Penerima menerima → akses ditambahkan ke access list tree.
4. Dukung **deep link** (`scheme: asalusul`) untuk "buka undangan".

### 5.4 Security Rules (WAJIB diperbarui)
Rules saat ini **owner-only** — sharing tidak akan jalan tanpa perubahan. Perlu:
- Izinkan `read` pada tree & members jika `request.auth.uid` ada di access list (owner/editor/viewer).
- Izinkan `write` pada members hanya jika role owner/editor.
- Lindungi field sensitif (mis. hanya owner boleh ubah access list & `ownerId`).
- Tambah audit: siapa mengubah apa (opsional).

> Catatan keamanan: setiap perubahan rules sharing harus diaudit ketat (skill `firebase-security-rules-auditor` tersedia) sebelum rilis, karena ini memperluas siapa yang bisa baca/tulis data keluarga.

### 5.5 UX kolaborasi
- Layar "Anggota & Akses" per tree: daftar kolaborator + peran + cabut akses.
- Indikator "Dibagikan" pada kartu tree.
- Notifikasi (FCM) saat diundang / saat ada perubahan (opsional).
- Tab/section "Dibagikan ke saya" di Home untuk tree milik orang lain.

---

## 6. Persiapan Monetisasi (Belum Diaktifkan, Disiapkan Sekarang)

Prinsip: jangan bangun paywall sekarang, tapi pastikan **data model & arsitektur tidak menghalangi** monetisasi nanti.

### 6.1 Kandidat model bisnis
- **Freemium** (paling cocok): gratis untuk 1 pohon & jumlah anggota terbatas; berbayar untuk pohon/anggota tak terbatas, foto resolusi penuh, export PDF/GEDCOM, kolaborator lebih banyak.
- **Subscription** bulanan/tahunan (mis. "AsalUsul Premium").
- **One-time unlock** fitur tertentu (export, kolaborasi).
- Hindari iklan di awal — kurang cocok untuk produk keluarga yang personal.

### 6.2 Contoh batas free vs premium
| Fitur | Free | Premium |
|-------|------|---------|
| Jumlah pohon | 1 | Tak terbatas |
| Anggota per pohon | mis. 25 | Tak terbatas |
| Foto anggota | terbatas/low-res | penuh |
| Kolaborator | 1–2 viewer | banyak, editor |
| Export PDF/GEDCOM | ❌ | ✅ |
| Backup otomatis | ❌ | ✅ |

(Angka di atas hanya ilustrasi untuk diskusi.)

### 6.3 Yang perlu disiapkan dari sekarang (tanpa membangun paywall)
- **Entitlement model**: tambahkan konsep `plan`/`tier` di `users/{uid}` (mis. `plan: 'free'`) — default `free` untuk semua sekarang. Belum dipakai untuk membatasi apa pun, tapi field tersedia.
- **Feature flag via Remote Config**: bungkus fitur kandidat premium di balik flag, default ON untuk semua sekarang. Saat monetisasi aktif, tinggal hubungkan flag ke entitlement.
- **Analytics funnel**: lacak event yang akan jadi indikator nilai (buat pohon ke-2, tambah anggota ke-N, klik export) untuk menentukan batas free yang tepat berbasis data.
- **Abstraksi billing**: rencanakan integrasi RevenueCat atau StoreKit/Google Play Billing nanti; jangan kunci logika harga ke UI.
- **Pemisahan "kapasitas" di repository**: taruh aturan batas (limit jumlah tree/anggota) di satu tempat (mis. helper `canCreateTree(user)`), supaya nanti tinggal mengubah satu sumber kebenaran.

### 6.4 Yang sebaiknya TIDAK dilakukan sekarang
- Jangan pasang SDK billing/paywall UI.
- Jangan batasi fitur apa pun ke user — fokus dulu ke retensi & nilai.
- Jangan over-engineer entitlement (cukup satu field `plan` + flag).

---

## 7. Apa yang Bisa Dikurangi / Disederhanakan

- **Banyak skill/agent di `.kiro/skills` & `.kiro/agents`** — berguna untuk pengembangan, tapi bukan bagian produk. Pastikan tidak ikut terbawa ke bundle/rilis (tidak masalah karena di luar `src`, hanya catatan kebersihan repo).
- **Duplikasi pesan error** ("Akses ditolak…", dll.) tersebar di beberapa store — sentralisasikan ke satu modul konstanta i18n. Ini juga menyiapkan jalan untuk multi-bahasa.
- **Field yang belum dipakai** (`coverImage`, `photoUrl`, `bio`) — putuskan: implementasikan segera (lihat §3.1) atau dokumentasikan sebagai "reserved" agar tidak membingungkan.
- **Gender biner** — jika ingin inklusif/akurat untuk silsilah, pertimbangkan menyederhanakan ke peran/relasi alih-alih mengandalkan gender untuk layout. Hindari menambah kompleksitas yang tak perlu.

---

## 8. Usulan Prioritas (Draft)

**Fase 1 — Perkuat inti (sekarang):**
1. Foto anggota + cover (Storage) — §3.1
2. Detail anggota lebih kaya + status meninggal — §3.2
3. UX pohon: zoom/pan, tap-to-detail, search — §3.3
4. Crashlytics + analytics — §4.1
5. Sentralisasi i18n/pesan error — §7

**Fase 2 — Kolaborasi:**
6. Role-based access + update security rules — §5
7. Alur invite + deep link — §5.3
8. UX "Anggota & Akses" + "Dibagikan ke saya" — §5.5
9. Notifikasi FCM (opsional) — §5.5

**Fase 3 — Siapkan monetisasi (tanpa mengaktifkan):**
10. Field `plan` di user + Remote Config flag — §6.3
11. Abstraksi limit di repository (`canCreateTree`, dll.) — §6.3
12. Analytics funnel untuk menentukan batas free — §6.3

**Fase 4 — Monetisasi aktif (nanti):**
13. Integrasi billing (RevenueCat/StoreKit/Play Billing)
14. Paywall UI + hubungkan flag ↔ entitlement
15. Export PDF/GEDCOM sebagai fitur premium — §3.5

---

## 9. Pertanyaan Terbuka untuk Diputuskan

1. Target pasar utama: keluarga Indonesia (multi-bahasa daerah?) atau lebih luas?
2. Seberapa besar pohon yang realistis (puluhan, ratusan, ribuan anggota)? Memengaruhi keputusan performa & data model.
3. Kolaborasi: cukup read-only sharing dulu, atau langsung editor multi-user dengan resolusi konflik?
4. Model monetisasi yang dituju: freemium subscription, one-time unlock, atau kombinasi?
5. Apakah privasi/consent perlu perhatian khusus (data keluarga = data sensitif, termasuk anggota yang masih hidup)? Pertimbangkan kebijakan privasi sejak awal.
6. Apakah perlu kompatibilitas standar silsilah (GEDCOM) untuk menarik pengguna yang sudah punya data?

---

> Rekomendasi: jangan bangun semua sekaligus. Selesaikan Fase 1 agar produk benar-benar bernilai, baru buka kolaborasi, lalu siapkan monetisasi secara bertahap menggunakan feature flag.

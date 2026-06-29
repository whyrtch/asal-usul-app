# PRD — AsalUsul (Aplikasi Silsilah Keluarga)

**Status:** Draft untuk review
**Tipe:** PRD Utama (product-level, payung untuk seluruh produk)

### Changelog
| Versi | Tanggal | Penulis | Perubahan |
|-------|---------|---------|-----------|
| 0.1 | 2026-06-28 | Tim AsalUsul | Draft awal untuk review |

> **Legenda penanda:**
> - 🔶 **Asumsi** — diisi berbasis inferensi, plausibel tapi belum tervalidasi (= risiko sampai dikonfirmasi).
> - 🔵 **Pertanyaan Terbuka** — belum diketahui, butuh keputusan/data dari kamu.
>
> Catatan: spec teknis detail tetap hidup di `.kiro/specs/<feature>/`. Dokumen ini adalah PRD level produk.

---

## 0. Ringkasan Eksekutif

Kami membangun **AsalUsul**, aplikasi mobile (iOS/Android/Web) untuk **keluarga Indonesia** yang ingin **mencatat, menyimpan, dan memvisualisasikan silsilah keluarga** dalam bentuk pohon. Masalah yang dipecahkan: pengetahuan silsilah keluarga tersebar (di kepala orang tua/kakek-nenek, catatan kertas, grup chat) dan **hilang antar generasi**. AsalUsul menjadikannya satu tempat yang rapi, visual, dan bisa dibagikan ke keluarga.

Tahap saat ini sudah berfungsi: login Google, buat pohon, tambah anggota + relasi, dan render pohon generasional otomatis. PRD ini menetapkan arah agar produk benar-benar bernilai (inti), lalu kolaborasi (invite), lalu siap dimonetisasi.

> 🔶 **Asumsi:** "kehilangan pengetahuan silsilah antar generasi" adalah pain yang cukup kuat untuk mendorong adopsi. Ini belum divalidasi lewat wawancara pengguna.

---

## 1. Problem Statement

### Siapa yang punya masalah ini?
Individu dalam keluarga (sering kali generasi yang lebih muda atau "penjaga sejarah keluarga") yang ingin merekam asal-usul keluarganya — siapa orang tua, kakek-nenek, paman/bibi, sepupu, dan bagaimana mereka terhubung.

### Apa masalahnya?
- Informasi silsilah tersimpan secara informal dan terfragmentasi: ingatan orang tua, foto lama, catatan tulisan tangan, atau obrolan grup keluarga.
- Tidak ada satu tempat terstruktur dan **visual** untuk melihat keseluruhan pohon.
- Saat anggota keluarga tua meninggal, **pengetahuan ikut hilang** karena tidak pernah dicatat.

### Kenapa menyakitkan?
- **Dampak ke pengguna:** sulit menjelaskan hubungan keluarga ke anak/cucu, kehilangan jejak sejarah, tidak ada warisan informasi yang bisa diteruskan.
- **Dampak ke bisnis (kita):** ini adalah kebutuhan emosional & jangka panjang — jika dipenuhi dengan baik, retensi dan keterikatan tinggi, serta potensi viral dalam satu keluarga (satu orang mengundang banyak anggota).

### Evidence
- 🔵 **Pertanyaan Terbuka:** Belum ada wawancara/analytics yang memvalidasi besarnya masalah. Perlu minimal 5–8 wawancara calon pengguna dan/atau survei kecil sebelum investasi besar di fitur lanjutan.

---

## 2. User Persona

### Persona Primer — "Sang Pencatat"
- **Nama:** Rina, 32 tahun
- **Konteks:** Pengguna smartphone aktif, melek aplikasi, tinggal terpisah dari keluarga besar. Sering jadi "penghubung" informasi di keluarga.
- **Goals:** Merekam silsilah keluarga besar sebelum kakek/nenek tiada; punya tampilan visual yang bisa ditunjukkan ke anak.
- **Pain points:** Tidak tahu cara menyusun data silsilah; takut salah/lupa; tidak punya alat yang mudah dan rapi.
- **Perilaku saat ini:** Menyimpan foto & catatan di galeri/notes; bertanya ke orang tua via chat; tidak pernah tersusun.

### Persona Sekunder — "Anggota Keluarga yang Diundang"
- **Nama:** Pak Budi, 58 tahun
- **Konteks:** Kurang tech-savvy, tapi sumber pengetahuan silsilah paling kaya.
- **Berbeda dari primer:** Tidak akan membangun pohon dari nol; tapi mau **melihat** dan mungkin **mengoreksi/menambah** bila diundang dengan cara yang sangat sederhana.
- **Implikasi:** UX untuk viewer/editor undangan harus sangat ringan.

> 🔶 **Asumsi:** Persona primer adalah generasi muda yang melek teknologi, bukan sesepuh keluarga. Ini memengaruhi keputusan desain (mobile-first, onboarding ringan).

### Jobs-to-Be-Done
- **Fungsional:** "Saya ingin menyusun siapa terhubung dengan siapa, lengkap dengan foto & tanggal, dalam satu tampilan pohon."
- **Emosional:** "Saya ingin merasa telah menjaga warisan keluarga, dan bangga menunjukkannya."
- **Sosial:** "Saya ingin keluarga melihat saya sebagai orang yang melestarikan sejarah keluarga."

---

## 3. Assumptions & Challenges (yang dipertanyakan & alasannya)

Sebagai partner berpikir kritis, ini hal-hal yang saya tantang dari ide ini:

1. **"Apakah orang mau repot memasukkan data silsilah?"**
   Memasukkan banyak anggota itu effort tinggi. **Tantangan:** nilai harus terasa cepat (aha moment) di 5 menit pertama. **Implikasi:** onboarding & input harus sangat mulus; pertimbangkan template/bulk-add.

2. **"Apakah ini sekali pakai lalu ditinggal?"**
   Risiko: orang membangun pohon sekali, lalu tidak kembali. **Tantangan:** apa alasan untuk kembali? (foto baru, kelahiran/pernikahan, reminder ulang tahun, kolaborasi). Retensi adalah risiko terbesar produk ini.

3. **"Apakah single-owner cukup, atau kolaborasi adalah inti?"**
   Silsilah pada dasarnya pengetahuan kolektif. **Tantangan:** mungkin kolaborasi bukan "fitur nanti" tapi pendorong nilai utama. Tapi membangun kolaborasi lebih mahal & berisiko keamanan. **Rekomendasi:** validasi dulu, jangan asal dahulukan.

4. **"Gender biner cukup untuk model relasi?"**
   Saat ini layout bergantung pada `male`/`female`. **Tantangan:** kasus nyata (adopsi, anggota meninggal, pasangan berurutan) bisa tidak tertangani. Sederhanakan ketergantungan pada gender bila memungkinkan.

5. **"Monetisasi via freemium — apakah pasar Indonesia mau bayar untuk app silsilah?"**
   🔵 **Pertanyaan Terbuka:** Willingness-to-pay belum diketahui. Jangan bangun paywall sebelum ada sinyal nilai & retensi.

---

## 4. User Stories

Dikelompokkan per tema. Status menandai apa yang **sudah ada** vs **diusulkan**.

### Tema A — Akun & Akses (sebagian sudah ada)
- **A1 (sudah):** Sebagai pengguna, saya ingin login dengan akun Google, agar bisa mengakses data saya di perangkat mana pun.
- **A2 (sudah):** Sebagai pengguna, saya ingin tetap login setelah menutup app, agar tidak perlu login berulang.

### Tema B — Mengelola Pohon (sudah ada)
- **B1 (sudah):** Sebagai pengguna, saya ingin membuat pohon keluarga bernama, agar bisa mengelompokkan silsilah.
- **B2 (sudah):** Sebagai pengguna, saya ingin melihat daftar pohon saya, agar bisa membuka yang relevan.
- **B3 (sudah):** Sebagai pengguna, saya ingin mengubah/menghapus pohon, agar data tetap rapi.

### Tema C — Mengelola Anggota & Relasi (sudah ada)
- **C1 (sudah):** Sebagai pengguna, saya ingin menambah anggota dengan nama, gender, peran, tanggal lahir.
- **C2 (sudah):** Sebagai pengguna, saya ingin menghubungkan anggota (orang tua/pasangan/anak) agar pohon tersusun otomatis.
- **C3 (sudah):** Sebagai pengguna, saya ingin melihat pohon generasional otomatis.

### Tema D — Memperkaya Data (diusulkan, prioritas inti)
- **D1:** Sebagai pengguna, saya ingin menambahkan **foto** anggota, agar pohon terasa hidup & personal.
- **D2:** Sebagai pengguna, saya ingin menandai status **hidup/meninggal** + tanggal, agar silsilah akurat.
- **D3:** Sebagai pengguna, saya ingin menulis **biografi/catatan** singkat per anggota.

### Tema E — Navigasi Pohon (diusulkan, prioritas inti)
- **E1:** Sebagai pengguna, saya ingin **zoom & geser** pohon, agar pohon besar tetap terbaca.
- **E2:** Sebagai pengguna, saya ingin **tap anggota** untuk melihat detail cepat.
- **E3:** Sebagai pengguna, saya ingin **mencari** anggota dalam pohon.

### Tema F — Kolaborasi / Invite (diusulkan, fase berikutnya)
- **F1:** Sebagai owner, saya ingin **mengundang** anggota keluarga lain ke pohon saya.
- **F2:** Sebagai owner, saya ingin memberi peran **Viewer** (hanya lihat) atau **Editor** (boleh menambah/ubah).
- **F3:** Sebagai pengguna yang diundang, saya ingin melihat pohon yang dibagikan ke saya di Home.
- **F4:** Sebagai owner, saya ingin **mencabut akses** kapan saja.

### Tema G — Monetisasi (diusulkan, dipersiapkan, belum aktif)
- **G1:** Sebagai bisnis, kami ingin field `plan` & feature flag siap, agar bisa mengaktifkan batasan/paywall tanpa migrasi data besar.
- **G2:** Sebagai pengguna premium (nanti), saya ingin **export PDF/gambar** pohon.

---

## 5. Acceptance Criteria (untuk story yang diusulkan)

**D1 — Foto anggota**
- [ ] Pengguna dapat mengunggah foto saat menambah/mengubah anggota.
- [ ] Foto tersimpan di Firebase Storage; `photoUrl` dipersistenkan ke dokumen member.
- [ ] Foto tampil sebagai avatar di node pohon; ada fallback inisial bila kosong.
- [ ] Kegagalan upload menampilkan pesan error lokal dan tidak merusak data lain.

**D2 — Status hidup/meninggal**
- [ ] Anggota punya status `living`/`deceased` + tanggal meninggal opsional.
- [ ] Kartu node menampilkan rentang hidup (mis. "1945–2010") bila data ada.

**E1/E2/E3 — Navigasi pohon**
- [ ] Pohon bisa di-zoom (pinch) dan digeser (pan) dengan mulus.
- [ ] Tap node membuka bottom sheet detail anggota.
- [ ] Pencarian memunculkan & menyorot node yang cocok.

**F1/F2 — Invite & peran**
- [ ] Owner dapat mengundang via email/UID/link; undangan punya status & peran.
- [ ] Penerima yang menerima undangan mendapat akses sesuai peran.
- [ ] **Security rules** memvalidasi akses non-owner (read untuk viewer/editor, write hanya editor/owner) — diaudit sebelum rilis.
- [ ] Owner dapat mencabut akses; akses langsung hilang.

**G1 — Persiapan monetisasi**
- [ ] `users/{uid}` punya field `plan` (default `'free'`), belum membatasi apa pun.
- [ ] Fitur kandidat premium dibungkus feature flag (default ON untuk semua).

---

## 6. Flow (journey + states + edge cases)

### Journey utama (pengguna baru)
1. Buka app → Splash → layar Login.
2. Login Google → (pertama kali) dokumen user dibuat → masuk Home.
3. Home kosong → tekan "Buat Pohon" → isi nama → pohon dibuat (optimistic).
4. Masuk detail pohon → kosong → tambah anggota pertama (diri/orang tua).
5. Tambah anggota lain + hubungkan relasi → pohon ter-render otomatis.

### States yang harus ditangani (sebagian sudah ada)
- **Loading:** spinner saat fetch pohon/anggota.
- **Empty:** EmptyState di Home & di pohon tanpa anggota.
- **Error:** banner pesan lokal (akses ditolak / tidak ada koneksi / kesalahan umum).
- **Success:** data muncul; optimistic update memberi feedback instan.

### Edge cases
- Anggota tanpa orang tua → jadi root (sudah ditangani).
- Hapus anggota → referensi di anggota lain dibersihkan (sudah ditangani).
- Pohon sangat besar → 🔶 **Asumsi:** performa render belum diuji untuk ratusan anggota; perlu virtualisasi.
- Offline → 🔵 **Pertanyaan Terbuka:** perilaku offline-first belum didefinisikan.
- Undangan kedaluwarsa / ditolak (fitur baru) → perlu status & UX.

---

## 7. Risks & Trade-offs

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| **Retensi rendah** (sekali pakai) | Fatal untuk produk | Bangun alasan kembali: kolaborasi, foto, reminder; ukur retensi sejak awal |
| **Effort input tinggi** | Drop-off saat onboarding | Input mulus, template, bulk-add; ukur funnel |
| **Keamanan saat sharing** | Kebocoran data keluarga sensitif | Update rules + audit ketat sebelum rilis; peran eksplisit |
| **Skalabilitas pohon besar** | Lag, UX buruk | Virtualisasi node, benchmark layout engine |
| **Monetisasi prematur** | Mematikan pertumbuhan | Tunda paywall; siapkan flag, putuskan batas berbasis data |
| **Data sensitif (anggota hidup)** | Risiko privasi/legal | Kebijakan privasi & consent sejak awal |

---

## 8. Alternatives Considered

1. **Fokus single-owner saja (tanpa kolaborasi).**
   - (+) Sederhana, aman. (−) Membatasi nilai kolektif & pertumbuhan viral. **Ditolak sebagai tujuan akhir**, tapi dipakai sebagai titik awal.

2. **Langsung bangun kolaborasi multi-editor sekarang.**
   - (+) Nilai kolektif cepat. (−) Mahal, risiko keamanan & konflik edit tinggi sebelum produk inti matang. **Ditunda ke Fase 2.**

3. **Monetisasi via iklan.**
   - (+) Tanpa friksi bayar. (−) Mengganggu pengalaman keluarga yang personal; kurang sesuai brand. **Tidak direkomendasikan di awal.**

4. **Mengandalkan standar GEDCOM sebagai fondasi data.**
   - (+) Interoperabilitas dengan tool silsilah lain. (−) Kompleksitas tinggi untuk MVP. **Pertimbangkan sebagai fitur import/export premium, bukan fondasi.**

---

## 9. Recommended Solution

Bangun secara bertahap, **dahulukan nilai produk inti, lalu kolaborasi, lalu monetisasi** — dengan persiapan monetisasi dilakukan lebih awal secara arsitektural (tanpa mengaktifkan).

- **Sekarang:** perkaya produk inti (foto, status anggota, navigasi pohon) + observability (Crashlytics/analytics) untuk mengukur retensi & funnel.
- **Berikutnya:** kolaborasi berbasis peran dengan security rules yang diperbarui & diaudit.
- **Nanti:** monetisasi freemium, diputuskan berbasis data retensi & willingness-to-pay.

Alasan: produk silsilah berdiri/jatuh pada **retensi & nilai emosional**. Foto dan kolaborasi adalah pendorong utama keduanya; monetisasi hanya berhasil setelah nilai terbukti.

---

## 10. MVP Scope

**Yang termasuk MVP (Fase 1 — perkuat inti):**
- Foto anggota + cover pohon (aktifkan Firebase Storage) — D1
- Status hidup/meninggal + rentang hidup — D2
- Biografi/catatan singkat — D3
- Navigasi pohon: zoom/pan, tap-to-detail, search — E1/E2/E3
- Crashlytics + analytics dasar (event kunci)
- Sentralisasi pesan error/i18n

**Eksplisit DI LUAR MVP (lihat §11):**
- Kolaborasi/invite (Fase 2)
- Monetisasi aktif & paywall (Fase 4)
- Export PDF/GEDCOM
- Notifikasi FCM
- Offline-first eksplisit

> Prinsip: MVP harus membuktikan bahwa pengguna **kembali** dan menambah data. Jika retensi Fase 1 lemah, evaluasi ulang sebelum membangun kolaborasi.

---

## 11. Future Enhancements

**Fase 2 — Kolaborasi (Invite)**
- Peran Owner/Editor/Viewer; alur invite + deep link; layar "Anggota & Akses"; section "Dibagikan ke saya"; **update + audit security rules**; notifikasi FCM (opsional).
- Keputusan data model: `shareWith: string[]` (cepat) vs subkoleksi `members_access/{uid}` dengan role (skalabel).

**Fase 3 — Siapkan Monetisasi (belum aktif)**
- Field `plan` di user; feature flag via Remote Config; abstraksi limit (`canCreateTree`, dll.); analytics funnel untuk menentukan batas free.

**Fase 4 — Monetisasi Aktif**
- Integrasi billing (RevenueCat/StoreKit/Play Billing); paywall UI ↔ entitlement; export PDF/GEDCOM sebagai fitur premium; backup otomatis.

---

## 12. Success Metrics (usulan)

> Baseline belum ada karena belum ada instrumentasi — **🔵 Pertanyaan Terbuka** untuk semua angka di bawah; tetapkan setelah analytics terpasang.

- **Metrik utama (retensi):** % pengguna yang kembali & menambah ≥1 anggota dalam 7 hari setelah membuat pohon.
- **Metrik sekunder:**
  - Rata-rata jumlah anggota per pohon aktif.
  - % pengguna yang menambahkan foto (indikator keterikatan).
  - Funnel: buat pohon → tambah anggota pertama → tambah anggota ke-5.
- **Guardrail:** tingkat keberhasilan login & waktu render pohon tidak memburuk saat fitur ditambah.

---

## 13. Open Questions (terkumpul)

1. 🔵 Target pasar spesifik: keluarga Indonesia umum, atau segmen tertentu (mis. marga/komunitas)? Memengaruhi positioning & fitur.
2. 🔵 Seberapa besar pohon yang realistis (puluhan/ratusan/ribuan)? Memengaruhi performa & data model.
3. 🔵 Kolaborasi: cukup read-only dulu, atau langsung multi-editor?
4. 🔵 Data model sharing: `shareWith` sederhana vs subkoleksi access dengan role?
5. 🔵 Willingness-to-pay & model monetisasi yang dituju?
6. 🔵 Kebutuhan privasi/consent untuk data anggota yang masih hidup?
7. 🔵 Perlu kompatibilitas GEDCOM untuk menarik pengguna yang sudah punya data?

---

> **Untuk reviewer:** mohon fokus menilai (a) apakah problem statement & persona sesuai realita yang kamu lihat, (b) apakah urutan fase (inti → kolaborasi → monetisasi) tepat, dan (c) jawaban atas Open Questions di §13 — karena itu yang paling memengaruhi keputusan teknis berikutnya.

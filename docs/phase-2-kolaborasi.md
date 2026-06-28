# Fase 2 — Kolaborasi (Invite User)

> Bagian dari roadmap AsalUsul. Lihat `docs/roadmap.md` dan `docs/prd-asalusul.md`.

Status: ⬜ Belum dimulai · Estimasi 🔶: ~4–6 minggu · Prasyarat: Fase 1 lulus exit gate

---

## 1. Tujuan & Hipotesis

**Tujuan:** Owner dapat mengundang anggota keluarga lain untuk **melihat** atau **berkontribusi** ke pohon keluarganya.

**Hipotesis:** Silsilah adalah pengetahuan kolektif. Dengan kolaborasi, lebih banyak data terkumpul (dari sesepuh keluarga) dan terjadi pertumbuhan viral dalam satu keluarga (satu owner mengundang banyak anggota) → retensi & akuisisi naik.

---

## 2. Lingkup (Scope)

### Termasuk
1. **Model peran:** Owner / Editor / Viewer
2. **Alur undangan:** kirim, terima, tolak, kedaluwarsa
3. **Deep link** undangan (`scheme: asalusul`)
4. **Update + audit Security Rules** (kritis)
5. **UI akses:** layar "Anggota & Akses" per pohon + cabut akses
6. **Home:** section "Dibagikan ke saya"
7. **Notifikasi FCM** (opsional di fase ini)

### Tidak termasuk
- Real-time co-editing dengan resolusi konflik kompleks (cukup last-write-wins + optimistic update yang sudah ada)
- Monetisasi batas kolaborator (disiapkan di Fase 3)

---

## 3. Keputusan Desain yang Harus Diambil Dulu

> 🔵 **Pertanyaan Terbuka — wajib diputuskan sebelum mulai:**

**A. Data model sharing:**
- **Opsi A (cepat):** ubah `shareWith: string[]` → map `sharedWith: { [uid]: 'editor' | 'viewer' }` di dokumen tree.
- **Opsi B (skalabel, direkomendasikan untuk kolaborasi serius):** subkoleksi `family_trees/{treeId}/access/{uid}` berisi `{ role, invitedBy, joinedAt }`. Memudahkan query "pohon yang dibagikan ke saya" dan skala banyak kolaborator.

**B. Cakupan peran:** cukup Viewer + Editor, atau perlu peran lebih granular?

**C. Kanal undangan:** email, UID, link, atau kombinasi?

---

## 4. Penambahan Teknologi
- **Cloud Functions** — logika yang tidak boleh dipercayakan ke klien: memproses penerimaan undangan, menambah/mencabut akses, mengirim notifikasi.
- **FCM (Cloud Messaging)** — notifikasi undangan & perubahan (opsional).
- **Firebase Dynamic Links / deep link handling** — membuka undangan dari luar app.

---

## 5. Rincian Pekerjaan (Deliverables)

### 5.1 Data model & migrasi
- Implementasi keputusan §3.A.
- Migrasi data lama (`shareWith: []`) agar kompatibel.

### 5.2 Security Rules (KRITIS)
- Izinkan `read` pada tree & members bila uid ada di access list (owner/editor/viewer).
- Izinkan `write` pada members hanya untuk owner/editor.
- Lindungi field sensitif: hanya owner boleh ubah access list & `ownerId`.
- **Audit wajib** sebelum rilis (gunakan skill `firebase-security-rules-auditor`).
- Tambah test rules (emulator) untuk tiap peran.

### 5.3 Alur undangan
- Dokumen `invitations/{inviteId}`: `{ treeId, role, invitedBy, inviteeEmailOrUid, status, expiresAt }`.
- Cloud Function: validasi & proses terima/tolak; tambahkan akses secara server-side.
- Deep link → layar "Terima Undangan".

### 5.4 UI
- Layar "Anggota & Akses": daftar kolaborator + peran + tombol cabut.
- Indikator "Dibagikan" pada kartu pohon.
- Section "Dibagikan ke saya" di Home (query pohon di mana uid ada di access list).
- Pembedaan UI read-only untuk Viewer (sembunyikan aksi edit).

### 5.5 Notifikasi (opsional)
- FCM saat diundang / akses diberikan / perubahan penting.

---

## 6. Acceptance Criteria (level fase)
- [ ] Owner dapat mengundang via kanal yang dipilih; undangan punya status & peran.
- [ ] Penerima yang menerima mendapat akses sesuai peran; muncul di "Dibagikan ke saya".
- [ ] Viewer hanya bisa melihat; Editor bisa menambah/ubah anggota; hanya Owner kelola akses & hapus pohon.
- [ ] Owner dapat mencabut akses; akses hilang seketika (diverifikasi via rules).
- [ ] Security rules teraudit & lulus test emulator untuk semua peran.
- [ ] Undangan kedaluwarsa/ditolak ditangani dengan benar.

---

## 7. Exit Gate (syarat lanjut ke Fase 3)
- Sharing berfungsi end-to-end & aman (rules teraudit).
- Ada sinyal penggunaan kolaborasi (mis. % owner yang mengundang ≥1 orang).
  - 🔵 Target ditetapkan berdasarkan data Fase 1–2.

---

## 8. Risiko & Mitigasi
| Risiko | Mitigasi |
|--------|----------|
| **Kebocoran data keluarga** (rules salah) | Audit ketat + test emulator menyeluruh sebelum rilis |
| Konflik edit multi-editor | Last-write-wins + optimistic update; pertimbangkan jejak perubahan |
| Undangan disalahgunakan/forwarded | Undangan terikat email/uid + expiry + sekali pakai |
| Kompleksitas data model | Pilih Opsi B bila menargetkan skala; jangan over-engineer bila tidak |
| Privasi anggota yang masih hidup | Pertimbangkan consent & kebijakan privasi |

---

## 9. Catatan Keamanan
Fase ini **memperluas siapa yang bisa membaca/menulis data keluarga**. Setiap perubahan rules harus melalui review keamanan (agent `security-reviewer` / `pr-security-auditor`) sebelum merge.

---

## 10. Langkah Berikutnya
Turunkan ke spec teknis, contoh:
- `.kiro/specs/sharing-access-model/`
- `.kiro/specs/invitations-flow/`
- `.kiro/specs/sharing-security-rules/`

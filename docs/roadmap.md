# AsalUsul — Roadmap & Indeks Fase

> Dokumen payung yang menghubungkan PRD utama (`docs/prd-asalusul.md`) ke rencana eksekusi per fase.

Terakhir diperbarui: 28 Juni 2026

---

## Prinsip Roadmap

1. **Berurutan, bukan paralel.** Tiap fase punya *exit gate*. Jangan masuk fase berikutnya sebelum gate terpenuhi.
2. **Validasi sebelum investasi.** Retensi Fase 1 harus terbukti sebelum membangun kolaborasi.
3. **Stack tetap, layanan ditambah.** Tidak ada perombakan arsitektur — hanya mengaktifkan layanan Firebase tambahan sesuai kebutuhan fase.
4. **Monetisasi disiapkan lebih awal, diaktifkan paling akhir.**

---

## Peta Fase

| Fase | Nama | Tujuan utama | Status | Estimasi 🔶 |
|------|------|--------------|--------|-------------|
| 0 | Fondasi | Auth, CRUD pohon & anggota, tree engine, Firestore | ✅ Selesai | — |
| 1 | Perkuat Produk Inti | Buktikan retensi (foto, detail, navigasi) | 🔄 Kode selesai* | ~3–5 minggu |
| 2 | Kolaborasi (Invite) | Owner mengundang keluarga lain | 🔄 Kode selesai* | ~4–6 minggu |
| 3 | Siapkan Monetisasi | Arsitektur siap tanpa paywall | 🔄 Kode inti selesai* | ~1–2 minggu |
| 4 | Monetisasi Aktif | Mulai menghasilkan | ⬜ Belum | ~3–4 minggu |

Dokumen detail:
- `docs/phase-1-perkuat-inti.md`
- `docs/phase-2-kolaborasi.md`
- `docs/phase-3-siapkan-monetisasi.md`
- `docs/phase-4-monetisasi-aktif.md`

> *Fase 1: seluruh kode selesai & test hijau. Yang tersisa adalah aksi infrastruktur dari pemilik project: aktifkan Firebase Storage + deploy `storage.rules`, dan aktifkan native Analytics/Crashlytics (lihat `docs/observability-setup.md`), lalu rebuild dev client.

---

## Penambahan Layanan per Fase (tanpa ganti stack)

| Fase | Layanan/teknologi yang ditambah |
|------|----------------------------------|
| 1 | Firebase Storage, Crashlytics, Analytics |
| 2 | Cloud Functions (invite logic), FCM |
| 3 | Remote Config (feature flag) |
| 4 | RevenueCat / Billing + Cloud Functions (webhook entitlement) |

---

## Exit Gate Ringkas

- **Fase 1 → 2:** Metrik retensi inti tercapai (lihat dokumen Fase 1). Jika tidak, evaluasi ulang produk sebelum kolaborasi.
- **Fase 2 → 3:** Sharing berfungsi & security rules teraudit; ada sinyal penggunaan kolaborasi.
- **Fase 3 → 4:** Flag & entitlement siap; ada sinyal willingness-to-pay dari data/analitik.

---

## Catatan
Spec teknis detail (requirements/design/tasks) diturunkan ke `.kiro/specs/<feature>/` saat fase mulai dikerjakan. Dokumen fase di `docs/` adalah rencana level produk/perencanaan.

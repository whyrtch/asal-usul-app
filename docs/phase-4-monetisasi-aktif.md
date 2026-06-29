# Fase 4 — Monetisasi Aktif

> Bagian dari roadmap AsalUsul. Lihat `docs/roadmap.md` dan `docs/prd-asalusul.md`.

Status: ⬜ Belum dimulai · Estimasi 🔶: ~3–4 minggu · Prasyarat: Fase 3 lulus exit gate + keputusan model bisnis

---

## 1. Tujuan

**Tujuan:** Mengaktifkan monetisasi secara nyata — pengguna dapat berlangganan/membeli premium, dan batasan free mulai berlaku — di atas kerangka yang sudah disiapkan di Fase 3.

> Aktifkan fase ini **hanya** setelah ada bukti nilai & retensi (Fase 1–2) dan sinyal willingness-to-pay (Fase 3).

---

## 2. Keputusan yang Harus Final Dulu

> 🔵 **Pertanyaan Terbuka — wajib diputuskan sebelum mulai:**
- **Model bisnis:** subscription (bulanan/tahunan), one-time unlock, atau kombinasi?
- **Batas free vs premium** (angka konkret, berdasarkan data funnel Fase 3).
- **Harga** untuk pasar Indonesia.

Usulan awal (ilustrasi, untuk diskusi):
| Fitur | Free | Premium |
|-------|------|---------|
| Jumlah pohon | 1 | Tak terbatas |
| Anggota per pohon | mis. 25 | Tak terbatas |
| Foto | terbatas | penuh |
| Kolaborator | 1–2 viewer | banyak + editor |
| Export PDF/GEDCOM | ❌ | ✅ |
| Backup otomatis | ❌ | ✅ |

---

## 3. Lingkup (Scope)

### Termasuk
1. **Integrasi billing** (rekomendasi: RevenueCat di atas StoreKit/Play Billing)
2. **Webhook entitlement** via Cloud Functions (set `plan` secara server-side)
3. **Paywall UI** + hubungkan feature flag ↔ entitlement
4. **Aktifkan batas free** melalui Remote Config (mengisi nilai limit yang sebelumnya tak terbatas)
5. **Fitur premium:** Export PDF/gambar (+ GEDCOM opsional), backup otomatis

### Tidak termasuk
- Skema diskon/kupon kompleks (bila perlu, fase terpisah)

---

## 4. Penambahan Teknologi
- **RevenueCat** — abstraksi pembelian lintas platform (lebih sederhana daripada native langsung).
- **Cloud Functions** — menerima webhook billing, memvalidasi, dan menulis `plan` ke `users/{uid}` (server-side, tidak boleh dari klien).
- Pustaka **export PDF/gambar** untuk fitur premium.

---

## 5. Rincian Pekerjaan (Deliverables)

### 5.1 Billing
- Konfigurasi produk di App Store Connect & Google Play.
- Integrasi RevenueCat (atau StoreKit/Play Billing langsung).
- Layar pembelian/langganan.

### 5.2 Entitlement server-side
- Cloud Function webhook RevenueCat → set `plan` di `users/{uid}`.
- Klien membaca `plan` (read-only); **klien tidak pernah menulis `plan`** (dijaga security rules).

### 5.3 Aktifkan pembatasan
- Hubungkan helper `canCreateTree`/`canAddMember`/`canExport` (dibuat di Fase 3) ke `plan` + nilai Remote Config.
- Set batas free di Remote Config.

### 5.4 Paywall UI
- Tampilkan paywall di titik batas (mis. saat coba buat pohon ke-2 sebagai free).
- Pesan jelas + jalur upgrade yang mulus.

### 5.5 Fitur premium
- Export pohon ke PDF/gambar.
- (Opsional) Export/import GEDCOM.
- Backup otomatis.

---

## 6. Acceptance Criteria (level fase)
- [ ] Pengguna dapat membeli/berlangganan premium; `plan` ter-update via webhook server-side.
- [ ] `plan` hanya bisa ditulis server-side; klien tidak bisa mengubahnya (diverifikasi via rules).
- [ ] Batas free berlaku sesuai konfigurasi; paywall muncul di titik yang tepat.
- [ ] Pengguna premium mendapat fitur premium (export, dll.).
- [ ] Restore purchase berfungsi; status langganan akurat lintas perangkat.

---

## 7. Risiko & Mitigasi
| Risiko | Mitigasi |
|--------|----------|
| Entitlement bisa dimanipulasi klien | Tulis `plan` hanya via Cloud Function; rules tolak tulisan klien |
| Paywall menurunkan retensi/akuisisi | A/B test batas; pantau guardrail metrics |
| Kompleksitas billing lintas platform | Pakai RevenueCat untuk menyederhanakan |
| Kebijakan store (refund, langganan) | Patuhi pedoman App Store & Play; uji restore/refund |
| Pasar ID enggan bayar | Validasi harga & model lewat data Fase 3; pertimbangkan harga lokal |

---

## 8. Exit Gate
- Pembelian, entitlement, dan pembatasan berfungsi & aman.
- Metrik konversi terukur; guardrail (retensi, akuisisi) tidak memburuk signifikan.

---

## 9. Langkah Berikutnya
Turunkan ke spec teknis, contoh:
- `.kiro/specs/billing-integration/`
- `.kiro/specs/entitlement-webhook/`
- `.kiro/specs/export-premium/`

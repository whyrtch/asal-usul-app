# Fase 3 — Siapkan Monetisasi (Belum Diaktifkan)

> Bagian dari roadmap AsalUsul. Lihat `docs/roadmap.md` dan `docs/prd-asalusul.md`.

Status: ⬜ Belum dimulai · Estimasi 🔶: ~1–2 minggu · Prasyarat: Fase 2 lulus exit gate

---

## 1. Tujuan & Prinsip

**Tujuan:** Menyiapkan arsitektur & data agar monetisasi bisa diaktifkan nanti **tanpa migrasi besar atau perombakan** — tetapi **belum membatasi apa pun** untuk pengguna saat ini.

**Prinsip:**
- Jangan bangun paywall atau pasang SDK billing di fase ini.
- Jangan batasi fitur apa pun. Default semua pengguna = akses penuh.
- Cukup siapkan "kerangka" yang nanti tinggal dinyalakan.

---

## 2. Lingkup (Scope)

### Termasuk
1. **Entitlement field** `plan` di `users/{uid}` (default `'free'`)
2. **Feature flag** via Remote Config (default ON untuk semua)
3. **Abstraksi limit** di satu sumber kebenaran (mis. `canCreateTree`, `canAddMember`)
4. **Analytics funnel** untuk menentukan batas free berbasis data

### Tidak termasuk
- Paywall UI, SDK billing, pembatasan aktual (semua di Fase 4)

---

## 3. Penambahan Teknologi
- **Firebase Remote Config** — feature flag & nilai batas (limit) yang bisa diubah tanpa rilis.

Tidak ada SDK billing di fase ini.

---

## 4. Rincian Pekerjaan (Deliverables)

### 4.1 Entitlement model
- Tambah `plan: 'free' | 'premium'` di `UserDocument` (default `'free'`).
- Repository & store membaca `plan`, tapi belum dipakai untuk membatasi.

### 4.2 Feature flag (Remote Config)
- Definisikan flag untuk fitur kandidat premium (mis. `feature_export`, `feature_unlimited_trees`, `limit_members_free`).
- Default: semua fitur ON, limit "tak terbatas" untuk semua → tidak ada perubahan perilaku.

### 4.3 Abstraksi limit
- Buat helper terpusat, mis. `src/services/entitlements.ts`:
  - `canCreateTree(user, currentTreeCount): boolean`
  - `canAddMember(user, currentMemberCount): boolean`
  - `canExport(user): boolean`
- Saat ini semua mengembalikan `true` (atau membaca limit dari Remote Config yang di-set tak terbatas).
- Tujuannya: saat Fase 4, cukup ubah nilai Remote Config + hubungkan ke `plan` — **tanpa menyentuh banyak file**.

### 4.4 Analytics funnel
- Lacak event indikator nilai: membuat pohon ke-2, menambah anggota ke-N, klik (calon) fitur premium seperti export.
- Tujuan: menentukan batas free yang masuk akal berbasis perilaku nyata, bukan tebakan.

---

## 5. Acceptance Criteria (level fase)
- [ ] `users/{uid}` punya field `plan` (default `'free'`); tidak ada perubahan perilaku bagi pengguna.
- [ ] Fitur kandidat premium dibungkus feature flag; semua default ON.
- [ ] Helper entitlement terpusat ada & dipakai di titik keputusan (membuat pohon, menambah anggota), saat ini selalu mengizinkan.
- [ ] Event funnel monetisasi tercatat di analytics.
- [ ] Tidak ada paywall/SDK billing yang terpasang.

---

## 6. Exit Gate (syarat lanjut ke Fase 4)
- Flag & entitlement siap dan teruji (mengubah Remote Config benar-benar mengubah perilaku helper).
- Ada **sinyal willingness-to-pay** atau data funnel yang cukup untuk menetapkan batas free.
  - 🔵 **Pertanyaan Terbuka:** model & harga belum diputuskan — lihat §13 PRD.

---

## 7. Risiko & Mitigasi
| Risiko | Mitigasi |
|--------|----------|
| Over-engineer entitlement | Cukup satu field `plan` + flag; jangan bikin sistem role/billing kompleks dulu |
| Flag tak sengaja membatasi pengguna | Default ON untuk semua; uji bahwa perilaku tidak berubah |
| Batas free ditebak tanpa data | Tunggu data funnel sebelum menetapkan angka |

---

## 8. Langkah Berikutnya
Turunkan ke spec teknis, contoh:
- `.kiro/specs/entitlements-foundation/`
- `.kiro/specs/remote-config-flags/`

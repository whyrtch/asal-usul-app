# Phase 3 — Laporan Penyelesaian (Siapkan Monetisasi)

> Status: ✅ **Kode inti selesai** (prepare-only) · Tanggal: 28 Juni 2026
> Spec: `.kiro/specs/monetization-foundation/` · Rencana: `docs/phase-3-siapkan-monetisasi.md` · Roadmap: `docs/roadmap.md`

Fase 3 menyiapkan **kerangka monetisasi** tanpa mengaktifkan apa pun. **Nol perubahan perilaku** untuk pengguna: tidak ada paywall, tidak ada SDK billing, tidak ada Remote Config native, tidak ada pembatasan aktif. Semua pengguna tetap akses penuh.

---

## 1. Ringkasan Task

| Task | Status |
|------|--------|
| 1 Modul entitlement (`src/services/entitlements.ts`) | ✅ |
| 2 Field `plan` pada user | ✅ |
| 3 Event analitik funnel | ✅ |
| 4 Wiring decision points | ⏸️ Ditunda ke Phase 4 (nol efek di bawah default tak-terbatas) |
| 5 Checkpoint | ✅ (no behavior change terverifikasi) |

---

## 2. Keputusan Arsitektur

- **`plan`** di `users/{uid}` (`'free' | 'premium'`, default `'free'`). Klien hanya membaca; upgrade = server/billing (Phase 4).
- **Sumber limit/flag = lokal sekarang** via `LimitsProvider` yang swappable. Default = **tak terbatas** (`null`) untuk semua plan → tidak ada pembatasan. Seam `setLimitsProvider()` untuk diganti ke Remote Config di Phase 4 tanpa menyentuh call site.
- **Tanpa Remote Config native** (hindari Blaze/dev build), **tanpa billing SDK**, **tanpa paywall**.

---

## 3. Yang Dibangun

| File | Peran |
|------|-------|
| `src/services/entitlements.ts` | `Plan`, `Limits`, `LimitsProvider`, `EntitlementResult`; `DefaultLimitsProvider` (unlimited); `canCreateTree`/`canAddMember`/`canExport`; `setLimitsProvider` (seam) |
| `src/types/firestore.ts` | `UserDocument.plan` |
| `src/repositories/userRepository.ts` | `createUser` set `plan:'free'`; mapping default `plan → 'free'` |
| `src/services/analytics/events.ts` | `LIMIT_REACHED`, `UPGRADE_PROMPT_SHOWN`, `EXPORT_CLICKED` |
| `src/__tests__/entitlements.test.ts` | unit + property tests |

Aturan entitlement: `null` limit ⇒ `allowed`; numeric L ⇒ allowed iff `count < L`. Default provider ⇒ selalu `allowed`.

---

## 4. Status Verifikasi

- **Test suite**: 438 passed, 24 skipped (462 total), 48 suite hijau.
- **Diagnostics**: bersih.
- **Test baru**: `entitlements.test.ts` (unlimited⇒allowed, boundary count<L, default tak pernah deny, provider swap).
- **Tanpa regresi**: default tak-terbatas → perilaku app tidak berubah; `userRepository` suite tetap hijau dengan `plan` baru.

---

## 5. Yang DITUNDA ke Phase 4 (saat monetisasi diaktifkan)

- Wiring entitlement ke titik keputusan (create tree / add member) + memuat `plan` ke app state.
- `RemoteConfigLimitsProvider` + set limit free non-null (mis. maxTrees, maxMembersPerTree).
- Integrasi billing (RevenueCat/StoreKit/Play Billing) + webhook server-side untuk set `plan`.
- Paywall UI + fitur premium (export PDF/GEDCOM).

---

## 6. Catatan Tech-Lead

- Kerangka ("saklar") sudah siap, tapi **angka batas free sebaiknya ditetapkan berbasis data** — tunggu retensi (Phase 1) & penggunaan invite (Phase 2) dari rilis nyata sebelum mengaktifkan limit.
- Aktivasi Phase 4 idealnya juga menunggu sinyal willingness-to-pay (lihat Open Questions §13 PRD).

---

## 7. Definisi "Selesai" Phase 3

- [x] Modul entitlement + tests.
- [x] Field `plan` + default mapping.
- [x] Event funnel.
- [x] Tanpa perubahan perilaku (verified, suite hijau).
- [x] Tanpa Remote Config native / billing / paywall.
- [ ] Aktivasi limit & billing — *Phase 4.*

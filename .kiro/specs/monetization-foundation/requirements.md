# Requirements Document

_Feature: Monetization Foundation (Phase 3) — prepare, do not activate_

## Introduction

Phase 3 menyiapkan **kerangka monetisasi** agar nanti (Phase 4) bisa diaktifkan tanpa migrasi besar — **tanpa mengubah perilaku apa pun untuk pengguna saat ini**. Tidak ada paywall, tidak ada SDK billing, tidak ada pembatasan aktif. Semua pengguna tetap akses penuh.

Yang disiapkan: field `plan` pada user, abstraksi entitlement/limit terpusat (default tak terbatas), sumber flag/limit yang bisa di-swap ke Firebase Remote Config nanti, dan event analitik funnel untuk menentukan batas free berbasis data.

> Catatan plan gratis: **tidak memakai Remote Config native sekarang** (butuh Blaze/dev build). Sumber limit/flag memakai konfigurasi lokal dengan seam yang jelas untuk diganti ke Remote Config di Phase 4 — mirip pola provider analytics.

## Glossary

- **Plan**: tingkat akun pengguna — `'free' | 'premium'`. Default `'free'`.
- **Entitlement**: keputusan boleh/tidaknya suatu aksi berdasarkan plan + limit.
- **Limit**: nilai batas (mis. jumlah pohon/anggota) yang bisa dikonfigurasi; default tak terbatas.
- **LimitsProvider**: sumber nilai limit/flag (lokal sekarang; Remote Config nanti).

## Keputusan (🟢 untuk review)

- 🟢 **KEPUTUSAN 1**: `plan` disimpan di `users/{uid}.plan`, default `'free'`. Klien hanya membaca; perubahan plan (upgrade) dilakukan server/billing di Phase 4.
- 🟢 **KEPUTUSAN 2**: sumber limit/flag = **konfigurasi lokal** (`LimitsProvider` default), seam untuk Remote Config nanti. Default semua limit = tak terbatas (`null`/`Infinity`) → tidak ada pembatasan.
- 🟢 **KEPUTUSAN 3**: helper entitlement terpusat (`canCreateTree`, `canAddMember`, `canExport`) dipakai di titik keputusan, tetapi saat ini SELALU mengizinkan.
- 🟢 **KEPUTUSAN 4**: tambah event analitik funnel; tidak ada paywall/billing.

---

## Requirements

### Requirement 1: Field `plan` pada user

**User Story:** Sebagai bisnis, saya ingin setiap user punya field `plan`, sehingga entitlement bisa dihubungkan nanti tanpa migrasi data.

#### Acceptance Criteria

1. THE `UserDocument` SHALL include a `plan` field of type `'free' | 'premium'`.
2. WHEN a new user document is created, THE system SHALL set `plan` to `'free'`.
3. WHEN reading a user document that lacks `plan` (legacy), THE system SHALL default it to `'free'`.
4. THE client SHALL treat `plan` as read-only (no client code path sets it to `'premium'` in Phase 3).

### Requirement 2: Abstraksi Limit / LimitsProvider

**User Story:** Sebagai pengembang, saya ingin sumber limit terpusat & bisa di-swap, sehingga Phase 4 cukup mengganti provider tanpa menyentuh call site.

#### Acceptance Criteria

1. THE system SHALL define a `Limits` shape (mis. `maxTrees`, `maxMembersPerTree`, `exportEnabled`) per plan.
2. THE system SHALL provide a default `LimitsProvider` returning **unlimited** values (`null` = tak terbatas) for both plans.
3. THE system SHALL allow swapping the active `LimitsProvider` at startup (seam for Remote Config) without changing call sites.
4. A limit value of `null` SHALL mean "tak terbatas".

### Requirement 3: Helper Entitlement

**User Story:** Sebagai pengembang, saya ingin keputusan akses di satu tempat, sehingga konsisten dan mudah diaktifkan nanti.

#### Acceptance Criteria

1. THE system SHALL provide `canCreateTree(plan, currentTreeCount)`, `canAddMember(plan, currentMemberCount)`, `canExport(plan)`.
2. WHEN the relevant limit is `null` (unlimited), THE helper SHALL return `{ allowed: true }`.
3. WHEN `currentCount` is below a numeric limit, THE helper SHALL return `{ allowed: true }`.
4. WHEN `currentCount` is at or above a numeric limit, THE helper SHALL return `{ allowed: false, reason, limit }`.
5. WITH the default (unlimited) provider, ALL helpers SHALL return `{ allowed: true }` for any input → no behavior change.

### Requirement 4: Analytics Funnel

**User Story:** Sebagai bisnis, saya ingin sinyal nilai terekam, sehingga batas free ditetapkan berbasis data.

#### Acceptance Criteria

1. THE system SHALL log funnel events relevant to monetization (mis. `tree_created` sudah ada; tambah `limit_reached`, `upgrade_prompt_shown` placeholder, `export_clicked`).
2. THE events SHALL go through the existing analytics facade (no-op default; never throws).

### Requirement 5: Tidak Ada Pembatasan/Paywall Aktif

**User Story:** Sebagai pengguna saat ini, saya ingin tidak ada perubahan, sehingga pengalaman tetap penuh.

#### Acceptance Criteria

1. THE system SHALL NOT install any billing SDK in Phase 3.
2. THE system SHALL NOT render any paywall UI in Phase 3.
3. WITH the default provider, creating trees/members and using features SHALL behave exactly as before.

---

## Correctness Properties

### Property 1: Unlimited ⇒ always allowed
*For any* plan and any non-negative count, when the limit is `null`, the helper returns `allowed: true`. **Validates: Requirements 2.2, 3.2, 3.5**

### Property 2: Numeric limit boundary
*For any* numeric limit L and count c, the helper returns `allowed: true` iff `c < L`, else `allowed: false`. **Validates: Requirements 3.3, 3.4**

### Property 3: plan default
*For any* user document missing `plan`, the mapped value is `'free'`. **Validates: Requirements 1.3**

### Property 4: No-op default provider
*For any* sequence of entitlement checks under the default provider, none returns `allowed: false`. **Validates: Requirements 3.5, 5.3**

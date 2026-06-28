# Design Document — Monetization Foundation (Phase 3)

## Overview

Menyiapkan kerangka monetisasi tanpa mengaktifkan apa pun. Tiga bagian:
1. `plan` di `users/{uid}` (data).
2. Modul entitlement terpusat (`src/services/entitlements.ts`) dengan `LimitsProvider` yang bisa di-swap.
3. Event analitik funnel lewat facade analytics yang sudah ada.

Default = tak terbatas → nol perubahan perilaku. Berjalan penuh di plan gratis (tanpa Remote Config native, tanpa billing).

## Architecture

```
Call sites (stores/screens)
   → entitlements.can*(plan, count)         // pure decision
        → LimitsProvider (active)           // swappable: local default → Remote Config (Phase 4)
users/{uid}.plan  → read via userRepository → app state
analytics facade  ← funnel events
```

Pola provider sama seperti `src/services/analytics` (default aman, swap di startup).

## Data Models

`UserDocument` (extend, `src/types/firestore.ts`):
```ts
plan: 'free' | 'premium'; // default 'free'
```
`userRepository`:
- `createUser` sets `plan: 'free'`.
- mapping defaults missing `plan` → `'free'`.
- (Phase 4) `updatePlan` is intentionally NOT added client-side; plan changes are server/billing-driven.

## Components and Interfaces

`src/services/entitlements.ts`:
```ts
export type Plan = 'free' | 'premium';

export interface Limits {
  maxTrees: number | null;          // null = unlimited
  maxMembersPerTree: number | null; // null = unlimited
  exportEnabled: boolean;
}

export interface LimitsProvider {
  getLimits(plan: Plan): Limits;
}

export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  limit?: number | null;
}

export const DefaultLimitsProvider: LimitsProvider; // unlimited for both plans
export function setLimitsProvider(p: LimitsProvider): void;
export function canCreateTree(plan: Plan, currentTreeCount: number): EntitlementResult;
export function canAddMember(plan: Plan, currentMemberCount: number): EntitlementResult;
export function canExport(plan: Plan): EntitlementResult;
```
- `null` limit ⇒ `{ allowed: true }`.
- numeric limit L ⇒ allowed iff `count < L`.
- DefaultLimitsProvider returns `{ maxTrees: null, maxMembersPerTree: null, exportEnabled: true }` for both plans → always allowed.

Analytics (`src/services/analytics/events.ts`): add `LIMIT_REACHED`, `UPGRADE_PROMPT_SHOWN`, `EXPORT_CLICKED` (placeholders; wired where relevant later).

## Error Handling

- Entitlement helpers are pure & total (no throw). Invalid/negative counts treated defensively (count < L still holds).
- Analytics via facade (never throws).
- No new Firestore writes for `plan` from client (avoids permission concerns); `plan` only read.

## Correctness Properties

### Property 1: Unlimited ⇒ always allowed
Null limit always yields allowed. **Validates: Requirements 2.2, 3.2, 3.5**

### Property 2: Numeric limit boundary
allowed iff count < L. **Validates: Requirements 3.3, 3.4**

### Property 3: plan default
Missing `plan` maps to `'free'`. **Validates: Requirements 1.3**

### Property 4: No-op default provider
Default provider never denies. **Validates: Requirements 3.5, 5.3**

## Testing Strategy

- **Pure unit + property** (fast-check) for `entitlements.ts`: null vs numeric limits, boundary, default provider never denies, provider swap works.
- **userRepository**: `plan` default mapping + createUser sets 'free' (extend existing tests / new test).
- No UI tests needed (no UI change).

## Rollout

- No flag needed for the foundation itself (no behavior change). The seam (`setLimitsProvider`) + `plan` field are the activation points for Phase 4.
- Phase 4 will: provide a RemoteConfigLimitsProvider, set non-null free limits, wire `plan` from billing, and add paywall UI.

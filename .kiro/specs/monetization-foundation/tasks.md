# Implementation Plan — Monetization Foundation (Phase 3)

## Overview

Prepare-only. Pure code, no behavior change, no Remote Config native, no billing, no paywall. Order: entitlements module (pure + tested) → `plan` field → analytics funnel events → (optional) wire decision points with the default/unlimited provider.

## Tasks

- [x] 1. Entitlements module (`src/services/entitlements.ts`)
  - [x] 1.1 `Plan`, `Limits`, `LimitsProvider`, `EntitlementResult`; `DefaultLimitsProvider` (unlimited); `setLimitsProvider`/`getLimitsProvider`
  - [x] 1.2 `canCreateTree`, `canAddMember`, `canExport` (null ⇒ allowed; numeric ⇒ count < L)
  - [x] 1.3 Unit + property tests (boundary, unlimited, default-never-denies, provider swap)
  - _Requirements: 2, 3; Properties 1, 2, 4_

- [x] 2. `plan` field on user
  - [x] 2.1 Add `plan: 'free' | 'premium'` to `UserDocument`
  - [x] 2.2 `userRepository`: `createUser` sets `plan: 'free'`; mapping defaults missing `plan` → `'free'`
  - [x] 2.3 Test: default mapping + createUser sets 'free' (covered by userRepository suite)
  - _Requirements: 1; Property 3_

- [x] 3. Analytics funnel events
  - [x] 3.1 Add `LIMIT_REACHED`, `UPGRADE_PROMPT_SHOWN`, `EXPORT_CLICKED` to `AnalyticsEvents`
  - _Requirements: 4_

- [ ] 4. (Optional / deferred to Phase 4) Wire decision points
  - [ ] 4.1 At create-tree / add-member, consult entitlements (always allowed under default provider)
  - Deferred: requires user `plan` in app state; zero effect under unlimited defaults, so wiring is deferred to Phase 4 when limits are activated.
  - _Requirements: 3, 5_

- [ ] 5. Checkpoint — review
  - Confirm no behavior change; defer Remote Config + paywall + billing to Phase 4.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "3"], "parallel": true },
    { "wave": 2, "tasks": ["4"], "parallel": false },
    { "wave": 3, "tasks": ["5"], "parallel": false }
  ]
}
```

- Wave 1: entitlements (1), plan field (2), events (3) are independent.
- Wave 2: wiring (4) depends on 1–3.
- Wave 3: checkpoint (5).

## Notes

- Prepare-only: no Remote Config native, no billing SDK, no paywall, no active limits (Phase 4 activates).
- The activation seam is `setLimitsProvider(...)` + the `plan` field; Phase 4 swaps in a Remote Config provider and non-null free limits.
- Tech-lead note: ideally collect retention/usage data (Phase 1–2 deployed) before setting real free limits.

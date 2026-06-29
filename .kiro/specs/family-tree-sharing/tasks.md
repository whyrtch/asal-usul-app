# Implementation Plan — Family Tree Sharing (Phase 2)

## Overview

Build sharing in dependency order: types → pure role logic → repositories → store → security rules (+ emulator tests) → accept flow (rules-only) → UI → flag wiring. Ship behind `FEATURE_SHARING` (default off) until rules are audited.

> Decisions assumed (see requirements §Keputusan Arsitektur): subcollection access model, roles owner/editor/viewer, email-identity + manual invite link, **rules-only accept (no Cloud Functions, free Spark plan)**. Adjust here if review changes them.

## Tasks

- [x] 1. Types & feature flag
  - [x] 1.1 Create `src/types/sharing.ts` (`Role`, `AccessRole`, `AccessDocument`, `InvitationDocument`, `InvitationStatus`, app-level variants)
  - [x] 1.2 Add `FEATURE_SHARING` to `src/constants/features.ts` (env `EXPO_PUBLIC_ENABLE_SHARING`, default off)
  - _Requirements: 1, 2_

- [x] 2. Pure role logic (`src/utils/roles.ts`)
  - [x] 2.1 Implement `deriveRole`, `canEditMembers`, `canManageTree`, `canManageAccess`
  - [x] 2.2 Unit + property tests: role enum, owner precedence, editor/viewer gating
  - _Requirements: 8; Properties 1, 3_

- [x] 3. accessRepository
  - [x] 3.1 `fetchAccessList`, `getMyAccess`, `setAccessRole`, `revokeAccess`, `fetchSharedTreeRefs` (collectionGroup)
  - [x] 3.2 Tests (mock firebase/firestore): query shape, role mapping, refs resolution
  - _Requirements: 1, 5, 6; Properties 2, 5_

- [x] 4. invitationRepository
  - [x] 4.1 `createInvitation` (email normalize + validate + dedupe pending), `fetchInvitationsForTree`, `fetchMyPendingInvitations`, `declineInvitation`
  - [x] 4.2 Tests: email normalization, self-invite reject, single-pending dedupe, expiry default
  - _Requirements: 2, 3, 4; Properties 6, 7, 8_

- [x] 5. familyTreeRepository — shared trees
  - [x] 5.1 `fetchSharedFamilyTrees(uid)` resolving refs → trees with derived `role`
  - _Requirements: 6_

- [x] 6. useSharingStore + useFamilyTreeStore integration
  - [x] 6.1 Create `useSharingStore` (collaborators, invitations, actions) with optimistic + rollback + `classifyError`/`recordError`
  - [x] 6.2 Extend `useFamilyTreeStore.loadFamilyTrees` to merge owned + shared (attach role)
  - [x] 6.3 Tests for store behaviors
  - _Requirements: 3, 4, 5, 6, 9_

- [~] 7. Security rules + emulator tests (CRITICAL)
  - [x] 7.1 Extend `firestore.rules`: helpers (isOwner/hasAccess/isEditor), trees, members, access, invitations; ownerId immutable; deny role 'owner'
  - [x] 7.2 Add Firestore emulator test suite covering owner/editor/viewer/none for trees, members, access, invitations (`__rules_tests__/sharing.rules.test.ts` + `jest.rules.config.js` + `npm run test:rules`)
  - [x] 7.3 Add composite index for `collectionGroup('access')` on `uid` (+ invitations indexes) in `firestore.indexes.json`; wire `firebase.json`
  - [~] 7.4 Security audit done (security-reviewer) — found 2 Critical + 1 High; all FIXED in `firestore.rules` (email_verified enforced, one-way invite status transitions to block revoke→re-grant, self-grant field integrity) + emulator tests added for unverified-email and revoke→re-grant. **Pending owner action**: run `npm run test:rules` (needs Java + emulator + `npm i -D @firebase/rules-unit-testing`) before enabling `FEATURE_SHARING`.
  - _Requirements: 7; Properties 2, 3, 5_

- [x] 8. Accept / decline flow (rules-only — no Cloud Functions)
  - [x] 8.1 Client accept implemented in `useSharingStore.accept`: `grantAccess` (create-once, carries `invitedVia`) + `updateInvitationStatus('accepted')`
  - [x] 8.2 Decline/expire via `updateInvitationStatus` / `declineInvitation`
  - [x] 8.3 Emulator tests for accept gating: success; rejected on email mismatch, role escalation, expired, not-pending (in `sharing.rules.test.ts`)
  - _Requirements: 4; Property 4_

- [x] 9. UI — collaborators & invitations
  - [x] 9.1 Collaborators screen (owner): list + role toggle + revoke + invite-by-email form; entry from `FamilySettingsSheet` → "Kelola Akses" (`/collaborators/[treeId]`)
  - [x] 9.2 Invitations inbox (accept/decline) at `/invitations`; entry from Settings tab "Undangan Saya"
  - [x] 9.3 Home: shared trees merged + "Dibagikan · Editor/Lihat" badge on `FamilyTreeCard`
  - [x] 9.4 Detail screen role gating (hide settings for non-owner; hide add/FAB + read-only EmptyTreeState for viewers)
  - [x] 9.5 Deep link `asalusul://invite/{inviteId}` → accept screen (`/invite/[inviteId]`)
  - _Requirements: 5, 6, 8, 9_

- [x] 10. Observability + flag rollout
  - [x] 10.1 Analytics events (invite_sent, invite_accepted, invite_declined, access_revoked, role_changed) wired in `useSharingStore`
  - [x] 10.2 All sharing UI/actions gated behind `FEATURE_SHARING` (screens, settings entries, manage-access entry, shared-tree load)
  - _Requirements: 9_

- [ ] 11. Checkpoint — review & owner infra actions
  - Deploy rules + `collectionGroup('access')` index, audit rules, then enable `FEATURE_SHARING`. (No Cloud Functions / Blaze needed.)

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "parallel": false },
    { "wave": 2, "tasks": ["2", "3", "4", "5"], "parallel": true },
    { "wave": 3, "tasks": ["6", "7", "8"], "parallel": true },
    { "wave": 4, "tasks": ["9", "10"], "parallel": true },
    { "wave": 5, "tasks": ["11"], "parallel": false }
  ]
}
```

- Wave 2 (2,3,4,5) depends on wave 1 (types + flag) and runs in parallel.
- Wave 3: stores (6) depend on 2–5; rules+emulator (7) and rules-only accept (8) can proceed alongside.
- Wave 4: UI (9) depends on 6/7/8; observability+flag (10) alongside.
- Wave 5: checkpoint (11) — deploy rules+index, audit, enable flag.
- Task 7 (rules + emulator) is the critical safety gate and must pass before wave 5.

## Notes

- Ship dark behind `FEATURE_SHARING` (default off) until rules are audited.
- Decisions are recommendations (requirements §Keputusan Arsitektur); confirm before task 1.
- **No Cloud Functions / Blaze plan required** — runs on the free Spark plan. The invitation `status` field + security rules enforce the accept grant.
- Invite delivery is manual (owner shares link/code `asalusul://invite/{inviteId}`); automatic email can be added later only if upgraded to Blaze.
- Owner infra actions (cannot be done from app code): deploy `firestore.rules`, create `collectionGroup('access')` index on `uid`.
- Security-sensitive: every rules change goes through `security-reviewer` / `pr-security-auditor` before merge.


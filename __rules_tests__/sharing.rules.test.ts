/**
 * Firestore security-rules tests for Family Tree Sharing (Phase 2).
 *
 * ⚠️ NOT run by the default `npm test` (excluded via testPathIgnorePatterns).
 * Run with the Firestore emulator:
 *
 *   npm i -D @firebase/rules-unit-testing
 *   npm run test:rules
 *
 * Covers the role model: owner / editor / viewer / outsider across trees,
 * members, access docs, and invitations — including the rules-only invitee
 * self-grant (accept) path.
 *
 * This is the critical safety net before enabling FEATURE_SHARING.
 */

import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    Timestamp,
} from 'firebase/firestore';
import { readFileSync } from 'fs';

const PROJECT_ID = 'asalusul-rules-test';

const OWNER = 'owner_uid';
const OWNER_EMAIL = 'owner@example.com';
const EDITOR = 'editor_uid';
const EDITOR_EMAIL = 'editor@example.com';
const VIEWER = 'viewer_uid';
const VIEWER_EMAIL = 'viewer@example.com';
const OUTSIDER = 'outsider_uid';
const OUTSIDER_EMAIL = 'outsider@example.com';

const TREE_ID = 'tree1';

let testEnv: RulesTestEnvironment;

function authed(uid: string, email: string) {
  return testEnv.authenticatedContext(uid, { email, email_verified: true }).firestore();
}

/** Authenticated but with an UNVERIFIED email (e.g. email/password signup). */
function authedUnverified(uid: string, email: string) {
  return testEnv.authenticatedContext(uid, { email, email_verified: false }).firestore();
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed a tree owned by OWNER, with an editor and a viewer access doc.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'family_trees', TREE_ID), {
      name: 'Keluarga',
      ownerId: OWNER,
      totalMembers: 0,
      shareWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'family_trees', TREE_ID, 'access', EDITOR), {
      uid: EDITOR, treeId: TREE_ID, role: 'editor', invitedBy: OWNER, invitedVia: 'seed', createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'family_trees', TREE_ID, 'access', VIEWER), {
      uid: VIEWER, treeId: TREE_ID, role: 'viewer', invitedBy: OWNER, invitedVia: 'seed', createdAt: serverTimestamp(),
    });
  });
});

describe('family_trees read', () => {
  it('owner, editor, viewer can read; outsider cannot', async () => {
    await assertSucceeds(getDoc(doc(authed(OWNER, OWNER_EMAIL), 'family_trees', TREE_ID)));
    await assertSucceeds(getDoc(doc(authed(EDITOR, EDITOR_EMAIL), 'family_trees', TREE_ID)));
    await assertSucceeds(getDoc(doc(authed(VIEWER, VIEWER_EMAIL), 'family_trees', TREE_ID)));
    await assertFails(getDoc(doc(authed(OUTSIDER, OUTSIDER_EMAIL), 'family_trees', TREE_ID)));
  });
});

describe('members write', () => {
  it('owner and editor can create; viewer and outsider cannot', async () => {
    const m = (db: ReturnType<typeof authed>) =>
      setDoc(doc(db, 'family_trees', TREE_ID, 'members', 'm1'), {
        familyTreeId: TREE_ID, fullName: 'A', gender: 'male', role: 'Ayah',
        birthDate: null, status: 'living', deathDate: null, photoUrl: null, bio: null,
        fatherId: null, motherId: null, spouseIds: [], childrenIds: [],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    await assertSucceeds(m(authed(OWNER, OWNER_EMAIL)));
    await assertSucceeds(m(authed(EDITOR, EDITOR_EMAIL)));
    await assertFails(m(authed(VIEWER, VIEWER_EMAIL)));
    await assertFails(m(authed(OUTSIDER, OUTSIDER_EMAIL)));
  });
});

describe('access management', () => {
  it('only owner can revoke (delete) an access doc', async () => {
    await assertFails(
      // editor cannot delete viewer's access
      import('firebase/firestore').then(({ deleteDoc }) =>
        deleteDoc(doc(authed(EDITOR, EDITOR_EMAIL), 'family_trees', TREE_ID, 'access', VIEWER)),
      ),
    );
    await assertSucceeds(
      import('firebase/firestore').then(({ deleteDoc }) =>
        deleteDoc(doc(authed(OWNER, OWNER_EMAIL), 'family_trees', TREE_ID, 'access', VIEWER)),
      ),
    );
  });

  it('nobody can grant themselves the owner role', async () => {
    await assertFails(
      setDoc(doc(authed(OUTSIDER, OUTSIDER_EMAIL), 'family_trees', TREE_ID, 'access', OUTSIDER), {
        uid: OUTSIDER, treeId: TREE_ID, role: 'owner', invitedBy: OWNER, invitedVia: 'x', createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('invitee self-grant (rules-only accept)', () => {
  const INVITE_ID = 'inv1';

  async function seedInvitation(status: string, role: string, email: string, expiresInMs: number) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'invitations', INVITE_ID), {
        treeId: TREE_ID, treeName: 'Keluarga', inviterUid: OWNER,
        inviteeEmail: email, role, status,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + expiresInMs),
      });
    });
  }

  function selfGrant(uid: string, email: string, role: string) {
    return setDoc(doc(authed(uid, email), 'family_trees', TREE_ID, 'access', uid), {
      uid, treeId: TREE_ID, role, invitedBy: OWNER, invitedVia: INVITE_ID, createdAt: serverTimestamp(),
    });
  }

  it('succeeds with a valid pending invitation matching email + role', async () => {
    await seedInvitation('pending', 'viewer', OUTSIDER_EMAIL, 60_000);
    await assertSucceeds(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
  });

  it('fails when the email does not match', async () => {
    await seedInvitation('pending', 'viewer', 'someone-else@example.com', 60_000);
    await assertFails(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
  });

  it('fails when escalating the role beyond the invitation', async () => {
    await seedInvitation('pending', 'viewer', OUTSIDER_EMAIL, 60_000);
    await assertFails(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'editor'));
  });

  it('fails when the invitation is expired', async () => {
    await seedInvitation('pending', 'viewer', OUTSIDER_EMAIL, -60_000);
    await assertFails(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
  });

  it('fails when the invitation is not pending', async () => {
    await seedInvitation('revoked', 'viewer', OUTSIDER_EMAIL, 60_000);
    await assertFails(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
  });

  it('fails when the email is unverified (impersonation guard)', async () => {
    await seedInvitation('pending', 'viewer', OUTSIDER_EMAIL, 60_000);
    await assertFails(
      setDoc(doc(authedUnverified(OUTSIDER, OUTSIDER_EMAIL), 'family_trees', TREE_ID, 'access', OUTSIDER), {
        uid: OUTSIDER, treeId: TREE_ID, role: 'viewer', invitedBy: OWNER, invitedVia: INVITE_ID, createdAt: serverTimestamp(),
      }),
    );
  });

  it('blocks revoke → re-grant: a revoked user cannot reset the invite to pending', async () => {
    await seedInvitation('pending', 'viewer', OUTSIDER_EMAIL, 60_000);
    // Accept.
    await assertSucceeds(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
    const inviteeDb = authed(OUTSIDER, OUTSIDER_EMAIL);
    const { updateDoc } = await import('firebase/firestore');
    await assertSucceeds(updateDoc(doc(inviteeDb, 'invitations', INVITE_ID), { status: 'accepted' }));
    // Owner revokes the access doc.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(ctx.firestore(), 'family_trees', TREE_ID, 'access', OUTSIDER));
    });
    // Attack: invitee tries to flip the invitation back to pending → denied.
    await assertFails(updateDoc(doc(inviteeDb, 'invitations', INVITE_ID), { status: 'pending' }));
    // Attack: re-grant while invitation is no longer pending → denied.
    await assertFails(selfGrant(OUTSIDER, OUTSIDER_EMAIL, 'viewer'));
  });
});

describe('invitations', () => {
  it('only the tree owner can create an invitation', async () => {
    const inv = (uid: string, email: string) =>
      setDoc(doc(authed(uid, email), 'invitations', 'invX'), {
        treeId: TREE_ID, treeName: 'Keluarga', inviterUid: uid,
        inviteeEmail: 'new@example.com', role: 'viewer', status: 'pending',
        createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 60_000),
      });
    await assertFails(inv(EDITOR, EDITOR_EMAIL));
    await assertSucceeds(inv(OWNER, OWNER_EMAIL));
  });
});

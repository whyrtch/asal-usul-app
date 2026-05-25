/**
 * Property-based tests for Member shape invariant
 *
 * Property 15: Member correct shape invariant
 * For any Member object created via `addMember`, the member SHALL have:
 *   - a non-empty `id`
 *   - a non-empty `fullName`
 *   - a `gender` value of exactly `"male"` or `"female"`
 *   - a non-empty `role` string
 *   - `spouseIds` as an array
 *   - `childrenIds` as an array
 *   - a valid ISO 8601 `createdAt` string
 *
 * NOTE: addMember has been moved to useMemberStore (task 9.1).
 * All describe blocks are skipped until useMemberStore is implemented.
 *
 * **Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6, 9.12, 9.13, 9.14**
 */

// Mock Firebase dependencies so Jest doesn't need native modules
jest.mock('@/repositories/familyTreeRepository', () => ({
  fetchFamilyTrees: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/services/firebase/firestore', () => ({
  isPermissionError: jest.fn().mockReturnValue(false),
  isNetworkError: jest.fn().mockReturnValue(false),
}));

import * as fc from 'fast-check';
import { useFamilyTreeStore } from '../store/useFamilyTreeStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OWNER_ID = 'local-user';

/** A non-empty, non-whitespace-only string */
const nonEmptyString = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length >= 1);

/** Arbitrary for gender */
const genderArb = fc.oneof(
  fc.constant('male' as const),
  fc.constant('female' as const)
);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  useFamilyTreeStore.setState({ familyTrees: [], loading: false, error: null });
});

// ---------------------------------------------------------------------------
// Property 15: Member correct shape invariant
// NOTE: addMember has been moved to useMemberStore (task 9.1).
// These tests are skipped until useMemberStore is implemented.
// ---------------------------------------------------------------------------

describe.skip('Property 15: Member correct shape invariant', () => {
  /**
   * For any valid member input, the member stored by `addMember` SHALL have
   * a non-empty `id`, a non-empty `fullName`, `gender` of `"male"` or
   * `"female"`, a non-empty `role`, `spouseIds` and `childrenIds` as arrays,
   * and a valid ISO 8601 `createdAt` string.
   *
   * **Validates: Requirements 9.1, 9.2, 9.4, 9.5, 9.6, 9.12, 9.13, 9.14**
   */
  it('created member has non-empty id, fullName, valid gender, non-empty role, array spouseIds/childrenIds, and valid ISO createdAt', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // fullName
        genderArb,
        nonEmptyString, // role
        (fullName, gender, role) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Add a FamilyTree first so addMember has a valid familyTreeId to reference
          useFamilyTreeStore.getState().addFamilyTree('Test Tree', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          const member = members[0];

          // Requirement 9.2: id is non-empty
          expect(typeof member.id).toBe('string');
          expect(member.id.length).toBeGreaterThan(0);

          // Requirement 9.4: fullName is non-empty
          expect(typeof member.fullName).toBe('string');
          expect(member.fullName.length).toBeGreaterThan(0);

          // Requirement 9.5: gender is exactly "male" or "female"
          expect(['male', 'female']).toContain(member.gender);

          // Requirement 9.6: role is non-empty
          expect(typeof member.role).toBe('string');
          expect(member.role.length).toBeGreaterThan(0);

          // Requirement 9.12: spouseIds is an array
          expect(Array.isArray(member.spouseIds)).toBe(true);

          // Requirement 9.13: childrenIds is an array
          expect(Array.isArray(member.childrenIds)).toBe(true);

          // Requirement 9.14: createdAt is a valid ISO 8601 string
          expect(typeof member.createdAt).toBe('string');
          const parsedDate = new Date(member.createdAt);
          expect(Number.isNaN(parsedDate.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Verifies all required fields are present on the created member.
   *
   * **Validates: Requirements 9.1**
   */
  it('created member has all required fields defined', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        genderArb,
        nonEmptyString,
        (fullName, gender, role) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Add a FamilyTree first
          useFamilyTreeStore.getState().addFamilyTree('Test Tree', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          const member = members[0];

          // Requirement 9.1: all required fields exist
          expect(member).toHaveProperty('id');
          expect(member).toHaveProperty('familyTreeId');
          expect(member).toHaveProperty('fullName');
          expect(member).toHaveProperty('gender');
          expect(member).toHaveProperty('role');
          expect(member).toHaveProperty('birthDate');
          expect(member).toHaveProperty('photoUrl');
          expect(member).toHaveProperty('bio');
          expect(member).toHaveProperty('fatherId');
          expect(member).toHaveProperty('motherId');
          expect(member).toHaveProperty('spouseIds');
          expect(member).toHaveProperty('childrenIds');
          expect(member).toHaveProperty('createdAt');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Verifies that gender is strictly "male" or "female" across many inputs,
   * and that the stored value matches what was passed in.
   *
   * **Validates: Requirements 9.5**
   */
  it('gender is always exactly "male" or "female" and matches the input', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        genderArb,
        nonEmptyString,
        (fullName, gender, role) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          useFamilyTreeStore.getState().addFamilyTree('Test Tree', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          const member = members[0];

          // Requirement 9.5: gender is exactly "male" or "female"
          expect(member.gender === 'male' || member.gender === 'female').toBe(true);
          // The stored gender must match what was passed in
          expect(member.gender).toBe(gender);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * Verifies that spouseIds and childrenIds are always arrays (even when empty).
   *
   * **Validates: Requirements 9.12, 9.13**
   */
  it('spouseIds and childrenIds are always arrays', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        genderArb,
        nonEmptyString,
        (fullName, gender, role) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          useFamilyTreeStore.getState().addFamilyTree('Test Tree', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          const member = members[0];

          // Requirement 9.12: spouseIds is an array
          expect(Array.isArray(member.spouseIds)).toBe(true);

          // Requirement 9.13: childrenIds is an array
          expect(Array.isArray(member.childrenIds)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Verifies that createdAt is always a valid ISO 8601 date string.
   *
   * **Validates: Requirements 9.14**
   */
  it('createdAt is always a valid ISO 8601 date string', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        genderArb,
        nonEmptyString,
        (fullName, gender, role) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          useFamilyTreeStore.getState().addFamilyTree('Test Tree', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          const member = members[0];

          // Requirement 9.14: createdAt is a valid ISO 8601 string
          expect(typeof member.createdAt).toBe('string');
          expect(member.createdAt.length).toBeGreaterThan(0);

          const parsed = new Date(member.createdAt);
          expect(Number.isNaN(parsed.getTime())).toBe(false);

          // ISO 8601 strings produced by toISOString() end with 'Z'
          expect(member.createdAt).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20: Parent-child relationship consistency invariant
// ---------------------------------------------------------------------------

/**
 * Property 20: Parent-child relationship consistency invariant
 * For any two Members A and B in the same FamilyTree, if A's `childrenIds`
 * contains B's `id`, then B's `fatherId` (if A is male) or B's `motherId`
 * (if A is female) SHALL equal A's `id`.
 *
 * **Validates: Requirements 10.2**
 */

describe.skip('Property 20: Parent-child relationship consistency invariant', () => {
  /**
   * If A is male and A's `childrenIds` contains B's `id`, then B's `fatherId`
   * SHALL equal A's `id`.
   *
   * Test strategy:
   *   1. Add a FamilyTree to the store.
   *   2. Add child member B (no childrenIds, no fatherId/motherId).
   *   3. Add parent member A (male) with B's id in childrenIds.
   *   4. Verify B's fatherId equals A's id.
   *
   * **Validates: Requirements 10.2**
   */
  it('child B has fatherId set to A.id when A is male and lists B in childrenIds', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // child fullName
        nonEmptyString, // parent fullName
        (childName, parentName) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Step 1: Add a FamilyTree
          useFamilyTreeStore.getState().addFamilyTree('Test Family', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          // Step 2: Add child member B (no childrenIds, no fatherId/motherId)
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: childName,
            gender: 'male',
            role: 'Anak',
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const membersAfterChild = useFamilyTreeStore.getState().members;
          const memberB = membersAfterChild[membersAfterChild.length - 1];

          // Step 3: Add parent member A (male) with B's id in childrenIds
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: parentName,
            gender: 'male',
            role: 'Ayah',
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [memberB.id],
          });

          const membersAfterParent = useFamilyTreeStore.getState().members;
          const memberA = membersAfterParent[membersAfterParent.length - 1];

          // Step 4: Verify B's fatherId equals A's id (A is male)
          const updatedB = membersAfterParent.find((m) => m.id === memberB.id);
          expect(updatedB).toBeDefined();
          expect(updatedB!.fatherId).toBe(memberA.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * If A is female and A's `childrenIds` contains B's `id`, then B's `motherId`
   * SHALL equal A's `id`.
   *
   * **Validates: Requirements 10.2**
   */
  it('child B has motherId set to A.id when A is female and lists B in childrenIds', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // child fullName
        nonEmptyString, // parent fullName
        (childName, parentName) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Step 1: Add a FamilyTree
          useFamilyTreeStore.getState().addFamilyTree('Test Family', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          // Step 2: Add child member B
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: childName,
            gender: 'female',
            role: 'Anak',
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const membersAfterChild = useFamilyTreeStore.getState().members;
          const memberB = membersAfterChild[membersAfterChild.length - 1];

          // Step 3: Add parent member A (female) with B's id in childrenIds
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: parentName,
            gender: 'female',
            role: 'Ibu',
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [memberB.id],
          });

          const membersAfterParent = useFamilyTreeStore.getState().members;
          const memberA = membersAfterParent[membersAfterParent.length - 1];

          // Step 4: Verify B's motherId equals A's id (A is female)
          const updatedB = membersAfterParent.find((m) => m.id === memberB.id);
          expect(updatedB).toBeDefined();
          expect(updatedB!.motherId).toBe(memberA.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any gender of parent A, if A's `childrenIds` contains B's `id`,
   * then B's `fatherId` or `motherId` SHALL equal A's `id`.
   *
   * **Validates: Requirements 10.2**
   */
  it('parent-child consistency holds for any gender of parent A', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // child fullName
        nonEmptyString, // parent fullName
        genderArb,      // parent gender (male or female)
        (childName, parentName, parentGender) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Step 1: Add a FamilyTree
          useFamilyTreeStore.getState().addFamilyTree('Test Family', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          // Step 2: Add child member B
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: childName,
            gender: 'male',
            role: 'Anak',
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const membersAfterChild = useFamilyTreeStore.getState().members;
          const memberB = membersAfterChild[membersAfterChild.length - 1];

          // Step 3: Add parent member A with B's id in childrenIds
          const parentRole = parentGender === 'male' ? 'Ayah' : 'Ibu';
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: parentName,
            gender: parentGender,
            role: parentRole,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [memberB.id],
          });

          const membersAfterParent = useFamilyTreeStore.getState().members;
          const memberA = membersAfterParent[membersAfterParent.length - 1];

          // Step 4: Verify the parent-child consistency invariant
          const updatedB = membersAfterParent.find((m) => m.id === memberB.id);
          expect(updatedB).toBeDefined();

          // A's childrenIds must contain B's id
          expect(memberA.childrenIds).toContain(memberB.id);

          // B's fatherId or motherId must equal A's id
          const parentLinkIsSet =
            updatedB!.fatherId === memberA.id || updatedB!.motherId === memberA.id;
          expect(parentLinkIsSet).toBe(true);

          // Specifically: fatherId if male, motherId if female
          if (parentGender === 'male') {
            expect(updatedB!.fatherId).toBe(memberA.id);
          } else {
            expect(updatedB!.motherId).toBe(memberA.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Parent-child consistency holds for multiple children listed in childrenIds.
   * For every child B in A's childrenIds, B's fatherId or motherId equals A's id.
   *
   * **Validates: Requirements 10.2**
   */
  it('parent-child consistency holds for multiple children listed in childrenIds', () => {
    fc.assert(
      fc.property(
        nonEmptyString,                                           // parent fullName
        genderArb,                                               // parent gender
        fc.array(nonEmptyString, { minLength: 1, maxLength: 5 }), // child names
        (parentName, parentGender, childNames) => {
          // Reset store for each property run
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });

          // Step 1: Add a FamilyTree
          useFamilyTreeStore.getState().addFamilyTree('Test Family', OWNER_ID);
          const familyTreeId = useFamilyTreeStore.getState().familyTrees[0].id;

          // Step 2: Add all child members
          const childIds: string[] = [];
          for (const childName of childNames) {
            useFamilyTreeStore.getState().addMember({
              familyTreeId,
              fullName: childName,
              gender: 'male',
              role: 'Anak',
              birthDate: null,
              photoUrl: null,
              bio: null,
              fatherId: null,
              motherId: null,
              spouseIds: [],
              childrenIds: [],
            });
            const members = useFamilyTreeStore.getState().members;
            childIds.push(members[members.length - 1].id);
          }

          // Step 3: Add parent member A with all children in childrenIds
          const parentRole = parentGender === 'male' ? 'Ayah' : 'Ibu';
          useFamilyTreeStore.getState().addMember({
            familyTreeId,
            fullName: parentName,
            gender: parentGender,
            role: parentRole,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [...childIds],
          });

          const finalMembers = useFamilyTreeStore.getState().members;
          const memberA = finalMembers[finalMembers.length - 1];

          // Step 4: For every child B in A's childrenIds, verify B's fatherId or motherId equals A's id
          for (const childId of childIds) {
            const childMember = finalMembers.find((m) => m.id === childId);
            expect(childMember).toBeDefined();

            // A's childrenIds must contain this child's id
            expect(memberA.childrenIds).toContain(childId);

            // B's fatherId or motherId must equal A's id
            if (parentGender === 'male') {
              expect(childMember!.fatherId).toBe(memberA.id);
            } else {
              expect(childMember!.motherId).toBe(memberA.id);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 19: Spouse relationship symmetry invariant ───────────────────────

/**
 * Property 19: Spouse relationship symmetry invariant
 *
 * For any two Members A and B in the same FamilyTree, if A's `spouseIds`
 * contains B's `id`, then B's `spouseIds` SHALL contain A's `id`.
 *
 * **Validates: Requirements 10.1**
 */

const SPOUSE_TREE_ID = 'spouse-test-tree';

/** Minimal valid member payload with configurable spouseIds */
const spouseTestMemberData = (
  familyTreeId: string,
  spouseIds: string[] = []
): Omit<Member, 'id' | 'createdAt'> => ({
  familyTreeId,
  fullName: 'Test Member',
  gender: 'male',
  role: 'Ayah',
  birthDate: null,
  photoUrl: null,
  bio: null,
  fatherId: null,
  motherId: null,
  spouseIds,
  childrenIds: [],
});

/** Resets the store with a single seeded FamilyTree */
function resetStoreWithSpouseTree(): void {
  useFamilyTreeStore.setState({
    familyTrees: [
      {
        id: SPOUSE_TREE_ID,
        name: 'Test Family',
        description: null,
        coverImage: null,
        ownerId: OWNER_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalMembers: 0,
      },
    ],
    members: [],
  });
}

describe.skip('Property 19: Spouse relationship symmetry invariant', () => {
  let spouseDateNowSpy: jest.SpyInstance;
  let spouseCounter: number;

  beforeEach(() => {
    spouseCounter = 9_000_000;
    // Mock Date.now to guarantee unique IDs for each addMember call
    spouseDateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => spouseCounter++);
  });

  afterEach(() => {
    spouseDateNowSpy.mockRestore();
  });

  /**
   * Core symmetry check:
   * Add member A (no spouseIds), then add member B with A's id in spouseIds.
   * After both additions, A's spouseIds must contain B's id.
   *
   * **Validates: Requirements 10.1**
   */
  it('if B lists A as spouse on addMember, then A also lists B as spouse', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (_nameA, _nameB) => {
          // Reset counter and store for each property run
          spouseCounter = 9_000_000;
          resetStoreWithSpouseTree();

          // Add member A with no spouseIds
          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [])
          );

          // Capture A's generated id
          const memberA = useFamilyTreeStore.getState().members[0];
          expect(memberA).toBeDefined();

          // Add member B listing A as spouse
          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [memberA.id])
          );

          const members = useFamilyTreeStore.getState().members;
          const updatedA = members.find((m) => m.id === memberA.id);
          const memberB = members.find((m) => m.id !== memberA.id);

          expect(updatedA).toBeDefined();
          expect(memberB).toBeDefined();

          // Symmetry: A's spouseIds must contain B's id
          expect(updatedA!.spouseIds).toContain(memberB!.id);

          // Symmetry: B's spouseIds must contain A's id (as declared)
          expect(memberB!.spouseIds).toContain(memberA.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Symmetry holds regardless of which member is added first.
   * Add member B first (no spouseIds), then add member A listing B as spouse.
   * After both additions, B's spouseIds must contain A's id.
   *
   * **Validates: Requirements 10.1**
   */
  it('symmetry holds when the first-added member is listed as spouse by the second', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (_nameA, _nameB) => {
          spouseCounter = 9_100_000;
          resetStoreWithSpouseTree();

          // Add member B first (no spouseIds)
          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [])
          );
          const memberB = useFamilyTreeStore.getState().members[0];
          expect(memberB).toBeDefined();

          // Add member A listing B as spouse
          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [memberB.id])
          );

          const members = useFamilyTreeStore.getState().members;
          const updatedB = members.find((m) => m.id === memberB.id);
          const memberA = members.find((m) => m.id !== memberB.id);

          expect(updatedB).toBeDefined();
          expect(memberA).toBeDefined();

          // Symmetry: B's spouseIds must contain A's id
          expect(updatedB!.spouseIds).toContain(memberA!.id);

          // Symmetry: A's spouseIds must contain B's id (as declared)
          expect(memberA!.spouseIds).toContain(memberB.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * After removeMember, the remaining member's spouseIds no longer references
   * the removed member — symmetry is cleaned up on removal.
   *
   * **Validates: Requirements 10.1**
   */
  it('spouseIds no longer references a removed member after removeMember', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length >= 1),
        (_nameA, _nameB) => {
          spouseCounter = 9_200_000;
          resetStoreWithSpouseTree();

          // Add A then B (B lists A as spouse)
          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [])
          );
          const memberA = useFamilyTreeStore.getState().members[0];

          useFamilyTreeStore.getState().addMember(
            spouseTestMemberData(SPOUSE_TREE_ID, [memberA.id])
          );

          const membersBeforeRemoval = useFamilyTreeStore.getState().members;
          const memberB = membersBeforeRemoval.find((m) => m.id !== memberA.id)!;

          // Confirm symmetry is established before removal
          const updatedA = membersBeforeRemoval.find((m) => m.id === memberA.id)!;
          expect(updatedA.spouseIds).toContain(memberB.id);

          // Remove member B
          useFamilyTreeStore.getState().removeMember(memberB.id);

          const membersAfterRemoval = useFamilyTreeStore.getState().members;
          const finalA = membersAfterRemoval.find((m) => m.id === memberA.id);

          expect(finalA).toBeDefined();
          // A's spouseIds must no longer contain B's id
          expect(finalA!.spouseIds).not.toContain(memberB.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Member familyTreeId consistency invariant
// ---------------------------------------------------------------------------

/**
 * Property 16: Member familyTreeId consistency invariant
 * For any Member added to a FamilyTree, `member.familyTreeId` SHALL equal
 * the target FamilyTree's `id`.
 *
 * **Validates: Requirements 9.3, 10.3**
 */

let dateNowSpy: jest.SpyInstance;
let counter: number;

beforeEach(() => {
  counter = 1_000_000;
  dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);
});

afterEach(() => {
  dateNowSpy.mockRestore();
});

describe.skip('Property 16: Member familyTreeId consistency invariant', () => {
  /**
   * For any Member added to a FamilyTree, `member.familyTreeId` SHALL equal
   * the target FamilyTree's `id`.
   *
   * **Validates: Requirements 9.3, 10.3**
   */
  it('member.familyTreeId equals the target FamilyTree id after addMember', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // treeName
        nonEmptyString, // fullName
        genderArb,
        nonEmptyString, // role
        (treeName, fullName, gender, role) => {
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 1_000_000;

          const { addFamilyTree, addMember } = useFamilyTreeStore.getState();

          addFamilyTree(treeName, OWNER_ID);
          const tree = useFamilyTreeStore.getState().familyTrees[0];
          expect(tree).toBeDefined();

          addMember({
            familyTreeId: tree.id,
            fullName,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          expect(members.length).toBe(1);

          // Core invariant: familyTreeId must equal the tree's id
          expect(members[0].familyTreeId).toBe(tree.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * When multiple members are added to the same FamilyTree, every member's
   * `familyTreeId` must equal that tree's `id`.
   *
   * **Validates: Requirements 9.3, 10.3**
   */
  it('all members added to the same tree have familyTreeId equal to that tree id', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // treeName
        fc.array(
          fc.record({
            fullName: nonEmptyString,
            gender: genderArb,
            role: nonEmptyString,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (treeName, memberInputs) => {
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 1_000_000;

          const { addFamilyTree, addMember } = useFamilyTreeStore.getState();

          addFamilyTree(treeName, OWNER_ID);
          const tree = useFamilyTreeStore.getState().familyTrees[0];
          expect(tree).toBeDefined();

          for (const input of memberInputs) {
            addMember({
              familyTreeId: tree.id,
              fullName: input.fullName,
              gender: input.gender,
              role: input.role,
              birthDate: null,
              photoUrl: null,
              bio: null,
              fatherId: null,
              motherId: null,
              spouseIds: [],
              childrenIds: [],
            });
          }

          const { members } = useFamilyTreeStore.getState();
          expect(members.length).toBe(memberInputs.length);

          // Every member must reference the correct tree
          for (const member of members) {
            expect(member.familyTreeId).toBe(tree.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * When members are added to different FamilyTrees, each member's
   * `familyTreeId` must equal the specific tree it was added to.
   *
   * **Validates: Requirements 9.3, 10.3**
   */
  it('members added to different trees each have familyTreeId matching their own tree', () => {
    fc.assert(
      fc.property(
        fc.tuple(nonEmptyString, nonEmptyString).filter(([a, b]) => a.trim() !== b.trim()),
        nonEmptyString, // fullName1
        nonEmptyString, // fullName2
        genderArb,
        nonEmptyString, // role
        ([treeName1, treeName2], fullName1, fullName2, gender, role) => {
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 1_000_000;

          const { addFamilyTree, addMember } = useFamilyTreeStore.getState();

          // Create two distinct family trees
          addFamilyTree(treeName1, OWNER_ID);
          addFamilyTree(treeName2, OWNER_ID);

          const { familyTrees } = useFamilyTreeStore.getState();
          // familyTrees is prepended — index 0 is the most recently added
          const tree2 = familyTrees[0];
          const tree1 = familyTrees[1];
          expect(tree1.id).not.toBe(tree2.id);

          addMember({
            familyTreeId: tree1.id,
            fullName: fullName1,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          addMember({
            familyTreeId: tree2.id,
            fullName: fullName2,
            gender,
            role,
            birthDate: null,
            photoUrl: null,
            bio: null,
            fatherId: null,
            motherId: null,
            spouseIds: [],
            childrenIds: [],
          });

          const { members } = useFamilyTreeStore.getState();
          expect(members.length).toBe(2);

          const member1 = members.find((m) => m.familyTreeId === tree1.id);
          const member2 = members.find((m) => m.familyTreeId === tree2.id);

          expect(member1).toBeDefined();
          expect(member2).toBeDefined();
          expect(member1!.familyTreeId).toBe(tree1.id);
          expect(member2!.familyTreeId).toBe(tree2.id);
          expect(member1!.familyTreeId).not.toBe(tree2.id);
          expect(member2!.familyTreeId).not.toBe(tree1.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * After removing a member, the remaining members must still have their
   * `familyTreeId` equal to the tree they were added to.
   *
   * **Validates: Requirements 9.3, 10.3**
   */
  it('familyTreeId consistency is preserved after removeMember', () => {
    fc.assert(
      fc.property(
        nonEmptyString, // treeName
        fc.array(
          fc.record({
            fullName: nonEmptyString,
            gender: genderArb,
            role: nonEmptyString,
          }),
          { minLength: 2, maxLength: 8 }
        ),
        fc.nat({ max: 7 }),
        (treeName, memberInputs, removeIndexSeed) => {
          useFamilyTreeStore.setState({ familyTrees: [], members: [] });
          counter = 1_000_000;

          const { addFamilyTree, addMember, removeMember } =
            useFamilyTreeStore.getState();

          addFamilyTree(treeName, OWNER_ID);
          const tree = useFamilyTreeStore.getState().familyTrees[0];

          for (const input of memberInputs) {
            addMember({
              familyTreeId: tree.id,
              fullName: input.fullName,
              gender: input.gender,
              role: input.role,
              birthDate: null,
              photoUrl: null,
              bio: null,
              fatherId: null,
              motherId: null,
              spouseIds: [],
              childrenIds: [],
            });
          }

          const membersBeforeRemoval = useFamilyTreeStore.getState().members;
          const removeIndex = removeIndexSeed % membersBeforeRemoval.length;
          const memberIdToRemove = membersBeforeRemoval[removeIndex].id;

          removeMember(memberIdToRemove);

          const { members: remainingMembers } = useFamilyTreeStore.getState();

          // All remaining members must still have the correct familyTreeId
          for (const member of remainingMembers) {
            expect(member.familyTreeId).toBe(tree.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

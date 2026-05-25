import { create } from 'zustand';
import type { FamilyTree, FamilyTreeStore, Member } from '../types/familyTree';

// ---------------------------------------------------------------------------
// Dummy data — Keluarga Jokowi
// ---------------------------------------------------------------------------

const JOKOWI_TREE_ID = 'jokowi-tree';

const dummyFamilyTree: FamilyTree = {
  id: JOKOWI_TREE_ID,
  name: 'Jokowi',
  description: 'Pohon keluarga Joko Widodo',
  coverImage: null,
  ownerId: 'dummy-owner',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  totalMembers: 15,
};

const dummyMembers: Member[] = [
  {
    id: '1',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Widjiatno Notomihardjo',
    gender: 'male',
    role: 'Kakek',
    birthDate: '1940-01-01',
    photoUrl: null,
    bio: 'Ayah dari Joko Widodo',
    fatherId: null,
    motherId: null,
    spouseIds: ['2'],
    childrenIds: ['3'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Sujiatmi',
    gender: 'female',
    role: 'Nenek',
    birthDate: '1943-01-01',
    photoUrl: null,
    bio: 'Ibu dari Joko Widodo',
    fatherId: null,
    motherId: null,
    spouseIds: ['1'],
    childrenIds: ['3'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Joko Widodo',
    gender: 'male',
    role: 'Ayah',
    birthDate: '1961-06-21',
    photoUrl: null,
    bio: 'Presiden ke-7 Republik Indonesia',
    fatherId: '1',
    motherId: '2',
    spouseIds: ['4'],
    childrenIds: ['5', '6', '7'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Iriana',
    gender: 'female',
    role: 'Ibu',
    birthDate: '1963-10-01',
    photoUrl: null,
    bio: 'Istri Joko Widodo, Ibu Negara 2014-2024',
    fatherId: null,
    motherId: null,
    spouseIds: ['3'],
    childrenIds: ['5', '6', '7'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Gibran Rakabuming',
    gender: 'male',
    role: 'Anak',
    birthDate: '1987-10-01',
    photoUrl: null,
    bio: 'Wakil Presiden ke-14 Republik Indonesia',
    fatherId: '3',
    motherId: '4',
    spouseIds: ['8'],
    childrenIds: ['10', '11'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '6',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Kahiyang Ayu',
    gender: 'female',
    role: 'Anak',
    birthDate: '1991-08-01',
    photoUrl: null,
    bio: 'Putri kedua Joko Widodo',
    fatherId: '3',
    motherId: '4',
    spouseIds: ['9'],
    childrenIds: ['12', '13'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '7',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Kaesang Pangarep',
    gender: 'male',
    role: 'Anak',
    birthDate: '1994-12-25',
    photoUrl: null,
    bio: 'Putra bungsu Joko Widodo',
    fatherId: '3',
    motherId: '4',
    spouseIds: ['14'],
    childrenIds: ['15'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '8',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Selvi Ananda',
    gender: 'female',
    role: 'Menantu',
    birthDate: '1991-06-01',
    photoUrl: null,
    bio: 'Istri Gibran Rakabuming Raka',
    fatherId: null,
    motherId: null,
    spouseIds: ['5'],
    childrenIds: ['10', '11'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '9',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Bobby Nasution',
    gender: 'male',
    role: 'Menantu',
    birthDate: '1991-07-01',
    photoUrl: null,
    bio: 'Suami Kahiyang Ayu, Gubernur Sumatera Utara',
    fatherId: null,
    motherId: null,
    spouseIds: ['6'],
    childrenIds: ['12', '13'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '10',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Jan Ethes',
    gender: 'male',
    role: 'Cucu',
    birthDate: '2016-03-25',
    photoUrl: null,
    bio: 'Cucu pertama Joko Widodo',
    fatherId: '5',
    motherId: '8',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '11',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'La Lembah Manah',
    gender: 'female',
    role: 'Cucu',
    birthDate: '2020-01-01',
    photoUrl: null,
    bio: 'Cucu kedua dari Gibran',
    fatherId: '5',
    motherId: '8',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '12',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Sedah Mirah',
    gender: 'female',
    role: 'Cucu',
    birthDate: '2018-08-01',
    photoUrl: null,
    bio: 'Cucu dari Kahiyang dan Bobby',
    fatherId: '9',
    motherId: '6',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '13',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Panembahan Al Nahyan',
    gender: 'male',
    role: 'Cucu',
    birthDate: '2022-01-01',
    photoUrl: null,
    bio: 'Cucu kedua dari Kahiyang dan Bobby',
    fatherId: '9',
    motherId: '6',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '14',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Erina Gudono',
    gender: 'female',
    role: 'Menantu',
    birthDate: '1999-11-07',
    photoUrl: null,
    bio: 'Istri Kaesang Pangarep',
    fatherId: null,
    motherId: null,
    spouseIds: ['7'],
    childrenIds: ['15'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '15',
    familyTreeId: JOKOWI_TREE_ID,
    fullName: 'Bebingah Manah',
    gender: 'female',
    role: 'Cucu',
    birthDate: '2024-01-01',
    photoUrl: null,
    bio: 'Anak dari Kaesang dan Erina',
    fatherId: '7',
    motherId: '14',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFamilyTreeStore = create<FamilyTreeStore>()((set) => ({
  // ---------------------------------------------------------------------------
  // Initial state — pre-loaded with Jokowi family dummy data
  // ---------------------------------------------------------------------------
  familyTrees: [dummyFamilyTree],
  members: dummyMembers,

  // ---------------------------------------------------------------------------
  // addFamilyTree
  // ---------------------------------------------------------------------------
  addFamilyTree: (name: string, ownerId: string): void => {
    const now = new Date().toISOString();
    const newTree: FamilyTree = {
      id: Date.now().toString(),
      name: name.trim(),
      description: null,
      coverImage: null,
      ownerId,
      createdAt: now,
      updatedAt: now,
      totalMembers: 0,
    };

    set((state) => ({
      familyTrees: [newTree, ...state.familyTrees],
    }));
  },

  // ---------------------------------------------------------------------------
  // removeFamilyTree — idempotent: no-op when id does not exist
  // ---------------------------------------------------------------------------
  removeFamilyTree: (id: string): void => {
    set((state) => ({
      familyTrees: state.familyTrees.filter((tree) => tree.id !== id),
    }));
  },

  // ---------------------------------------------------------------------------
  // addMember
  // ---------------------------------------------------------------------------
  addMember: (memberData: Omit<Member, 'id' | 'createdAt'>): void => {
    const now = new Date().toISOString();
    const newMember: Member = {
      id: Date.now().toString(),
      createdAt: now,
      ...memberData,
    };

    set((state) => {
      // Enforce spouse symmetry: each listed spouse gets this member added to their spouseIds
      const updatedMembers = state.members.map((m) => {
        if (newMember.spouseIds.includes(m.id)) {
          return {
            ...m,
            spouseIds: m.spouseIds.includes(newMember.id)
              ? m.spouseIds
              : [...m.spouseIds, newMember.id],
          };
        }

        // Enforce parent-child consistency: each listed child gets fatherId/motherId set
        if (newMember.childrenIds.includes(m.id)) {
          return {
            ...m,
            fatherId:
              newMember.gender === 'male' ? newMember.id : m.fatherId,
            motherId:
              newMember.gender === 'female' ? newMember.id : m.motherId,
          };
        }

        return m;
      });

      return {
        members: [...updatedMembers, newMember],
        familyTrees: state.familyTrees.map((tree) =>
          tree.id === newMember.familyTreeId
            ? { ...tree, totalMembers: tree.totalMembers + 1, updatedAt: now }
            : tree
        ),
      };
    });
  },

  // ---------------------------------------------------------------------------
  // updateFamilyTree — no-op when id does not exist
  // ---------------------------------------------------------------------------
  updateFamilyTree: (id: string, patch: Partial<Pick<FamilyTree, 'name' | 'description'>>): void => {
    const now = new Date().toISOString();
    set((state) => ({
      familyTrees: state.familyTrees.map((tree) =>
        tree.id === id ? { ...tree, ...patch, updatedAt: now } : tree
      ),
    }));
  },

  // ---------------------------------------------------------------------------
  // deleteFamilyTree — removes tree and all its members in a single set() call
  // ---------------------------------------------------------------------------
  deleteFamilyTree: (id: string): void => {
    set((state) => ({
      familyTrees: state.familyTrees.filter((t) => t.id !== id),
      members: state.members.filter((m) => m.familyTreeId !== id),
    }));
  },

  // ---------------------------------------------------------------------------
  // updateMember — no-op when memberId does not exist;
  //   never overwrites id, familyTreeId, or createdAt
  // ---------------------------------------------------------------------------
  updateMember: (memberId: string, patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>): void => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.members.find((m) => m.id === memberId);
      if (!target) return state; // idempotent — nothing to do

      // Destructure to ensure immutable fields are never overwritten
      const { id: _id, familyTreeId: _familyTreeId, createdAt: _createdAt, ...safePatch } = patch as Partial<Member>;

      return {
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, ...safePatch } : m
        ),
        familyTrees: state.familyTrees.map((tree) =>
          tree.id === target.familyTreeId
            ? { ...tree, updatedAt: now }
            : tree
        ),
      };
    });
  },

  // ---------------------------------------------------------------------------
  // deleteMember — alias for removeMember; handles relationship cleanup and
  //   totalMembers decrement via the existing removeMember implementation
  // ---------------------------------------------------------------------------
  deleteMember: (memberId: string): void => {
    set((state) => {
      const target = state.members.find((m) => m.id === memberId);
      if (!target) return state; // idempotent — nothing to do

      const now = new Date().toISOString();

      const updatedMembers = state.members
        .filter((m) => m.id !== memberId)
        .map((m) => {
          if (m.familyTreeId !== target.familyTreeId) return m;
          return {
            ...m,
            spouseIds: m.spouseIds.filter((id) => id !== memberId),
            childrenIds: m.childrenIds.filter((id) => id !== memberId),
            fatherId: m.fatherId === memberId ? null : m.fatherId,
            motherId: m.motherId === memberId ? null : m.motherId,
          };
        });

      return {
        members: updatedMembers,
        familyTrees: state.familyTrees.map((tree) =>
          tree.id === target.familyTreeId
            ? {
                ...tree,
                totalMembers: Math.max(0, tree.totalMembers - 1),
                updatedAt: now,
              }
            : tree
        ),
      };
    });
  },

  // ---------------------------------------------------------------------------
  // removeMember — idempotent: no-op when memberId does not exist
  // ---------------------------------------------------------------------------
  removeMember: (memberId: string): void => {
    set((state) => {
      const target = state.members.find((m) => m.id === memberId);
      if (!target) return state; // idempotent — nothing to do

      const now = new Date().toISOString();

      const updatedMembers = state.members
        .filter((m) => m.id !== memberId)
        .map((m) => {
          if (m.familyTreeId !== target.familyTreeId) return m;
          return {
            ...m,
            spouseIds: m.spouseIds.filter((id) => id !== memberId),
            childrenIds: m.childrenIds.filter((id) => id !== memberId),
            fatherId: m.fatherId === memberId ? null : m.fatherId,
            motherId: m.motherId === memberId ? null : m.motherId,
          };
        });

      return {
        members: updatedMembers,
        familyTrees: state.familyTrees.map((tree) =>
          tree.id === target.familyTreeId
            ? {
                ...tree,
                totalMembers: Math.max(0, tree.totalMembers - 1),
                updatedAt: now,
              }
            : tree
        ),
      };
    });
  },
}));

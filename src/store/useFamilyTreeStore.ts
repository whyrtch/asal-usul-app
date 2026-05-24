import { create } from 'zustand';
import type { FamilyTree, FamilyTreeStore, Member } from '../types/familyTree';

export const useFamilyTreeStore = create<FamilyTreeStore>()((set) => ({
  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  familyTrees: [],
  members: [],

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

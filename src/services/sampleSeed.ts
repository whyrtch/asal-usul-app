/**
 * Dev-only seeder that writes the sample family trees (Jokowi & Prabowo) to
 * Firestore under the current user, using deterministic document ids so
 * relationships stay consistent and re-seeding is idempotent.
 *
 * Writes go through normal security rules (owner creates their own tree +
 * members), so this works on the free plan once Firestore is enabled.
 *
 * @module src/services/sampleSeed
 */

import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { SAMPLE_TREES } from '@/data/sampleFamilyData';
import { db } from './firebase/config';

/**
 * Seeds the sample trees owned by `ownerId`. Idempotent (overwrites existing
 * sample docs). Returns the list of created tree ids.
 */
export async function seedSampleData(ownerId: string): Promise<string[]> {
  for (const tree of SAMPLE_TREES) {
    await setDoc(doc(db, 'family_trees', tree.id), {
      name: tree.name,
      description: tree.description,
      ownerId,
      totalMembers: tree.members.length,
      shareWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const mem of tree.members) {
      await setDoc(doc(db, 'family_trees', tree.id, 'members', mem.id), {
        familyTreeId: tree.id,
        fullName: mem.fullName,
        gender: mem.gender,
        role: mem.role,
        birthDate: mem.birthDate,
        status: mem.status,
        deathDate: mem.deathDate,
        photoUrl: mem.photoUrl,
        bio: mem.bio,
        fatherId: mem.fatherId,
        motherId: mem.motherId,
        spouseIds: mem.spouseIds,
        childrenIds: mem.childrenIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return SAMPLE_TREES.map((t) => t.id);
}

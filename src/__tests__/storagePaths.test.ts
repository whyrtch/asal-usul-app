/**
 * Unit + property tests for src/utils/storagePaths.ts (Phase 1, 4.1).
 */

import * as fc from 'fast-check';
import {
    buildMemberPhotoPath,
    buildTreeCoverPath,
    generateFileId,
} from '../utils/storagePaths';

describe('buildMemberPhotoPath', () => {
  it('builds the expected path with default extension', () => {
    expect(buildMemberPhotoPath('tree1', 'abc')).toBe(
      'family_trees/tree1/member-photos/abc.jpg',
    );
  });

  it('honors a custom extension', () => {
    expect(buildMemberPhotoPath('tree1', 'abc', 'png')).toBe(
      'family_trees/tree1/member-photos/abc.png',
    );
  });
});

describe('buildTreeCoverPath', () => {
  it('builds the expected cover path', () => {
    expect(buildTreeCoverPath('tree1', 'abc')).toBe(
      'family_trees/tree1/cover/abc.jpg',
    );
  });
});

describe('generateFileId', () => {
  it('produces unique-ish ids on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateFileId()));
    // Extremely unlikely to collide within 100 calls.
    expect(ids.size).toBe(100);
  });

  it('contains only safe path characters', () => {
    fc.assert(
      fc.property(fc.integer(), () => {
        const id = generateFileId();
        expect(/^[a-z0-9_]+$/.test(id)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});

describe('member photo path always nests under the tree (property)', () => {
  it('starts with family_trees/{treeId}/', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), (treeId, fileId) => {
        const path = buildMemberPhotoPath(treeId, fileId);
        expect(path.startsWith(`family_trees/${treeId}/`)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

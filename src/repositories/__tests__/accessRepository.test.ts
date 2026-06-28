/**
 * Tests for src/repositories/accessRepository.ts (Phase 2 — sharing).
 *
 * Firestore SDK is mocked (same pattern as memberRepository tests).
 */

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...segments: string[]) => ({ _path: segments.join('/') })),
  collectionGroup: jest.fn((_db: unknown, id: string) => ({ _group: id })),
  doc: jest.fn((_db: unknown, ...segments: string[]) => ({
    _path: segments.join('/'),
    id: segments[segments.length - 1],
  })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => ({ _query: args })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

jest.mock('@/services/firebase/config', () => ({ db: {} }));

jest.mock('@/services/firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  toISOString: jest.fn((ts: { toDate: () => Date } | null) =>
    ts == null ? new Date().toISOString() : ts.toDate().toISOString(),
  ),
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

import { deleteDoc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import {
    fetchAccessList,
    fetchSharedTreeRefs,
    getMyAccess,
    grantAccess,
    revokeAccess,
    setAccessRole,
} from '../accessRepository';

const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('grantAccess', () => {
  it('writes the access doc with the expected fields', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    await grantAccess({
      uid: 'u2',
      treeId: 't1',
      role: 'editor',
      invitedBy: 'owner1',
      invitedVia: 'inv1',
    });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const payload = mockSetDoc.mock.calls[0][1];
    expect(payload).toMatchObject({
      uid: 'u2',
      treeId: 't1',
      role: 'editor',
      invitedBy: 'owner1',
      invitedVia: 'inv1',
    });
    expect(payload.createdAt).toEqual({ _type: 'serverTimestamp' });
  });
});

describe('setAccessRole / revokeAccess', () => {
  it('setAccessRole updates only the role', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await setAccessRole('t1', 'u2', 'viewer');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { role: 'viewer' });
  });

  it('revokeAccess deletes the access doc', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);
    await revokeAccess('t1', 'u2');
    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
  });
});

describe('getMyAccess', () => {
  it('returns null when no doc exists', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    expect(await getMyAccess('t1', 'u2')).toBeNull();
  });

  it('maps an existing doc', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'u2',
        treeId: 't1',
        role: 'editor',
        invitedBy: 'owner1',
        invitedVia: 'inv1',
        createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z') },
      }),
    });
    const access = await getMyAccess('t1', 'u2');
    expect(access).toMatchObject({ uid: 'u2', treeId: 't1', role: 'editor' });
    expect(access?.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('fetchAccessList', () => {
  it('maps all access docs', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { data: () => ({ uid: 'a', treeId: 't1', role: 'editor', invitedBy: 'o', invitedVia: 'i1', createdAt: null }) },
        { data: () => ({ uid: 'b', treeId: 't1', role: 'viewer', invitedBy: 'o', invitedVia: 'i2', createdAt: null }) },
      ],
    });
    const list = await fetchAccessList('t1');
    expect(list).toHaveLength(2);
    expect(list.map((a) => a.role).sort()).toEqual(['editor', 'viewer']);
  });
});

describe('fetchSharedTreeRefs', () => {
  it('returns empty array for blank uid without querying', async () => {
    expect(await fetchSharedTreeRefs('')).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('maps collectionGroup results to { treeId, role }', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { data: () => ({ uid: 'me', treeId: 't1', role: 'editor' }) },
        { data: () => ({ uid: 'me', treeId: 't2', role: 'viewer' }) },
      ],
    });
    const refs = await fetchSharedTreeRefs('me');
    expect(refs).toEqual([
      { treeId: 't1', role: 'editor' },
      { treeId: 't2', role: 'viewer' },
    ]);
  });
});

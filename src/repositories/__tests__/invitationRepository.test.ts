/**
 * Tests for src/repositories/invitationRepository.ts (Phase 2 — sharing).
 *
 * Covers email normalization/validation, self-invite rejection, pending
 * dedupe, and status updates. Firestore SDK is mocked.
 */

import * as fc from 'fast-check';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...segments: string[]) => ({ _path: segments.join('/') })),
  doc: jest.fn((_db: unknown, ...segments: string[]) => ({
    _path: segments.join('/'),
    id: segments[segments.length - 1],
  })),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => ({ _query: args })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, _ts: date.getTime() }),
  },
}));

jest.mock('@/services/firebase/config', () => ({ db: {} }));

jest.mock('@/services/firebase/firestore', () => ({
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  toISOString: jest.fn((ts: { toDate: () => Date } | null) =>
    ts == null ? new Date().toISOString() : ts.toDate().toISOString(),
  ),
  withRetry: jest.fn((op: () => Promise<unknown>) => op()),
}));

import { addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import {
    createInvitation,
    declineInvitation,
    fetchMyPendingInvitations,
    isValidEmail,
    normalizeEmail,
    updateInvitationStatus,
} from '../invitationRepository';

const mockAddDoc = addDoc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Budi@Example.COM ')).toBe('budi@example.com');
  });

  it('property: result equals trim().toLowerCase()', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(normalizeEmail(s)).toBe(s.trim().toLowerCase());
      }),
      { numRuns: 300 },
    );
  });
});

describe('isValidEmail', () => {
  it('accepts a normal email', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
  });
  it('rejects malformed emails', () => {
    expect(isValidEmail('no-at')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createInvitation
// ---------------------------------------------------------------------------

describe('createInvitation', () => {
  it('throws on invalid email and does not write', async () => {
    await expect(
      createInvitation(
        { treeId: 't1', treeName: 'Keluarga', inviterUid: 'o', inviteeEmail: 'bad', role: 'viewer' },
        'owner@example.com',
      ),
    ).rejects.toThrow('Email tidak valid');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('throws on self-invite (case/space-insensitive)', async () => {
    await expect(
      createInvitation(
        { treeId: 't1', treeName: 'K', inviterUid: 'o', inviteeEmail: '  Owner@Example.com ', role: 'editor' },
        'owner@example.com',
      ),
    ).rejects.toThrow('mengundang diri sendiri');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('creates a new pending invitation with normalized email when none exists', async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    mockAddDoc.mockResolvedValue({ id: 'inv1' });
    mockGetDoc.mockResolvedValue({
      id: 'inv1',
      exists: () => true,
      data: () => ({
        treeId: 't1',
        treeName: 'K',
        inviterUid: 'o',
        inviteeEmail: 'budi@example.com',
        role: 'editor',
        status: 'pending',
        createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z') },
        expiresAt: { toDate: () => new Date('2026-01-15T00:00:00.000Z') },
      }),
    });

    const inv = await createInvitation(
      { treeId: 't1', treeName: 'K', inviterUid: 'o', inviteeEmail: 'Budi@Example.com', role: 'editor' },
      'owner@example.com',
    );

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.inviteeEmail).toBe('budi@example.com');
    expect(payload.status).toBe('pending');
    expect(inv.id).toBe('inv1');
    expect(inv.role).toBe('editor');
  });

  it('updates an existing pending invitation instead of creating a duplicate', async () => {
    const existingRef = { id: 'existing' };
    mockGetDocs.mockResolvedValue({ empty: false, docs: [{ ref: existingRef }] });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      id: 'existing',
      exists: () => true,
      data: () => ({
        treeId: 't1',
        treeName: 'K',
        inviterUid: 'o',
        inviteeEmail: 'budi@example.com',
        role: 'viewer',
        status: 'pending',
        createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z') },
        expiresAt: { toDate: () => new Date('2026-01-20T00:00:00.000Z') },
      }),
    });

    const inv = await createInvitation(
      { treeId: 't1', treeName: 'K', inviterUid: 'o', inviteeEmail: 'budi@example.com', role: 'viewer' },
      'owner@example.com',
    );

    expect(mockAddDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(inv.id).toBe('existing');
  });
});

// ---------------------------------------------------------------------------
// queries + status
// ---------------------------------------------------------------------------

describe('fetchMyPendingInvitations', () => {
  it('returns [] for invalid email without querying', async () => {
    expect(await fetchMyPendingInvitations('not-an-email')).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('maps pending invitations for a valid email', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'inv1',
          data: () => ({
            treeId: 't1', treeName: 'K', inviterUid: 'o',
            inviteeEmail: 'me@example.com', role: 'viewer', status: 'pending',
            createdAt: null, expiresAt: null,
          }),
        },
      ],
    });
    const list = await fetchMyPendingInvitations('me@example.com');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('inv1');
  });
});

describe('status updates', () => {
  it('updateInvitationStatus writes the status', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await updateInvitationStatus('inv1', 'accepted');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'accepted' });
  });

  it('declineInvitation sets status declined', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await declineInvitation('inv1');
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'declined' });
  });
});

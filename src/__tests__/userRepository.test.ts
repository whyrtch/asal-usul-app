/**
 * Unit tests for src/repositories/userRepository.ts
 *
 * Requirements: 1.2, 1.3, 1.5, 1.6
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports
// ---------------------------------------------------------------------------

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  serverTimestamp: () => ({ _type: 'serverTimestamp' }),
}));

// Mock the config module so we don't need a real Firebase app
jest.mock('@/services/firebase/config', () => ({
  db: { type: 'firestore' },
}));

// Mock the firestore helpers — re-export serverTimestamp as a sentinel
jest.mock('@/services/firebase/firestore', () => ({
  serverTimestamp: () => ({ _type: 'serverTimestamp' }),
}));

// ---------------------------------------------------------------------------

import { Timestamp } from 'firebase/firestore';
import type { CreateUserInput, UserDocument } from '../types/firestore';

// Import after mocks are set up
import {
    createUser,
    getUser,
    updateLastLogin,
} from '../repositories/userRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_REF = { id: 'mock-ref' };
const SERVER_TS = { _type: 'serverTimestamp' };

/** Build a fake Firestore Timestamp-like object */
function fakeTimestamp(date: Date): Timestamp {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as Timestamp;
}

const NOW = new Date('2024-06-01T10:00:00.000Z');
const FAKE_TS = fakeTimestamp(NOW);

const SAMPLE_DATA = {
  name: 'Budi Santoso',
  email: 'budi@example.com',
  photoUrl: 'https://example.com/photo.jpg',
  provider: 'google' as const,
  createdAt: FAKE_TS,
  updatedAt: FAKE_TS,
  lastLoginAt: FAKE_TS,
};

const SAMPLE_USER_DOCUMENT: UserDocument = {
  id: 'uid-123',
  ...SAMPLE_DATA,
};

// ---------------------------------------------------------------------------
// getUser
// ---------------------------------------------------------------------------

describe('getUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue(MOCK_REF);
  });

  it('returns null when the document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getUser('uid-123');

    expect(result).toBeNull();
    expect(mockDoc).toHaveBeenCalledWith({ type: 'firestore' }, 'users', 'uid-123');
    expect(mockGetDoc).toHaveBeenCalledWith(MOCK_REF);
  });

  it('returns a mapped UserDocument when the document exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'uid-123',
      data: () => SAMPLE_DATA,
    });

    const result = await getUser('uid-123');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('uid-123');
    expect(result?.name).toBe('Budi Santoso');
    expect(result?.email).toBe('budi@example.com');
    expect(result?.photoUrl).toBe('https://example.com/photo.jpg');
    expect(result?.provider).toBe('google');
    expect(result?.createdAt).toBe(FAKE_TS);
    expect(result?.updatedAt).toBe(FAKE_TS);
    expect(result?.lastLoginAt).toBe(FAKE_TS);
  });

  it('never exposes raw DocumentSnapshot to callers — returns plain object', async () => {
    const rawSnap = {
      exists: () => true,
      id: 'uid-123',
      data: () => SAMPLE_DATA,
      ref: MOCK_REF,
      metadata: {},
      get: jest.fn(),
    };
    mockGetDoc.mockResolvedValue(rawSnap);

    const result = await getUser('uid-123');

    // The returned object must NOT have DocumentSnapshot-specific properties
    expect(result).not.toHaveProperty('ref');
    expect(result).not.toHaveProperty('metadata');
    expect(result).not.toHaveProperty('get');
    expect(result).not.toHaveProperty('exists');
  });

  it('uses the document id from the snapshot, not the uid argument', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'snap-id-from-firestore',
      data: () => SAMPLE_DATA,
    });

    const result = await getUser('uid-123');

    expect(result?.id).toBe('snap-id-from-firestore');
  });

  it('propagates errors thrown by getDoc', async () => {
    const error = new Error('Firestore unavailable');
    mockGetDoc.mockRejectedValue(error);

    await expect(getUser('uid-123')).rejects.toThrow('Firestore unavailable');
  });
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue(MOCK_REF);
    mockSetDoc.mockResolvedValue(undefined);
    // Second getDoc call (re-read after setDoc) returns the created document
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'uid-123',
      data: () => SAMPLE_DATA,
    });
  });

  const INPUT: CreateUserInput = {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    photoUrl: 'https://example.com/photo.jpg',
    provider: 'google',
  };

  it('calls setDoc with serverTimestamp() for createdAt, updatedAt, and lastLoginAt', async () => {
    await createUser('uid-123', INPUT);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, docData] = mockSetDoc.mock.calls[0] as [unknown, Record<string, unknown>];

    expect(docData['createdAt']).toEqual(SERVER_TS);
    expect(docData['updatedAt']).toEqual(SERVER_TS);
    expect(docData['lastLoginAt']).toEqual(SERVER_TS);
  });

  it('writes all CreateUserInput fields to Firestore', async () => {
    await createUser('uid-123', INPUT);

    const [, docData] = mockSetDoc.mock.calls[0] as [unknown, Record<string, unknown>];

    expect(docData['name']).toBe('Budi Santoso');
    expect(docData['email']).toBe('budi@example.com');
    expect(docData['photoUrl']).toBe('https://example.com/photo.jpg');
    expect(docData['provider']).toBe('google');
  });

  it('returns a UserDocument with the correct id and fields', async () => {
    const result = await createUser('uid-123', INPUT);

    expect(result.id).toBe('uid-123');
    expect(result.name).toBe('Budi Santoso');
    expect(result.email).toBe('budi@example.com');
    expect(result.provider).toBe('google');
  });

  it('re-reads the document after setDoc to resolve server timestamps', async () => {
    await createUser('uid-123', INPUT);

    // getDoc should be called once (the re-read after setDoc)
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(mockGetDoc).toHaveBeenCalledWith(MOCK_REF);
  });

  it('never exposes raw DocumentSnapshot or DocumentReference to callers', async () => {
    const result = await createUser('uid-123', INPUT);

    expect(result).not.toHaveProperty('ref');
    expect(result).not.toHaveProperty('metadata');
    expect(result).not.toHaveProperty('exists');
  });

  it('propagates errors thrown by setDoc', async () => {
    mockSetDoc.mockRejectedValue(new Error('permission-denied'));

    await expect(createUser('uid-123', INPUT)).rejects.toThrow('permission-denied');
  });
});

// ---------------------------------------------------------------------------
// updateLastLogin
// ---------------------------------------------------------------------------

describe('updateLastLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue(MOCK_REF);
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('calls updateDoc with serverTimestamp() for lastLoginAt and updatedAt', async () => {
    await updateLastLogin('uid-123');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [, patch] = mockUpdateDoc.mock.calls[0] as [unknown, Record<string, unknown>];

    expect(patch['lastLoginAt']).toEqual(SERVER_TS);
    expect(patch['updatedAt']).toEqual(SERVER_TS);
  });

  it('updates ONLY lastLoginAt and updatedAt — no other fields', async () => {
    await updateLastLogin('uid-123');

    const [, patch] = mockUpdateDoc.mock.calls[0] as [unknown, Record<string, unknown>];

    expect(Object.keys(patch)).toHaveLength(2);
    expect(Object.keys(patch)).toEqual(
      expect.arrayContaining(['lastLoginAt', 'updatedAt']),
    );
  });

  it('targets the correct Firestore path users/{uid}', async () => {
    await updateLastLogin('uid-456');

    expect(mockDoc).toHaveBeenCalledWith({ type: 'firestore' }, 'users', 'uid-456');
    expect(mockUpdateDoc).toHaveBeenCalledWith(MOCK_REF, expect.any(Object));
  });

  it('returns void on success', async () => {
    const result = await updateLastLogin('uid-123');

    expect(result).toBeUndefined();
  });

  it('propagates errors thrown by updateDoc', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('not-found'));

    await expect(updateLastLogin('uid-123')).rejects.toThrow('not-found');
  });
});

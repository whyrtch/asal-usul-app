/**
 * Tests for src/store/useSharingStore.ts (Phase 2 — sharing).
 *
 * Repositories are mocked; verifies invite, optimistic revoke + rollback,
 * accept (grant + status), and decline.
 */

jest.mock('@/repositories/accessRepository', () => ({
  fetchAccessList: jest.fn(),
  grantAccess: jest.fn(),
  revokeAccess: jest.fn(),
  setAccessRole: jest.fn(),
}));

jest.mock('@/repositories/invitationRepository', () => ({
  createInvitation: jest.fn(),
  declineInvitation: jest.fn(),
  fetchInvitationsForTree: jest.fn(),
  fetchMyPendingInvitations: jest.fn(),
  updateInvitationStatus: jest.fn(),
}));

jest.mock('@/services/firebase/firestore', () => ({
  isPermissionError: jest.fn().mockReturnValue(false),
  isNetworkError: jest.fn().mockReturnValue(false),
}));

import {
    grantAccess,
    revokeAccess,
} from '@/repositories/accessRepository';
import {
    createInvitation,
    declineInvitation,
    updateInvitationStatus,
} from '@/repositories/invitationRepository';
import type { Access, Invitation } from '@/types/sharing';
import { useSharingStore } from '../useSharingStore';

const mockCreateInvitation = createInvitation as jest.Mock;
const mockGrantAccess = grantAccess as jest.Mock;
const mockRevokeAccess = revokeAccess as jest.Mock;
const mockUpdateStatus = updateInvitationStatus as jest.Mock;
const mockDecline = declineInvitation as jest.Mock;

function resetStore() {
  useSharingStore.setState({
    collaboratorsByTree: {},
    invitationsByTree: {},
    myInvitations: [],
    loading: false,
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

const baseInvite = {
  treeId: 't1',
  treeName: 'Keluarga',
  inviterUid: 'owner1',
  inviterEmail: 'owner@example.com',
  inviteeEmail: 'budi@example.com',
  role: 'editor' as const,
};

describe('invite', () => {
  it('returns true and stores the invitation on success', async () => {
    const inv: Invitation = {
      id: 'inv1', treeId: 't1', treeName: 'Keluarga', inviterUid: 'owner1',
      inviteeEmail: 'budi@example.com', role: 'editor', status: 'pending',
      createdAt: 'x', expiresAt: 'y',
    };
    mockCreateInvitation.mockResolvedValue(inv);

    const ok = await useSharingStore.getState().invite(baseInvite);

    expect(ok).toBe(true);
    expect(useSharingStore.getState().invitationsByTree['t1']).toHaveLength(1);
    expect(useSharingStore.getState().error).toBeNull();
  });

  it('returns false and surfaces the validation message on failure', async () => {
    mockCreateInvitation.mockRejectedValue(new Error('Email tidak valid. Periksa kembali alamat email.'));

    const ok = await useSharingStore.getState().invite(baseInvite);

    expect(ok).toBe(false);
    expect(useSharingStore.getState().error).toContain('Email tidak valid');
  });
});

describe('revoke', () => {
  const collaborators: Access[] = [
    { uid: 'u2', treeId: 't1', role: 'editor', invitedBy: 'owner1', invitedVia: 'inv1', createdAt: 'x' },
    { uid: 'u3', treeId: 't1', role: 'viewer', invitedBy: 'owner1', invitedVia: 'inv2', createdAt: 'x' },
  ];

  it('optimistically removes the collaborator on success', async () => {
    useSharingStore.setState({ collaboratorsByTree: { t1: collaborators } });
    mockRevokeAccess.mockResolvedValue(undefined);

    await useSharingStore.getState().revoke('t1', 'u2');

    expect(useSharingStore.getState().collaboratorsByTree['t1'].map((a) => a.uid)).toEqual(['u3']);
  });

  it('rolls back on failure', async () => {
    useSharingStore.setState({ collaboratorsByTree: { t1: collaborators } });
    mockRevokeAccess.mockRejectedValue(new Error('network'));

    await useSharingStore.getState().revoke('t1', 'u2');

    // restored to both collaborators
    expect(useSharingStore.getState().collaboratorsByTree['t1']).toHaveLength(2);
    expect(useSharingStore.getState().error).toBeTruthy();
  });
});

describe('accept', () => {
  const invitation: Invitation = {
    id: 'inv1', treeId: 't1', treeName: 'Keluarga', inviterUid: 'owner1',
    inviteeEmail: 'me@example.com', role: 'viewer', status: 'pending',
    createdAt: 'x', expiresAt: 'y',
  };

  it('grants access, marks accepted, and removes from inbox', async () => {
    useSharingStore.setState({ myInvitations: [invitation] });
    mockGrantAccess.mockResolvedValue(undefined);
    mockUpdateStatus.mockResolvedValue(undefined);

    const ok = await useSharingStore.getState().accept(invitation, 'meUid');

    expect(ok).toBe(true);
    expect(mockGrantAccess).toHaveBeenCalledWith({
      uid: 'meUid',
      treeId: 't1',
      role: 'viewer',
      invitedBy: 'owner1',
      invitedVia: 'inv1',
    });
    expect(mockUpdateStatus).toHaveBeenCalledWith('inv1', 'accepted');
    expect(useSharingStore.getState().myInvitations).toHaveLength(0);
  });

  it('returns false and keeps inbox on failure', async () => {
    useSharingStore.setState({ myInvitations: [invitation] });
    mockGrantAccess.mockRejectedValue(new Error('permission'));

    const ok = await useSharingStore.getState().accept(invitation, 'meUid');

    expect(ok).toBe(false);
    expect(useSharingStore.getState().error).toBeTruthy();
  });
});

describe('decline', () => {
  it('optimistically removes the invitation from inbox', async () => {
    const inv: Invitation = {
      id: 'inv9', treeId: 't1', treeName: 'K', inviterUid: 'o',
      inviteeEmail: 'me@example.com', role: 'viewer', status: 'pending',
      createdAt: 'x', expiresAt: 'y',
    };
    useSharingStore.setState({ myInvitations: [inv] });
    mockDecline.mockResolvedValue(undefined);

    await useSharingStore.getState().decline('inv9');

    expect(useSharingStore.getState().myInvitations).toHaveLength(0);
    expect(mockDecline).toHaveBeenCalledWith('inv9');
  });
});

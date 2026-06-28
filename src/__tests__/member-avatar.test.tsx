/**
 * Tests for MemberAvatar — guarantees a default (initials) is always shown
 * when there is no photo, and the photo replaces it when present.
 *
 * Phase 1 — 4.1 Foto anggota (default image / fallback).
 */

import { render } from '@testing-library/react-native';

import { MemberAvatar } from '../components/ui/member-avatar';

describe('MemberAvatar — default fallback', () => {
  it('shows initials when there is no photoUrl', () => {
    const { getByText } = render(
      <MemberAvatar fullName="Budi Santoso" photoUrl={null} size={52} />,
    );
    expect(getByText('BS')).toBeTruthy();
  });

  it('shows a single initial for a one-word name', () => {
    const { getByText } = render(
      <MemberAvatar fullName="Budi" photoUrl={null} size={52} />,
    );
    expect(getByText('B')).toBeTruthy();
  });

  it('does not render initials text when a photoUrl is provided', () => {
    const { queryByText } = render(
      <MemberAvatar
        fullName="Budi Santoso"
        photoUrl="https://example.com/photo.jpg"
        size={52}
      />,
    );
    expect(queryByText('BS')).toBeNull();
  });
});

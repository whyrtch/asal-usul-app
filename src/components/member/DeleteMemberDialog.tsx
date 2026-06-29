/**
 * DeleteMemberDialog — confirmation dialog before permanently deleting a family member.
 *
 * Uses the shared `Dialog` primitive for overlay, ZoomIn animation, and action buttons.
 *
 * Requirements: 6.1, 6.2, 6.10, 8.4
 */

import { Text } from 'react-native';

import { Dialog } from '@/components/ui/dialog';
import { AsalUsulColors } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeleteMemberDialogProps {
  /** Controls whether the dialog is shown. */
  visible: boolean;
  /** The member's full name displayed in the confirmation copy. */
  memberName: string;
  /** Called when the user confirms deletion by tapping "Hapus". */
  onConfirm: () => void;
  /** Called when the user cancels by tapping "Batal". */
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Centered confirmation dialog for deleting a family member.
 *
 * Wraps the shared `Dialog` primitive which provides overlay, ZoomIn animation,
 * and Button actions with variant support.
 */
export function DeleteMemberDialog({
  visible,
  memberName,
  onConfirm,
  onCancel,
}: DeleteMemberDialogProps) {
  return (
    <Dialog
      visible={visible}
      onCancel={onCancel}
      message={
        <Text>
          Apakah Anda yakin ingin menghapus{' '}
          <Text style={{ fontWeight: 'bold', color: AsalUsulColors.textHeading }}>
            {memberName}
          </Text>{' '}
          dari pohon keluarga?
        </Text>
      }
      subMessage="Semua referensi hubungan akan ikut dihapus."
      actions={[
        { label: 'Batal', onPress: onCancel, variant: 'outline' },
        { label: 'Hapus', onPress: onConfirm, variant: 'destructive' },
      ]}
    />
  );
}

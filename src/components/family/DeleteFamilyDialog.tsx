/**
 * DeleteFamilyDialog — confirmation dialog before permanently deleting a family tree.
 *
 * Uses the shared `Dialog` primitive for overlay, ZoomIn animation, and action buttons.
 *
 * Requirements: 3.1, 3.2, 3.4, 8.4
 */

import { Text } from 'react-native';

import { Dialog } from '@/components/ui/dialog';
import { AsalUsulColors } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeleteFamilyDialogProps {
  /** Controls whether the dialog is shown. */
  visible: boolean;
  /** The family tree name displayed in the confirmation copy. */
  familyName: string;
  /** Called when the user confirms deletion by tapping "Hapus". */
  onConfirm: () => void;
  /** Called when the user cancels by tapping "Batal". */
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Centered confirmation dialog for deleting a family tree.
 *
 * Wraps the shared `Dialog` primitive which provides overlay, ZoomIn animation,
 * and Button actions with variant support.
 */
export function DeleteFamilyDialog({
  visible,
  familyName,
  onConfirm,
  onCancel,
}: DeleteFamilyDialogProps) {
  return (
    <Dialog
      visible={visible}
      onCancel={onCancel}
      message={
        <Text>
          Apakah Anda yakin ingin menghapus pohon keluarga{' '}
          <Text style={{ fontWeight: 'bold', color: AsalUsulColors.textHeading }}>
            {familyName}
          </Text>
          ?
        </Text>
      }
      subMessage="Semua anggota keluarga akan ikut terhapus."
      actions={[
        { label: 'Batal', onPress: onCancel, variant: 'outline' },
        { label: 'Hapus', onPress: onConfirm, variant: 'destructive' },
      ]}
    />
  );
}

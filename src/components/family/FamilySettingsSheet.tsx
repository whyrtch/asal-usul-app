/**
 * FamilySettingsSheet — animated bottom sheet for family tree settings.
 *
 * Presents "Edit Keluarga" and "Hapus Keluarga" action rows, plus a "Batal"
 * dismiss button. Uses the shared `Sheet` primitive for overlay, handle,
 * animations, and keyboard avoidance.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Spacing } from '@/constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilySettingsSheetProps {
  /** Controls whether the sheet is shown. */
  visible: boolean;
  /** Called when the user taps the overlay or the "Batal" button. */
  onClose: () => void;
  /** Called when the user taps "Edit Keluarga". */
  onEditPress: () => void;
  /** Called when the user taps "Hapus Keluarga". */
  onDeletePress: () => void;
  /**
   * Called when the user taps "Kelola Akses". When omitted, the row is hidden
   * (e.g. sharing disabled). Owner-only entry to collaborator management.
   */
  onManageAccessPress?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Danger red — not in the theme palette, used only for destructive actions. */
const DANGER_RED = '#C0392B';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Bottom sheet with Edit and Delete actions for a family tree.
 *
 * Wraps the shared `Sheet` primitive which provides overlay, drag handle,
 * SlideInDown/SlideOutDown animations, and KeyboardAvoidingView.
 */
export function FamilySettingsSheet({
  visible,
  onClose,
  onEditPress,
  onDeletePress,
  onManageAccessPress,
}: FamilySettingsSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} overlayLabel="Tutup menu pengaturan">
      {/* ── Edit row ────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={onEditPress}
        style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
        accessibilityRole="button"
        accessibilityLabel="Edit Keluarga"
      >
        <Ionicons
          name="create-outline"
          size={22}
          color={AsalUsulColors.textBody}
          style={styles.rowIcon}
        />
        <UIText variant="p" style={styles.rowLabel}>Edit Keluarga</UIText>
      </Pressable>

      {/* ── Manage access row (owner + sharing enabled only) ──────────────── */}
      {onManageAccessPress && (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={onManageAccessPress}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Kelola Akses"
          >
            <Ionicons
              name="people-outline"
              size={22}
              color={AsalUsulColors.textBody}
              style={styles.rowIcon}
            />
            <UIText variant="p" style={styles.rowLabel}>Kelola Akses</UIText>
          </Pressable>
        </>
      )}

      {/* Subtle divider */}
      <View style={styles.divider} />

      {/* ── Delete row ──────────────────────────────────────────────────────── */}
      <Pressable
        onPress={onDeletePress}
        style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
        accessibilityRole="button"
        accessibilityLabel="Hapus Keluarga"
      >
        <Ionicons
          name="trash-outline"
          size={22}
          color={DANGER_RED}
          style={styles.rowIcon}
        />
        <UIText variant="p" style={[styles.rowLabel, styles.rowLabelDanger]}>
          Hapus Keluarga
        </UIText>
      </Pressable>

      {/* ── Cancel button ───────────────────────────────────────────────────── */}
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Batal"
      >
        <UIText variant="smallBold" style={styles.cancelLabel}>Batal</UIText>
      </Pressable>
    </Sheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
  },
  actionRowPressed: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
  },
  rowIcon: {
    marginRight: Spacing.three,
  },
  rowLabel: {
    color: AsalUsulColors.textBody,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: DANGER_RED,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginVertical: Spacing.one,
  },

  // Cancel button
  cancelButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.one,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    alignItems: 'center',
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  cancelButtonPressed: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
  },
  cancelLabel: {
    color: AsalUsulColors.textBody,
  },
});

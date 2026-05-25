/**
 * DeleteMemberDialog — confirmation dialog before permanently deleting a family member.
 *
 * Uses react-native-reanimated `ZoomIn` for the card entrance animation.
 * The overlay is a semi-transparent full-screen backdrop centered over the dialog card.
 *
 * Requirements: 6.1, 6.2, 6.10, 8.4
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AsalUsulColors, Radii, Spacing } from '@/constants/theme';

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
 * - Overlay: full-screen `rgba(0,0,0,0.5)` backdrop.
 * - Card: `ZoomIn.duration(250)` entrance animation via Reanimated.
 * - Two buttons: "Batal" (outline) and "Hapus" (filled danger red `#C0392B`).
 */
export function DeleteMemberDialog({
  visible,
  memberName,
  onConfirm,
  onCancel,
}: DeleteMemberDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Full-screen overlay — centers the dialog card */}
      <View style={styles.overlay}>
        {/* Animated dialog card */}
        <Animated.View entering={ZoomIn.duration(250)} style={styles.card}>
          {/* Primary copy */}
          <Text style={styles.primaryText}>
            Apakah Anda yakin ingin menghapus{' '}
            <Text style={styles.boldName}>{memberName}</Text>{' '}
            dari pohon keluarga?
          </Text>

          {/* Sub-copy */}
          <Text style={styles.subText}>
            Semua referensi hubungan akan ikut dihapus.
          </Text>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            {/* Batal — outline */}
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Batal"
              style={({ pressed }) => [
                styles.button,
                styles.buttonOutline,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.labelOutline}>Batal</Text>
            </Pressable>

            {/* Hapus — filled danger red */}
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Hapus"
              style={({ pressed }) => [
                styles.button,
                styles.buttonDanger,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.labelDanger}>Hapus</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DANGER_RED = '#C0392B';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: '100%',
    borderRadius: Radii.lg,
    backgroundColor: AsalUsulColors.backgroundCard,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  primaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: AsalUsulColors.textBody,
  },
  boldName: {
    fontWeight: 'bold',
    color: AsalUsulColors.textHeading,
  },
  subText: {
    fontSize: 14,
    lineHeight: 20,
    color: AsalUsulColors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: AsalUsulColors.primary,
  },
  buttonDanger: {
    backgroundColor: DANGER_RED,
    borderColor: DANGER_RED,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  labelOutline: {
    fontSize: 15,
    fontWeight: '600',
    color: AsalUsulColors.primary,
  },
  labelDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

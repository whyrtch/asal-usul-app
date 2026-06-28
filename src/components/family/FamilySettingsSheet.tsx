/**
 * FamilySettingsSheet — animated bottom sheet for family tree settings.
 *
 * Presents "Edit Keluarga" and "Hapus Keluarga" action rows, plus a "Batal"
 * dismiss button. The sheet slides in from the bottom via Reanimated layout
 * animations (SlideInDown / SlideOutDown) and sits above a semi-transparent
 * dark overlay that also dismisses the sheet on tap.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 8.2
 */

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';

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

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Bottom sheet with Edit and Delete actions for a family tree.
 *
 * - Outer wrapper: `Modal` with `transparent` and `animationType="none"` so
 *   Reanimated controls all entrance/exit motion.
 * - Overlay: full-screen `Pressable` at `rgba(0,0,0,0.45)` — tapping it calls `onClose`.
 * - Sheet panel: `Animated.View` with `entering={SlideInDown.springify()}` and
 *   `exiting={SlideOutDown.duration(250)}`, anchored to the bottom of the screen.
 */
export function FamilySettingsSheet({
  visible,
  onClose,
  onEditPress,
  onDeletePress,
  onManageAccessPress,
}: FamilySettingsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen overlay — tap to dismiss */}
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Tutup menu pengaturan"
      />

      {/* Animated sheet panel */}
      <Animated.View
        entering={SlideInDown.springify()}
        exiting={SlideOutDown.duration(250)}
        style={styles.sheet}
      >
        {/* Decorative drag handle */}
        <View style={styles.handle} />

        {/* ── Edit row ──────────────────────────────────────────────────────── */}
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
          <ThemedText style={styles.rowLabel}>Edit Keluarga</ThemedText>
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
              <ThemedText style={styles.rowLabel}>Kelola Akses</ThemedText>
            </Pressable>
          </>
        )}

        {/* Subtle divider */}
        <View style={styles.divider} />

        {/* ── Delete row ────────────────────────────────────────────────────── */}
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
          <ThemedText style={[styles.rowLabel, styles.rowLabelDanger]}>
            Hapus Keluarga
          </ThemedText>
        </Pressable>

        {/* ── Cancel button ─────────────────────────────────────────────────── */}
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Batal"
        >
          <ThemedText style={styles.cancelLabel}>Batal</ThemedText>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Danger red — not in the theme palette, used only for destructive actions. */
const DANGER_RED = '#C0392B';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
    ...Shadows.card,
  },

  // Decorative drag handle bar
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginBottom: Spacing.two,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radii.sm,
  },
  actionRowPressed: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
  },
  rowIcon: {
    marginRight: Spacing.three,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: AsalUsulColors.textBody,
    lineHeight: 22,
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
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    alignItems: 'center',
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  cancelButtonPressed: {
    backgroundColor: AsalUsulColors.backgroundOverlay,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AsalUsulColors.textBody,
    lineHeight: 22,
  },
});

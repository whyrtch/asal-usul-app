/**
 * CreateFamilyTreeModal — animated bottom-sheet modal for creating a new family tree.
 *
 * Uses react-native-reanimated for the slide-up (withSpring) and slide-down
 * (withTiming, 250 ms) animations. The `onClose` callback is invoked after the
 * close animation completes via `runOnJS` so it runs safely on the JS thread.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13
 */

import { useEffect, useState } from 'react';
import {
    Keyboard,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows } from '@/constants/theme';
import { validateFamilyTreeName } from '@/utils/familyTreeUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Height of the bottom sheet in logical pixels. Must match the rendered height. */
const SHEET_HEIGHT = 380;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CreateFamilyTreeModalProps {
  /** Controls whether the modal is shown. */
  visible: boolean;
  /** Called after the close animation completes. Memoize with useCallback. */
  onClose: () => void;
  /** Called with the trimmed name when the user submits a valid name. Memoize with useCallback. */
  onSubmit: (name: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Animated bottom-sheet modal for entering a new family tree name.
 *
 * - Open: `translateY` animates from `SHEET_HEIGHT` → `0` via `withSpring`.
 * - Close: `translateY` animates from `0` → `SHEET_HEIGHT` via `withTiming` (250 ms),
 *   then `onClose` is called via `runOnJS`.
 */
export function CreateFamilyTreeModal({
  visible,
  onClose,
  onSubmit,
}: CreateFamilyTreeModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Shared value: 0 = fully visible, SHEET_HEIGHT = off-screen below viewport
  const translateY = useSharedValue(SHEET_HEIGHT);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ─── Animation helpers ──────────────────────────────────────────────────────

  function openModal() {
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 200,
      mass: 0.8,
    });
  }

  function closeModal(callback: () => void) {
    translateY.value = withTiming(
      SHEET_HEIGHT,
      {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      },
      () => {
        // Fires on the UI thread after animation — bridge back to JS
        runOnJS(callback)();
      },
    );
  }

  // ─── Visibility effect ──────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      openModal();
    }
    // When visible goes false externally (e.g. parent force-closes), snap off-screen
    // without animation so the sheet is ready for the next open.
    else {
      translateY.value = SHEET_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleClose() {
    Keyboard.dismiss();
    closeModal(() => {
      setInputValue('');
      onClose();
    });
  }

  function handleSubmit() {
    if (!validateFamilyTreeName(inputValue)) return;
    onSubmit(inputValue.trim());
  }

  // ─── Derived state ───────────────────────────────────────────────────────────

  const isNameValid = validateFamilyTreeName(inputValue);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    // Requirement 2.10 — transparent modal, no built-in animation
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Requirement 2.11 — full-screen dark overlay, tap to dismiss */}
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
        accessibilityLabel="Tutup modal"
      />

      {/* Animated bottom sheet */}
      <Animated.View style={[styles.sheet, animatedStyle]}>
        {/* Drag handle — decorative */}
        <View style={styles.handle} />

        {/* Requirement 2.12 — title */}
        <ThemedText type="subtitle" style={styles.title}>
          Buat Pohon Keluarga
        </ThemedText>

        {/* Requirement 2.12 — helper description */}
        <ThemedText type="default" style={styles.description}>
          Beri nama pohon keluarga Anda agar mudah dikenali
        </ThemedText>

        {/* Requirement 2.12 — text input */}
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Contoh: Keluarga Sastrawinata"
          placeholderTextColor={AsalUsulColors.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Nama pohon keluarga"
        />

        {/* Requirement 2.13 — action buttons */}
        <View style={styles.buttonRow}>
          <PrimaryButton
            variant="outline"
            label="Batal"
            onPress={handleClose}
            style={styles.buttonFlex}
          />
          <PrimaryButton
            variant="filled"
            label="Buat"
            onPress={handleSubmit}
            disabled={!isNameValid}
            style={styles.buttonFlex}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 16,
    ...Shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radii.pill,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: AsalUsulColors.textHeading,
  },
  description: {
    color: AsalUsulColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AsalUsulColors.textBody,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonFlex: {
    flex: 1,
  },
});

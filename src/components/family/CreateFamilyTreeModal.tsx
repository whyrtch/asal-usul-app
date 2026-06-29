/**
 * CreateFamilyTreeModal — animated bottom-sheet modal for creating a new family tree.
 *
 * Uses the shared `Sheet` primitive for overlay, animations, and keyboard avoidance.
 * `Input` for the text field, `Button` for actions, and `UIText` for copy.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { validateFamilyTreeName } from '@/utils/familyTreeUtils';

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
 * Wraps the shared `Sheet` primitive which provides SlideInDown/SlideOutDown
 * animations, overlay, drag handle, and KeyboardAvoidingView.
 */
export function CreateFamilyTreeModal({
  visible,
  onClose,
  onSubmit,
}: CreateFamilyTreeModalProps) {
  const [inputValue, setInputValue] = useState('');

  function handleClose() {
    setInputValue('');
    onClose();
  }

  function handleSubmit() {
    if (!validateFamilyTreeName(inputValue)) return;
    onSubmit(inputValue.trim());
  }

  const isNameValid = validateFamilyTreeName(inputValue);

  return (
    <Sheet visible={visible} onClose={handleClose} overlayLabel="Tutup modal">
      {/* Title */}
      <UIText variant="h3" style={styles.title}>
        Buat Pohon Keluarga
      </UIText>

      {/* Description */}
      <UIText variant="p" style={styles.description}>
        Beri nama pohon keluarga Anda agar mudah dikenali
      </UIText>

      {/* Text input */}
      <Input
        value={inputValue}
        onChangeText={setInputValue}
        placeholder="Contoh: Keluarga Sastrawinata"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        accessibilityLabel="Nama pohon keluarga"
        containerStyle={styles.inputContainer}
      />

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Button label="Batal" onPress={handleClose} variant="outline" style={styles.buttonFlex} />
        <Button
          label="Buat"
          onPress={handleSubmit}
          variant="default"
          disabled={!isNameValid}
          style={styles.buttonFlex}
        />
      </View>
    </Sheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  title: {
    color: AsalUsulColors.textHeading,
  },
  description: {
    color: AsalUsulColors.textMuted,
  },
  inputContainer: {
    marginVertical: Spacing.one,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  buttonFlex: {
    flex: 1,
  },
});

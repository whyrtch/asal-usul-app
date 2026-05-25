/**
 * EditFamilyModal — modal form for editing a family tree's name and description.
 *
 * Appears with a SlideInDown.duration(350).springify() entering animation.
 * Handles keyboard avoidance via KeyboardAvoidingView.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 8.3
 */

import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import type { EditFamilyFormErrors } from '@/types/familyTree';
import { validateFamilyForm } from '@/utils/validationUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EditFamilyModalProps {
  visible: boolean;
  initialName: string;
  initialDescription: string | null;
  onSave: (name: string, description: string | null) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditFamilyModal({
  visible,
  initialName,
  initialDescription,
  onSave,
  onClose,
}: EditFamilyModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [errors, setErrors] = useState<EditFamilyFormErrors>({});

  // Reset local state whenever the modal opens with fresh initial values
  function handleShow() {
    setName(initialName);
    setDescription(initialDescription ?? '');
    setErrors({});
  }

  function handleSave() {
    const validationErrors = validateFamilyForm({ name, description });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim() || null;
    onSave(trimmedName, trimmedDescription);
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={handleShow}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Overlay — tapping it closes the modal */}
        <Pressable
          style={styles.overlay}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup modal"
        />

        {/* Panel */}
        <Animated.View
          entering={SlideInDown.duration(350).springify()}
          style={styles.panel}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Edit Keluarga</ThemedText>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Batal"
              style={styles.cancelButton}
            >
              <ThemedText style={styles.cancelLabel}>Batal</ThemedText>
            </Pressable>
          </View>

          {/* ── Name field ──────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Nama Keluarga <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.textInput, errors.name ? styles.textInputError : null]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Masukkan nama keluarga"
              placeholderTextColor={AsalUsulColors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Nama keluarga"
            />
            {errors.name ? (
              <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
            ) : null}
          </View>

          {/* ── Description field ───────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Deskripsi</ThemedText>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ceritakan sedikit tentang keluarga ini (opsional)"
              placeholderTextColor={AsalUsulColors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              accessibilityLabel="Deskripsi keluarga"
            />
          </View>

          {/* ── Save button ─────────────────────────────────────────────────── */}
          <Pressable
            onPress={handleSave}
            style={styles.saveButton}
            accessibilityRole="button"
            accessibilityLabel="Simpan perubahan"
          >
            <ThemedText style={styles.saveLabel}>Simpan</ThemedText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
    ...Shadows.card,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
    lineHeight: 24,
    flex: 1,
  },
  cancelButton: {
    paddingVertical: Spacing.one,
    paddingLeft: Spacing.three,
  },
  cancelLabel: {
    fontSize: 15,
    color: AsalUsulColors.primaryMuted,
    fontWeight: '500',
  },

  // Field groups
  fieldGroup: { gap: Spacing.two },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AsalUsulColors.textBody,
    lineHeight: 20,
  },
  required: { color: '#D32F2F' },

  // Text inputs — matches FamilyMemberForm styles exactly
  textInput: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
    color: AsalUsulColors.textBody,
    backgroundColor: AsalUsulColors.backgroundWarm,
    lineHeight: 22,
  },
  textInputError: { borderColor: '#D32F2F' },
  descriptionInput: {
    minHeight: 96,
    paddingTop: Spacing.two + 2,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    lineHeight: 16,
    marginTop: -Spacing.one,
  },

  // Save button — matches FamilyMemberForm submit button
  saveButton: {
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.button,
  },
  saveLabel: {
    color: AsalUsulColors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});

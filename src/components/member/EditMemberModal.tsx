/**
 * EditMemberModal — modal form for editing all editable member fields.
 *
 * Appears with a SlideInDown.duration(350).springify() entering animation.
 * Handles keyboard avoidance via KeyboardAvoidingView + ScrollView.
 * Does NOT render relationship fields (fatherId, motherId, spouseIds, childrenIds).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.9, 8.3
 */

import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { PhotoPickerField } from '@/components/ui/photo-picker-field';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import type { EditMemberFormErrors, Member } from '@/types/familyTree';
import { validateMemberForm } from '@/utils/validationUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ['Anak', 'Ayah', 'Ibu', 'Kakek', 'Nenek'] as const;

const GENDER_OPTIONS: { value: 'male' | 'female'; label: string }[] = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
];

const STATUS_OPTIONS: { value: 'living' | 'deceased'; label: string }[] = [
  { value: 'living', label: 'Hidup' },
  { value: 'deceased', label: 'Meninggal' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EditMemberModalProps {
  visible: boolean;
  member: Member;
  onSave: (patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>>) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditMemberModal({
  visible,
  member,
  onSave,
  onClose,
}: EditMemberModalProps) {
  const [fullName, setFullName] = useState(member.fullName);
  const [gender, setGender] = useState<'male' | 'female'>(member.gender);
  const [role, setRole] = useState(member.role);
  const [birthDate, setBirthDate] = useState(member.birthDate ?? '');
  const [status, setStatus] = useState<'living' | 'deceased'>(member.status);
  const [deathDate, setDeathDate] = useState(member.deathDate ?? '');
  const [bio, setBio] = useState(member.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(member.photoUrl);
  const [errors, setErrors] = useState<EditMemberFormErrors>({});

  // Reset local state whenever the modal opens with fresh member values
  function handleShow() {
    setFullName(member.fullName);
    setGender(member.gender);
    setRole(member.role);
    setBirthDate(member.birthDate ?? '');
    setStatus(member.status);
    setDeathDate(member.deathDate ?? '');
    setBio(member.bio ?? '');
    setPhotoUrl(member.photoUrl);
    setErrors({});
  }

  function handleSave() {
    const validationErrors = validateMemberForm({ fullName, gender, role, birthDate, status, deathDate, bio });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Build patch with only changed fields
    const patch: Partial<Omit<Member, 'id' | 'familyTreeId' | 'createdAt'>> = {};

    const trimmedFullName = fullName.trim();
    if (trimmedFullName !== member.fullName) {
      patch.fullName = trimmedFullName;
    }

    if (gender !== member.gender) {
      patch.gender = gender;
    }

    if (role !== member.role) {
      patch.role = role;
    }

    const resolvedBirthDate = birthDate.trim() === '' ? null : birthDate.trim();
    if (resolvedBirthDate !== member.birthDate) {
      patch.birthDate = resolvedBirthDate;
    }

    if (status !== member.status) {
      patch.status = status;
    }

    // Death date is only meaningful when deceased; clear it otherwise.
    const resolvedDeathDate =
      status === 'deceased' && deathDate.trim() !== '' ? deathDate.trim() : null;
    if (resolvedDeathDate !== member.deathDate) {
      patch.deathDate = resolvedDeathDate;
    }

    const resolvedBio = bio.trim() === '' ? null : bio.trim();
    if (resolvedBio !== member.bio) {
      patch.bio = resolvedBio;
    }

    if (photoUrl !== member.photoUrl) {
      patch.photoUrl = photoUrl;
    }

    onSave(patch);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ────────────────────────────────────────────────────── */}
            <View style={styles.header}>
              <ThemedText style={styles.title}>Edit Anggota</ThemedText>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Batal"
                style={styles.cancelButton}
              >
                <ThemedText style={styles.cancelLabel}>Batal</ThemedText>
              </Pressable>
            </View>

            {/* ── Photo ──────────────────────────────────────────────────────── */}
            <PhotoPickerField
              treeId={member.familyTreeId}
              value={photoUrl}
              onChange={setPhotoUrl}
            />

            {/* ── Full Name ──────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>
                Nama Lengkap <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.textInput, errors.fullName ? styles.textInputError : null]}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={AsalUsulColors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Nama lengkap"
              />
              {errors.fullName ? (
                <ThemedText style={styles.errorText}>{errors.fullName}</ThemedText>
              ) : null}
            </View>

            {/* ── Gender ────────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>
                Jenis Kelamin <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(({ value, label }) => {
                  const isSelected = gender === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        setGender(value);
                        if (errors.gender) setErrors((prev) => ({ ...prev, gender: undefined }));
                      }}
                      style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={label}
                    >
                      <ThemedText
                        style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}
                      >
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              {errors.gender ? (
                <ThemedText style={styles.errorText}>{errors.gender}</ThemedText>
              ) : null}
            </View>

            {/* ── Role ──────────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>
                Peran dalam Keluarga <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((roleOption) => {
                  const isSelected = role === roleOption;
                  return (
                    <Pressable
                      key={roleOption}
                      onPress={() => {
                        setRole(roleOption);
                        if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                      }}
                      style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={roleOption}
                    >
                      <ThemedText
                        style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}
                      >
                        {roleOption}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              {errors.role ? (
                <ThemedText style={styles.errorText}>{errors.role}</ThemedText>
              ) : null}
            </View>

            {/* ── Birth Date ────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Tanggal Lahir</ThemedText>
              <DatePickerField
                value={birthDate}
                onChange={(date) => {
                  setBirthDate(date);
                  if (errors.birthDate) setErrors((prev) => ({ ...prev, birthDate: undefined }));
                }}
                hasError={!!errors.birthDate}
                accessibilityLabel="Pilih tanggal lahir"
              />
              {errors.birthDate ? (
                <ThemedText style={styles.errorText}>{errors.birthDate}</ThemedText>
              ) : null}
            </View>

            {/* ── Status (Hidup / Meninggal) ───────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <View style={styles.genderRow}>
                {STATUS_OPTIONS.map(({ value, label }) => {
                  const isSelected = status === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        setStatus(value);
                        if (value === 'living') setDeathDate('');
                        if (errors.deathDate) setErrors((prev) => ({ ...prev, deathDate: undefined }));
                      }}
                      style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={label}
                    >
                      <ThemedText
                        style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}
                      >
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Death Date — only when deceased ──────────────────────────── */}
            {status === 'deceased' && (
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Tanggal Meninggal</ThemedText>
                <DatePickerField
                  value={deathDate}
                  onChange={(date) => {
                    setDeathDate(date);
                    if (errors.deathDate) setErrors((prev) => ({ ...prev, deathDate: undefined }));
                  }}
                  hasError={!!errors.deathDate}
                  accessibilityLabel="Pilih tanggal meninggal"
                />
                {errors.deathDate ? (
                  <ThemedText style={styles.errorText}>{errors.deathDate}</ThemedText>
                ) : null}
              </View>
            )}

            {/* ── Bio ───────────────────────────────────────────────────────── */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Biografi</ThemedText>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Ceritakan sedikit tentang anggota ini (opsional)"
                placeholderTextColor={AsalUsulColors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                accessibilityLabel="Biografi"
              />
            </View>

            {/* ── Save button ───────────────────────────────────────────────── */}
            <Pressable
              onPress={handleSave}
              style={styles.saveButton}
              accessibilityRole="button"
              accessibilityLabel="Simpan perubahan"
            >
              <ThemedText style={styles.saveLabel}>Simpan</ThemedText>
            </Pressable>
          </ScrollView>
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
    maxHeight: '90%',
    ...Shadows.card,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
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
  bioInput: {
    minHeight: 96,
    paddingTop: Spacing.two + 2,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    lineHeight: 16,
    marginTop: -Spacing.one,
  },

  // Gender toggle — matches FamilyMemberForm
  genderRow: { flexDirection: 'row', gap: Spacing.two },
  genderOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  genderOptionSelected: {
    borderColor: AsalUsulColors.primary,
    backgroundColor: AsalUsulColors.primary,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AsalUsulColors.textBody,
    lineHeight: 20,
  },
  genderLabelSelected: {
    color: AsalUsulColors.textOnPrimary,
    fontWeight: '600',
  },

  // Role chips — matches FamilyMemberForm
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  roleOption: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  roleOptionSelected: {
    borderColor: AsalUsulColors.primary,
    backgroundColor: AsalUsulColors.primary,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AsalUsulColors.textBody,
    lineHeight: 20,
  },
  roleLabelSelected: {
    color: AsalUsulColors.textOnPrimary,
    fontWeight: '600',
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

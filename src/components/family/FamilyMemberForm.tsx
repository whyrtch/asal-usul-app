/**
 * FamilyMemberForm — animated form for capturing a family member's identity
 * and their relationship to existing members.
 *
 * Appears with a SlideInDown.duration(350).springify() entering animation.
 * Handles keyboard avoidance via KeyboardAvoidingView.
 *
 * Requirements: 4.1–4.14, 5.1, 9.3, 10.2, 10.5
 */

import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useMemberStore } from '@/store/useMemberStore';
import type { Member } from '@/types/familyTree';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormValues = {
  fullName: string;
  gender: 'male' | 'female' | null;
  role: string;
  birthDate: string;
  bio: string;
};

export type FormErrors = {
  fullName?: string;
  gender?: string;
  role?: string;
  birthDate?: string;
};

/**
 * How the new member relates to an existing member.
 *
 * - 'parent_of'  → new member is the father/mother of the selected member
 * - 'child_of'   → new member is a child of the selected member
 * - 'spouse_of'  → new member is the spouse of the selected member
 */
type RelationshipType = 'parent_of' | 'child_of' | 'spouse_of';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ['Anak', 'Ayah', 'Ibu', 'Kakek', 'Nenek'] as const;

const GENDER_OPTIONS: { value: 'male' | 'female'; label: string }[] = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
];

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string; hint: string }[] = [
  { value: 'parent_of', label: 'Orang tua dari',  hint: 'Ayah/Ibu dari anggota yang dipilih' },
  { value: 'child_of',  label: 'Anak dari',        hint: 'Anak dari anggota yang dipilih' },
  { value: 'spouse_of', label: 'Pasangan dari',    hint: 'Suami/Istri dari anggota yang dipilih' },
];

// ─── validateForm ─────────────────────────────────────────────────────────────

/**
 * Validates the form values and returns an errors object.
 * An empty object means all required fields are valid.
 *
 * Exported as a named export so property tests can import it directly.
 */
export function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().length < 1) {
    errors.fullName = 'Nama lengkap wajib diisi';
  }

  if (values.gender === null) {
    errors.gender = 'Jenis kelamin wajib dipilih';
  }

  if (values.role.length < 1) {
    errors.role = 'Peran dalam keluarga wajib dipilih';
  }

  if (
    typeof values.birthDate === 'string' &&
    values.birthDate.trim() !== '' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate.trim())
  ) {
    errors.birthDate = 'Format tanggal: YYYY-MM-DD';
  }

  return errors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds relationship fields by looking up the existing member's gender
 * to decide fatherId vs motherId when the new member is a child.
 */
function resolveRelationshipFields(
  _newGender: 'male' | 'female',
  relationshipType: RelationshipType | null,
  relatedMember: Member | null,
): Pick<Member, 'fatherId' | 'motherId' | 'spouseIds' | 'childrenIds'> {
  const base = { fatherId: null as string | null, motherId: null as string | null, spouseIds: [] as string[], childrenIds: [] as string[] };

  if (!relationshipType || !relatedMember) return base;

  switch (relationshipType) {
    case 'parent_of':
      // New member is parent of relatedMember
      return { ...base, childrenIds: [relatedMember.id] };

    case 'child_of':
      // New member is child of relatedMember
      // Set fatherId or motherId based on the *existing* member's gender
      return {
        ...base,
        fatherId: relatedMember.gender === 'male' ? relatedMember.id : null,
        motherId: relatedMember.gender === 'female' ? relatedMember.id : null,
      };

    case 'spouse_of':
      return { ...base, spouseIds: [relatedMember.id] };

    default:
      return base;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FamilyMemberFormProps {
  /** The family tree this member belongs to. */
  familyTreeId: string;
  /** Existing members in this tree — used to render the relationship picker. */
  existingMembers?: Member[];
  /** Called after the member is successfully added to the store. */
  onSuccess: () => void;
  /** Called when the user dismisses the form without submitting. */
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyMemberForm({
  familyTreeId,
  existingMembers = [],
  onSuccess,
  onDismiss,
}: FamilyMemberFormProps) {
  // ── Store ───────────────────────────────────────────────────────────────────
  const addMember = useMemberStore((s) => s.addMember);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formValues, setFormValues] = useState<FormValues>({
    fullName: '',
    gender: null,
    role: '',
    birthDate: '',
    bio: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ── Relationship state ──────────────────────────────────────────────────────
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null);
  const [relatedMemberId, setRelatedMemberId] = useState<string | null>(null);

  const hasExistingMembers = existingMembers.length > 0;

  // ── Submit button animation ─────────────────────────────────────────────────
  const submitScale = useSharedValue(1);
  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const errors = validateForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const relatedMember = existingMembers.find((m) => m.id === relatedMemberId) ?? null;
    const relationshipFields = resolveRelationshipFields(
      formValues.gender as 'male' | 'female',
      relationshipType,
      relatedMember,
    );

    addMember(familyTreeId, {
      familyTreeId,
      fullName: formValues.fullName.trim(),
      gender: formValues.gender as 'male' | 'female',
      role: formValues.role,
      birthDate: formValues.birthDate.trim() === '' ? null : formValues.birthDate,
      photoUrl: null,
      bio: formValues.bio.trim() === '' ? null : formValues.bio,
      ...relationshipFields,
    });

    onSuccess();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const formTitle = hasExistingMembers ? 'Tambah Anggota Keluarga' : 'Tambah Anggota Pertama';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        entering={SlideInDown.duration(350).springify()}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>{formTitle}</ThemedText>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Tutup formulir"
              style={styles.dismissButton}
            >
              <ThemedText style={styles.dismissLabel}>Batal</ThemedText>
            </Pressable>
          </View>

          {/* ── Full Name ───────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Nama Lengkap <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.textInput, formErrors.fullName ? styles.textInputError : null]}
              value={formValues.fullName}
              onChangeText={(text) => updateField('fullName', text)}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={AsalUsulColors.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Nama lengkap"
            />
            {formErrors.fullName ? (
              <ThemedText style={styles.errorText}>{formErrors.fullName}</ThemedText>
            ) : null}
          </View>

          {/* ── Gender ──────────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Jenis Kelamin <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map(({ value, label }) => {
                const isSelected = formValues.gender === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => updateField('gender', value)}
                    style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={label}
                  >
                    <ThemedText style={[styles.genderLabel, isSelected && styles.genderLabelSelected]}>
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {formErrors.gender ? (
              <ThemedText style={styles.errorText}>{formErrors.gender}</ThemedText>
            ) : null}
          </View>

          {/* ── Role ────────────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>
              Peran dalam Keluarga <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((role) => {
                const isSelected = formValues.role === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => updateField('role', role)}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={role}
                  >
                    <ThemedText style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                      {role}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {formErrors.role ? (
              <ThemedText style={styles.errorText}>{formErrors.role}</ThemedText>
            ) : null}
          </View>

          {/* ── Birth Date ──────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Tanggal Lahir</ThemedText>
            <TextInput
              style={[styles.textInput, formErrors.birthDate ? styles.textInputError : null]}
              value={formValues.birthDate}
              onChangeText={(text) => updateField('birthDate', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={AsalUsulColors.textMuted}
              keyboardType="default"
              maxLength={10}
              returnKeyType="next"
              accessibilityLabel="Tanggal lahir"
            />
            {formErrors.birthDate ? (
              <ThemedText style={styles.errorText}>{formErrors.birthDate}</ThemedText>
            ) : null}
          </View>

          {/* ── Bio ─────────────────────────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.label}>Biografi</ThemedText>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={formValues.bio}
              onChangeText={(text) => updateField('bio', text)}
              placeholder="Ceritakan sedikit tentang anggota ini (opsional)"
              placeholderTextColor={AsalUsulColors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
              accessibilityLabel="Biografi"
            />
          </View>

          {/* ── Relationship section — only when existing members exist ─────── */}
          {hasExistingMembers && (
            <View style={styles.relationshipSection}>
              <ThemedText style={styles.sectionHeading}>Hubungan Keluarga</ThemedText>
              <ThemedText style={styles.sectionHint}>
                Opsional — pilih hubungan anggota ini dengan anggota yang sudah ada.
              </ThemedText>

              {/* Relationship type chips */}
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Jenis Hubungan</ThemedText>
                <View style={styles.roleGrid}>
                  {RELATIONSHIP_OPTIONS.map(({ value, label }) => {
                    const isSelected = relationshipType === value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() =>
                          setRelationshipType(isSelected ? null : value)
                        }
                        style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        accessibilityLabel={label}
                      >
                        <ThemedText
                          style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}
                        >
                          {label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Member picker — shown only when a relationship type is selected */}
              {relationshipType !== null && (
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.label}>
                    {RELATIONSHIP_OPTIONS.find((r) => r.value === relationshipType)?.hint}
                  </ThemedText>
                  <View style={styles.memberList}>
                    {existingMembers.map((member) => {
                      const isSelected = relatedMemberId === member.id;
                      return (
                        <Pressable
                          key={member.id}
                          onPress={() =>
                            setRelatedMemberId(isSelected ? null : member.id)
                          }
                          style={[
                            styles.memberOption,
                            isSelected && styles.memberOptionSelected,
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={member.fullName}
                        >
                          {/* Initials avatar */}
                          <View
                            style={[
                              styles.memberAvatar,
                              isSelected && styles.memberAvatarSelected,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.memberAvatarText,
                                isSelected && styles.memberAvatarTextSelected,
                              ]}
                            >
                              {member.fullName
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </ThemedText>
                          </View>

                          <View style={styles.memberInfo}>
                            <ThemedText
                              style={[
                                styles.memberName,
                                isSelected && styles.memberNameSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {member.fullName}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.memberRole,
                                isSelected && styles.memberRoleSelected,
                              ]}
                            >
                              {member.role}
                            </ThemedText>
                          </View>

                          {/* Checkmark */}
                          {isSelected && (
                            <View style={styles.checkmark}>
                              <ThemedText style={styles.checkmarkText}>✓</ThemedText>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ── Submit ──────────────────────────────────────────────────────── */}
          <Animated.View style={submitAnimatedStyle}>
            <Pressable
              onPress={handleSubmit}
              onPressIn={() => {
                submitScale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
              }}
              onPressOut={() => {
                submitScale.value = withSpring(1, { damping: 10, stiffness: 300 });
              }}
              style={styles.submitButton}
              accessibilityRole="button"
              accessibilityLabel="Simpan anggota"
            >
              <ThemedText style={styles.submitLabel}>Simpan</ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
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
  dismissButton: { paddingVertical: Spacing.one, paddingLeft: Spacing.three },
  dismissLabel: { fontSize: 15, color: AsalUsulColors.primaryMuted, fontWeight: '500' },

  // Field groups
  fieldGroup: { gap: Spacing.two },
  label: { fontSize: 14, fontWeight: '600', color: AsalUsulColors.textBody, lineHeight: 20 },
  required: { color: '#D32F2F' },

  // Text inputs
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
  bioInput: { minHeight: 96, paddingTop: Spacing.two + 2 },
  errorText: { fontSize: 12, color: '#D32F2F', lineHeight: 16, marginTop: -Spacing.one },

  // Gender
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
  genderOptionSelected: { borderColor: AsalUsulColors.primary, backgroundColor: AsalUsulColors.primary },
  genderLabel: { fontSize: 14, fontWeight: '500', color: AsalUsulColors.textBody, lineHeight: 20 },
  genderLabelSelected: { color: AsalUsulColors.textOnPrimary, fontWeight: '600' },

  // Role / relationship chips
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  roleOption: {
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  roleOptionSelected: { borderColor: AsalUsulColors.primary, backgroundColor: AsalUsulColors.primary },
  roleLabel: { fontSize: 14, fontWeight: '500', color: AsalUsulColors.textBody, lineHeight: 20 },
  roleLabelSelected: { color: AsalUsulColors.textOnPrimary, fontWeight: '600' },

  // Relationship section
  relationshipSection: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: AsalUsulColors.borderSubtle,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
    lineHeight: 22,
  },
  sectionHint: {
    fontSize: 13,
    color: AsalUsulColors.textMuted,
    lineHeight: 18,
    marginTop: -Spacing.two,
  },

  // Member picker
  memberList: { gap: Spacing.two },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.md,
    padding: Spacing.three,
    backgroundColor: AsalUsulColors.backgroundWarm,
  },
  memberOptionSelected: {
    borderColor: AsalUsulColors.primary,
    backgroundColor: '#EAF2EE',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarSelected: { backgroundColor: AsalUsulColors.primary },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: AsalUsulColors.primaryMuted,
  },
  memberAvatarTextSelected: { color: AsalUsulColors.textOnPrimary },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: AsalUsulColors.textHeading,
    lineHeight: 20,
  },
  memberNameSelected: { color: AsalUsulColors.primary },
  memberRole: { fontSize: 12, color: AsalUsulColors.textMuted, lineHeight: 16 },
  memberRoleSelected: { color: AsalUsulColors.primaryMuted },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { fontSize: 13, color: AsalUsulColors.textOnPrimary, fontWeight: '700' },

  // Submit
  submitButton: {
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    ...Shadows.button,
  },
  submitLabel: {
    color: AsalUsulColors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});

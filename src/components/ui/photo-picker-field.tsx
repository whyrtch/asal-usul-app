/**
 * PhotoPickerField — circular avatar with pick / change / remove controls.
 *
 * Picks a square image from the library, uploads it to Cloud Storage via
 * `usePhotoUpload`, and reports the resulting download URL through `onChange`.
 *
 * Phase 1 — 4.1 Foto anggota.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FEATURE_PHOTO_UPLOAD } from '@/constants/features';
import { AsalUsulColors, Spacing } from '@/constants/theme';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { buildMemberPhotoPath, generateFileId } from '@/utils/storagePaths';

export interface PhotoPickerFieldProps {
  /** Family tree id — used to build the storage path. */
  treeId: string;
  /** Current photo URL (or null when none). */
  value: string | null;
  /** Called with the new download URL, or null when the photo is removed. */
  onChange: (url: string | null) => void;
}

export function PhotoPickerField({ treeId, value, onChange }: PhotoPickerFieldProps) {
  const { uploading, error, pickAndUpload } = usePhotoUpload();

  // Feature temporarily disabled (Firebase Storage not provisioned) — render
  // nothing so the forms simply omit the photo control.
  if (!FEATURE_PHOTO_UPLOAD) {
    return null;
  }

  async function handlePick() {
    const path = buildMemberPhotoPath(treeId, generateFileId());
    const url = await pickAndUpload(path);
    if (url) onChange(url);
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePick}
        disabled={uploading}
        style={styles.avatar}
        accessibilityRole="button"
        accessibilityLabel={value ? 'Ganti foto' : 'Tambah foto'}
      >
        {uploading ? (
          <ActivityIndicator color={AsalUsulColors.textOnPrimary} />
        ) : value ? (
          <Image
            source={{ uri: value }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Ionicons name="camera" size={26} color={AsalUsulColors.textOnPrimary} />
        )}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={handlePick}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Ganti foto' : 'Tambah foto'}
        >
          <ThemedText style={styles.actionText}>
            {value ? 'Ganti Foto' : 'Tambah Foto'}
          </ThemedText>
        </Pressable>

        {value && !uploading && (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Hapus foto"
          >
            <ThemedText style={styles.removeText}>Hapus</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Photo is optional — make that explicit to the user. */}
      {!value && !uploading && (
        <ThemedText style={styles.optionalHint}>Opsional</ThemedText>
      )}

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: AsalUsulColors.primary,
  },
  removeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
  },
  optionalHint: {
    fontSize: 12,
    color: AsalUsulColors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    lineHeight: 16,
  },
});

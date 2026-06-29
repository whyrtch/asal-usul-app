/**
 * usePhotoUpload — picks an image from the library and uploads it to Cloud
 * Storage, returning the download URL.
 *
 * Exposes `uploading` / `error` state so the UI can show a spinner and an
 * inline message. Returns `null` when the user cancels or permission is denied.
 *
 * Phase 1 — 4.1 Foto anggota + cover.
 *
 * @module src/hooks/usePhotoUpload
 */

import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { AnalyticsEvents, logEvent, recordError } from '@/services/analytics';
import { uploadImageAsync } from '@/services/firebase/storage';

export interface UsePhotoUploadResult {
  /** True while an upload is in progress. */
  uploading: boolean;
  /** Localized error message, or null. */
  error: string | null;
  /**
   * Opens the image library, lets the user pick + crop a square image, uploads
   * it to `storagePath`, and resolves to the download URL (or null on
   * cancel/permission-denied/error).
   */
  pickAndUpload: (storagePath: string) => Promise<string | null>;
}

const ERROR_PERMISSION = 'Izin akses galeri ditolak.';
const ERROR_UPLOAD = 'Gagal mengunggah foto. Silakan coba lagi.';

export function usePhotoUpload(): UsePhotoUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(
    async (storagePath: string): Promise<string | null> => {
      setError(null);

      // Request media-library permission before opening the picker.
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(ERROR_PERMISSION);
        return null;
      }

      // Open the system picker — square crop, compressed for upload size.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || result.assets.length === 0) {
        return null;
      }

      const uri = result.assets[0].uri;

      setUploading(true);
      try {
        const url = await uploadImageAsync(uri, storagePath);
        logEvent(AnalyticsEvents.PHOTO_ADDED);
        return url;
      } catch (err) {
        recordError(err, { op: 'pickAndUpload' });
        setError(ERROR_UPLOAD);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { uploading, error, pickAndUpload };
}

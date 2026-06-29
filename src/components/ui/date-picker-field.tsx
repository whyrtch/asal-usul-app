/**
 * DatePickerField — a tappable field that opens a native calendar date picker.
 *
 * Uses the Expo SDK 56 drop-in replacement `@expo/ui/community/datetime-picker`
 * (Jetpack Compose on Android, SwiftUI on iOS). Values are stored as
 * `YYYY-MM-DD` strings to stay compatible with the existing form validation
 * and the `Member.birthDate` shape.
 *
 * Web has a dedicated implementation in `date-picker-field.web.tsx`.
 */

import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Spacing } from '@/constants/theme';

// ─── Date helpers ───────────────────────────────────────────────────────────

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Formats a `Date` to a local `YYYY-MM-DD` string (no timezone shift). */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local `Date`, or null when invalid. */
function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Friendly Indonesian display, e.g. "12 Januari 1990". */
function formatDisplay(value: string): string {
  const d = parseISODate(value);
  if (!d) return value;
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface DatePickerFieldProps {
  /** Current value as `YYYY-MM-DD`, or '' when unset. */
  value: string;
  /** Called with the selected date as `YYYY-MM-DD`. */
  onChange: (value: string) => void;
  /** Renders the field with an error border when true. */
  hasError?: boolean;
  /** Placeholder shown when no date is selected. */
  placeholder?: string;
  /** Accessibility label for the field. */
  accessibilityLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DatePickerField({
  value,
  onChange,
  hasError = false,
  placeholder = 'Pilih tanggal lahir',
  accessibilityLabel = 'Tanggal lahir',
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const [iosTempDate, setIosTempDate] = useState<Date | null>(null);

  const today = new Date();
  const currentDate = parseISODate(value) ?? today;

  function openPicker() {
    setIosTempDate(currentDate);
    setShow(true);
  }

  // Android: dialog presentation fires once on selection / dismissal.
  function handleAndroidChange(_event: unknown, date: Date) {
    setShow(false);
    if (date) onChange(toISODate(date));
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={[styles.field, hasError && styles.fieldError]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <ThemedText style={[styles.valueText, !value && styles.placeholderText]}>
          {value ? formatDisplay(value) : placeholder}
        </ThemedText>
        <Ionicons name="calendar-outline" size={20} color={AsalUsulColors.primaryMuted} />
      </Pressable>

      {/* Android — native Material 3 dialog, opens on mount */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          presentation="dialog"
          maximumDate={today}
          accentColor={AsalUsulColors.primary}
          onValueChange={handleAndroidChange}
          onDismiss={() => setShow(false)}
        />
      )}

      {/* iOS — inline SwiftUI calendar inside a bottom sheet with confirm */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setShow(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable
                onPress={() => setShow(false)}
                accessibilityRole="button"
                accessibilityLabel="Batal"
              >
                <ThemedText style={styles.sheetCancel}>Batal</ThemedText>
              </Pressable>
              <ThemedText style={styles.sheetTitle}>Tanggal Lahir</ThemedText>
              <Pressable
                onPress={() => {
                  if (iosTempDate) onChange(toISODate(iosTempDate));
                  setShow(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Selesai"
              >
                <ThemedText style={styles.sheetDone}>Selesai</ThemedText>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosTempDate ?? currentDate}
              mode="date"
              display="inline"
              maximumDate={today}
              accentColor={AsalUsulColors.primary}
              onValueChange={(_event, date) => setIosTempDate(date)}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: AsalUsulColors.borderSubtle,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    backgroundColor: AsalUsulColors.backgroundWarm,
    minHeight: 50,
  },
  fieldError: { borderColor: '#D32F2F' },
  valueText: { fontSize: 15, color: AsalUsulColors.textBody, lineHeight: 22 },
  placeholderText: { color: AsalUsulColors.textMuted },

  // iOS bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingBottom: Spacing.six,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: AsalUsulColors.borderSubtle,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: AsalUsulColors.textHeading },
  sheetCancel: { fontSize: 15, color: AsalUsulColors.textMuted, fontWeight: '500' },
  sheetDone: { fontSize: 15, color: AsalUsulColors.primary, fontWeight: '700' },
  iosPicker: { height: 360, alignSelf: 'stretch' },
});

/**
 * DatePickerField (web) — uses the browser-native `<input type="date">`,
 * which renders the platform calendar picker. The `@expo/ui` native picker
 * renders nothing on web, so this dedicated implementation is used instead.
 *
 * Value format is `YYYY-MM-DD`, matching the native implementation and the
 * `Member.birthDate` shape.
 */

import { AsalUsulColors, Radii } from '@/constants/theme';
import type { DatePickerFieldProps } from './date-picker-field';

export type { DatePickerFieldProps };

/** Today as `YYYY-MM-DD`, used as the max selectable date. */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePickerField({
  value,
  onChange,
  hasError = false,
  placeholder = 'Pilih tanggal lahir',
  accessibilityLabel = 'Tanggal lahir',
}: DatePickerFieldProps) {
  return (
    <input
      type="date"
      value={value}
      max={todayISO()}
      placeholder={placeholder}
      aria-label={accessibilityLabel}
      onChange={(event) => onChange(event.target.value)}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 50,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: hasError ? '#D32F2F' : AsalUsulColors.borderSubtle,
        borderRadius: Radii.sm,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 12,
        paddingRight: 12,
        fontSize: 15,
        color: AsalUsulColors.textBody,
        backgroundColor: AsalUsulColors.backgroundWarm,
        outline: 'none',
        fontFamily: 'inherit',
      }}
    />
  );
}

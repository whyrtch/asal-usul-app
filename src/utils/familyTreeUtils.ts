/**
 * Utility functions for the Family Tree feature.
 *
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4
 */

/**
 * Validates a family tree name.
 *
 * Returns `true` if and only if `name.trim().length >= 1`.
 * An empty string or a string consisting entirely of whitespace is invalid.
 *
 * Requirements: 5.1, 5.2, 5.3
 */
export function validateFamilyTreeName(name: string): boolean {
  return name.trim().length >= 1;
}

/**
 * Formats an ISO 8601 date string as a human-readable Indonesian relative date label.
 *
 * - Returns `"Dibuat hari ini"` when the date falls on today's calendar date.
 * - Returns `"Dibuat N hari lalu"` for any past date N calendar days ago (N ≥ 1).
 *
 * The day difference is computed using calendar dates (midnight-to-midnight) so that
 * a date created at 23:59 yesterday is correctly reported as "1 hari lalu" rather
 * than "0 hari lalu".
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function formatRelativeDate(isoDate: string): string {
  const created = new Date(isoDate);
  const now = new Date();

  // Normalise both dates to midnight (local time) to get a clean calendar-day diff
  const createdMidnight = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  );
  const nowMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const diffMs = nowMidnight.getTime() - createdMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Dibuat hari ini';
  }

  return `Dibuat ${diffDays} hari lalu`;
}

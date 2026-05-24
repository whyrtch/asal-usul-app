/**
 * Unit tests for familyTreeUtils.ts
 *
 * Covers: validateFamilyTreeName and formatRelativeDate
 * Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4
 */

import {
    formatRelativeDate,
    validateFamilyTreeName,
} from '../utils/familyTreeUtils';

// ---------------------------------------------------------------------------
// validateFamilyTreeName
// ---------------------------------------------------------------------------

describe('validateFamilyTreeName', () => {
  // Requirement 5.1 — returns true for valid names
  it('returns true for a normal non-empty name', () => {
    expect(validateFamilyTreeName('Keluarga Budi')).toBe(true);
  });

  it('returns true for a single character', () => {
    expect(validateFamilyTreeName('A')).toBe(true);
  });

  it('returns true for a name with leading/trailing whitespace (trimmed length >= 1)', () => {
    expect(validateFamilyTreeName('  Keluarga  ')).toBe(true);
  });

  // Requirement 5.2 — returns false for empty string
  it('returns false for an empty string', () => {
    expect(validateFamilyTreeName('')).toBe(false);
  });

  // Requirement 5.3 — returns false for whitespace-only strings
  it('returns false for a single space', () => {
    expect(validateFamilyTreeName(' ')).toBe(false);
  });

  it('returns false for multiple spaces', () => {
    expect(validateFamilyTreeName('   ')).toBe(false);
  });

  it('returns false for a tab character', () => {
    expect(validateFamilyTreeName('\t')).toBe(false);
  });

  it('returns false for a newline character', () => {
    expect(validateFamilyTreeName('\n')).toBe(false);
  });

  it('returns false for mixed whitespace characters', () => {
    expect(validateFamilyTreeName(' \t\n ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatRelativeDate
// ---------------------------------------------------------------------------

describe('formatRelativeDate', () => {
  // Requirement 6.1 — returns "Dibuat hari ini" for today
  it('returns "Dibuat hari ini" for the current ISO timestamp', () => {
    const now = new Date().toISOString();
    expect(formatRelativeDate(now)).toBe('Dibuat hari ini');
  });

  it('returns "Dibuat hari ini" for midnight of today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(formatRelativeDate(today.toISOString())).toBe('Dibuat hari ini');
  });

  it('returns "Dibuat hari ini" for end of today (23:59:59)', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    expect(formatRelativeDate(today.toISOString())).toBe('Dibuat hari ini');
  });

  // Requirement 6.2 — returns "Dibuat N hari lalu" for past dates
  it('returns "Dibuat 1 hari lalu" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday.toISOString())).toBe('Dibuat 1 hari lalu');
  });

  it('returns "Dibuat 7 hari lalu" for 7 days ago', () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    expect(formatRelativeDate(sevenDaysAgo.toISOString())).toBe('Dibuat 7 hari lalu');
  });

  it('returns "Dibuat 30 hari lalu" for 30 days ago', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(formatRelativeDate(thirtyDaysAgo.toISOString())).toBe('Dibuat 30 hari lalu');
  });

  // Requirement 6.3 — result always starts with "Dibuat "
  it('result always starts with "Dibuat " for today', () => {
    const result = formatRelativeDate(new Date().toISOString());
    expect(result.startsWith('Dibuat ')).toBe(true);
  });

  it('result always starts with "Dibuat " for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = formatRelativeDate(past.toISOString());
    expect(result.startsWith('Dibuat ')).toBe(true);
  });

  // Requirement 6.4 — result is always non-empty
  it('returns a non-empty string for today', () => {
    expect(formatRelativeDate(new Date().toISOString()).length).toBeGreaterThan(0);
  });

  it('returns a non-empty string for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(formatRelativeDate(past.toISOString()).length).toBeGreaterThan(0);
  });
});

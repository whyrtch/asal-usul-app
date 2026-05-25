/**
 * Property-based tests for `validateForm`
 *
 * Property 3: no errors iff all required fields valid
 * **Validates: Requirements 4.7, 4.8, 4.9, 4.10, 4.11**
 */

// ── Module mocks ──────────────────────────────────────────────────────────────

// react-native-reanimated: stub out all animation primitives so the module
// loads without a native UI thread in the Jest environment.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
        React.createElement(View, { style }, children),
    },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withSpring: (toValue: number) => toValue,
    withTiming: (toValue: number) => toValue,
    SlideInDown: { duration: () => ({ springify: () => undefined }) },
    FadeIn: { duration: () => ({ delay: () => undefined }) },
    ZoomIn: { duration: () => ({ delay: () => undefined }) },
    FadeInDown: { duration: () => ({ delay: () => undefined }) },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
  };
});

// useFamilyTreeStore: validateForm doesn't use the store, but FamilyMemberForm
// imports it at module level — stub it out so Jest doesn't need Zustand setup.
jest.mock('@/store/useFamilyTreeStore', () => ({
  useFamilyTreeStore: () => ({ addMember: jest.fn() }),
}));

// ThemedText: not needed for pure function tests
jest.mock('@/components/themed-text', () => ({
  ThemedText: () => null,
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import * as fc from 'fast-check';
import type { FormValues } from '../components/family/FamilyMemberForm';
import { validateForm } from '../components/family/FamilyMemberForm';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Arbitrary for a non-empty, non-whitespace-only fullName */
const validFullNameArbitrary = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length >= 1);

/** Arbitrary for a whitespace-only fullName (spaces, tabs, newlines) */
const whitespaceOnlyArbitrary = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(''));

/** Arbitrary for a valid gender value */
const validGenderArbitrary = fc.oneof(
  fc.constant('male' as const),
  fc.constant('female' as const),
);

/** Arbitrary for a non-empty role string */
const validRoleArbitrary = fc.string({ minLength: 1 });

/** Arbitrary for a valid birthDate in YYYY-MM-DD format */
const validBirthDateArbitrary = fc
  .tuple(
    fc.integer({ min: 1000, max: 9999 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(([y, m, d]) => {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  });

/** Arbitrary for an invalid birthDate (non-empty, does not match YYYY-MM-DD) */
const invalidBirthDateArbitrary = fc
  .string({ minLength: 1 })
  .filter((s) => s.trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(s));

/** Arbitrary for an optional birthDate (empty string = omitted, or a valid date) */
const optionalBirthDateArbitrary = fc.oneof(
  fc.constant(''),
  validBirthDateArbitrary,
);

/** Arbitrary for a complete valid FormValues object */
const validFormValuesArbitrary: fc.Arbitrary<FormValues> = fc.record<FormValues>({
  fullName: validFullNameArbitrary,
  gender: validGenderArbitrary,
  role: validRoleArbitrary,
  birthDate: optionalBirthDateArbitrary,
  bio: fc.string(),
});

/** Arbitrary for an arbitrary FormValues object (may be valid or invalid) */
const anyFormValuesArbitrary: fc.Arbitrary<FormValues> = fc.record<FormValues>({
  fullName: fc.string(),
  gender: fc.oneof(
    fc.constant('male' as const),
    fc.constant('female' as const),
    fc.constant(null),
  ),
  role: fc.string(),
  birthDate: fc.string(),
  bio: fc.string(),
});

// ---------------------------------------------------------------------------
// Property 3: no errors iff all required fields valid
// ---------------------------------------------------------------------------

describe('Property 3: no errors iff all required fields valid', () => {
  /**
   * For any FormValues object, `Object.keys(validateForm(v)).length === 0`
   * if and only if `v.fullName.trim().length >= 1 && v.gender !== null && v.role.length >= 1`.
   *
   * **Validates: Requirements 4.7, 4.8, 4.9, 4.10, 4.11**
   */
  it('returns no errors when all required fields are valid', () => {
    fc.assert(
      fc.property(validFormValuesArbitrary, (values) => {
        const errors = validateForm(values);
        expect(Object.keys(errors).length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });

  it('biconditional: no required-field errors iff all required fields valid', () => {
    fc.assert(
      fc.property(anyFormValuesArbitrary, (values) => {
        const errors = validateForm(values);
        const hasRequiredErrors = Boolean(
          errors.fullName || errors.gender || errors.role,
        );

        const allRequiredValid =
          values.fullName.trim().length >= 1 &&
          values.gender !== null &&
          values.role.length >= 1;

        // No required-field errors iff all required fields are valid
        expect(hasRequiredErrors).toBe(!allRequiredValid);
      }),
      { numRuns: 300 },
    );
  });

  it('returns at least one error when any required field is invalid', () => {
    fc.assert(
      fc.property(anyFormValuesArbitrary, (values) => {
        const allRequiredValid =
          values.fullName.trim().length >= 1 &&
          values.gender !== null &&
          values.role.length >= 1;

        const errors = validateForm(values);

        if (!allRequiredValid) {
          expect(Object.keys(errors).length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Whitespace-only fullName produces fullName error
// ---------------------------------------------------------------------------

describe('whitespace-only fullName produces fullName error', () => {
  /**
   * A fullName consisting entirely of whitespace characters must produce
   * a `fullName` validation error.
   *
   * **Validates: Requirements 4.8, 10.5**
   */
  it('whitespace-only fullName always produces a fullName error', () => {
    fc.assert(
      fc.property(
        whitespaceOnlyArbitrary,
        validGenderArbitrary,
        validRoleArbitrary,
        (fullName, gender, role) => {
          const values: FormValues = {
            fullName,
            gender,
            role,
            birthDate: '',
            bio: '',
          };
          const errors = validateForm(values);
          expect(errors.fullName).toBeDefined();
          expect(errors.fullName).toBe('Nama lengkap wajib diisi');
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Valid birthDate format does not produce birthDate error
// ---------------------------------------------------------------------------

describe('valid birthDate format YYYY-MM-DD does not produce birthDate error', () => {
  /**
   * A birthDate matching the pattern `^\d{4}-\d{2}-\d{2}$` must NOT produce
   * a `birthDate` validation error.
   *
   * **Validates: Requirements 4.11**
   */
  it('valid YYYY-MM-DD birthDate never produces a birthDate error', () => {
    fc.assert(
      fc.property(
        validFullNameArbitrary,
        validGenderArbitrary,
        validRoleArbitrary,
        validBirthDateArbitrary,
        (fullName, gender, role, birthDate) => {
          const values: FormValues = { fullName, gender, role, birthDate, bio: '' };
          const errors = validateForm(values);
          expect(errors.birthDate).toBeUndefined();
        },
      ),
      { numRuns: 200 },
    );
  });

  it('empty birthDate (omitted) never produces a birthDate error', () => {
    fc.assert(
      fc.property(
        validFullNameArbitrary,
        validGenderArbitrary,
        validRoleArbitrary,
        (fullName, gender, role) => {
          const values: FormValues = { fullName, gender, role, birthDate: '', bio: '' };
          const errors = validateForm(values);
          expect(errors.birthDate).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Invalid birthDate format produces birthDate error
// ---------------------------------------------------------------------------

describe('invalid birthDate format produces birthDate error', () => {
  /**
   * A non-empty birthDate that does NOT match `^\d{4}-\d{2}-\d{2}$` must
   * produce a `birthDate` validation error.
   *
   * **Validates: Requirements 4.11**
   */
  it('invalid non-empty birthDate always produces a birthDate error', () => {
    fc.assert(
      fc.property(
        validFullNameArbitrary,
        validGenderArbitrary,
        validRoleArbitrary,
        invalidBirthDateArbitrary,
        (fullName, gender, role, birthDate) => {
          const values: FormValues = { fullName, gender, role, birthDate, bio: '' };
          const errors = validateForm(values);
          expect(errors.birthDate).toBeDefined();
          expect(errors.birthDate).toBe('Format tanggal: YYYY-MM-DD');
        },
      ),
      { numRuns: 200 },
    );
  });
});

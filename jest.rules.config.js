/**
 * Jest config for Firestore security-rules tests (Phase 2 — sharing).
 *
 * These run in Node against the Firestore emulator and are SEPARATE from the
 * app test suite (which excludes `__rules_tests__`). Run via:
 *
 *   npm run test:rules
 *
 * Requires:
 *   - Java (for the Firestore emulator)
 *   - `npm i -D @firebase/rules-unit-testing`
 *   - firebase-tools (`npx firebase emulators:exec` wraps the run)
 *
 * @type {import('jest').Config}
 */
const config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__rules_tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
};

module.exports = config;

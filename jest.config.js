/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase/.*))',
  ],
  moduleNameMapper: {
    // Stub out CSS imports — Jest cannot parse raw CSS files
    '\\.css$': '<rootDir>/__mocks__/fileMock.js',
    // Stub out asset files (images, fonts, etc.) that Jest cannot process
    '^@/assets/(.*)$': '<rootDir>/__mocks__/fileMock.js',
    // Redirect .mjs imports to their .js equivalents — Babel cannot transform .mjs files
    '^(.+)\\.mjs$': '$1.js',
    // Force Firebase packages to use their CJS node builds to avoid ESM issues in Jest
    '^@firebase/util$': '<rootDir>/node_modules/@firebase/util/dist/index.node.cjs.js',
    '^@firebase/app$': '<rootDir>/node_modules/@firebase/app/dist/index.cjs.js',
    '^firebase/app$': '<rootDir>/node_modules/firebase/app/dist/index.cjs.js',
  },
};

module.exports = config;

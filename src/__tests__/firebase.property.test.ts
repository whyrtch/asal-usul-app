// Feature: expo-firebase-boilerplate, Property 4: Firebase singleton initialization

/**
 * Property 4: Firebase singleton initialization
 * Validates: Requirements 6.2
 *
 * For any number of calls to the Firebase initialization module (1 or more),
 * the Firebase app should be initialized exactly once — getApps().length should
 * always equal 1 after any number of initialization calls.
 */

import * as fc from 'fast-check';

describe('Property 4: Firebase singleton initialization', () => {
  // Save and restore env vars around the suite
  const originalEnv = process.env;

  beforeEach(() => {
    // Provide dummy env vars so firebase.ts can build its config object
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('getApps().length is always 1 after N initialization calls (N >= 1)', async () => {
    await fc.assert(
      // Generator: integer between 1 and 10 representing number of import calls
      fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (callCount) => {
        // Reset module registry before each property run so we start fresh
        jest.resetModules();

        // Track how many times initializeApp is actually called
        let initializeAppCallCount = 0;

        // Simulate the apps list that Firebase maintains internally
        const simulatedApps: object[] = [];
        const mockApp = { name: '[DEFAULT]' };

        // Mock firebase/app
        jest.doMock('firebase/app', () => ({
          initializeApp: jest.fn((_config: object) => {
            initializeAppCallCount++;
            simulatedApps.push(mockApp);
            return mockApp;
          }),
          getApps: jest.fn(() => simulatedApps),
          getApp: jest.fn(() => mockApp),
        }));

        // Mock @react-native-async-storage/async-storage
        jest.doMock('@react-native-async-storage/async-storage', () => ({
          default: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
          },
        }));

        // Mock firebase/auth — initializeAuth must not throw
        jest.doMock('firebase/auth', () => ({
          initializeAuth: jest.fn(() => ({ app: mockApp })),
          getReactNativePersistence: jest.fn(() => 'mock-persistence'),
        }));

        // Simulate N calls to the initialization module by re-requiring it each time.
        // Because jest.resetModules() was called above, the first require will execute
        // the module body (which calls getApps() and conditionally calls initializeApp).
        // Subsequent requires within the same resetModules cycle return the cached export,
        // so we reset modules between each call to truly simulate N independent imports.
        for (let i = 0; i < callCount; i++) {
          if (i > 0) {
            // On subsequent calls: reset modules but keep the same mock state
            // so simulatedApps already has the app from the first call.
            jest.resetModules();

            // Re-apply mocks with the same simulatedApps reference (already has 1 entry)
            jest.doMock('firebase/app', () => ({
              initializeApp: jest.fn((_config: object) => {
                initializeAppCallCount++;
                simulatedApps.push(mockApp);
                return mockApp;
              }),
              getApps: jest.fn(() => simulatedApps),
              getApp: jest.fn(() => mockApp),
            }));

            jest.doMock('@react-native-async-storage/async-storage', () => ({
              default: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
              },
            }));

            jest.doMock('firebase/auth', () => ({
              initializeAuth: jest.fn(() => ({ app: mockApp })),
              getReactNativePersistence: jest.fn(() => 'mock-persistence'),
            }));
          }

          // Dynamically require the module — this executes the module body
          await require('../lib/firebase');
        }

        // The core property: regardless of how many times the module was loaded,
        // initializeApp should have been called exactly once (singleton pattern).
        // Therefore getApps().length === 1.
        expect(initializeAppCallCount).toBe(1);
        expect(simulatedApps.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for src/lib/firebase.ts
 * Requirements: 6.1, 6.2, 6.3
 */

// --- Mocks must be declared before any imports ---

const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

const mockInitializeAuth = jest.fn();
const mockGetReactNativePersistence = jest.fn();

jest.mock('firebase/auth', () => ({
  initializeAuth: (...args: unknown[]) => mockInitializeAuth(...args),
  getReactNativePersistence: (...args: unknown[]) =>
    mockGetReactNativePersistence(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

// ---------------------------------------------------------------------------

describe('src/lib/firebase.ts', () => {
  const ENV_VARS = {
    EXPO_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'test-project-id',
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
  };

  const MOCK_APP = { name: '[DEFAULT]' };
  const MOCK_AUTH = { currentUser: null, app: MOCK_APP };
  const MOCK_PERSISTENCE = { type: 'LOCAL' };

  beforeEach(() => {
    // Reset all mocks and module registry before each test
    jest.resetModules();
    jest.clearAllMocks();

    // Set env vars
    Object.entries(ENV_VARS).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Default mock implementations
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue(MOCK_APP);
    mockGetApp.mockReturnValue(MOCK_APP);
    mockGetReactNativePersistence.mockReturnValue(MOCK_PERSISTENCE);
    mockInitializeAuth.mockReturnValue(MOCK_AUTH);
  });

  afterEach(() => {
    // Clean up env vars
    Object.keys(ENV_VARS).forEach((key) => {
      delete process.env[key];
    });
  });

  // -------------------------------------------------------------------------
  // Test 1: Firebase diinisialisasi dengan 6 konfigurasi yang benar dari env vars
  // -------------------------------------------------------------------------
  describe('Requirement 6.1 — Firebase initialized with correct config from env vars', () => {
    it('calls initializeApp with all 6 env var values when no app exists yet', () => {
      mockGetApps.mockReturnValue([]); // no existing app

      // Re-require after resetModules so the module runs fresh
      require('../lib/firebase');

      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockInitializeApp).toHaveBeenCalledWith({
        apiKey: ENV_VARS.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: ENV_VARS.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: ENV_VARS.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: ENV_VARS.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: ENV_VARS.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: ENV_VARS.EXPO_PUBLIC_FIREBASE_APP_ID,
      });
    });

    it('passes exactly 6 config keys — no more, no less', () => {
      mockGetApps.mockReturnValue([]);

      require('../lib/firebase');

      const configArg = mockInitializeApp.mock.calls[0][0] as Record<
        string,
        string
      >;
      expect(Object.keys(configArg)).toHaveLength(6);
      expect(Object.keys(configArg)).toEqual(
        expect.arrayContaining([
          'apiKey',
          'authDomain',
          'projectId',
          'storageBucket',
          'messagingSenderId',
          'appId',
        ])
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Panggilan kedua mengembalikan instance yang sama (singleton)
  // Requirement 6.2
  // -------------------------------------------------------------------------
  describe('Requirement 6.2 — Singleton: second call reuses existing app', () => {
    it('does NOT call initializeApp when an app already exists', () => {
      // Simulate an already-initialized app
      mockGetApps.mockReturnValue([MOCK_APP]);

      require('../lib/firebase');

      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(mockGetApp).toHaveBeenCalledTimes(1);
    });

    it('calls getApp() to retrieve the existing instance when apps list is non-empty', () => {
      mockGetApps.mockReturnValue([MOCK_APP]);

      const { auth } = require('../lib/firebase') as { auth: typeof MOCK_AUTH };

      expect(mockGetApp).toHaveBeenCalledTimes(1);
      // auth should still be initialized (initializeAuth called with the existing app)
      expect(mockInitializeAuth).toHaveBeenCalledTimes(1);
      expect(auth).toBe(MOCK_AUTH);
    });

    it('calls initializeApp exactly once when no app exists', () => {
      mockGetApps.mockReturnValue([]);

      require('../lib/firebase');

      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockGetApp).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: `auth` instance yang diekspor valid dan menggunakan AsyncStorage persistence
  // Requirement 6.3
  // -------------------------------------------------------------------------
  describe('Requirement 6.3 — Exported auth instance uses AsyncStorage persistence', () => {
    it('exports a valid auth instance returned by initializeAuth', () => {
      mockGetApps.mockReturnValue([]);

      const { auth } = require('../lib/firebase') as { auth: typeof MOCK_AUTH };

      expect(auth).toBe(MOCK_AUTH);
    });

    it('calls initializeAuth with the Firebase app instance', () => {
      mockGetApps.mockReturnValue([]);

      require('../lib/firebase');

      expect(mockInitializeAuth).toHaveBeenCalledTimes(1);
      const [appArg] = mockInitializeAuth.mock.calls[0] as [unknown];
      expect(appArg).toBe(MOCK_APP);
    });

    it('calls getReactNativePersistence with AsyncStorage', () => {
      mockGetApps.mockReturnValue([]);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage')
        .default as object;

      require('../lib/firebase');

      expect(mockGetReactNativePersistence).toHaveBeenCalledTimes(1);
      expect(mockGetReactNativePersistence).toHaveBeenCalledWith(AsyncStorage);
    });

    it('passes the persistence object from getReactNativePersistence to initializeAuth', () => {
      mockGetApps.mockReturnValue([]);

      require('../lib/firebase');

      expect(mockInitializeAuth).toHaveBeenCalledWith(
        MOCK_APP,
        expect.objectContaining({
          persistence: MOCK_PERSISTENCE,
        })
      );
    });
  });
});

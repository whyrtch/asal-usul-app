/**
 * Manual mock for firebase/auth
 * Jest will automatically use this when the module is imported in tests.
 */

// Mock auth instance returned by initializeAuth
export const mockAuth = {
  currentUser: null as object | null,
  app: { name: '[DEFAULT]' },
  name: 'auth',
  config: {},
  setPersistence: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
};

// Tracks registered onAuthStateChanged listeners for test control
let _authStateListeners: Array<(user: object | null) => void> = [];
let _unsubscribeMock = jest.fn();

export const initializeAuth = jest.fn(() => mockAuth);

export const getAuth = jest.fn(() => mockAuth);

export const onAuthStateChanged = jest.fn(
  (auth: object, callback: (user: object | null) => void) => {
    _authStateListeners.push(callback);
    return _unsubscribeMock;
  }
);

export const signInWithCredential = jest.fn().mockResolvedValue({
  user: {
    uid: 'mock-uid',
    email: 'mock@example.com',
    displayName: 'Mock User',
    photoURL: 'https://example.com/photo.jpg',
  },
  operationType: 'signIn',
});

export const signOut = jest.fn().mockResolvedValue(undefined);

export const GoogleAuthProvider = {
  credential: jest.fn((idToken: string, accessToken?: string) => ({
    providerId: 'google.com',
    signInMethod: 'google.com',
    idToken,
    accessToken,
  })),
  PROVIDER_ID: 'google.com',
};

export const getReactNativePersistence = jest.fn((storage: object) => ({
  type: 'LOCAL',
  storage,
}));

/**
 * Helper to simulate an auth state change in tests.
 * Call this to trigger all registered onAuthStateChanged listeners.
 */
export const _simulateAuthStateChange = (user: object | null) => {
  _authStateListeners.forEach((listener) => listener(user));
};

/**
 * Helper to get the mock unsubscribe function for assertion.
 */
export const _getUnsubscribeMock = () => _unsubscribeMock;

/**
 * Helper to reset all auth mocks between tests.
 * Call this in beforeEach/afterEach to ensure test isolation.
 */
export const _resetAuthMocks = () => {
  _authStateListeners = [];
  _unsubscribeMock = jest.fn();
  mockAuth.currentUser = null;
  initializeAuth.mockClear();
  getAuth.mockClear();
  onAuthStateChanged.mockClear();
  onAuthStateChanged.mockImplementation(
    (auth: object, callback: (user: object | null) => void) => {
      _authStateListeners.push(callback);
      return _unsubscribeMock;
    }
  );
  signInWithCredential.mockClear();
  signOut.mockClear();
  GoogleAuthProvider.credential.mockClear();
  getReactNativePersistence.mockClear();
};

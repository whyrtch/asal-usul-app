/**
 * Manual mock for firebase/app
 * Jest will automatically use this when the module is imported in tests.
 */

// Internal registry to simulate Firebase app singleton
const _apps: object[] = [];

const mockApp = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
};

export const initializeApp = jest.fn((config?: object) => {
  _apps.push(mockApp);
  return mockApp;
});

export const getApps = jest.fn(() => [..._apps]);

export const getApp = jest.fn((name?: string) => {
  if (_apps.length === 0) {
    throw new Error('No Firebase App has been created - call initializeApp() first');
  }
  return mockApp;
});

export const deleteApp = jest.fn(async () => {
  _apps.length = 0;
});

/**
 * Helper to reset the mock app registry between tests.
 * Call this in beforeEach/afterEach to ensure test isolation.
 */
export const _resetApps = () => {
  _apps.length = 0;
  initializeApp.mockClear();
  getApps.mockClear();
  getApp.mockClear();
};

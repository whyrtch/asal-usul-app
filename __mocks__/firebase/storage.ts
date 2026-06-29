/**
 * Manual mock for firebase/storage
 * Jest will automatically use this when the module is imported in tests.
 *
 * The real `getStorage` requires a fully-initialized Firebase app with a
 * registered storage provider, which the mocked `firebase/app` does not have.
 * This stub keeps `src/services/firebase/config.ts` importable in tests.
 */

const mockStorage = { _type: 'mockStorage' };

export const getStorage = jest.fn(() => mockStorage);

export const ref = jest.fn((_storage: unknown, path?: string) => ({
  _type: 'storageRef',
  fullPath: path ?? '',
}));

export const uploadBytes = jest.fn(async () => ({
  metadata: { fullPath: 'mock/path' },
}));

export const getDownloadURL = jest.fn(
  async () => 'https://example.com/mock-download-url.jpg',
);

export const deleteObject = jest.fn(async () => undefined);

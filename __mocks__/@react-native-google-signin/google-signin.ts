/**
 * Manual mock for @react-native-google-signin/google-signin
 * Jest will automatically use this when the module is imported in tests.
 */

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

export const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn().mockResolvedValue({
    type: 'success',
    data: {
      idToken: 'mock-id-token',
      user: {
        id: 'mock-user-id',
        name: 'Mock User',
        email: 'mock@example.com',
        photo: 'https://example.com/photo.jpg',
        familyName: 'User',
        givenName: 'Mock',
      },
    },
  }),
  signOut: jest.fn().mockResolvedValue(null),
  revokeAccess: jest.fn().mockResolvedValue(null),
  isSignedIn: jest.fn().mockResolvedValue(false),
  getCurrentUser: jest.fn().mockReturnValue(null),
};

export const GoogleSigninButton = {
  Size: {
    Standard: 0,
    Wide: 1,
    Icon: 2,
  },
  Color: {
    Auto: 0,
    Light: 1,
    Dark: 2,
  },
};

export const isErrorWithCode = jest.fn((error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  );
});

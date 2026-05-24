/**
 * Manual mock for expo-splash-screen
 * Jest will automatically use this when the module is imported in tests.
 */

export const preventAutoHideAsync = jest.fn().mockResolvedValue(true);

export const hideAsync = jest.fn().mockResolvedValue(true);

export const setOptions = jest.fn();

export default {
  preventAutoHideAsync,
  hideAsync,
  setOptions,
};

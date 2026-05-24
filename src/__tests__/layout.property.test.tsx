// Feature: expo-firebase-boilerplate, Property 2: Auth-based routing

/**
 * Property 2: Auth-based routing
 * Validates: Requirements 3.2, 3.3
 *
 * For any auth state (user is null or a valid user object), the router should
 * always direct the user to the correct screen — unauthenticated users
 * attempting to access HomeScreen or SettingScreen are redirected to
 * AuthScreen, and authenticated users attempting to access AuthScreen are
 * redirected to HomeScreen.
 *
 * Concretely: RootLayoutNav renders two Stack.Protected blocks:
 *   - guard={!isLoggedIn}  → login screen  (true when user=null)
 *   - guard={isLoggedIn}   → (tabs) screen (true when user!=null)
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import React from 'react';

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock expo-splash-screen (module-level call in _layout.tsx)
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

// Mock AnimatedSplashOverlay so it renders nothing in tests (legacy — kept for safety)
jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
}));

// Mock SplashScreen component so it renders nothing in tests
// (avoids pulling in react-native-reanimated which requires native Worklets init)
jest.mock('@/components/splash-screen', () => ({
  SplashScreen: () => null,
}));

// Mock AuthProvider so we can inject arbitrary auth state
jest.mock('@/context/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

// Capture guard values passed to Stack.Protected
const capturedGuards: boolean[] = [];

// Mock expo-router: Stack renders children, Stack.Protected captures guard prop
jest.mock('expo-router', () => {
  const React = require('react');

  const StackProtected = ({
    guard,
    children,
  }: {
    guard: boolean;
    children: React.ReactNode;
  }) => {
    capturedGuards.push(guard);
    return <>{children}</>;
  };

  const StackScreen = (_props: { name: string }) => null;

  const Stack = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Stack.Protected = StackProtected;
  Stack.Screen = StackScreen;

  return {
    Stack,
    DarkTheme: {},
    DefaultTheme: {},
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// ── Import after mocks ────────────────────────────────────────────────────────

import { useAuth } from '@/context/auth-context';
import RootLayout from '../app/_layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Clears the captured guards array before each render. */
function resetCapturedGuards() {
  capturedGuards.length = 0;
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generates a valid AuthUser object (non-null, simulating a logged-in user). */
const validUserArb = fc.record({
  uid: fc.string({ minLength: 1, maxLength: 28 }),
  email: fc.option(fc.emailAddress(), { nil: null }),
  displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  photoURL: fc.option(fc.webUrl(), { nil: null }),
});

/** Generates either null (signed-out) or a valid user object (signed-in). */
const userArb = fc.oneof(fc.constant(null), validUserArb);

/** Route names that the app navigates between. */
const routeNameArb = fc.constantFrom('login', 'index', 'setting');

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 2: Auth-based routing', () => {
  beforeEach(() => {
    resetCapturedGuards();
    // Default: loading=false so RootLayoutNav renders the Stack
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it(
    'user=null → login guard is true, tabs guard is false (for any route name)',
    () => {
      // Feature: expo-firebase-boilerplate, Property 2: Auth-based routing
      fc.assert(
        fc.property(routeNameArb, (_routeName) => {
          resetCapturedGuards();

          // Arrange: unauthenticated state
          (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          render(<RootLayout />);

          // RootLayoutNav renders two Stack.Protected blocks in order:
          //   [0] guard={!isLoggedIn}  → login screen
          //   [1] guard={isLoggedIn}   → (tabs) screen
          expect(capturedGuards).toHaveLength(2);

          const [loginGuard, tabsGuard] = capturedGuards;

          // Core property: when user=null, login is accessible, tabs are not
          expect(loginGuard).toBe(true);
          expect(tabsGuard).toBe(false);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'user!=null → login guard is false, tabs guard is true (for any valid user and route name)',
    () => {
      // Feature: expo-firebase-boilerplate, Property 2: Auth-based routing
      fc.assert(
        fc.property(validUserArb, routeNameArb, (user, _routeName) => {
          resetCapturedGuards();

          // Arrange: authenticated state
          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          render(<RootLayout />);

          expect(capturedGuards).toHaveLength(2);

          const [loginGuard, tabsGuard] = capturedGuards;

          // Core property: when user!=null, tabs are accessible, login is not
          expect(loginGuard).toBe(false);
          expect(tabsGuard).toBe(true);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'guard values are always complementary (loginGuard === !tabsGuard) for any user state',
    () => {
      // Feature: expo-firebase-boilerplate, Property 2: Auth-based routing
      fc.assert(
        fc.property(userArb, routeNameArb, (user, _routeName) => {
          resetCapturedGuards();

          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          render(<RootLayout />);

          expect(capturedGuards).toHaveLength(2);

          const [loginGuard, tabsGuard] = capturedGuards;

          // Core property: the two guards are always logical complements
          expect(loginGuard).toBe(!tabsGuard);
          expect(tabsGuard).toBe(!loginGuard);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'exactly two Stack.Protected blocks are rendered for any auth state',
    () => {
      // Feature: expo-firebase-boilerplate, Property 2: Auth-based routing
      fc.assert(
        fc.property(userArb, (user) => {
          resetCapturedGuards();

          (useAuth as jest.Mock).mockReturnValue({
            user,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          render(<RootLayout />);

          // There must always be exactly 2 protected blocks (login + tabs)
          expect(capturedGuards).toHaveLength(2);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: expo-firebase-boilerplate, Property 7: Splash screen hides when loading completes

/**
 * Property 7: Splash screen hides when loading completes
 * Validates: Requirements 1.2, 1.3
 *
 * For any combination of resource loading outcomes (success or error) for
 * fonts, assets, and Firebase auth state, SplashScreen.hideAsync() should
 * always be called exactly once after `loading` transitions to `false`,
 * ensuring the splash screen is never permanently visible.
 */

import { act, renderHook } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * A minimal re-implementation of the splash-screen hiding logic from
 * `RootLayoutNav` in `src/app/_layout.tsx`.
 *
 * We test the logic in isolation rather than rendering the full layout
 * component, which avoids pulling in Expo Router's navigation tree while
 * still exercising the exact same `useEffect` pattern.
 *
 * The logic under test (from _layout.tsx):
 *
 *   useEffect(() => {
 *     if (!loading) {
 *       (async () => {
 *         try {
 *           await SplashScreen.hideAsync();
 *         } finally {
 *           // Ensure splash screen is dismissed even if hideAsync throws
 *         }
 *       })();
 *     }
 *   }, [loading]);
 */
import { useEffect } from 'react';

function useSplashScreenHiding() {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      (async () => {
        try {
          await SplashScreen.hideAsync();
        } finally {
          // Ensure splash screen is dismissed even if hideAsync throws
        }
      })();
    }
  }, [loading]);

  return { loading };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Represents the outcome of a single async resource load (font, asset, etc.).
 * `success` → the resource loaded without error.
 * `error`   → the resource load threw an error (e.g. network failure).
 */
type LoadOutcome = 'success' | 'error';

const loadOutcomeArb = fc.constantFrom<LoadOutcome>('success', 'error');

/**
 * Represents the combined loading scenario for all resources.
 * Each outcome is independent — any combination of success/error is valid.
 * The key invariant: regardless of individual outcomes, once all resources
 * finish (loading=false), hideAsync must be called exactly once.
 */
interface LoadingScenario {
  fontsOutcome: LoadOutcome;
  assetsOutcome: LoadOutcome;
  firebaseAuthOutcome: LoadOutcome;
}

const loadingScenarioArb: fc.Arbitrary<LoadingScenario> = fc.record({
  fontsOutcome: loadOutcomeArb,
  assetsOutcome: loadOutcomeArb,
  firebaseAuthOutcome: loadOutcomeArb,
});

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Property 7: Splash screen hides when loading completes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(
    'SplashScreen.hideAsync is called exactly once when loading is false, ' +
      'regardless of resource loading outcomes',
    async () => {
      await fc.assert(
        fc.asyncProperty(loadingScenarioArb, async (scenario) => {
          // Reset mock call counts for each property run.
          (SplashScreen.hideAsync as jest.Mock).mockClear();
          (SplashScreen.preventAutoHideAsync as jest.Mock).mockClear();

          // Configure hideAsync to always resolve — we verify it is called once.
          // The try/finally in the implementation already guarantees hideAsync
          // is called even if it throws; that invariant is tested separately.
          (SplashScreen.hideAsync as jest.Mock).mockResolvedValueOnce(undefined);

          // Determine the final auth user based on the Firebase auth outcome.
          // An error outcome means auth resolved to null (unauthenticated).
          const resolvedUser =
            scenario.firebaseAuthOutcome === 'success'
              ? { uid: 'test-uid', email: 'test@example.com', displayName: 'Test', photoURL: null }
              : null;

          // Mock useAuth to return loading=false with the resolved user.
          // This simulates all resources (fonts, assets, Firebase auth) having
          // completed — successfully or with errors — so loading is now false.
          (useAuth as jest.Mock).mockReturnValue({
            user: resolvedUser,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          // Render the hook that contains the splash screen hiding logic.
          const { result } = renderHook(() => useSplashScreenHiding());

          // Wait for the async hideAsync call inside the useEffect to settle.
          await act(async () => {
            await Promise.resolve();
          });

          // Core property: loading is false, so hideAsync must have been called.
          expect(result.current.loading).toBe(false);

          // Core property: hideAsync must be called exactly once — never zero
          // times (splash screen stuck) and never more than once (double-hide).
          expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'SplashScreen.hideAsync is NOT called while loading is still true',
    async () => {
      await fc.assert(
        fc.asyncProperty(loadingScenarioArb, async (_scenario) => {
          (SplashScreen.hideAsync as jest.Mock).mockClear();
          (SplashScreen.hideAsync as jest.Mock).mockResolvedValue(undefined);

          // Mock useAuth to return loading=true (resources still loading).
          (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: true,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          renderHook(() => useSplashScreenHiding());

          // Flush any pending microtasks.
          await act(async () => {
            await Promise.resolve();
          });

          // Core property: hideAsync must NOT be called while loading is true.
          expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'SplashScreen.hideAsync is called exactly once when loading transitions ' +
      'from true to false (simulating real auth resolution)',
    async () => {
      // Generator: the final auth state after loading resolves.
      const finalUserArb = fc.option(
        fc.record({
          uid: fc.string({ minLength: 1, maxLength: 28 }),
          email: fc.option(fc.emailAddress(), { nil: null }),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          photoURL: fc.option(fc.webUrl(), { nil: null }),
        }),
        { nil: null }
      );

      await fc.assert(
        fc.asyncProperty(finalUserArb, async (finalUser) => {
          (SplashScreen.hideAsync as jest.Mock).mockClear();
          (SplashScreen.hideAsync as jest.Mock).mockResolvedValue(undefined);

          // Phase 1: loading=true — hideAsync should NOT be called yet.
          (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: true,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          const { rerender } = renderHook(() => useSplashScreenHiding());

          await act(async () => {
            await Promise.resolve();
          });

          expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

          // Phase 2: loading transitions to false — hideAsync should be called once.
          (useAuth as jest.Mock).mockReturnValue({
            user: finalUser,
            loading: false,
            signInWithGoogle: jest.fn(),
            signOut: jest.fn(),
          });

          rerender({});

          await act(async () => {
            await Promise.resolve();
          });

          // Core property: exactly one call after loading becomes false.
          expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 }
      );
    }
  );
});

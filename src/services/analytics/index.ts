/**
 * Analytics & error-reporting facade.
 *
 * The rest of the app talks ONLY to this module (`logEvent`, `recordError`,
 * `setAnalyticsUserId`). Under the hood a swappable `AnalyticsProvider` does
 * the actual work, so we can:
 *   - ship today with a safe no-op default (works on every platform, no native
 *     dependency, keeps tests clean),
 *   - flip to Firebase Analytics + Crashlytics later by calling
 *     `setAnalyticsProvider(...)` once at app startup — no call-site changes.
 *
 * Every facade call is wrapped in try/catch: observability must NEVER crash the
 * app or change business logic.
 *
 * Activation guide: docs/observability-setup.md
 *
 * Phase 1 — 4.4 Observability.
 *
 * @module src/services/analytics
 */

import type { AnalyticsEventName, AnalyticsParams } from './events';

export { AnalyticsEvents } from './events';
export type { AnalyticsEventName, AnalyticsParams } from './events';

// ---------------------------------------------------------------------------
// Provider contract
// ---------------------------------------------------------------------------

/**
 * A pluggable analytics/crash-reporting backend. Implement this to forward to
 * Firebase Analytics + Crashlytics, Sentry, etc.
 */
export interface AnalyticsProvider {
  logEvent(name: string, params?: AnalyticsParams): void;
  setUserId(uid: string | null): void;
  recordError(error: unknown, context?: AnalyticsParams): void;
  setEnabled(enabled: boolean): void;
}

// ---------------------------------------------------------------------------
// Built-in providers
// ---------------------------------------------------------------------------

/** Does nothing. The safe default until a real provider is wired in. */
export const NoopAnalyticsProvider: AnalyticsProvider = {
  logEvent: () => {},
  setUserId: () => {},
  recordError: () => {},
  setEnabled: () => {},
};

/**
 * Logs to the console — handy during development to see the funnel without a
 * backend. Opt-in via `setAnalyticsProvider(ConsoleAnalyticsProvider)`.
 */
export const ConsoleAnalyticsProvider: AnalyticsProvider = {
  logEvent: (name, params) => {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, params ?? {});
  },
  setUserId: (uid) => {
    // eslint-disable-next-line no-console
    console.log('[analytics] setUserId', uid);
  },
  recordError: (error, context) => {
    // eslint-disable-next-line no-console
    console.warn('[analytics] recordError', error, context ?? {});
  },
  setEnabled: (enabled) => {
    // eslint-disable-next-line no-console
    console.log('[analytics] setEnabled', enabled);
  },
};

// ---------------------------------------------------------------------------
// Facade
// ---------------------------------------------------------------------------

let activeProvider: AnalyticsProvider = NoopAnalyticsProvider;

/**
 * Swaps the active provider. Call once at app startup (e.g. in the root layout)
 * before any events are logged.
 */
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  activeProvider = provider;
}

/** Returns the currently active provider (useful for tests/inspection). */
export function getAnalyticsProvider(): AnalyticsProvider {
  return activeProvider;
}

/** Logs a funnel event. Never throws. */
export function logEvent(
  name: AnalyticsEventName,
  params?: AnalyticsParams,
): void {
  try {
    activeProvider.logEvent(name, params);
  } catch {
    // Observability must never break the app.
  }
}

/** Associates subsequent events with a user id (or clears it with null). */
export function setAnalyticsUserId(uid: string | null): void {
  try {
    activeProvider.setUserId(uid);
  } catch {
    // ignore
  }
}

/** Reports a caught error to the crash/error backend. Never throws. */
export function recordError(error: unknown, context?: AnalyticsParams): void {
  try {
    activeProvider.recordError(error, context);
  } catch {
    // ignore
  }
}

/** Enables/disables collection (e.g. behind a user consent toggle). */
export function setAnalyticsEnabled(enabled: boolean): void {
  try {
    activeProvider.setEnabled(enabled);
  } catch {
    // ignore
  }
}

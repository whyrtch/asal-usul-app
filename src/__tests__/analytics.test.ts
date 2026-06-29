/**
 * Tests for the analytics facade (Phase 1, 4.4).
 *
 * Verifies: provider delegation, swapping providers, user id forwarding,
 * error reporting, and that the facade never throws even with a faulty provider.
 */

import {
    AnalyticsEvents,
    getAnalyticsProvider,
    logEvent,
    NoopAnalyticsProvider,
    recordError,
    setAnalyticsEnabled,
    setAnalyticsProvider,
    setAnalyticsUserId,
    type AnalyticsProvider,
} from '../services/analytics';

function makeSpyProvider(): { provider: AnalyticsProvider; calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {
    logEvent: [],
    setUserId: [],
    recordError: [],
    setEnabled: [],
  };
  const provider: AnalyticsProvider = {
    logEvent: (...args) => calls.logEvent.push(args),
    setUserId: (...args) => calls.setUserId.push(args),
    recordError: (...args) => calls.recordError.push(args),
    setEnabled: (...args) => calls.setEnabled.push(args),
  };
  return { provider, calls };
}

afterEach(() => {
  // Restore the safe default between tests.
  setAnalyticsProvider(NoopAnalyticsProvider);
});

describe('analytics facade', () => {
  it('defaults to a no-op provider that does not throw', () => {
    expect(getAnalyticsProvider()).toBe(NoopAnalyticsProvider);
    expect(() => logEvent(AnalyticsEvents.TREE_CREATED)).not.toThrow();
    expect(() => recordError(new Error('x'))).not.toThrow();
    expect(() => setAnalyticsUserId('uid')).not.toThrow();
  });

  it('delegates logEvent to the active provider with params', () => {
    const { provider, calls } = makeSpyProvider();
    setAnalyticsProvider(provider);

    logEvent(AnalyticsEvents.MEMBER_ADDED, { hasPhoto: true });

    expect(calls.logEvent).toHaveLength(1);
    expect(calls.logEvent[0][0]).toBe('member_added');
    expect(calls.logEvent[0][1]).toEqual({ hasPhoto: true });
  });

  it('forwards setUserId and recordError', () => {
    const { provider, calls } = makeSpyProvider();
    setAnalyticsProvider(provider);

    setAnalyticsUserId('uid-123');
    const err = new Error('boom');
    recordError(err, { op: 'createTree' });

    expect(calls.setUserId[0][0]).toBe('uid-123');
    expect(calls.recordError[0][0]).toBe(err);
    expect(calls.recordError[0][1]).toEqual({ op: 'createTree' });
  });

  it('forwards setEnabled', () => {
    const { provider, calls } = makeSpyProvider();
    setAnalyticsProvider(provider);
    setAnalyticsEnabled(false);
    expect(calls.setEnabled[0][0]).toBe(false);
  });

  it('never throws even if the provider throws', () => {
    const faulty: AnalyticsProvider = {
      logEvent: () => {
        throw new Error('provider failure');
      },
      setUserId: () => {
        throw new Error('provider failure');
      },
      recordError: () => {
        throw new Error('provider failure');
      },
      setEnabled: () => {
        throw new Error('provider failure');
      },
    };
    setAnalyticsProvider(faulty);

    expect(() => logEvent(AnalyticsEvents.SIGN_IN)).not.toThrow();
    expect(() => recordError(new Error('x'))).not.toThrow();
    expect(() => setAnalyticsUserId('u')).not.toThrow();
    expect(() => setAnalyticsEnabled(true)).not.toThrow();
  });
});

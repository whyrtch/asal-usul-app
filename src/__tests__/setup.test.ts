// Smoke test to verify Jest + jest-expo setup is working correctly
import * as fc from 'fast-check';

describe('Testing infrastructure', () => {
  it('jest is configured and running', () => {
    expect(true).toBe(true);
  });

  it('fast-check is importable and functional', () => {
    expect(typeof fc.assert).toBe('function');
    expect(typeof fc.property).toBe('function');
    expect(typeof fc.string).toBe('function');
  });

  it('fast-check can run a basic property', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });
});

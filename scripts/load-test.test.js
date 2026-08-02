import { describe, expect, it } from 'vitest';
import { percentile } from './load-test.mjs';

describe('load-test helpers', () => {
  it('calculates stable nearest-rank percentiles', () => {
    expect(percentile([50, 10, 40, 20, 30], 50)).toBe(30);
    expect(percentile([50, 10, 40, 20, 30], 95)).toBe(50);
    expect(percentile([], 99)).toBe(0);
  });
});

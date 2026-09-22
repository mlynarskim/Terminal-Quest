import { describe, it, expect } from 'vitest';
import { createStorm, endStorm, stormSurvived, stormSummary } from './storm';

describe('storm', () => {
  it('createStorm initializes with active true', () => {
    const s = createStorm();
    expect(s.active).toBe(true);
    expect(s.startedAt).toBeTypeOf('number');
  });

  it('stormSurvived returns true after duration', () => {
    const s = { ...createStorm(), startedAt: Date.now() - 50_000 };
    expect(stormSurvived(s, Date.now())).toBe(true);
  });

  it('stormSurvived returns false before duration', () => {
    const s = { ...createStorm(), startedAt: Date.now() - 10_000 };
    expect(stormSurvived(s, Date.now())).toBe(false);
  });

  it('endStorm sets active false', () => {
    const s = createStorm();
    const ended = endStorm(s, Date.now());
    expect(ended.active).toBe(false);
    expect(ended.endedAt).toBeTypeOf('number');
  });

  it('stormSummary returns null if no startedAt', () => {
    expect(stormSummary({})).toBeNull();
  });

  it('stormSummary returns elapsed and glitchCount', () => {
    const s = { ...createStorm(), glitchCount: 5, startedAt: Date.now() - 10_000 };
    const sum = stormSummary(s);
    expect(sum.elapsed).toBeGreaterThanOrEqual(9);
    expect(sum.glitchCount).toBe(5);
  });
});

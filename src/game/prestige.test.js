import { describe, it, expect } from 'vitest';
import { prestigeTitle, prestigeMultiplier, prestigeBitsBonus, canPrestige } from './prestige';

describe('prestige', () => {
  it('prestigeTitle returns correct titles', () => {
    expect(prestigeTitle(0)).toBe('INITIAL_BOOT');
    expect(prestigeTitle(1)).toBe('RECOMPILED');
    expect(prestigeTitle(5)).toBe('PHANTOM_NODE');
  });

  it('prestigeMultiplier scales with level', () => {
    expect(prestigeMultiplier(0)).toBe(1);
    expect(prestigeMultiplier(1)).toBeCloseTo(1.15);
    expect(prestigeMultiplier(3)).toBeCloseTo(1.45);
  });

  it('prestigeBitsBonus increases with level', () => {
    expect(prestigeBitsBonus(0)).toBe(0);
    expect(prestigeBitsBonus(1)).toBe(200);
    expect(prestigeBitsBonus(5)).toBe(5000);
  });

  it('canPrestige requires stage 2 and 2000 bits', () => {
    expect(canPrestige({ story: { stage: 2 }, stats: { bitsEarned: 2000 } })).toBe(true);
    expect(canPrestige({ story: { stage: 1 }, stats: { bitsEarned: 5000 } })).toBe(false);
    expect(canPrestige({ story: { stage: 2 }, stats: { bitsEarned: 1000 } })).toBe(false);
  });
});

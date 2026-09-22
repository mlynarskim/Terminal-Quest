import { describe, it, expect } from 'vitest';
import { computeRank } from '../game/ranks';

describe('computeRank', () => {
  it('starts at GRID_TENDER', () => {
    const r = computeRank({ bitsEarned: 0 });
    expect(r.current).toBe('GRID_TENDER');
    expect(r.next).toBeTruthy();
  });

  it('advances at thresholds and stops at max with null next', () => {
    const r = computeRank({ bitsEarned: 9_000 });
    expect(r.current).toBe('GHOST_OF_THE_GRID');
    expect(r.next).toBeNull();
    expect(r.progress).toBe(100);
  });

  it('reports progress toward the next rank', () => {
    const r = computeRank({ bitsEarned: 100 }); // 0 → 200
    expect(r.current).toBe('GRID_TENDER');
    expect(r.next).toBe('SECTOR_HOPPER');
    expect(r.progress).toBe(50);
  });

  it('tolerates missing stats', () => {
    expect(computeRank(undefined).current).toBe('GRID_TENDER');
    expect(computeRank({}).current).toBe('GRID_TENDER');
  });
});

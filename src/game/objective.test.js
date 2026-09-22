import { describe, it, expect } from 'vitest';
import { getObjective } from './objective';

const base = {
  story: { stage: 0, repairedSectors: 0 },
  cat: { unlocked: false, trust: 0, fragmentsFound: 0 },
  inventory: [],
  prestige: 0,
};

describe('objective', () => {
  it('tells a fresh player to find the cat', () => {
    const o = getObjective(base);
    expect(o.title).toBe('FIND THE CAT');
    expect(o.detail).toContain('/users/explorer');
  });

  it('pushes befriending once the cat is found', () => {
    const o = getObjective({ ...base, cat: { unlocked: true, trust: 20, fragmentsFound: 0 } });
    expect(o.title).toBe('BEFRIEND THE CAT');
    expect(o.progress).toEqual({ current: 20, total: 80 });
  });

  it('pushes fragments at high trust', () => {
    const o = getObjective({ ...base, cat: { unlocked: true, trust: 90, fragmentsFound: 1 } });
    expect(o.title).toBe('COLLECT THE FRAGMENTS');
    expect(o.progress).toEqual({ current: 1, total: 3 });
  });

  it('pushes sector repair at stage 1', () => {
    const o = getObjective({ ...base, story: { stage: 1, repairedSectors: 2 } });
    expect(o.title).toBe('REPAIR THE SECTORS');
    expect(o.progress).toEqual({ current: 2, total: 4 });
  });

  it('pushes restoration with or without the key', () => {
    const noKey = getObjective({ ...base, story: { stage: 1, repairedSectors: 4 } });
    expect(noKey.title).toBe('RESTORE THE GRID');
    expect(noKey.detail).toContain('buy key');
    const keyed = getObjective({
      ...base,
      story: { stage: 1, repairedSectors: 4 },
      inventory: ['key'],
    });
    expect(keyed.detail).toContain('choose your ending');
  });

  it('points past restoration to prestige, then legend', () => {
    expect(getObjective({ ...base, story: { stage: 2 } }).title).toBe('GRID RESTORED');
    expect(getObjective({ ...base, story: { stage: 2 }, prestige: 2 }).title).toBe('GRID LEGEND');
  });
});

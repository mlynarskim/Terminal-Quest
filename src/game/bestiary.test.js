import { describe, it, expect } from 'vitest';
import {
  initBestiary,
  discover,
  discoveryPercent,
  totalEntries,
  discoveredCount,
  deriveBestiary,
  mergedBestiary,
  BESTIARY_CATEGORIES,
} from './bestiary';

describe('bestiary', () => {
  it('initBestiary creates all categories with false', () => {
    const b = initBestiary();
    expect(Object.keys(b).length).toBe(Object.keys(BESTIARY_CATEGORIES).length);
    for (const cat of Object.values(b)) {
      for (const val of Object.values(cat)) {
        expect(val).toBe(false);
      }
    }
  });

  it('discover marks an entry as found', () => {
    let b = initBestiary();
    b = discover(b, 'files', 'readme');
    expect(b.files.readme).toBe(true);
    expect(b.files.encrypted).toBe(false);
  });

  it('discover is idempotent', () => {
    let b = initBestiary();
    b = discover(b, 'files', 'readme');
    const snapshot = JSON.stringify(b);
    b = discover(b, 'files', 'readme');
    expect(JSON.stringify(b)).toBe(snapshot);
  });

  it('discoveryPercent calculates correctly', () => {
    let b = initBestiary();
    const total = totalEntries(b);
    b = discover(b, 'files', 'readme');
    expect(discoveryPercent(b)).toBe(Math.round((1 / total) * 100));
  });

  it('discoveredCount counts only true entries', () => {
    let b = initBestiary();
    b = discover(b, 'files', 'readme');
    b = discover(b, 'creatures', 'cat');
    expect(discoveredCount(b)).toBe(2);
  });

  it('deriveBestiary reflects live progress', () => {
    const d = deriveBestiary({
      stats: { commandsRun: 60, dirsVisited: ['/home', '/logs'], bitsEarned: 10 },
      solvedPuzzles: ['binary'],
      unlockedFiles: ['/home/.hidden/secret.txt'],
      inventory: ['key'],
      cat: { unlocked: true, trust: 80 },
      processes: [{ pid: 1 }],
      storm: { glitchCount: 2 },
      story: { stage: 2 },
      dailyStats: { date: '2026-01-01' },
      achievements: ['X'],
      memos: { a: 'b' },
      macros: {},
      encrypted: {},
    });
    expect(d.files.readme).toBe(true);
    expect(d.files.binary).toBe(true);
    expect(d.files.hidden).toBe(true);
    expect(d.files.encrypted).toBe(true);
    expect(d.creatures.cat).toBe(true);
    expect(d.creatures.daemon).toBe(true);
    expect(d.systems.bits).toBe(true);
    expect(d.stories.coreCrystal).toBe(true);
    expect(d.stories.catOrigin).toBe(true);
  });

  it('mergedBestiary combines persisted and derived entries', () => {
    const state = {
      bestiary: { files: { readme: true } },
      stats: { commandsRun: 0, dirsVisited: [], bitsEarned: 0 },
      solvedPuzzles: [],
      unlockedFiles: [],
      inventory: [],
      cat: {},
      processes: [],
      storm: {},
      story: {},
      dailyStats: {},
      achievements: [],
      memos: {},
      macros: {},
      encrypted: {},
    };
    const m = mergedBestiary(state);
    expect(m.files.readme).toBe(true);
    expect(m.files.binary).toBe(false);
    expect(Object.keys(m).sort()).toEqual(Object.keys(BESTIARY_CATEGORIES).sort());
  });
});

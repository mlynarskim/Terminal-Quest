import { describe, it, expect } from 'vitest';
import {
  boardSource,
  buildBoard,
  computeScore,
  defaultHandle,
  formatBoard,
  rewardForRank,
  sanitizeName,
  scoreBreakdown,
} from './leaderboard';
import {
  LEADERBOARD_LOCAL_BOT_COUNT,
  LEADERBOARD_REWARD_TOP1,
  LEADERBOARD_REWARD_TOP10,
} from './constants';

const brokenDown = (breakdown, label) => breakdown.find((part) => part.label === label).points;

const stateWith = (overrides = {}) => ({
  bits: 100,
  achievements: [],
  inventory: [],
  stats: { bitsEarned: 0, commandsRun: 0, dirsVisited: [], killsCount: 0 },
  story: { stage: 0, repairedSectors: 0 },
  cat: { trust: 0, fragmentsFound: 0, unlocked: false },
  bestiary: {},
  journal: { entries: {} },
  glitch: { survived: [] },
  profile: { name: 'tester' },
  encrypted: {},
  memos: {},
  macros: {},
  processes: [],
  radio: { on: false },
  storm: {},
  dailyStats: { date: null },
  ...overrides,
});

describe('computeScore', () => {
  it('is zero for a brand new save', () => {
    expect(computeScore(stateWith())).toBe(0);
  });

  it('counts lifetime bits', () => {
    const state = stateWith({
      stats: { bitsEarned: 500, commandsRun: 0, dirsVisited: [], killsCount: 0 },
    });
    const bits = scoreBreakdown(state).find((part) => part.label === 'lifetime bits');
    expect(bits.points).toBe(500);
    expect(computeScore(state)).toBeGreaterThanOrEqual(500);
  });

  it('counts achievements, lore, sectors and glitch events', () => {
    const state = stateWith({
      achievements: ['A', 'B'],
      journal: { entries: { one: 1, two: 2 } },
      story: { stage: 1, repairedSectors: 2 },
      glitch: { survived: ['x', 'y', 'z'] },
    });
    const breakdown = scoreBreakdown(state);
    const total = breakdown.reduce((sum, part) => sum + part.points, 0);
    expect(computeScore(state)).toBe(total);
    expect(brokenDown(breakdown, 'achievements')).toBe(2 * 250);
    expect(brokenDown(breakdown, 'lore entries')).toBe(2 * 400);
    expect(brokenDown(breakdown, 'sectors repaired')).toBe(2 * 1500);
    expect(brokenDown(breakdown, 'glitches survived')).toBe(3 * 300);
  });

  it('never returns a negative score', () => {
    expect(computeScore(stateWith({ stats: { bitsEarned: -50 } }))).toBe(0);
  });
});

describe('handles', () => {
  it('generates an anonymous explorer handle', () => {
    expect(defaultHandle()).toMatch(/^explorer-[0-9A-F]{4}$/);
  });

  it('sanitizes player handles', () => {
    expect(sanitizeName('  Zero Cool  ')).toBe('Zero Cool');
    expect(sanitizeName('<script>alert(1)</script>')).toBe('scriptalert1script');
    expect(sanitizeName('a'.repeat(40))).toHaveLength(18);
    expect(sanitizeName('x')).toBeNull();
    expect(sanitizeName(42)).toBeNull();
  });
});

describe('buildBoard', () => {
  it('always contains rival agents and the player', () => {
    const board = buildBoard(stateWith());
    expect(board.entries.length).toBe(LEADERBOARD_LOCAL_BOT_COUNT + 1);
    expect(board.yourEntry.name).toBe('tester');
    expect(board.rank).toBeGreaterThan(0);
  });

  it('sorts by score and merges remote operators', () => {
    const board = buildBoard(
      stateWith({ stats: { bitsEarned: 15_000, commandsRun: 0, dirsVisited: [], killsCount: 0 } }),
      [{ name: 'INTERNET_PIONEER', score: 12_000 }]
    );
    expect(board.entries[0].name).toBe('tester');
    expect(board.entries[1].name).toBe('INTERNET_PIONEER');
    expect(board.rank).toBe(1);
  });

  it('deduplicates a remote entry that shares the player handle', () => {
    const board = buildBoard(stateWith(), [{ name: 'tester', score: 5 }]);
    expect(board.entries.filter((e) => e.name === 'tester')).toHaveLength(1);
  });

  it('keeps the player at the bottom of a brand new save', () => {
    const board = buildBoard(stateWith());
    expect(board.rank).toBe(board.total);
  });

  it('lets rival agents advance with wall-clock time', () => {
    const now = Date.now();
    const fresh = buildBoard(stateWith()).entries.find((e) => e.name === 'N0DE_HOPPER').score;
    const later = buildBoard(stateWith(), [], now + 6 * 3_600_000).entries.find(
      (e) => e.name === 'N0DE_HOPPER'
    ).score;
    expect(later).toBeGreaterThan(fresh);
  });

  it('clamps absurd remote scores', () => {
    const board = buildBoard(stateWith(), [{ name: 'CHEATER', score: 10_000_000 }]);
    expect(board.entries[0].score).toBeLessThanOrEqual(5_000_000);
  });
});

describe('rewards', () => {
  it('pays the top ten and the winner', () => {
    expect(rewardForRank(1)).toBe(LEADERBOARD_REWARD_TOP1);
    expect(rewardForRank(10)).toBe(LEADERBOARD_REWARD_TOP10);
    expect(rewardForRank(11)).toBe(0);
    expect(rewardForRank(0)).toBe(0);
  });
});

describe('formatBoard', () => {
  it('renders a table and marks the player', () => {
    const board = buildBoard(
      stateWith({ stats: { bitsEarned: 5_000, commandsRun: 0, dirsVisited: [], killsCount: 0 } })
    );
    const text = formatBoard(board, { limit: 5, source: 'remote' });
    expect(text).toContain('GLOBAL RELAY');
    expect(text).toContain('YOUR POSITION: #1');
    expect(text).toContain('<<');
  });

  it('nudges the player when they are outside the top ten', () => {
    const text = formatBoard(buildBoard(stateWith()), { limit: 3 });
    expect(text).toContain('top 10');
  });

  it('labels the data source', () => {
    expect(boardSource({ status: 'remote' })).toBe('remote');
    expect(boardSource({ status: 'local' })).toBe('local');
  });
});

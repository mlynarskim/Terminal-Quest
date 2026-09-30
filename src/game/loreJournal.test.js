import { describe, it, expect } from 'vitest';
import {
  LORE_CATEGORIES,
  LORE_ENTRIES,
  availableEntries,
  findEntry,
  formatIndex,
  isDiscovered,
  isRead,
  journalProgress,
  readReward,
  refreshJournal,
} from './loreJournal';
import { LORE_ENTRY_REWARD } from './constants';

const baseState = (overrides = {}) => ({
  stats: { commandsRun: 0, bitsEarned: 0, dirsVisited: [], killsCount: 0, stormSurvivals: 0 },
  unlockedFiles: [],
  achievements: [],
  inventory: [],
  journal: { entries: {} },
  encrypted: {},
  bestiary: {},
  cat: { trust: 0, fragmentsFound: 0, unlocked: false },
  story: { stage: 0, repairedSectors: 0 },
  solvedPuzzles: [],
  prestige: 0,
  leaderboard: { best: 0 },
  radio: { on: false },
  fs: { files: {} },
  dailyStats: { date: null },
  ...overrides,
});

describe('journal content', () => {
  it('has entries in every category', () => {
    for (const category of Object.keys(LORE_CATEGORIES)) {
      expect(LORE_ENTRIES.filter((entry) => entry.category === category).length).toBeGreaterThan(0);
    }
  });

  it('uses unique ids', () => {
    const ids = LORE_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts empty and fills up as the player plays', () => {
    expect(refreshJournal(baseState())).toEqual([]);
    const afterPlaying = refreshJournal(
      baseState({
        stats: {
          commandsRun: 30,
          bitsEarned: 10,
          dirsVisited: [],
          killsCount: 0,
          stormSurvivals: 0,
        },
      })
    );
    expect(afterPlaying.length).toBeGreaterThan(0);
    expect(afterPlaying).not.toContain('readme');
  });
});

const ids = (state) => availableEntries(state).map((entry) => entry.id);

describe('discovery', () => {
  it('unlocks an entry once its file is read', () => {
    expect(ids(baseState())).not.toContain('readme');
    expect(ids(baseState({ unlockedFiles: ['/home/readme.txt'] }))).toContain('readme');
  });

  it('unlocks entries as the cat trusts you', () => {
    expect(ids(baseState({ cat: { trust: 90, fragmentsFound: 0, unlocked: true } }))).toEqual(
      expect.arrayContaining(['cat-arrives', 'cat-trust', 'cat-listen'])
    );
  });

  it('unlocks entries for writing your own files', () => {
    const withFile = baseState({ fs: { files: { '/home/x.txt': { content: 'y' } } } });
    expect(ids(withFile)).toContain('written-by-you');
  });

  it('unlocks the final entry only when everything else is recovered', () => {
    const all = Object.fromEntries(
      LORE_ENTRIES.filter((e) => e.id !== 'journal-complete').map((e) => [e.id, 1])
    );
    const complete = baseState({ journal: { entries: all } });
    expect(journalProgress(complete).discovered).toBe(LORE_ENTRIES.length - 1);
    expect(ids(complete)).toContain('journal-complete');
    expect(refreshJournal(complete)).toEqual(['journal-complete']);
  });

  it('stops reporting entries that are already discovered', () => {
    const state = baseState({ journal: { entries: { readme: 1 } } });
    expect(ids(state)).not.toContain('readme');
    expect(journalProgress(state).discovered).toBe(1);
  });
});

describe('reading and rewards', () => {
  it('pays for the first read of an entry only', () => {
    expect(readReward(baseState(), 'readme')).toBe(LORE_ENTRY_REWARD);
    expect(readReward(baseState({ journal: { entries: {}, read: { readme: 1 } } }), 'readme')).toBe(
      0
    );
  });

  it('pays a completion bonus on the last entry', () => {
    const all = Object.fromEntries(LORE_ENTRIES.map((e) => [e.id, 1]));
    const state = baseState({
      journal: { entries: all, read: { [LORE_ENTRIES[LORE_ENTRIES.length - 1].id]: 1 } },
    });
    const last = LORE_ENTRIES[LORE_ENTRIES.length - 1].id;
    expect(readReward(state, last)).toBe(0);
  });

  it('tracks discovered and read separately', () => {
    const state = baseState({ journal: { entries: { readme: 1 }, read: { readme: 2 } } });
    expect(isDiscovered(state, 'readme')).toBe(true);
    expect(isRead(state, 'readme')).toBe(true);
    expect(isRead(state, 'daemon-first')).toBe(false);
  });
});

describe('formatting', () => {
  it('indexes entries by chapter and hides unrecovered titles', () => {
    const state = baseState({ journal: { entries: { readme: 1 } } });
    const index = formatIndex(state);
    expect(index).toContain('LORE JOURNAL // 1/');
    expect(index).toContain('[ORIGINS]');
    expect(index).toContain('readme');
    expect(index).toContain('???');
  });

  it('renders a single entry', () => {
    const entry = findEntry('readme');
    expect(entry.title).toBe('A Note Left On The Desktop');
    expect(entry.body).toContain('Explore the system');
  });

  it('returns null for an unknown id', () => {
    expect(findEntry('nope')).toBeNull();
  });
});

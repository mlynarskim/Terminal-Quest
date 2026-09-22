import { describe, it, expect } from 'vitest';
import {
  getTodayStr,
  generateDailyQuests,
  evaluateQuest,
  evaluateAllQuests,
  isNewDay,
} from '../game/dailyQuest';

describe('dailyQuest', () => {
  it('generates deterministic quests per date', () => {
    expect(generateDailyQuests('2026-09-09')).toEqual(generateDailyQuests('2026-09-09'));
    expect(generateDailyQuests('2026-09-09')).not.toEqual(generateDailyQuests('2026-09-10'));
  });

  it('generates exactly the configured number of unique quests', () => {
    const quests = generateDailyQuests('2026-09-09');
    expect(quests.length).toBe(3);
    expect(new Set(quests.map((q) => q.id)).size).toBe(3);
  });

  it('evaluates quests from tracked daily stats', () => {
    const [quest] = generateDailyQuests('2026-09-09');
    const state = {
      dailyStats: { bitsEarned: 1000, commands: 0, catInteractions: 0, dirsVisited: [] },
      solvedPuzzles: [{ binary: true }, { decryption: true }],
    };
    const evaluated = evaluateQuest(quest, state);
    expect(evaluated.progress).toBeGreaterThanOrEqual(0);
    expect(typeof evaluated.done).toBe('boolean');
  });

  it('marks quests done when target is reached', () => {
    const quest = { id: 'test', target: 5, evaluate: () => 5 };
    expect(evaluateQuest(quest, {}).done).toBe(true);
    expect(evaluateQuest({ ...quest, target: 6 }, {}).done).toBe(false);
  });

  it('evaluateAllQuests maps over the whole set', () => {
    const quests = generateDailyQuests('2026-09-09');
    const result = evaluateAllQuests(quests, { dailyStats: {}, solvedPuzzles: [] });
    expect(result).toHaveLength(3);
    expect(result.every((q) => 'progress' in q && 'done' in q)).toBe(true);
  });

  it('detects day boundaries', () => {
    expect(isNewDay('2026-09-08', '2026-09-09')).toBe(true);
    expect(isNewDay('2026-09-09', '2026-09-09')).toBe(false);
    expect(isNewDay(null, getTodayStr())).toBe(true);
  });
});

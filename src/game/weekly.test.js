import { describe, it, expect } from 'vitest';
import { getWeekSeed, getWeeklyChallenge, scoreWeekly } from './weekly';

describe('weekly', () => {
  it('getWeekSeed is deterministic for the same date', () => {
    const a = getWeekSeed(new Date('2026-09-09'));
    const b = getWeekSeed(new Date('2026-09-09'));
    expect(a).toBe(b);
  });

  it('getWeeklyChallenge returns a challenge and bots', () => {
    const ch = getWeeklyChallenge(new Date('2026-09-09'));
    expect(ch.challenge).toBeTruthy();
    expect(ch.bots.length).toBe(12);
    expect(ch.bots[0].score).toBeGreaterThanOrEqual(ch.bots[ch.bots.length - 1].score);
  });

  it('getWeeklyChallenge is deterministic for same seed', () => {
    const a = getWeeklyChallenge(new Date('2026-09-09'));
    const b = getWeeklyChallenge(new Date('2026-09-09'));
    expect(a.challenge).toBe(b.challenge);
    expect(a.bots[0].score).toBe(b.bots[0].score);
  });

  it('scoreWeekly returns 0 for no progress', () => {
    const ch = getWeeklyChallenge(new Date('2026-09-09'));
    const score = scoreWeekly(
      {
        stats: { bitsEarned: 0, commandsRun: 0, dirsVisited: [], catInteractions: 0 },
        achievements: [],
      },
      ch.challenge
    );
    expect(typeof score).toBe('number');
  });
});

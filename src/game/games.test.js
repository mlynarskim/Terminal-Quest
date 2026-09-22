import { describe, it, expect } from 'vitest';
import {
  startCrash,
  judgeCrashGuess,
  crashWinnings,
  startLeak,
  registerCatch,
} from '../game/games';
import { GAME_CRASH_WIN_MULTIPLIER } from '../game/constants';

describe('games (crash)', () => {
  it('enforces a minimum bet', () => {
    const game = startCrash({ bet: 1 });
    expect(game.bet).toBeGreaterThanOrEqual(10);
    expect(game.attemptsLeft).toBe(3);
    expect(game.challenge).toMatch(/^[A-Z0-9-]+$/);
    expect(game.challenge.length).toBeGreaterThan(3);
  });

  it('judges exact guesses as a win', () => {
    const game = startCrash({ bet: 50 });
    expect(judgeCrashGuess(game, game.challenge)).toBe('win');
    expect(judgeCrashGuess(game, game.challenge.toLowerCase())).toBe('win');
  });

  it('continues on a wrong guess while attempts remain', () => {
    const game = startCrash({ bet: 50 });
    expect(judgeCrashGuess(game, 'nope')).toBe('continue');
  });

  it('loses when the final attempt is wrong', () => {
    const game = startCrash({ bet: 50 });
    expect(judgeCrashGuess({ ...game, attemptsLeft: 1 }, 'nope')).toBe('lose');
  });

  it('pays out only when guesses match exactly', () => {
    const game = startCrash({ bet: 50 });
    const chunk = game.challenge.slice(0, -1);
    expect(judgeCrashGuess(game, chunk)).toBe('continue');
  });

  it('pays out the bet times the win multiplier', () => {
    const game = startCrash({ bet: 40 });
    expect(crashWinnings(game)).toBe(40 * GAME_CRASH_WIN_MULTIPLIER);
  });
});

describe('games (leak)', () => {
  it('starts empty and counts catches', () => {
    const game = startLeak();
    expect(game.catches).toBe(0);
    expect(registerCatch(game).catches).toBe(1);
  });
});

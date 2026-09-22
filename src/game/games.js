import {
  GAME_CRASH_BET_MIN,
  GAME_CRASH_MAX_ATTEMPTS,
  GAME_CRASH_WIN_MULTIPLIER,
} from './constants';

const KEY_SETS = ['XK72-AQF4-B1', 'GRID-9F2-CAT', 'P0L0-A1R-IN0', 'ZZZ-0101-MEOW', 'B10-H4CK-R00T'];

const pickKeys = (seed) => KEY_SETS[seed % KEY_SETS.length];

export const startCrash = ({ bet }) => {
  const challenge = pickKeys(Math.floor(Math.random() * KEY_SETS.length * 100));
  return {
    type: 'crash',
    bet: Math.max(GAME_CRASH_BET_MIN, Math.floor(bet || GAME_CRASH_BET_MIN)),
    challenge,
    attemptsLeft: GAME_CRASH_MAX_ATTEMPTS,
  };
};

export const judgeCrashGuess = (game, guess) => {
  const trimmed = String(guess || '')
    .trim()
    .toUpperCase();
  if (trimmed === game.challenge.toUpperCase()) return 'win';
  return game.attemptsLeft - 1 <= 0 ? 'lose' : 'continue';
};

export const crashWinnings = (game) => game.bet * GAME_CRASH_WIN_MULTIPLIER;
export const crashBetMin = () => GAME_CRASH_BET_MIN;

export const startLeak = () => ({ type: 'leak', catches: 0 });
export const registerCatch = (game) => ({ ...game, catches: game.catches + 1 });

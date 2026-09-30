/**
 * Grid Leaderboard.
 *
 * The score is derived from real progress (lifetime bits, achievements, lore
 * journal entries, bestiary discoveries, repaired sectors, glitch events) so
 * playing normally is the only way to climb.
 *
 * Two data sources are merged:
 *   - the remote board, served by `api/leaderboard.js` (Upstash Redis on
 *     Vercel). When the deployment has no Redis configured, or the request
 *     fails, the board silently falls back to the local rival agents below.
 *   - local rival agents whose scores advance with wall-clock time, so the
 *     board always moves between sessions and there is always someone to
 *     overtake.
 */

import {
  LEADERBOARD_LOCAL_BOT_COUNT,
  LEADERBOARD_MAX_NAME_LENGTH,
  LEADERBOARD_MAX_SCORE,
  LEADERBOARD_MIN_NAME_LENGTH,
  LEADERBOARD_REWARD_TOP1,
  LEADERBOARD_REWARD_TOP10,
  LEADERBOARD_SCORE,
  LEADERBOARD_SIZE,
} from './constants';
import { discoveryPercent, mergedBestiary, discoveredCount } from './bestiary';

export const RIVAL_AGENTS = [
  { name: 'N0DE_HOPPER', base: 1_840, rate: 26 },
  { name: 'BIT_MINER', base: 1_520, rate: 31 },
  { name: 'SECTOR_GHOST', base: 1_190, rate: 18 },
  { name: 'GRID_RAT', base: 980, rate: 22 },
  { name: 'CIPHER_PUNK', base: 860, rate: 15 },
  { name: 'PROCESS_KILLER', base: 742, rate: 19 },
  { name: 'DATA_WRAITH', base: 655, rate: 12 },
  { name: 'HEX_WALKER', base: 588, rate: 14 },
  { name: 'PULSE_RIDER', base: 512, rate: 17 },
  { name: 'VOID_CRAWLER', base: 447, rate: 11 },
  { name: 'SIGNAL_THIEF', base: 396, rate: 13 },
  { name: 'PIXEL_MONK', base: 342, rate: 9 },
  { name: 'KERNEL_PILGRIM', base: 288, rate: 8 },
  { name: 'ECHO_CHAPEL', base: 231, rate: 7 },
  { name: 'TERMINAL_WIDOW', base: 184, rate: 6 },
  { name: 'LOREKEEPER', base: 142, rate: 5 },
  { name: 'STATIC_MONK', base: 96, rate: 4 },
  { name: 'FIRST_BOOT', base: 41, rate: 3 },
];

/** Player handle: `explorer-XXXX`, stable until they rename themselves. */
export const defaultHandle = () =>
  `explorer-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

export const sanitizeName = (name) => {
  if (typeof name !== 'string') return null;
  const cleaned = name
    .trim()
    .replace(/[^\w ._-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, LEADERBOARD_MAX_NAME_LENGTH);
  if (cleaned.length < LEADERBOARD_MIN_NAME_LENGTH) return null;
  return cleaned;
};

/** Total leaderboard score for the current save. */
export const computeScore = (state) => {
  const stats = state.stats || {};
  const journal = Object.keys(state.journal?.entries || {}).length;
  const bestiary = discoveredCount(mergedBestiary(state));
  const sectors = state.story?.repairedSectors || 0;
  const glitchEvents = (state.glitch?.survived || []).length;

  return Math.max(
    0,
    Math.floor(
      (stats.bitsEarned || 0) * LEADERBOARD_SCORE.bitsPerPoint +
        (state.achievements || []).length * LEADERBOARD_SCORE.achievement +
        journal * LEADERBOARD_SCORE.journal +
        bestiary * LEADERBOARD_SCORE.bestiary +
        sectors * LEADERBOARD_SCORE.sector +
        glitchEvents * LEADERBOARD_SCORE.glitch
    )
  );
};

/** Score breakdown, used by `leaderboard --me`. */
export const scoreBreakdown = (state) => {
  const stats = state.stats || {};
  const bestiary = discoveredCount(mergedBestiary(state));
  return [
    ['lifetime bits', stats.bitsEarned || 0, LEADERBOARD_SCORE.bitsPerPoint],
    ['achievements', (state.achievements || []).length, LEADERBOARD_SCORE.achievement],
    ['lore entries', Object.keys(state.journal?.entries || {}).length, LEADERBOARD_SCORE.journal],
    ['bestiary finds', bestiary, LEADERBOARD_SCORE.bestiary],
    ['sectors repaired', state.story?.repairedSectors || 0, LEADERBOARD_SCORE.sector],
    ['glitches survived', (state.glitch?.survived || []).length, LEADERBOARD_SCORE.glitch],
  ].map(([label, count, weight]) => ({ label, count, weight, points: count * weight }));
};

/**
 * Monday 00:00 UTC of the current week. Rivals climb from here, so the board
 * is always moving but never runs away — and it resets like a real ladder.
 */
export const weekStartMs = (now = Date.now()) => {
  const date = new Date(now);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day);
};

/** Rivals advance with wall-clock time so the board is never stale. */
export const rivalScoreAt = (rival, now = Date.now()) => {
  const hours = Math.max(0, (now - weekStartMs(now)) / 3_600_000);
  return Math.floor(rival.base + hours * rival.rate);
};

const clampScore = (score) => Math.min(LEADERBOARD_MAX_SCORE, Math.max(0, Math.floor(score)));

/**
 * Merges the remote board with local rivals and the player's own score.
 *
 * @returns {{entries: Array, yourEntry: object|null, rank: number, total: number}}
 */
export const buildBoard = (state, remote = [], now = Date.now()) => {
  const entries = [];
  const seen = new Set();

  const push = (name, score, origin) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ name, score: clampScore(score), origin });
  };

  for (const entry of Array.isArray(remote) ? remote : []) {
    if (!entry || typeof entry.name !== 'string') continue;
    push(
      sanitizeName(entry.name) || entry.name.slice(0, LEADERBOARD_MAX_NAME_LENGTH),
      entry.score,
      'remote'
    );
  }

  for (const rival of RIVAL_AGENTS.slice(0, LEADERBOARD_LOCAL_BOT_COUNT)) {
    push(rival.name, rivalScoreAt(rival, now), 'rival');
  }

  const you = state.profile?.name || defaultHandle();
  push(you, computeScore(state), 'you');

  entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const rank = entries.findIndex((entry) => entry.origin === 'you') + 1;
  return {
    entries: entries.slice(0, LEADERBOARD_SIZE),
    rank,
    total: entries.length,
    yourEntry: entries.find((entry) => entry.origin === 'you') || null,
  };
};

export const rewardForRank = (rank) => {
  if (rank === 1) return LEADERBOARD_REWARD_TOP1;
  if (rank > 0 && rank <= 10) return LEADERBOARD_REWARD_TOP10;
  return 0;
};

/** Renders the board exactly like a terminal table. */
export const formatBoard = (board, { limit = 15, source = 'local' } = {}) => {
  const lines = [];
  const width = Math.max(6, ...board.entries.slice(0, limit).map((e) => e.name.length)) + 2;

  lines.push(
    `GRID LEADERBOARD // ${source === 'remote' ? 'GLOBAL' : 'LOCAL'} RELAY // TOP ${limit}`
  );
  lines.push(
    `${'#'.padStart(3)}  ${'OPERATOR'.padEnd(width)}${'SCORE'.padStart(8)}${'  ORIGIN'.padEnd(10)}`
  );
  lines.push(`${'-'.repeat(3 + 2 + width + 8 + 10)}`);

  board.entries.slice(0, limit).forEach((entry, index) => {
    const rank = String(index + 1).padStart(3);
    const marker = entry.origin === 'you' ? ' <<' : '';
    const origin = entry.origin === 'you' ? 'YOU' : entry.origin === 'remote' ? 'REMOTE' : 'AGENT';
    lines.push(
      `${rank}  ${entry.name.padEnd(width)}${String(entry.score).padStart(8)}  ${origin.padEnd(8)}${marker}`
    );
  });

  const you = board.yourEntry;
  if (you) {
    lines.push('');
    lines.push(
      `YOUR POSITION: #${board.rank} of ${board.total} visible operators with ${you.score} points.`
    );
    if (board.rank > 10) {
      lines.push(
        `Reach the top 10 for ${LEADERBOARD_REWARD_TOP10} Bits, first place pays ${LEADERBOARD_REWARD_TOP1}.`
      );
    }
  }
  return lines.join('\n');
};

export const boardSource = (leaderboard) => (leaderboard?.status === 'remote' ? 'remote' : 'local');

export const bestiaryPercent = (state) => discoveryPercent(mergedBestiary(state));

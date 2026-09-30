/**
 * Terminal Quest leaderboard API (Vercel serverless function).
 *
 * Storage is an Upstash Redis sorted set, reached over its REST API so the
 * project keeps zero runtime dependencies. When Redis is not configured the
 * function reports `configured: false` and the client falls back to its local
 * rival board — the game stays fully playable either way.
 *
 *   GET  /api/leaderboard            -> { ok, configured, entries: [{name, score}] }
 *   POST /api/leaderboard {name,...} -> { ok, configured, rank, entries }
 *
 * Environment:
 *   UPSTASH_REDIS_REST_URL   e.g. https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Abuse control (the game is client-side, so this is best effort):
 *   - handles are sanitised and length limited
 *   - scores are clamped and must be integers
 *   - a handle can only improve its score once every LEASE_MS
 *   - only the top BOARD_SIZE operators are stored
 */

import {
  LEADERBOARD_MAX_NAME_LENGTH,
  LEADERBOARD_MAX_SCORE,
  LEADERBOARD_SIZE,
} from '../src/game/constants.js';

const LEASE_MS = 60 * 60 * 1000;
const BOARD_KEY = 'tq:leaderboard';
const LEASE_PREFIX = 'tq:lease:';

const redisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
};

const encode = (value) => encodeURIComponent(String(value));

/** Runs a single Upstash REST command. */
const command = async (config, parts) => {
  const response = await fetch(`${config.url}/${parts.map(encode).join('/')}`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });
  if (!response.ok) throw new Error(`upstash ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
};

export const sanitizeName = (name) => {
  if (typeof name !== 'string') return null;
  const cleaned = name
    .trim()
    .replace(/[^\w ._-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, LEADERBOARD_MAX_NAME_LENGTH);
  return cleaned.length >= 2 ? cleaned : null;
};

const clampScore = (score) =>
  Math.min(LEADERBOARD_MAX_SCORE, Math.max(0, Math.floor(Number(score) || 0)));

/** Top of the board as `[{ name, score }]`. */
export const readBoard = async (config, size = LEADERBOARD_SIZE) => {
  const flat = await command(config, ['zrange', BOARD_KEY, 0, size - 1, 'REV', 'WITHSCORES']);
  const entries = [];
  for (let i = 0; i < flat.length; i += 2) {
    entries.push({ name: flat[i], score: Number(flat[i + 1]) || 0 });
  }
  return entries;
};

/**
 * Records a score. A handle may only improve its entry once per lease window,
 * and only ever upwards.
 */
export const writeScore = async (config, rawName, rawScore) => {
  const name = sanitizeName(rawName);
  if (!name) return { ok: false, reason: 'invalid name' };

  const current = Number(await command(config, ['zscore', BOARD_KEY, name])) || 0;
  const score = Math.max(current, clampScore(rawScore));

  const leaseKey = LEASE_PREFIX + name;
  const lease = Number(await command(config, ['get', leaseKey])) || 0;
  const now = Date.now();

  if (lease && now - lease < LEASE_MS && score <= current) {
    return { ok: true, rank: null, entries: await readBoard(config), throttled: true };
  }

  if (score > current) {
    await command(config, ['zadd', BOARD_KEY, score, name]);
  }
  await command(config, ['set', leaseKey, now, 'PX', String(LEASE_MS)]);
  await command(config, ['zremrangebyrank', BOARD_KEY, 0, -(LEADERBOARD_SIZE + 1)]);

  const entries = await readBoard(config);
  const rank = entries.findIndex((entry) => entry.name === name) + 1;
  return { ok: true, rank: rank || null, entries };
};

const handler = async (req, res) => {
  const config = redisConfig();

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (!config) {
    res.status(200).json({ ok: true, configured: false, entries: [] });
    return;
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json({ ok: true, configured: true, entries: await readBoard(config) });
      return;
    }

    if (req.method === 'POST') {
      const { name, score } = req.body || {};
      const result = await writeScore(config, name, score);
      res.status(result.ok ? 200 : 400).json({ configured: true, ...result });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ ok: false, error: 'method not allowed' });
  } catch (error) {
    res.status(503).json({ ok: false, configured: true, error: String(error.message || error) });
  }
};

export default handler;

/**
 * Leaderboard transport.
 *
 * Talks to `api/leaderboard.js` (a Vercel serverless function backed by
 * Upstash Redis) when the deployment has a database. Every failure path —
 * offline, 404, missing Redis, timeout — resolves to `null`, and the caller
 * falls back to the local rival board. The game never blocks on the network.
 */

import { LEADERBOARD_SIZE } from '../game/constants';

const ENDPOINT = import.meta.env?.VITE_LEADERBOARD_API || '/api/leaderboard';
const TIMEOUT_MS = 4_000;

/** Set to `false` to stay local (useful for offline dev and for E2E runs). */
const isEnabled = () => import.meta.env?.VITE_LEADERBOARD_API !== 'off';

const withTimeout = async (promise) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const request = async (options) => {
  if (!isEnabled() || typeof fetch !== 'function') return null;
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') return null;

  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(ENDPOINT, { ...options, signal });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.ok ? data : null;
    });
  } catch {
    return null;
  }
};

/** @returns {Promise<Array<{name: string, score: number}>|null>} */
export const fetchBoard = async () => {
  const data = await request({ method: 'GET', headers: { Accept: 'application/json' } });
  if (!data || !Array.isArray(data.entries)) return null;
  return data.entries.slice(0, LEADERBOARD_SIZE);
};

/** @returns {Promise<{ok: boolean, rank: number|null, entries: Array}|null>} */
export const submitScore = async ({ name, score, meta }) => {
  const data = await request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score, meta }),
  });
  if (!data) return null;
  return { ok: true, rank: data.rank ?? null, entries: data.entries || [] };
};

export { ENDPOINT as LEADERBOARD_ENDPOINT };

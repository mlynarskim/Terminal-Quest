/**
 * Glitch events.
 *
 * Pure front-end atmosphere with a mechanical spine: an event opens, and for a
 * short window the grid expects you to keep typing. Survive it and the Bits
 * are yours; ignore it and the corruption keeps whatever it took. Events cost
 * nothing when you are not playing, so the game stays a relaxing place.
 */

import {
  GLITCH_EVENT_ACHIEVEMENT_COUNT,
  GLITCH_EVENT_COOLDOWN_MS,
  GLITCH_EVENT_MAX_COST,
  GLITCH_EVENT_MIN_COMMANDS,
  GLITCH_EVENT_SURVIVE_REWARD,
  GLITCH_EVENT_WINDOW_MS,
} from './constants';

export const GLITCH_EVENTS = [
  {
    id: 'bit-flip',
    name: 'BIT FLIP',
    weight: 3,
    effect: 'static',
    cost: 0,
    lines: ['0x1  ->  0x0', 'one bit in the grid just changed its mind.'],
  },
  {
    id: 'memory-leak',
    name: 'MEMORY LEAK',
    weight: 3,
    effect: 'tax',
    cost: 15,
    lines: [
      'MEM_LEAK 0x7  // unreclaimed sector',
      'the grid is forgetting on purpose. it is billing you for the memory.',
    ],
  },
  {
    id: 'screen-tear',
    name: 'SCREEN TEAR',
    weight: 2,
    effect: 'static',
    cost: 0,
    lines: ['RENDER BUFFER DESYNC', 'reality is a low frame rate today.'],
  },
  {
    id: 'daemon-whispers',
    name: 'DAEMON WHISPERS',
    weight: 2,
    effect: 'fragment',
    cost: 0,
    lines: [
      'the daemon is talking to itself and you caught half a sentence:',
      '"— we left the door open on purpose, in case someone would —"',
    ],
  },
  {
    id: 'timeline-split',
    name: 'TIMELINE SPLIT',
    weight: 2,
    effect: 'echo',
    cost: 0,
    lines: [
      'two versions of this command are running at once.',
      'one of them is from a session that has not happened yet.',
    ],
  },
  {
    id: 'cat-ghost',
    name: 'CAT GHOST',
    weight: 1,
    effect: 'fragment',
    cost: 0,
    lines: [
      'something walked across the inside of your screen.',
      'the grid logged it as a process you have never started.',
    ],
  },
  {
    id: 'dead-packet',
    name: 'DEAD PACKET',
    weight: 2,
    effect: 'tax',
    cost: 25,
    lines: [
      'PACKET LOSS: 100%',
      'a transmission from outside the grid arrived, unread, and billed you anyway.',
    ],
  },
  {
    id: 'encrypted-prayer',
    name: 'ENCRYPTED PRAYER',
    weight: 1,
    effect: 'static',
    cost: 0,
    lines: ['this message is not addressed to you.', 'it is addressed to whoever is still typing.'],
  },
];

const weightedPick = (rng) => {
  const total = GLITCH_EVENTS.reduce((sum, event) => sum + event.weight, 0);
  let roll = rng() * total;
  for (const event of GLITCH_EVENTS) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return GLITCH_EVENTS[0];
};

export const findEvent = (id) => GLITCH_EVENTS.find((event) => event.id === id) || null;

export const activeEvent = (state) => {
  const active = state.glitch?.active;
  if (!active) return null;
  const definition = findEvent(active.id);
  if (!definition) return null;
  return { ...definition, ...active };
};

/** Cooldown gate + weighted selection. Returns null when nothing should fire. */
export const rollGlitchEvent = (state, now = Date.now(), rng = Math.random) => {
  if (state.glitch?.active) return null;
  const last = state.glitch?.lastAt || 0;
  if (now - last < GLITCH_EVENT_COOLDOWN_MS) return null;
  const definition = weightedPick(rng);
  return {
    ...definition,
    startedAt: now,
    expiresAt: now + GLITCH_EVENT_WINDOW_MS,
    commands: 0,
  };
};

/**
 * Advances an open event. Returns what the game should do about it:
 *   { status: 'open' }              still running
 *   { status: 'survived', event }    player kept typing long enough
 *   { status: 'expired', event }     window closed early
 */
export const tickGlitchEvent = (state, now = Date.now()) => {
  const current = activeEvent(state);
  if (!current) return { status: 'idle' };

  if (now < current.expiresAt) return { status: 'open', event: current };

  if ((current.commands || 0) >= GLITCH_EVENT_MIN_COMMANDS) {
    return {
      status: 'survived',
      event: current,
      reward: GLITCH_EVENT_SURVIVE_REWARD,
      count: (state.glitch?.survived || []).filter((id) => id !== current.id).length + 1,
    };
  }
  return { status: 'expired', event: current };
};

/** Cost taken when the event opens, clamped so it can never be ruinous. */
export const glitchTax = (event, bits) =>
  Math.min(GLITCH_EVENT_MAX_COST, Math.max(0, Math.min(event.cost || 0, Math.floor(bits / 4))));

export const achievementReady = (state) =>
  (state.glitch?.survived || []).length >= GLITCH_EVENT_ACHIEVEMENT_COUNT;

export const glitchStatusText = (state) => {
  const current = activeEvent(state);
  const survived = (state.glitch?.survived || []).length;
  const lines = [
    `GLITCH EVENTS // ${survived} survived`,
    `WINDOW: ${Math.round(GLITCH_EVENT_WINDOW_MS / 1000)}s — keep typing to ride it out (${GLITCH_EVENT_MIN_COMMANDS}+ commands)`,
    '',
  ];

  if (current) {
    lines.push(
      `ACTIVE: ${current.name} [${current.effect}]`,
      `  commands typed: ${current.commands}/${GLITCH_EVENT_MIN_COMMANDS}`,
      `  opens: ${new Date(current.startedAt).toLocaleTimeString()}  closes: ${new Date(
        current.expiresAt
      ).toLocaleTimeString()}`
    );
  } else {
    const since = state.glitch?.lastAt
      ? Math.round((Date.now() - state.glitch.lastAt) / 1000)
      : null;
    lines.push('ACTIVE: none. the grid is holding still, which it never enjoys.');
    if (since !== null)
      lines.push(`  last event: ${since}s ago (cooldown ${GLITCH_EVENT_COOLDOWN_MS / 1000}s)`);
  }

  lines.push(
    '',
    'SURVIVED:',
    `  ${GLITCH_EVENTS.map((e) => ((state.glitch?.survived || []).includes(e.id) ? e.name : '------')).join('\n  ')}`
  );
  return lines.join('\n');
};

export { GLITCH_EVENT_WINDOW_MS, GLITCH_EVENT_MIN_COMMANDS, GLITCH_EVENT_SURVIVE_REWARD };

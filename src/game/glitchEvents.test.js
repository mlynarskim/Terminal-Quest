import { describe, it, expect, vi } from 'vitest';
import {
  GLITCH_EVENTS,
  achievementReady,
  activeEvent,
  findEvent,
  glitchStatusText,
  glitchTax,
  rollGlitchEvent,
  tickGlitchEvent,
} from './glitchEvents';
import {
  GLITCH_EVENT_COOLDOWN_MS,
  GLITCH_EVENT_MIN_COMMANDS,
  GLITCH_EVENT_SURVIVE_REWARD,
  GLITCH_EVENT_WINDOW_MS,
} from './constants';

const NOW = 1_700_000_000_000;

const stateWith = (glitch = {}, overrides = {}) => ({
  bits: 100,
  glitch: { active: null, survived: [], lastAt: null, count: 0, ...glitch },
  achievements: [],
  stats: { bitsEarned: 0 },
  ...overrides,
});

describe('the event table', () => {
  it('defines events with lines, an effect and a cost', () => {
    expect(GLITCH_EVENTS.length).toBeGreaterThanOrEqual(6);
    for (const event of GLITCH_EVENTS) {
      expect(event.lines.length).toBeGreaterThan(0);
      expect(['static', 'tax', 'echo', 'fragment']).toContain(event.effect);
      expect(event.cost).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses unique ids', () => {
    const ids = GLITCH_EVENTS.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds an event by id', () => {
    expect(findEvent('bit-flip').name).toBe('BIT FLIP');
    expect(findEvent('nope')).toBeNull();
  });
});

describe('rollGlitchEvent', () => {
  it('returns an event with a window when off cooldown', () => {
    const event = rollGlitchEvent(stateWith(), NOW);
    expect(event).not.toBeNull();
    expect(event.expiresAt - event.startedAt).toBe(GLITCH_EVENT_WINDOW_MS);
    expect(event.commands).toBe(0);
  });

  it('respects the cooldown', () => {
    const state = stateWith({ lastAt: NOW - 1_000 });
    expect(rollGlitchEvent(state, NOW)).toBeNull();
  });

  it('never stacks two events', () => {
    const state = stateWith({
      active: { id: 'bit-flip', startedAt: NOW, expiresAt: NOW + 1_000, commands: 0 },
    });
    expect(rollGlitchEvent(state, NOW + GLITCH_EVENT_COOLDOWN_MS)).toBeNull();
  });

  it('only picks from the declared table', () => {
    for (let i = 0; i < 40; i++) {
      const event = rollGlitchEvent(stateWith(), NOW + i * GLITCH_EVENT_COOLDOWN_MS);
      expect(GLITCH_EVENTS.some((e) => e.id === event.id)).toBe(true);
    }
  });

  it('honours a deterministic rng', () => {
    const rng = vi.fn(() => 0);
    const event = rollGlitchEvent(stateWith(), NOW, rng);
    expect(GLITCH_EVENTS).toContainEqual(expect.objectContaining({ id: event.id }));
  });
});

describe('tickGlitchEvent', () => {
  const openEvent = (commands) => ({
    active: {
      id: 'bit-flip',
      name: 'BIT FLIP',
      effect: 'static',
      startedAt: NOW,
      expiresAt: NOW + GLITCH_EVENT_WINDOW_MS,
      commands,
    },
  });

  it('stays open inside the window', () => {
    expect(tickGlitchEvent(stateWith(openEvent(0)), NOW + 1_000).status).toBe('open');
  });

  it('is idle when nothing is running', () => {
    expect(tickGlitchEvent(stateWith(), NOW).status).toBe('idle');
  });

  it('rewards surviving with enough commands', () => {
    const result = tickGlitchEvent(
      stateWith(openEvent(GLITCH_EVENT_MIN_COMMANDS)),
      NOW + GLITCH_EVENT_WINDOW_MS
    );
    expect(result.status).toBe('survived');
    expect(result.reward).toBe(GLITCH_EVENT_SURVIVE_REWARD);
    expect(result.count).toBe(1);
  });

  it('loses the event when the player goes quiet', () => {
    const result = tickGlitchEvent(stateWith(openEvent(0)), NOW + GLITCH_EVENT_WINDOW_MS + 1);
    expect(result.status).toBe('expired');
    expect(result.reward).toBeUndefined();
  });
});

describe('glitchTax', () => {
  it('never takes more than a share of the wallet', () => {
    expect(glitchTax({ cost: 25 }, 40)).toBe(10);
    expect(glitchTax({ cost: 25 }, 10_000)).toBe(25);
    expect(glitchTax({ cost: 0 }, 1_000)).toBe(0);
    expect(glitchTax({ cost: 25 }, 0)).toBe(0);
  });
});

describe('activeEvent and status', () => {
  it('merges the stored event with its definition', () => {
    const state = stateWith({
      active: { id: 'memory-leak', startedAt: NOW, expiresAt: NOW + 1_000, commands: 1 },
    });
    const event = activeEvent(state);
    expect(event.name).toBe('MEMORY LEAK');
    expect(event.effect).toBe('tax');
    expect(event.commands).toBe(1);
  });

  it('ignores an unknown stored event', () => {
    expect(activeEvent(stateWith({ active: { id: 'gone', commands: 0 } }))).toBeNull();
  });

  it('prints a status block', () => {
    const text = glitchStatusText(stateWith({ survived: ['bit-flip'] }));
    expect(text).toContain('GLITCH EVENTS // 1 survived');
    expect(text).toContain('ACTIVE: none');
    expect(text).toContain('BIT FLIP');
  });
});

describe('achievementReady', () => {
  it('needs three distinct events', () => {
    expect(achievementReady(stateWith())).toBe(false);
    expect(achievementReady(stateWith({ survived: ['bit-flip'] }))).toBe(false);
    expect(
      achievementReady(stateWith({ survived: ['bit-flip', 'screen-tear', 'cat-ghost'] }))
    ).toBe(true);
  });
});

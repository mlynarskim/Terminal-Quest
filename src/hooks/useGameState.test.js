import { describe, it, expect } from 'vitest';
import { isValidState, hydrateState, SAVE_VERSION } from '../hooks/useGameState';

describe('isValidState', () => {
  it('accepts a well-formed state object', () => {
    const state = {
      bits: 100,
      inventory: ['key'],
      achievements: [],
      currentDir: '/home',
      history: [],
      solvedPuzzles: [],
      cat: {
        unlocked: true,
        trust: 50,
        hunger: 80,
        isPresent: true,
        lastInteractionAt: 0,
        fragmentsFound: 0,
      },
    };
    expect(isValidState(state)).toBe(true);
  });

  it('rejects null and primitives', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState(undefined)).toBe(false);
    expect(isValidState('state')).toBe(false);
    expect(isValidState(42)).toBe(false);
  });

  it('rejects malformed objects', () => {
    expect(isValidState({})).toBe(false);
    expect(isValidState({ bits: 'abc' })).toBe(false);
    expect(isValidState({ bits: 1, inventory: 5 })).toBe(false);
    expect(
      isValidState({
        bits: 1,
        inventory: [],
        achievements: [],
        currentDir: '/',
        history: [],
        solvedPuzzles: [],
      })
    ).toBe(false); // missing cat
  });
});

describe('hydrateState', () => {
  it('fills in everything a partial save is missing', () => {
    const state = hydrateState({ bits: 42, currentDir: '/logs', cat: { trust: 10 } });
    expect(state.bits).toBe(42);
    expect(state.currentDir).toBe('/logs');
    expect(state.cat.trust).toBe(10);
    expect(state.cat.unlocked).toBe(false);
    expect(state.settings).toEqual({ chaos: true });
    expect(state.saveVersion).toBe(SAVE_VERSION);
    expect(Array.isArray(state.history)).toBe(true);
  });

  it('keeps arrays from the save and ignores undefined values', () => {
    const state = hydrateState({ inventory: ['key'], achievements: undefined });
    expect(state.inventory).toEqual(['key']);
    expect(state.achievements).toEqual([]);
  });

  it('falls back to the defaults for anything that is not an object', () => {
    expect(hydrateState(null).currentDir).toBe('/home');
    expect(hydrateState('nope').bits).toBe(0);
  });

  it('merges nested objects instead of replacing them', () => {
    const state = hydrateState({ stats: { bitsEarned: 900 } });
    expect(state.stats.bitsEarned).toBe(900);
    expect(state.stats.commandsRun).toBe(0);
  });
});

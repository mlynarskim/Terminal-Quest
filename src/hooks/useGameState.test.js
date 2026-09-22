import { describe, it, expect } from 'vitest';
import { isValidState } from '../hooks/useGameState';

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

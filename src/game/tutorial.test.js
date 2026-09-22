import { describe, it, expect } from 'vitest';
import {
  TUTORIAL_STEPS,
  TUTORIAL_REWARD_BITS,
  TUTORIAL_ACHIEVEMENT,
  getTutorialIntro,
  getStepPrompt,
  matchTutorialStep,
  isTutorialActive,
} from './tutorial';

describe('tutorial', () => {
  it('defines five ordered steps', () => {
    expect(TUTORIAL_STEPS.map((s) => s.id)).toEqual(['help', 'ls', 'cat', 'cd', 'ask']);
    for (const step of TUTORIAL_STEPS) {
      expect(step.prompt).toBeTruthy();
      expect(step.done).toBeTruthy();
    }
  });

  it('matches each step against its command', () => {
    expect(matchTutorialStep(0, 'help', [])).toBe(true);
    expect(matchTutorialStep(0, 'ls', [])).toBe(false);
    expect(matchTutorialStep(1, 'ls', [])).toBe(true);
    expect(matchTutorialStep(2, 'cat', ['readme.txt'])).toBe(true);
    expect(matchTutorialStep(2, 'cat', ['other.txt'])).toBe(false);
    expect(matchTutorialStep(2, 'ls', [])).toBe(false);
    expect(matchTutorialStep(3, 'cd', ['/logs'])).toBe(true);
    expect(matchTutorialStep(3, 'cd', ['logs'])).toBe(true);
    expect(matchTutorialStep(3, 'cd', ['/home'])).toBe(false);
    expect(matchTutorialStep(4, 'ask', ['hello'])).toBe(true);
  });

  it('returns false for out-of-range steps', () => {
    expect(matchTutorialStep(99, 'help', [])).toBe(false);
    expect(matchTutorialStep(-1, 'help', [])).toBe(false);
  });

  it('intro mentions the goal and the skip hatch', () => {
    const texts = getTutorialIntro()
      .map((e) => e.text)
      .join('\n');
    expect(texts).toContain('TUTORIAL START');
    expect(texts).toContain('tutorial skip');
    expect(texts).toContain('STEP 1/5');
  });

  it('getStepPrompt resolves prompts and null past the end', () => {
    expect(getStepPrompt(0)).toContain('STEP 1/5');
    expect(getStepPrompt(4)).toContain('STEP 5/5');
    expect(getStepPrompt(5)).toBeNull();
  });

  it('isTutorialActive only for started, unfinished tutorials', () => {
    expect(isTutorialActive(undefined)).toBe(false);
    expect(isTutorialActive(null)).toBe(false);
    expect(isTutorialActive({ started: false, step: 0, done: false })).toBe(false);
    expect(isTutorialActive({ started: true, step: 2, done: false })).toBe(true);
    expect(isTutorialActive({ started: true, step: 5, done: true })).toBe(false);
  });

  it('exposes a sane reward', () => {
    expect(TUTORIAL_REWARD_BITS).toBeGreaterThan(0);
    expect(TUTORIAL_ACHIEVEMENT).toBeTruthy();
  });
});

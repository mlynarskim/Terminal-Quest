import { describe, it, expect } from 'vitest';
import {
  isStoryAdvancingToRepair,
  repairStatus,
  storyUnlocks,
  stageInfo,
  STORY_ENDINGS,
  endingInfo,
} from '../game/story';

describe('story', () => {
  it('advances to repair once the fragments are found', () => {
    expect(isStoryAdvancingToRepair({ story: { stage: 0 }, cat: { fragmentsFound: 3 } })).toBe(
      true
    );
    expect(isStoryAdvancingToRepair({ story: { stage: 0 }, cat: { fragmentsFound: 2 } })).toBe(
      false
    );
    expect(isStoryAdvancingToRepair({ story: { stage: 1 }, cat: { fragmentsFound: 3 } })).toBe(
      false
    );
  });

  it('tracks repair sector progress', () => {
    const st = repairStatus({ story: { stage: 1, repairedSectors: 1 } });
    expect(st.stageName).toBe('REPAIR');
    expect(st.repaired).toBe(1);
    expect(st.total).toBe(4);
    expect(st.remaining).toBe(3);
    expect(st.canRepair).toBe(true);
  });

  it('flags restoration as available only after full repair', () => {
    expect(repairStatus({ story: { stage: 1, repairedSectors: 4 } }).remaining).toBe(0);
    expect(repairStatus({ story: { stage: 2, repairedSectors: 4 } }).complete).toBe(true);
  });

  it('gates core file readability behind completion', () => {
    expect(storyUnlocks.coreReadable({ story: { stage: 1 } })).toBe(false);
    expect(storyUnlocks.coreReadable({ story: { stage: 2 } })).toBe(true);
  });

  it('provides stage info with a default fallback', () => {
    expect(stageInfo({}).name).toBe('DISCOVERY');
    expect(stageInfo({ story: { stage: 1 } }).name).toBe('REPAIR');
  });

  it('defines two endings with achievements and lines', () => {
    expect(Object.keys(STORY_ENDINGS).sort()).toEqual(['preserve', 'rewrite']);
    for (const e of Object.values(STORY_ENDINGS)) {
      expect(e.lines.length).toBe(5);
      expect(e.achievement).toContain('Ending:');
    }
  });

  it('resolves the ending from state', () => {
    expect(endingInfo({ story: {} })).toBeNull();
    expect(endingInfo({ story: { ending: 'rewrite' } }).name).toBe('REWRITE');
    expect(endingInfo({ story: { ending: 'preserve' } }).title).toBe('Glitch Keeper');
  });
});

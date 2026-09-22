import {
  STORY_COMPLETE_REWARD,
  STORY_FRAGMENT_TRIGGER,
  STORY_REPAIR_COST,
  STORY_REPAIR_SECTORS,
} from './constants';

// story.stage:
//  0 = DISCOVERY    (find the fragments, befriend the cat)
//  1 = REPAIR       (repair the corrupted sectors)
//  2 = RESTORED     (arc complete, NG+ content unlocked)
export const STAGE_BY_INDEX = [
  { index: 0, name: 'DISCOVERY', hint: 'HINT: fragments hide where the cat lingers.' },
  { index: 1, name: 'REPAIR', hint: 'REPAIR PROTOCOL ONLINE: "repair" each corrupted sector.' },
  { index: 2, name: 'RESTORED', hint: 'THE GRID IS WHOLE AGAIN. deeper archives now echo.' },
];

// Endings chosen at restoration time via `restore rewrite|preserve`.
// story.ending holds 'rewrite' | 'preserve' | null.
export const STORY_ENDINGS = {
  rewrite: {
    id: 'rewrite',
    name: 'REWRITE',
    title: 'Grid Rewriter',
    achievement: 'Ending: Rewrite',
    choice: 'Purge the corruption and rewrite every sector clean.',
    lines: [
      'cracks in the core close like lips rehearsing a goodbye.',
      'the corruption screams once, in a frequency no speaker can hold.',
      'silence. then a clean boot tone the grid has never played before.',
      'INTEGRITY: 100%. GHOSTS REPORT A STRANGE PEACE.',
      'RESTORATION COMPLETE. THE GRID IS CLEAN — AND IT REMEMBERS YOU, EXPLORER.',
    ],
  },
  preserve: {
    id: 'preserve',
    name: 'PRESERVE',
    title: 'Glitch Keeper',
    achievement: 'Ending: Preserve',
    choice: 'Seal the corruption in amber and keep the glitches alive.',
    lines: [
      'cracks in the core glow amber instead of closing.',
      'the glitches settle like snow. they spell your name, once, then rest.',
      'the cat purrs. approval flickers in both green eyes.',
      'INTEGRITY: 100%. THE BEAUTIFUL BUGS ARE NOW PROTECTED SPECIMENS.',
      'RESTORATION COMPLETE. THE GRID IS WHOLE — SCARS, GHOSTS, AND ALL.',
    ],
  },
};

export const endingInfo = (state) => STORY_ENDINGS[state.story?.ending] || null;

export const isStoryAdvancingToRepair = (state) =>
  state.story?.stage === 0 && (state.cat?.fragmentsFound || 0) >= STORY_FRAGMENT_TRIGGER;

export const stageInfo = (state) => STAGE_BY_INDEX[state.story?.stage || 0] || STAGE_BY_INDEX[0];

export const repairStatus = (state) => {
  const stage = state.story?.stage || 0;
  const repaired = state.story?.repairedSectors || 0;
  return {
    stage,
    stageName: STAGE_BY_INDEX[stage].name,
    repaired,
    total: STORY_REPAIR_SECTORS,
    cost: STORY_REPAIR_COST,
    remaining: STORY_REPAIR_SECTORS - repaired,
    complete: stage >= 2,
    canRepair: stage === 1 && repaired < STORY_REPAIR_SECTORS,
  };
};

export const storyUnlocks = {
  coreReadable: (state) => (state.story?.stage || 0) >= 2,
};

export const STORY_COMPLETE_BONUS = STORY_COMPLETE_REWARD;
export const STORY_REPAIR_COST_PER_SECTOR = STORY_REPAIR_COST;

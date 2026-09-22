export const PRESTIGE_TITLES = [
  'INITIAL_BOOT',
  'RECOMPILED',
  'REWRITTEN',
  'TRANSCENDED',
  'GRID_TWIN',
  'PHANTOM_NODE',
  'OMEGA_SECTOR',
];

export const prestigeTitle = (level) =>
  PRESTIGE_TITLES[Math.min(level, PRESTIGE_TITLES.length - 1)];

export const prestigeMultiplier = (level) => 1 + level * 0.15;

export const prestigeBitsBonus = (level) => level * 200;

export const canPrestige = (state) =>
  state.story?.stage === 2 && (state.stats?.bitsEarned || 0) >= 2_000;

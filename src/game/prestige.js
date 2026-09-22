export const PRESTIGE_TITLES = [
  'INITIAL_BOOT',
  'RECOMPILED',
  'REWRITTEN',
  'TRANSCENDED',
  'GRID_TWIN',
  'PHANTOM_NODE',
  'OMEGA_SECTOR',
];

export const PRESTIGE_PERKS = {
  0: { name: 'INITIAL_BOOT', desc: 'Standard start. No perks.' },
  1: {
    name: 'RECOMPILED',
    desc: '+15% Bits from all sources. +200 starting Bits.',
    effects: { bitsMult: 1.15, startBits: 200 },
  },
  2: {
    name: 'REWRITTEN',
    desc: 'Auto-feed cat every 5 min. +30% Bits. +500 starting Bits.',
    effects: { bitsMult: 1.3, startBits: 500, autoFeed: true },
  },
  3: {
    name: 'TRANSCENDED',
    desc: 'Free Decoder on start. +45% Bits. +1000 starting Bits.',
    effects: { bitsMult: 1.45, startBits: 1000, freeDecoder: true },
  },
  4: {
    name: 'GRID_TWIN',
    desc: '2x Bits from processes. +60% Bits. +2000 starting Bits.',
    effects: { bitsMult: 1.6, startBits: 2000, processBitsMult: 2 },
  },
  5: {
    name: 'PHANTOM_NODE',
    desc: 'Storm immunity. +75% Bits. +5000 starting Bits.',
    effects: { bitsMult: 1.75, startBits: 5000, stormImmune: true },
  },
  6: {
    name: 'OMEGA_SECTOR',
    desc: 'Max prestige. All perks active. 2x Bits globally.',
    effects: { bitsMult: 2.0, startBits: 10000, allPerks: true },
  },
};

export const prestigeTitle = (level) =>
  PRESTIGE_TITLES[Math.min(level, PRESTIGE_TITLES.length - 1)];

export const prestigeMultiplier = (level) => {
  const perk = PRESTIGE_PERKS[level];
  return perk?.effects?.bitsMult || 1 + level * 0.15;
};

export const prestigeBitsBonus = (level) => {
  const perk = PRESTIGE_PERKS[level];
  return perk?.effects?.startBits || level * 200;
};

export const getPrestigePerks = (level) => PRESTIGE_PERKS[level] || { effects: {} };

export const canPrestige = (state) =>
  state.story?.stage === 2 && (state.stats?.bitsEarned || 0) >= 2_000;

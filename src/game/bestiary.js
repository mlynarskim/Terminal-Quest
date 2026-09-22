export const BESTIARY_CATEGORIES = {
  files: {
    name: 'FILE_SPECIMENS',
    items: {
      readme: 'A text file. The most common inhabitant of any directory.',
      encrypted: 'A locked file. The grid hides things it cannot control.',
      hidden: 'A file prefixed with dot. Visible only to the curious.',
      binary: 'Raw data. Unreadable to the naked eye, but the decoder hums.',
    },
  },
  commands: {
    name: 'COMMAND_GLYPHS',
    items: {
      navigate: "cd, ls — the explorer's compass and map.",
      create: "touch, mkdir — the explorer's pen and hammer.",
      inspect: "cat — reading the grid's written memory.",
      destroy: 'rm, rmdir — deleting from the grid. does it ever forget?',
    },
  },
  creatures: {
    name: 'GRID_FAUNA',
    items: {
      cat: 'The node-0 process. It has always been here. Trust is earned.',
      daemon: 'Background processes. Silent. Useful. Occasionally dangerous.',
      glitch: 'Corrupted data given form. It flickers. It watches.',
    },
  },
  systems: {
    name: 'SYSTEM_ORGANS',
    items: {
      bits: 'Crystallised computation. The currency of the grid.',
      sectors: 'Memory partitions. Some are clean. Some are very, very not.',
      clock: "The grid's heartbeat. It never stops. It never sleeps.",
    },
  },
  stories: {
    name: 'GRID_LORE',
    items: {
      explorer: 'You are the fourth explorer. The previous three did not return.',
      corruption: 'It started in sector 7. It spread. It is still spreading.',
      catOrigin: 'The cat arrived before the grid. Or perhaps the grid was built around the cat.',
      coreCrystal: 'The living heart of the grid. Some say it can think.',
    },
  },
};

export const initBestiary = () => {
  const discovered = {};
  for (const [cat, data] of Object.entries(BESTIARY_CATEGORIES)) {
    discovered[cat] = {};
    for (const key of Object.keys(data.items)) {
      discovered[cat][key] = false;
    }
  }
  return discovered;
};

export const totalEntries = (bestiary) => {
  let total = 0;
  for (const cat of Object.values(bestiary)) {
    total += Object.keys(cat).length;
  }
  return total;
};

export const discoveredCount = (bestiary) => {
  let count = 0;
  for (const cat of Object.values(bestiary)) {
    for (const found of Object.values(cat)) {
      if (found) count++;
    }
  }
  return count;
};

export const discoveryPercent = (bestiary) => {
  const total = totalEntries(bestiary);
  return total === 0 ? 0 : Math.round((discoveredCount(bestiary) / total) * 100);
};

export const discover = (bestiary, category, key) => {
  if (!bestiary[category] || bestiary[category][key] === undefined) return bestiary;
  if (bestiary[category][key]) return bestiary;
  return {
    ...bestiary,
    [category]: { ...bestiary[category], [key]: true },
  };
};

/**
 * Derives bestiary discoveries from live game state, so the gallery feels
 * alive without requiring explicit discovery calls everywhere.
 * Returns a bestiary-shaped object to be merged over the persisted one.
 */
export const deriveBestiary = (state) => {
  const stats = state.stats || {};
  const solved = state.solvedPuzzles || [];
  const unlocked = state.unlockedFiles || [];
  const commands = stats.commandsRun || 0;
  const dirs = stats.dirsVisited || [];
  const earned = stats.bitsEarned || 0;
  const stage = state.story?.stage || 0;
  const cat = state.cat || {};
  const encrypted = state.encrypted || {};
  const memos = state.memos || {};
  const macros = state.macros || {};

  const has = (cond) => Boolean(cond);
  return {
    files: {
      readme: has(commands > 0),
      encrypted: has(Object.keys(encrypted).length > 0 || (state.inventory || []).includes('key')),
      hidden: has(unlocked.some((p) => p.includes('.hidden'))),
      binary: has(solved.includes('binary')),
    },
    commands: {
      navigate: has(dirs.length > 1),
      create: has(Object.keys(memos).length > 0 || Object.keys(macros).length > 0),
      inspect: has(commands > 5),
      destroy: has(commands > 50),
    },
    creatures: {
      cat: has(cat.unlocked),
      daemon: has((state.processes || []).length > 0),
      glitch: has((state.storm?.glitchCount || 0) > 0),
    },
    systems: {
      bits: has(earned > 0),
      sectors: has(stage >= 1),
      clock: has(state.dailyStats?.date !== null),
    },
    stories: {
      explorer: has((state.achievements || []).length > 0),
      corruption: has(stage >= 1),
      catOrigin: has((cat.trust || 0) >= 50),
      coreCrystal: has(stage >= 2),
    },
  };
};

/** Merges persisted bestiary with state-derived discoveries. */
export const mergedBestiary = (state) => {
  const persisted =
    state.bestiary && Object.keys(state.bestiary).length ? state.bestiary : initBestiary();
  const derived = deriveBestiary(state);
  const out = {};
  for (const cat of Object.keys(BESTIARY_CATEGORIES)) {
    out[cat] = {};
    for (const key of Object.keys(BESTIARY_CATEGORIES[cat].items)) {
      out[cat][key] = Boolean(persisted[cat]?.[key] || derived[cat]?.[key]);
    }
  }
  return out;
};

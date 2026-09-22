/**
 * Current-objective resolver. A first-time player should always be able to
 * answer "what do I do next" — the OBJECTIVE panel and `story` both read this.
 */
export const getObjective = (state) => {
  const stage = state.story?.stage || 0;
  const repaired = state.story?.repairedSectors || 0;
  const fragments = state.cat?.fragmentsFound || 0;
  const trust = state.cat?.trust || 0;
  const catFound = Boolean(state.cat?.unlocked);
  const prestige = state.prestige || 0;

  if (stage >= 2) {
    if (prestige === 0) {
      return {
        title: 'GRID RESTORED',
        detail: 'Ending locked in. Next: `recompile` for prestige, `weekly` for glory.',
        progress: null,
      };
    }
    return {
      title: 'GRID LEGEND',
      detail: 'Chase 100% `bestiary`, weekly #1, higher prestige.',
      progress: null,
    };
  }

  if (stage === 1) {
    if (repaired >= 4) {
      const hasKey = (state.inventory || []).includes('key');
      return {
        title: 'RESTORE THE GRID',
        detail: hasKey
          ? 'Run `restore` and choose your ending: rewrite or preserve.'
          : 'Get the master key (`buy key`), then run `restore`.',
        progress: { current: repaired, total: 4 },
      };
    }
    return {
      title: 'REPAIR THE SECTORS',
      detail: '`repair` costs 1000 Bits per sector. Earn via games, processes, dailies.',
      progress: { current: repaired, total: 4 },
    };
  }

  // stage 0 — DISCOVERY
  if (!catFound) {
    return {
      title: 'FIND THE CAT',
      detail: 'Explore /home and /users/explorer. Try `ls -a`, read what you find.',
      progress: null,
    };
  }
  if (trust < 80) {
    return {
      title: 'BEFRIEND THE CAT',
      detail: '`buy cat_food`, then `feed` and `pet` until trust hits 80%.',
      progress: { current: Math.min(trust, 80), total: 80 },
    };
  }
  return {
    title: 'COLLECT THE FRAGMENTS',
    detail: 'Hunt fragment files and earn the rest from the cat. `story` tracks them.',
    progress: { current: Math.min(fragments, 3), total: 3 },
  };
};

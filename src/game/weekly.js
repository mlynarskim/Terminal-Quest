const BOT_NAMES = [
  'N0DE_HOPPER',
  'BIT_MINER',
  'SECTOR_GHOST',
  'GRID_RAT',
  'CIPHER_PUNK',
  'PROCESS_KILLER',
  'DATA_WRAITH',
  'PIXEL_MONK',
  'HEX_WALKER',
  'PULSE_RIDER',
  'VOID_CRAWLER',
  'SIGNAL_THIEF',
];

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
};

export const getWeekSeed = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day + (day === 0 ? -6 : 1));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return d.getUTCFullYear() * 100 + weekNo;
};

export const getWeeklyChallenge = (date = new Date()) => {
  const seed = getWeekSeed(date);
  const rng = seededRandom(seed);

  const challenges = [
    'MINE 500 BITS',
    'COMPLETE 100 COMMANDS',
    'VISIT 15 UNIQUE DIRECTORIES',
    'KILL 10 PROCESSES',
    'PLAY 5 GAMES OF CRASH',
    'EARN 2 ACHIEVEMENTS',
    'FEED THE CAT 5 TIMES',
    'SOLVE 3 CIPHERS',
  ];

  const challenge = challenges[Math.floor(rng() * challenges.length)];

  const bots = BOT_NAMES.map((name) => ({
    name,
    score: Math.floor(rng() * 800 + 200),
  })).sort((a, b) => b.score - a.score);

  return { seed, challenge, bots, weekStart: getWeekLabel(date) };
};

const getWeekLabel = (date) => {
  const d = new Date(date);
  return `W${String(Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)).padStart(2, '0')}-${d.getFullYear()}`;
};

export const scoreWeekly = (state, challenge) => {
  const text = challenge.toUpperCase();
  if (text.includes('500 BITS')) return state.stats?.bitsEarned || 0;
  if (text.includes('100 COMMANDS')) return state.stats?.commandsRun || 0;
  if (text.includes('15 UNIQUE')) return (state.stats?.dirsVisited || []).length;
  if (text.includes('KILL 10')) return Math.min(10, state.stats?.commandsRun || 0);
  if (text.includes('5 GAMES')) return Math.min(5, state.stats?.commandsRun || 0);
  if (text.includes('2 ACHIEVEMENTS')) return Math.min(2, state.achievements?.length || 0);
  if (text.includes('FEED')) return Math.min(5, state.stats?.catInteractions || 0);
  if (text.includes('3 CIPHERS')) return Math.min(3, state.stats?.commandsRun || 0);
  return 0;
};

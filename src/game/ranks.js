const RANKS = [
  { name: 'GRID_TENDER', minEarned: 0, tagline: 'the grid hums for you already.' },
  { name: 'SECTOR_HOPPER', minEarned: 200, tagline: 'you leave footprints between folders.' },
  { name: 'BIT_SMITH', minEarned: 500, tagline: 'bits bend to your keystrokes.' },
  { name: 'DEFRAGMENTER', minEarned: 1_000, tagline: 'you stitch what others corrupted.' },
  { name: 'PACKET_BREAKER', minEarned: 2_000, tagline: 'the data flow fears your name.' },
  { name: 'KERNEL_ARCHITECT', minEarned: 4_000, tagline: 'you could compile morning light.' },
  { name: 'GHOST_OF_THE_GRID', minEarned: 8_000, tagline: 'the system whispers your command.' },
];

export const computeRank = (stats) => {
  const earned = stats?.bitsEarned || 0;
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    current = RANKS[i];
    next = RANKS[i + 1] || null;
    if (earned < current.minEarned) break;
    if (!RANKS[i + 1] || earned < RANKS[i + 1].minEarned) break;
  }
  const progress = next
    ? Math.min(
        100,
        Math.floor(((earned - current.minEarned) / (next.minEarned - current.minEarned)) * 100)
      )
    : 100;
  return {
    current: current.name,
    tagline: current.tagline,
    next: next?.name || null,
    progress,
    earned,
  };
};

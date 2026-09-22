export const RADIO_STATIONS = [
  {
    id: 'lofi',
    name: 'LO-FI_GRID',
    description: 'calm frequencies. reduces glitch chance.',
    effect: 'glitchReduce',
  },
  {
    id: 'static',
    name: 'STATIC_BURST',
    description: 'raw data streams. more frequent transmissions.',
    effect: 'moreTransmissions',
  },
  {
    id: 'encrypted',
    name: 'ENCRYPTED_CHANNEL',
    description: 'cryptic messages. lore-rich transmissions.',
    effect: 'lore',
  },
  {
    id: 'mining',
    name: 'MINING_RADIO',
    description: 'mining frequencies. transmissions yield more BITS.',
    effect: 'bitsBonus',
  },
];

export const TRANSMISSIONS = {
  lore: [
    'SIGNAL: a fragment of the old grid bleeds through…',
    'SIGNAL: coordinates detected. /archives/… somewhere deep.',
    "SIGNAL: the previous explorer's final log entry echoes.",
    'SIGNAL: a name, repeated. someone who was here before.',
    'SIGNAL: the corruption has a pulse. it beats in hex.',
    'SIGNAL: the cat was here before the grid. remember that.',
  ],
  bits: [
    'SIGNAL: mining pulse detected. +BITS transmitted.',
    'SIGNAL: stray computation detected. +BITS recovered.',
    'SIGNAL: bandwidth surplus. +BITS redirected to explorer.',
    'SIGNAL: legacy cache flushed. +BITS recovered.',
  ],
  neutral: [
    'SIGNAL: atmospheric interference on sector 7.',
    'SIGNAL: node handshake complete. all clear.',
    'SIGNAL: the grid hums a low frequency. 440Hz.',
    'SIGNAL: data packet lost. probably nothing.',
    'SIGNAL: the cat passed through a camera. for 0.2 seconds.',
  ],
  glitch: [
    'SIGNAL: [CORRUPTED] …help…me…',
    'SIGNAL: [GLITCH] the grid remembers what you deleted.',
    'SIGNAL: [ERROR] recursive signal detected. echo…echo…echo.',
    'SIGNAL: [WARN] something is watching from the other side.',
  ],
};

export const pickTransmission = (effect) => {
  const pool =
    effect === 'lore'
      ? TRANSMISSIONS.lore
      : effect === 'bitsBonus'
        ? TRANSMISSIONS.bits
        : effect === 'moreTransmissions'
          ? [...TRANSMISSIONS.glitch, ...TRANSMISSIONS.neutral]
          : TRANSMISSIONS.neutral;

  return pool[Math.floor(Math.random() * pool.length)];
};

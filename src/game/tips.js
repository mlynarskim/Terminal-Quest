const TIPS = [
  'TIP: "ls -a" reveals hidden entries. "ls -la" also sizes them.',
  'TIP: find -name lists every encrypted file on the grid, e.g. find / -name *.enc',
  'TIP: "cat file | grep word | wc -l" works here. so does "echo hi > note.txt".',
  'TIP: "man <command>" documents anything, including the grid-specific verbs.',
  'TIP: the cat drops fragments at high trust. keep it fed.',
  'TIP: "buy" shows the current stock.',
  'TIP: "stats --graph" shows your last 14 days of bit flow.',
  'TIP: "daily" generates a fresh set of daemon quests each day.',
  'TIP: "lore" is your journal. reading a new entry pays Bits.',
  'TIP: "leaderboard submit" publishes your score to the relay.',
  'TIP: "play crash" is a paying typing game. fast hands, clean keys.',
  'TIP: "echo anything > file" writes a real file you can grep later.',
  'TIP: "history" survives a reboot, and "history -c" does not.',
  'TIP: themes are sold as "theme_amber", "theme_cyan", "theme_violet".',
  'TIP: "rank" tracks your lifetime bits earned, not your wallet.',
  'TIP: the konami code is remembered by the system. so is everything else.',
  'TIP: "story" tracks the main arc. "restore" is its last word.',
  'TIP: "ps aux" then "kill <pid>" is how you farm bits safely.',
  'TIP: restricted sectors admit "sudo", but not always.',
  'TIP: "calm off" silences the chaos if the static gets loud.',
  'TIP: some commands only answer at a certain hour.',
];

export const randomTip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

export const getTimeOfDay = (now = new Date()) => {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
};

export const TIME_PHRASES = {
  morning: {
    greeting: 'the system rises with you.',
    look: 'shadows retreat from the first command.',
    listen: 'a frail hum. the grid is waking up.',
    status: 'DIURNAL_WAKE: REQUESTED GRACE PERIOD',
  },
  day: {
    greeting: 'the grid is loud today.',
    look: 'data streams sharpen under midday light.',
    listen: 'echoes of a thousand users at once.',
    status: 'PEAK_LOAD. REMAINS USEFUL.',
  },
  evening: {
    greeting: 'the last shift logs off. you remain.',
    look: 'amber shadows stretch across the sectors.',
    listen: 'the walls murmur secrets to the late ones.',
    status: 'DUSK_PROTOCOL ENGAGED',
  },
  night: {
    greeting: 'the ghosts keep the servers breathing.',
    look: 'only the cursor and the cat are awake.',
    listen: 'everything is quieter. somehow louder.',
    status: 'NIGHT_CYCLE: WHO IS WATCHING?',
  },
};

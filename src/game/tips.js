const TIPS = [
  'TIP: "ls -a" reveals hidden entries.',
  'TIP: "search [pattern]" scans the whole filesystem.',
  'TIP: the cat drops fragments at high trust. keep it fed.',
  'TIP: "buy" shows the current stock.',
  'TIP: "stats --graph" shows your last 14 days of bit flow.',
  'TIP: "daily" generates a fresh set of daemon quests each day.',
  'TIP: "play crash" is a paying typing game. fast hands, clean keys.',
  'TIP: "edit memo hello world" writes a personal note to state.memos.',
  'TIP: themes are sold as "theme_amber", "theme_cyan", "theme_violet".',
  'TIP: "rank" tracks your lifetime bits earned, not your wallet.',
  'TIP: the konami code is remembered by the system. so is everything else.',
  'TIP: "story" tracks the main arc. "restore" is its last word.',
  'TIP: restricted sectors admit "sudo", but not always.',
  'TIP: some commands only answer at a certain hour.',
  'TIP: the grid rewards the curious. "tips" repeats that every command or two.',
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

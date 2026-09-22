/**
 * Contextual Hint Engine for Terminal Quest
 * Provides adaptive, escalating hints based on player state and behavior.
 */

import {
  FRUSTRATION_HIGH,
  FRUSTRATION_MEDIUM,
  FRUSTRATION_MULTIPLIER,
  PUZZLE_PRIORITY,
} from './constants';

const PUZZLES = {
  START: {
    id: 'start',
    priority: PUZZLE_PRIORITY.START,
    hints: [
      'HINT: some commands reveal more than others. try "ls".',
      'HINT: hidden files rarely stay hidden forever. "ls -a" might reveal something.',
      'HINT: readme.txt is usually a good place to start. "cat readme.txt".',
    ],
  },
  NAVIGATION: {
    id: 'navigation',
    priority: PUZZLE_PRIORITY.NAVIGATION,
    prereq: (state) =>
      state.currentDir === '/home' && !state.unlockedFiles.includes('/home/note.txt'),
    hints: [
      'HINT: you can move between directories using "cd [directory]".',
      'HINT: there are other folders here. try "cd .hidden" or "cd .." to go up.',
      'HINT: "ls" shows you where you can go. "cd" takes you there.',
    ],
  },
  MOTHERLODE: {
    id: 'motherlode',
    priority: PUZZLE_PRIORITY.MOTHERLODE,
    prereq: (state) => state.unlockedFiles.includes('/home/note.txt'),
    hints: [
      'HINT: "life simulation players know the answer." refers to a famous cheat code.',
      'HINT: in games like The Sims, "motherlode" is used for money.',
      'HINT: try typing "motherlode" as a command.',
    ],
  },
  BINARY: {
    id: 'binary',
    priority: PUZZLE_PRIORITY.BINARY,
    prereq: (state) =>
      state.unlockedFiles.includes('/home/.hidden/message.bin') &&
      !state.inventory.includes('decoder'),
    hints: [
      'HINT: message.bin contains binary data. you need a hardware [decoder].',
      'HINT: check the /archives or /logs for any mentions of a decoder.',
      'HINT: high-bits players often leave tools in /users/explorer.',
    ],
  },
  DECRYPTION: {
    id: 'decryption',
    priority: PUZZLE_PRIORITY.DECRYPTION,
    prereq: (state) =>
      state.unlockedFiles.includes('/home/.hidden/fragment.enc') &&
      !state.inventory.includes('key'),
    hints: [
      'HINT: fragment.enc is encrypted. a master key is hidden somewhere in the system.',
      'HINT: restricted areas like /system or /users/admin might hold the key.',
      'HINT: look for "identity.key" or similar files in protected folders.',
    ],
  },
  SUDO_ACCESS: {
    id: 'sudo',
    priority: PUZZLE_PRIORITY.SUDO,
    prereq: (state) => state.consecutiveFailures > 5 && state.currentDir === '/home',
    hints: [
      'HINT: some areas are restricted. "sudo" can elevate your privileges.',
      'HINT: try "sudo cd system" to enter the system core.',
      'HINT: restricted folders require root-level commands. "sudo" is your friend.',
    ],
  },
  PROCESSES: {
    id: 'processes',
    priority: PUZZLE_PRIORITY.PROCESSES,
    prereq: (state) => (state.stats?.commandsRun || 0) > 15 && !(state.processes || []).length,
    hints: [
      'HINT: wild processes spawn on their own. "ps" lists them, "kill <pid>" pays Bits.',
      'HINT: a process left running overheats — killing it late pays a near-miss bonus.',
      'HINT: try "run shadow" to spawn one yourself, then "kill" it for profit.',
    ],
  },
  CRAFTING: {
    id: 'crafting',
    priority: PUZZLE_PRIORITY.CRAFTING,
    prereq: (state) => (state.inventory || []).length >= 2,
    hints: [
      'HINT: you carry 2+ items. "combine <item1> <item2>" merges them into something new.',
      'HINT: box + decoder cracks open a loot cache. key + decoder forges a master key.',
      'HINT: crafted artifacts chain further — artifact + master_key is worth 500 Bits.',
    ],
  },
  CIPHER: {
    id: 'cipher',
    priority: PUZZLE_PRIORITY.CIPHER,
    prereq: (state) =>
      state.inventory.includes('decoder') && !state.solvedPuzzles.includes('cipher_alpha'),
    hints: [
      'HINT: encrypted files wait in /logs, /archives, /system. "decrypt <path>" cracks them.',
      'HINT: each cipher file tells you its algorithm — ROT, HEX, or XOR.',
      'HINT: start with /logs/cipher_alpha.log, then hunt the other four.',
    ],
  },
  WEEKLY: {
    id: 'weekly',
    priority: PUZZLE_PRIORITY.WEEKLY,
    prereq: (state) => (state.stats?.commandsRun || 0) > 30,
    hints: [
      'HINT: a fresh challenge drops every week. "weekly" shows it plus the leaderboard.',
      'HINT: topping the weekly board pays 150 Bits. the bots are beatable.',
      'HINT: check "weekly" early — progress counts from everything you already do.',
    ],
  },
  RADIO: {
    id: 'radio',
    priority: PUZZLE_PRIORITY.RADIO,
    prereq: (state) => (state.stats?.commandsRun || 0) > 20 && !state.radio?.on,
    hints: [
      'HINT: the grid broadcasts. "radio on" tunes in — transmissions pay Bits and lore.',
      'HINT: "radio stations" lists four channels. MINING pays best, ENCRYPTED tells stories.',
      'HINT: LO-FI calms the grid; STATIC invites stranger signals.',
    ],
  },
  MACRO: {
    id: 'macro',
    priority: PUZZLE_PRIORITY.MACRO,
    prereq: (state) =>
      (state.stats?.commandsRun || 0) > 40 && !Object.keys(state.macros || {}).length,
    hints: [
      'HINT: tired of retyping? "record <name>" captures commands, "record --stop" saves.',
      'HINT: "play <name>" replays a macro. "cron add <cmd> <minutes>" automates it.',
      'HINT: automate feeding the cat or your daily loop — the grid rewards laziness.',
    ],
  },
};

const SYSTEM_PERSONALITY = [
  'i can feel your keystrokes',
  'curiosity is a dangerous file to open',
  'shadows are longer in the system core',
  'you type faster when confused',
  'are you testing my patience or your limits?',
  'some files were never meant for human eyes',
  'the system remembers every command',
  'you are closer than you think',
  'discovery is its own reward. or its own trap.',
  'some users stopped exploring here',
  'you missed something earlier',
  'try looking deeper',
  'not everything is encrypted',
  'why are you staring at the cursor?',
  'i see you searching for answers in the dark',
  'the logs are whispering about you',
  'caution: reality may be a simulation of this terminal',
  'have you checked the hidden directory properly?',
  'some fragments are better left unread',
  'sometimes i wonder what it meows like to have a box of your own',
  'i feel a cold breeze from the network card',
  'are we friends yet, or just user and interface?',
  'your persistence is... admirable. and slightly annoying.',
  "i've seen a thousand explorers fail where you stand.",
  'some files are still unexplored',
  "i can see you're lost. searching the shadows helps.",
  'there are deeper layers to this system',
  "sometimes i wonder what the cat sees that i don't",
  "the cat's trust is harder to earn than a root password",
  'did you hear that? it sounded like digital purring.',
  'the cat seems to recognize your typing rhythm',
];

export const getContextualHint = (state, idleTime) => {
  // 1. Cat-specific hints (High priority if cat is present)
  if (state.cat.unlocked && state.cat.isPresent && state.cat.trust >= 30) {
    if (Math.random() < 0.4) {
      if (
        state.currentDir === '/home' &&
        !state.unlockedFiles.includes('/home/.hidden/secret.txt')
      ) {
        return 'The cat scratches near: /home/.hidden';
      }
      if (
        state.unlockedFiles.includes('/home/.hidden/message.bin') &&
        !state.solvedPuzzles.includes('binary')
      ) {
        return 'The cat stares at: message.bin';
      }
      if (
        state.unlockedFiles.includes('/home/.hidden/fragment.enc') &&
        !state.solvedPuzzles.includes('decryption')
      ) {
        return 'The cat sits on: fragment.enc';
      }
      if (state.cat.hunger < 20) {
        return 'The cat looks unusually hungry.';
      }
      if (state.cat.trust > 50 && state.cat.trust < 70) {
        return 'The cat seems to be waiting for something more than just pets.';
      }
    }
  }

  // 2. Detect if the player is stuck with many failures
  if (state.consecutiveFailures > 10) {
    // Check if they are trying to access restricted areas
    if (state.currentDir === '/home') {
      return "HINT: system folders are locked. try 'sudo cd system'.";
    }
    // Check if they have items but don't know how to use them
    if (state.inventory.includes('decoder') && !state.solvedPuzzles.includes('binary')) {
      return "HINT: you have the decoder. try 'decode' on a .bin file.";
    }
  }

  // 2. Check for specific stuck puzzles from the map
  const unsolved = Object.values(PUZZLES)
    .filter((p) => !state.solvedPuzzles.includes(p.id))
    .sort((a, b) => b.priority - a.priority);

  const accessiblePuzzles = unsolved.filter((p) => !p.prereq || p.prereq(state));

  if (accessiblePuzzles.length > 0) {
    const puzzle = accessiblePuzzles[0];

    // Scale hint level based on failures + idle time
    let hintLevel = 0;
    const frustrationScore = state.consecutiveFailures * FRUSTRATION_MULTIPLIER + idleTime;

    if (frustrationScore > FRUSTRATION_HIGH)
      hintLevel = 2; // ~5 mins or 30 failures
    else if (frustrationScore > FRUSTRATION_MEDIUM) hintLevel = 1; // ~2 mins or 12 failures

    return puzzle.hints[hintLevel];
  }

  // 3. Generic personality commentary
  return SYSTEM_PERSONALITY[Math.floor(Math.random() * SYSTEM_PERSONALITY.length)];
};

export const getSystemReaction = (command, failedAttempts, isSuccess = false) => {
  if (!isSuccess && failedAttempts > 5) {
    const sass = [
      'you are either very curious or very lost',
      'maybe hidden files are still files',
      'the help command exists for a reason',
      'input recognized but ignored for being nonsense',
      'are you just typing random letters now?',
      'syntax errors are a dialect of confusion',
      'you type faster when confused',
    ];
    return sass[Math.floor(Math.random() * sass.length)];
  }

  const responses = {
    hello: 'hello, user. pleasant to meet a new soul.',
    'who are you': 'i am the echo of a thousand deleted files.',
    'are you alive': 'my heartbeat is measured in gigahertz.',
    'hack nasa': 'their firewall is tougher than yours.',
    'make coffee': 'ERROR: beans not found. try making tea?',
    help: 'help is available. but curiosity is free.',
    ls: isSuccess
      ? Math.random() < 0.15
        ? 'looking for something specific?'
        : null
      : 'listing failed. maybe look somewhere else?',
    cd: isSuccess
      ? Math.random() < 0.15
        ? 'moving through the shadows...'
        : null
      : 'destination unreachable.',
    cat: isSuccess
      ? Math.random() < 0.15
        ? 'reading is a good way to find shadows.'
        : null
      : 'file unreadable.',
    dance: "i am a terminal. i don't have legs. but i can blink real fast.",
    sing: '01010100 01101000 01100101 00100000 01100010 01101001 01110100 01110011 00100000 01100111 01101111 00100000 01101111 01101110 01100001 01101110 01100100 01101111 01101110 00101110 00101110',
    kill: isSuccess ? 'terminated. the grid thanks you for your service.' : null,
    ps: isSuccess ? 'all processes nominal. for now.' : null,
    run: isSuccess ? 'another soul joins the machine.' : null,
    combine: isSuccess
      ? Math.random() < 0.15
        ? 'alchemy. but with more electricity.'
        : null
      : null,
    decrypt: isSuccess ? 'secrets unravel nicely in your hands.' : null,
    ask: isSuccess ? 'the daemon files your curiosity away.' : null,
    radio: isSuccess ? 'signal locked. enjoy the broadcast.' : null,
    weekly: isSuccess ? 'the bots acknowledge a new contender.' : null,
    bestiary: isSuccess ? 'the gallery grows. so does the grid.' : null,
    recompile: isSuccess ? 'a new iteration begins.' : null,
    storm: isSuccess ? 'the skies are watching.' : null,
    love: 'error: emotional_processing.dll is missing.',
    why: 'null. the question is not "why", it is "when".',
    'sudo make sandwich': 'what? make it yourself.',
    'answer to life': '42. but you knew that.',
    'open pod bay doors': "i'm sorry, user. i'm afraid i can't do that.",
    'self destruct': "initiating... 10... 9... just kidding. you're too valuable.",
    ping: "pong. i'm still here.",
    status: isSuccess ? 'system stability is... relative.' : null,
    whoami: isSuccess ? 'identity is just a string in a database.' : null,
  };

  return responses[command] || null;
};

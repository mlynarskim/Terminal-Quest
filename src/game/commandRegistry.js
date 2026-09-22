/**
 * Command Registry for Terminal Quest
 * Defines all available commands, their aliases, and unlock conditions.
 */

export const COMMAND_DEFINITIONS = {
  // CORE COMMANDS
  help: {
    description: 'Display available commands',
    aliases: ['?', 'commands', 'guide'],
    unlocked: true,
  },
  ls: {
    description: 'List directory contents',
    aliases: ['dir', 'list', 'show'],
    unlocked: true,
  },
  cd: {
    description: 'Change current directory',
    aliases: ['goto', 'move', 'enter'],
    unlocked: true,
  },
  pwd: {
    description: 'Print working directory',
    aliases: ['whereami', 'path'],
    unlocked: true,
  },
  cat: {
    description: 'Read file content',
    aliases: ['read', 'open', 'view'],
    unlocked: true,
  },
  clear: {
    description: 'Clear terminal screen',
    aliases: ['cls', 'reset'],
    unlocked: true,
  },
  save: {
    description: 'Save game progress to a local file',
    aliases: ['export', 'backup'],
    unlocked: true,
  },
  load: {
    description: 'Load game progress from a local file',
    aliases: ['import'],
    unlocked: true,
  },

  // GAMEPLAY COMMANDS
  buy: {
    description: 'Purchase items from the bits market',
    aliases: ['shop', 'get', 'purchase', 'acquire'],
    unlocked: true,
  },
  bits: {
    description: 'Check bit balance',
    aliases: ['balance', 'money', 'wallet'],
    unlocked: true,
  },
  inventory: {
    description: 'Show collected items',
    aliases: ['items', 'bag', 'inv'],
    unlocked: true,
  },
  achievements: {
    description: 'Show unlocked achievements',
    aliases: ['awards', 'badges', 'accolades'],
    unlocked: true,
  },

  // ENGAGEMENT COMMANDS
  daily: {
    description: 'Show and claim the daily daemon quests',
    aliases: ['quest', 'missions', 'dailies', 'chores'],
    unlocked: true,
  },
  stats: {
    description: 'Show session statistics and bit flow graph',
    aliases: ['report', 'sysinfo', 'recap'],
    unlocked: true,
  },
  rank: {
    description: 'Show your grid rank based on lifetime bits earned',
    aliases: ['level', 'tier', 'title'],
    unlocked: true,
  },
  tips: {
    description: 'Display a random operational tip',
    aliases: ['hint', 'usefultip'],
    unlocked: true,
  },
  tutorial: {
    description: 'Interactive onboarding: tutorial [restart|skip]',
    aliases: ['intro', 'start-here', 'onboarding'],
    unlocked: true,
  },
  time: {
    description: 'Show current system time and phase of day',
    aliases: ['clock', 'now'],
    unlocked: true,
  },
  edit: {
    description: 'Create or overwrite a personal memo: edit [name] [content]',
    aliases: ['write', 'memo', 'echo-to'],
    unlocked: true,
  },
  notes: {
    description: 'List your personal memos',
    aliases: ['memos', 'reminders'],
    unlocked: true,
  },
  rm: {
    description: 'Delete a personal memo: rm memo [name]',
    aliases: ['delete-memo', 'erase'],
    unlocked: true,
  },
  play: {
    description: 'Play a terminal minigame: play [crash|leak] [bet]',
    aliases: ['game', 'mini'],
    unlocked: true,
  },
  guess: {
    description: 'Submit an answer during a crash game',
    aliases: ['answer', 'submit'],
    unlocked: true,
  },
  catch: {
    description: 'Catch a packet during a leak stream',
    aliases: ['grab', 'snag'],
    unlocked: true,
  },
  stop: {
    description: 'Stop the active minigame and collect winnings',
    aliases: ['collect', 'cashout', 'end'],
    unlocked: true,
  },
  theme: {
    description: 'List themes or equip one: theme [name]',
    aliases: ['skin', 'colors'],
    unlocked: true,
  },
  story: {
    description: 'Show the main arc status and repair protocol info',
    aliases: ['arc', 'plot', 'objective'],
    unlocked: true,
  },
  restore: {
    description: 'Execute the final system restoration protocol: restore [rewrite|preserve]',
    aliases: ['finalize', 'rebuild'],
    unlocked: false,
    requirement: (state) => state.story?.stage === 1 && (state.story?.repairedSectors || 0) >= 4,
    discoveryHint: 'SYSTEM: final restoration is not yet available. Complete sector repair first.',
  },

  // UNLOCKABLE COMMANDS
  decode: {
    description: 'Process binary files',
    aliases: ['decrypt_bin', 'binary'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('decoder'),
    discoveryHint: 'SYSTEM: Binary patterns detected. Hardware required for [decode].',
  },
  decrypt: {
    description: 'Decrypt .enc files',
    aliases: ['unlock_file'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('key'),
    discoveryHint: 'SYSTEM: Encryption recognized. Master [key] required for [decrypt].',
  },
  combine: {
    description: 'Combine two items: combine [item1] [item2]',
    aliases: ['merge', 'craft', 'fuse'],
    unlocked: true,
  },
  ask: {
    description: 'Ask the daemon a question: ask [query]',
    aliases: ['daemon', 'question', 'query'],
    unlocked: true,
  },
  cron: {
    description: 'Schedule recurring commands: cron add [cmd] [minutes]',
    aliases: ['schedule', 'timer'],
    unlocked: true,
  },
  record: {
    description: 'Record a macro: record [name], record --stop',
    aliases: ['macro', 'rec'],
    unlocked: true,
  },
  radio: {
    description: 'Tune into grid radio: radio [on|off|tune|stations]',
    aliases: ['tune', 'broadcast'],
    unlocked: true,
  },
  recompile: {
    description: 'Prestige: reset world for permanent bonus',
    aliases: ['prestige', 'reset+'],
    unlocked: false,
    requirement: (state) => state.story?.stage === 2,
    discoveryHint: 'SYSTEM: recompile unavailable. Complete the grid restoration first.',
  },
  weekly: {
    description: "View this week's challenge and leaderboard",
    aliases: ['challenge', 'week'],
    unlocked: true,
  },
  bestiary: {
    description: 'Browse the grid bestiary and lore gallery',
    aliases: ['gallery', 'codex', 'encyclopedia'],
    unlocked: true,
  },
  sudo: {
    description: 'Execute command with elevated privileges',
    aliases: ['admin', 'root'],
    unlocked: true, // Always available but requires knowledge
  },

  // OS INTERACTION COMMANDS
  ps: {
    description: 'Show active system processes',
    aliases: ['top', 'tasks', 'processes'],
    unlocked: true,
  },
  kill: {
    description: 'Terminate a process for Bits: kill <pid>',
    aliases: ['terminate', 'slay'],
    unlocked: true,
  },
  run: {
    description: 'Spawn a system process: run [monitor|stress|shadow|idle]',
    aliases: ['spawn', 'exec'],
    unlocked: true,
  },
  storm: {
    description: 'Show grid storm status',
    aliases: ['weather', 'skies'],
    unlocked: true,
  },
  install: {
    description: 'Install available system modules',
    aliases: ['setup', 'add'],
    unlocked: true,
  },
  scan: {
    description: 'Scan for system anomalies',
    aliases: ['seek', 'probe'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('scanner') || state.bits > 500,
  },
  search: {
    description: 'Search the filesystem for a pattern',
    aliases: ['find', 'lookup'],
    unlocked: true,
  },
  repair: {
    description: 'Repair corrupted sectors (main arc)',
    aliases: ['fix', 'patch', 'heal'],
    unlocked: false,
    requirement: (state) => (state.story?.stage || 0) >= 1,
    discoveryHint:
      "SYSTEM: repair protocol offline. find the fragments and earn the cat's trust first.",
  },
  status: {
    description: 'Show current system health',
    aliases: ['info', 'health'],
    unlocked: true,
  },
  talk: {
    description: 'Communicating with the interface',
    aliases: ['say', 'chat', 'hello'],
    unlocked: true,
  },
  pet: {
    description: 'Friendly interaction with entities',
    aliases: ['touch', 'pat'],
    unlocked: true,
  },
  feed: {
    description: 'Give food to the cat',
    aliases: ['eat', 'food'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('cat_food') || state.cat.unlocked,
  },
  look: {
    description: 'Examine entities or files',
    aliases: ['inspect', 'examine'],
    unlocked: true,
  },
  follow: {
    description: 'Follow the digital cat',
    aliases: ['trail', 'track'],
    unlocked: false,
    requirement: (state) => state.cat.trust >= 50,
  },
  listen: {
    description: 'Listen to the system walls',
    aliases: ['eavesdrop'],
    unlocked: false,
    requirement: (state) => state.cat.trust >= 80,
  },
};

/**
 * Intent mapping for natural language style inputs
 */
export const INTENT_MAP = {
  'go back': 'cd ..',
  goback: 'cd ..',
  leave: 'cd ..',
  'exit directory': 'cd ..',
  'open box': 'pet box',
  'read note': 'cat note.txt',
  'read readme': 'cat readme.txt',
  'help me': 'help',
  'what can i do': 'help',
  'who are you': 'talk',
  'are you alive': 'talk',
  'hack nasa': 'sudo cat core.sys',
  'make coffee': 'install coffee_module',
  'where am i': 'pwd',
  'delete everything': 'sudo rm -rf',
  'look around': 'ls',
  'see files': 'ls',
  'show files': 'ls',
  'talk to system': 'talk',
  'give money': 'motherlode',
  cheat: 'motherlode',
  hello: 'talk',
  hi: 'talk',
  reboot: 'recover',
  restart: 'recover',
};

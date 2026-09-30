/**
 * Command Registry for Terminal Quest
 *
 * Only grid-native commands live here — everything POSIX is defined in
 * `src/game/shell/` and injected at the bottom of this file, so `help` and
 * alias resolution always agree with what the shell can actually execute.
 */

import { shellCommandDefinitions } from './shell/tables';

export const GRID_COMMAND_DEFINITIONS = {
  // CORE
  help: {
    description: 'List every command — grid verbs and shell commands',
    aliases: ['?'],
    unlocked: true,
  },
  clear: {
    description: 'Clear the terminal screen (reset wipes progress instead)',
    aliases: ['cls'],
    unlocked: true,
  },
  reset: {
    description: 'Wipe all progress and achievements (asks for confirmation)',
    aliases: [],
    unlocked: true,
  },
  calm: {
    description: 'Toggle grid chaos: calm [on|off|toggle]',
    aliases: ['still', 'quiet'],
    unlocked: true,
  },
  save: {
    description: 'Export progress to a JSON file',
    aliases: ['backup'],
    unlocked: true,
  },
  load: {
    description: 'Import progress from a JSON file',
    aliases: ['import'],
    unlocked: true,
  },

  // FEATURE 1 — LEADERBOARD
  leaderboard: {
    description: 'Global scoreboard: leaderboard [me|submit|name <handle>|sync]',
    aliases: ['board', 'ladder', 'top10', 'scores'],
    unlocked: true,
  },

  // FEATURE 2 — LORE JOURNAL
  lore: {
    description: 'Read the lore journal: lore [id|all]',
    aliases: ['journal', 'chronicle', 'records'],
    unlocked: true,
  },

  // FEATURE 3 — GLITCH EVENTS
  glitch: {
    description: 'Glitch event status: glitch [list|force]',
    aliases: ['anomaly'],
    unlocked: true,
  },

  // ECONOMY
  buy: {
    description: 'Purchase items: buy box|cat_food|decoder|key|theme_<id>',
    aliases: ['shop'],
    unlocked: true,
  },
  bits: {
    description: 'Check your Bit balance',
    aliases: ['balance', 'wallet'],
    unlocked: true,
  },
  inventory: {
    description: 'Show collected items',
    aliases: ['items', 'inv'],
    unlocked: true,
  },
  achievements: {
    description: 'Show unlocked achievements',
    aliases: ['awards', 'badges'],
    unlocked: true,
  },
  combine: {
    description: 'Craft an item: combine <item1> <item2>',
    aliases: ['merge', 'craft'],
    unlocked: true,
  },

  // PROGRESS
  daily: {
    description: 'Show and claim the daily daemon quests',
    aliases: ['quest', 'missions', 'dailies'],
    unlocked: true,
  },
  weekly: {
    description: "This week's challenge and its local board",
    aliases: ['challenge', 'week'],
    unlocked: true,
  },
  stats: {
    description: 'Session statistics (--graph for the bit-flow chart)',
    aliases: ['report', 'recap'],
    unlocked: true,
  },
  rank: {
    description: 'Your grid rank based on lifetime bits earned',
    aliases: ['level', 'tier'],
    unlocked: true,
  },
  bestiary: {
    description: 'Browse the grid bestiary and lore gallery',
    aliases: ['gallery', 'codex', 'encyclopedia'],
    unlocked: true,
  },
  tutorial: {
    description: 'Guided onboarding: tutorial [restart|skip]',
    aliases: ['intro', 'onboarding'],
    unlocked: true,
  },
  tips: {
    description: 'Display a random operational tip',
    aliases: ['hint'],
    unlocked: true,
  },
  story: {
    description: 'Main arc status and repair protocol info',
    aliases: ['arc', 'plot'],
    unlocked: true,
  },
  restore: {
    description: 'Final restoration protocol: restore rewrite|preserve',
    aliases: ['finalize', 'rebuild'],
    unlocked: false,
    requirement: (state) => state.story?.stage === 1 && (state.story?.repairedSectors || 0) >= 4,
    discoveryHint: 'SYSTEM: final restoration is not yet available. Complete sector repair first.',
  },
  recompile: {
    description: 'Prestige: reset the arc for a permanent bonus',
    aliases: ['prestige'],
    unlocked: false,
    requirement: (state) => state.story?.stage === 2,
    discoveryHint: 'SYSTEM: recompile unavailable. Complete the grid restoration first.',
  },
  repair: {
    description: 'Repair one corrupted sector (main arc)',
    aliases: ['fix', 'patch'],
    unlocked: false,
    requirement: (state) => (state.story?.stage || 0) >= 1,
    discoveryHint:
      "SYSTEM: repair protocol offline. find the fragments and earn the cat's trust first.",
  },

  // CIPHERS
  decrypt: {
    description: 'Decrypt an .enc file',
    aliases: ['unlock_file'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('key') || state.inventory.includes('decoder'),
    discoveryHint: 'SYSTEM: Encryption recognized. A [key] or [decoder] is required for [decrypt].',
  },
  decode: {
    description: 'Process a binary file',
    aliases: ['decrypt_bin', 'binary'],
    unlocked: false,
    requirement: (state) => state.inventory.includes('decoder'),
    discoveryHint: 'SYSTEM: Binary patterns detected. Hardware required for [decode].',
  },
  scan: {
    description: 'Scan the grid for anomalies',
    aliases: [],
    unlocked: false,
    requirement: (state) => state.inventory.includes('scanner') || state.bits > 500,
    discoveryHint: 'SYSTEM: scan needs hardware. Buy a [scanner] or hold more than 500 Bits.',
  },

  // THE CAT
  pet: {
    description: 'Pet the cat (or the box it is hiding in)',
    aliases: ['pat'],
    unlocked: true,
  },
  feed: {
    description: 'Give cat food to the cat',
    aliases: [],
    unlocked: false,
    requirement: (state) => state.inventory.includes('cat_food') || state.cat.unlocked,
    discoveryHint: 'SYSTEM: the cat is hungry. buy cat_food first.',
  },
  talk: {
    description: 'Talk to the cat or to the system',
    aliases: ['say'],
    unlocked: true,
  },
  look: {
    description: 'Look at the cat',
    aliases: ['examine'],
    unlocked: true,
  },
  follow: {
    description: 'Follow the cat to the next objective',
    aliases: ['track'],
    unlocked: false,
    requirement: (state) => state.cat.trust >= 50,
    discoveryHint: 'SYSTEM: the cat will not lead you anywhere yet. Trust is too low.',
  },
  listen: {
    description: 'Listen to what the grid says in the walls',
    aliases: [],
    unlocked: false,
    requirement: (state) => state.cat.trust >= 80,
    discoveryHint: 'SYSTEM: there is only static until the cat trusts you.',
  },

  // WORLD
  ask: {
    description: 'Ask the daemon: ask <question>',
    aliases: ['daemon', 'question'],
    unlocked: true,
  },
  radio: {
    description: 'Grid radio: radio on|off|tune <station>|stations',
    aliases: ['broadcast'],
    unlocked: true,
  },
  storm: {
    description: 'Grid storm status',
    aliases: ['skies'],
    unlocked: true,
  },
  install: {
    description: 'Install a system module',
    aliases: ['setup'],
    unlocked: true,
  },
  status: {
    description: 'Current system health report',
    aliases: ['health', 'systeminfo'],
    unlocked: true,
  },
  ping: {
    description: 'Ping the loopback interface',
    aliases: [],
    unlocked: true,
  },
  recover: {
    description: 'Reboot the session back to the root directory',
    aliases: ['reboot', 'restart'],
    unlocked: true,
  },
  sudo: {
    description: 'Run a command with elevated privileges: sudo <command>',
    aliases: ['admin', 'root'],
    unlocked: true,
  },

  // AUTOMATION
  cron: {
    description: 'Schedule a recurring command: cron add <cmd> <minutes>',
    aliases: ['schedule'],
    unlocked: true,
  },
  record: {
    description: 'Record a macro: record <name> | record --stop',
    aliases: ['macro', 'rec'],
    unlocked: true,
  },
  play: {
    description: 'Play a minigame or macro: play crash|leak|snake|2048|memory|<macro>',
    aliases: ['game', 'mini'],
    unlocked: true,
  },
  guess: {
    description: 'Answer during a crash game',
    aliases: ['answer', 'submit'],
    unlocked: true,
  },
  catch: {
    description: 'Catch a packet during a leak stream',
    aliases: ['grab'],
    unlocked: true,
  },
  stop: {
    description: 'End the active minigame and collect winnings',
    aliases: ['collect', 'cashout'],
    unlocked: true,
  },

  // PERSONAL
  edit: {
    description: 'Write a file quickly: edit <name> <text> (or use echo > file)',
    aliases: ['memo'],
    unlocked: true,
  },
  notes: {
    description: 'List the files you have written',
    aliases: ['memos'],
    unlocked: true,
  },
  theme: {
    description: 'List themes or equip one: theme [name]',
    aliases: ['skin', 'colors'],
    unlocked: true,
  },
};

/** Grid commands first, then every real shell command with its aliases. */
export const COMMAND_DEFINITIONS = {
  ...GRID_COMMAND_DEFINITIONS,
  ...Object.fromEntries(
    shellCommandDefinitions().map((def) => [def.name, { ...def, name: undefined }])
  ),
};

/**
 * Intent mapping for natural language style inputs.
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
  'hack nasa': 'sudo cat /system/core.sys',
  'make coffee': 'install coffee_module',
  'where am i': 'pwd',
  'delete everything': 'sudo rm -rf /',
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
  'wipe save': 'reset',
  'wipe my progress': 'reset',
  'delete my save': 'reset',
  'show the journal': 'lore',
  'show the board': 'leaderboard',
  'how am i doing': 'leaderboard me',
};

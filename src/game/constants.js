// Timing constants (in milliseconds)
export const IDLE_HINT_THRESHOLD_MS = 60_000;
export const SPECIAL_COMMENTARY_MIN_MS = 180_000;
export const SPECIAL_COMMENTARY_MAX_MS = 225_000;
export const HINT_CHECK_INTERVAL_MS = 45_000;
export const GLITCH_DURATION_MS = 500;
export const EARLY_GLITCH_DELAY_MS = 180_000;
export const GLITCH_CHECK_INTERVAL_MS = 45_000;
export const CAT_ABSENCE_CHECK_INTERVAL_MS = 120_000;
export const CAT_ABSENCE_THRESHOLD_MS = 300_000;
export const BOOT_LINE_INTERVAL_MS = 600;
export const BOOT_PROGRESS_INTERVAL_MS = 50;
export const BOOT_TIMEOUT_MS = 8_000;
export const BSOD_MIN_MS = 2_000;
export const BSOD_MAX_MS = 6_000;
export const BSOD_DURATION_MS = 2_000;
export const COMMAND_LATENCY_MIN_MS = 200;
export const COMMAND_LATENCY_MAX_MS = 600;
export const DELAY_SHORT_MS = 500;
export const DELAY_MEDIUM_MS = 1_000;
export const DELAY_LONG_MS = 1_200;
export const DELAY_EXTRA_MS = 1_500;
export const DELAY_RECOVERY_MS = 2_000;
export const PROGRESS_BAR_STEP_MS = 400;

// Puzzle priorities
export const PUZZLE_PRIORITY = {
  START: 10,
  NAVIGATION: 9,
  MOTHERLODE: 8,
  BINARY: 7,
  DECRYPTION: 7,
  SUDO: 6,
  PROCESSES: 5,
  CRAFTING: 5,
  CIPHER: 4,
  WEEKLY: 3,
  RADIO: 2,
  MACRO: 1,
};

// Frustration / hint scaling
export const FRUSTRATION_HIGH = 300_000;
export const FRUSTRATION_MEDIUM = 120_000;
export const FRUSTRATION_MULTIPLIER = 10_000;

// Cat thresholds
export const CAT_TRUST_FOLLOW = 50;
export const CAT_TRUST_LISTEN = 80;
export const CAT_TRUST_INSIGHT = 90;
export const CAT_HUNGER_LOW = 30;
export const CAT_HUNGER_FEED = 20;
export const CAT_TRUST_GAIN_PET = 5;
export const CAT_TRUST_GAIN_PET_HUNGRY = 2;
export const CAT_TRUST_GAIN_FEED = 10;
export const CAT_FRAGMENT_TRUST_THRESHOLD = 80;
export const CAT_FRAGMENT_CHANCE = 0.2;
export const CAT_ABSENCE_CHANCE = 0.02;
export const CAT_RETURN_CHANCE = 0.1;
export const CAT_HUNGER_DECAY_CHANCE = 0.1;
export const CAT_HUNGER_DECAY_AMOUNT = 5;

// Glitch / personality chances
export const GLITCH_CHANCE = 0.05;
export const GLITCH_LINE_CHANCE = 0.05;
export const SYSTEM_REACTION_CHANCE = 0.15;
export const CAT_HINT_CHANCE = 0.4;

// Bit rewards
export const REWARD_MOTHERLODE = 150;
export const REWARD_ROSEBUD = 1;
export const REWARD_KONAMI = 100;
export const REWARD_LS_A = 20;
export const REWARD_CAT_FRIEND = 50;
export const REWARD_DECRYPTION = 75;
export const REWARD_BINARY = 50;
export const REWARD_CRASH = 50;
export const REWARD_FRAGMENT = 10;

// Shop prices
export const PRICE_BOX = 50;
export const PRICE_CAT_FOOD = 30;
export const PRICE_DECODER = 150;
export const PRICE_KEY = 200;

// System thresholds
export const REPAIR_BIT_THRESHOLD = 1_000;
export const OVERLOAD_BIT_THRESHOLD = 1_000;

// Daily quests
export const DAILY_QUEST_COUNT = 3;
export const DAILY_REWARD_BASE = 40;
export const DAILY_STREAK_BONUS = 15;
export const DAILY_STREAK_MILESTONE_3 = 150;
export const DAILY_STREAK_MILESTONE_7 = 500;
export const DAILY_STREAK_MILESTONE_30 = 2_000;
export const DAILY_HISTORY_LIMIT = 14;

// Quest targets
export const DAILY_TARGET_BITS = 100;
export const DAILY_TARGET_COMMANDS = 25;
export const DAILY_TARGET_DIRS = 6;
export const DAILY_TARGET_CAT = 4;

// Story arc
export const STORY_REPAIR_COST = 1_000;
export const STORY_REPAIR_SECTORS = 4;
export const STORY_COMPLETE_REWARD = 500;
export const STORY_FRAGMENT_TRIGGER = 3;

// Mini-games
export const GAME_CRASH_BET_MIN = 10;
export const GAME_CRASH_WIN_MULTIPLIER = 2;
export const GAME_CRASH_MAX_ATTEMPTS = 3;
export const GAME_LEAK_DURATION_MS = 8_000;
export const GAME_LEAK_REWARD_PER_CATCH = 2;
export const GAME_LEAK_JACKPOT_CATCHES = 20;

// Skins
export const PRICE_THEME_AMBER = 300;
export const PRICE_THEME_CYAN = 250;
export const PRICE_THEME_VIOLET = 400;

// Tips
export const TIP_CHECK_INTERVAL_MS = 90_000;

// ──────────────────────────────────────────────────────────────────────────────
// Processes
// ──────────────────────────────────────────────────────────────────────────────
export const PROCESS_SPAWN_CHECK_MS = 30_000;
export const PROCESS_SPAWN_CHANCE = 0.25;
export const PROCESS_MAX_COUNT = 5;
export const PROCESS_BASE_BITS_YIELD = 20;
export const PROCESS_DANGER_TICKS = 8;
export const PROCESS_DECAY_CHANCE = 0.1;

// ──────────────────────────────────────────────────────────────────────────────
// Crafting
// ──────────────────────────────────────────────────────────────────────────────
export const COMBINE_COST_BITS = 0;

// ──────────────────────────────────────────────────────────────────────────────
// Daemon chat
// ──────────────────────────────────────────────────────────────────────────────
export const DAEMON_COOLDOWN_MS = 3_000;

// ──────────────────────────────────────────────────────────────────────────────
// Cron / macros
// ──────────────────────────────────────────────────────────────────────────────
export const CRON_MIN_INTERVAL_MS = 60_000;
export const CRON_MAX_INTERVAL_MS = 3_600_000;
export const CRON_MAX_JOBS = 5;
export const MACRO_MAX_RECORDING_COMMANDS = 20;

// ──────────────────────────────────────────────────────────────────────────────
// Ciphers (encrypted files)
// ──────────────────────────────────────────────────────────────────────────────
export const CIPHER_REWARD_BITS = 100;
export const CIPHER_HINT_DELAY_MS = 2_000;

// ──────────────────────────────────────────────────────────────────────────────
// Prestige
// ──────────────────────────────────────────────────────────────────────────────
export const PRESTIGE_BITS_MULTIPLIER = 0.15;
export const PRESTIGE_BITS_BASE_BONUS = 200;
export const PRESTIGE_ACHIEVEMENT_PREFIX = 'RECOMPILE';

// ──────────────────────────────────────────────────────────────────────────────
// Radio
// ──────────────────────────────────────────────────────────────────────────────
export const RADIO_TRANSMISSION_CHECK_MS = 60_000;
export const RADIO_TRANSMISSION_CHANCE = 0.3;
export const RADIO_BITS_PER_CATCH = 15;

// ──────────────────────────────────────────────────────────────────────────────
// Weekly challenge
// ──────────────────────────────────────────────────────────────────────────────
export const WEEKLY_BITS_TARGET = 500;
export const WEEKLY_COMMANDS_TARGET = 100;
export const WEEKLY_REWARD_BITS = 150;

// ──────────────────────────────────────────────────────────────────────────────
// Bestiary / gallery
// ──────────────────────────────────────────────────────────────────────────────
export const BESTIARY_LORE_DISCOVERY_BITS = 50;

// ──────────────────────────────────────────────────────────────────────────────
// Storm events
// ──────────────────────────────────────────────────────────────────────────────
export const STORM_CHECK_MS = 120_000;
export const STORM_CHANCE = 0.12;
export const STORM_DURATION_MS = 45_000;
export const STORM_GLITCH_MULTIPLIER = 3;
export const STORM_SURVIVAL_REWARD = 80;

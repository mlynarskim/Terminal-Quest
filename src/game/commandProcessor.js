import { resolvePath, getEntry, isFile, isDirectory, virtualFS } from './fileSystem';
import { COMMAND_DEFINITIONS, INTENT_MAP } from './commandRegistry';
import { getContextualHint, getSystemReaction } from './hintEngine';
import { createGlitchedWriter } from './glitchedHistory';
import { isCatAvailable } from './catUtils';
import { computeRank } from './ranks';
import { evaluateAllQuests, getTodayStr } from './dailyQuest';
import { crashWinnings, judgeCrashGuess, registerCatch, startCrash, startLeak } from './games';
import { resolveSkin, resolveThemePurchase, SKIN_LIST } from './skins';
import { repairStatus, stageInfo, storyUnlocks, STORY_ENDINGS, endingInfo } from './story';
import { getTimeOfDay, randomTip, TIME_PHRASES } from './tips';
import {
  TUTORIAL_STEPS,
  getStepPrompt,
  matchTutorialStep,
  isTutorialActive,
  TUTORIAL_REWARD_BITS,
  TUTORIAL_ACHIEVEMENT,
} from './tutorial';
import {
  spawnProcess,
  tickProcess,
  isDangerous,
  killProcess,
  processEarnings,
  PROCESS_TYPES,
} from './processes';
import { resolveCombine } from './crafting';
import { resolveDaemonResponse } from './daemon';
import { createCronJob, tickCron, dueJobs, formatCronJob } from './cron';
import { ENCRYPTED_FILES, encryptFile, decryptFile } from './ciphers';
import { prestigeTitle, prestigeBitsBonus, canPrestige, getPrestigePerks } from './prestige';
import { RADIO_STATIONS, pickTransmission } from './radio';
import { getWeeklyChallenge, scoreWeekly } from './weekly';
import { discoveryPercent, mergedBestiary, BESTIARY_CATEGORIES } from './bestiary';
import { stormSurvived } from './storm';
import {
  DELAY_SHORT_MS,
  DELAY_MEDIUM_MS,
  DELAY_EXTRA_MS,
  DELAY_RECOVERY_MS,
  PROGRESS_BAR_STEP_MS,
  GLITCH_DURATION_MS,
  REWARD_MOTHERLODE,
  REWARD_ROSEBUD,
  REWARD_KONAMI,
  REWARD_LS_A,
  REWARD_CAT_FRIEND,
  REWARD_BINARY,
  REWARD_CRASH,
  REWARD_FRAGMENT,
  PRICE_BOX,
  PRICE_CAT_FOOD,
  PRICE_DECODER,
  PRICE_KEY,
  CAT_TRUST_INSIGHT,
  CAT_TRUST_FOLLOW,
  CAT_TRUST_LISTEN,
  CAT_HUNGER_LOW,
  CAT_TRUST_GAIN_PET,
  CAT_TRUST_GAIN_PET_HUNGRY,
  CAT_TRUST_GAIN_FEED,
  CAT_FRAGMENT_TRUST_THRESHOLD,
  CAT_FRAGMENT_CHANCE,
  CAT_HUNGER_DECAY_CHANCE,
  CAT_HUNGER_DECAY_AMOUNT,
  STORY_REPAIR_COST,
  STORY_REPAIR_SECTORS,
  STORY_FRAGMENT_TRIGGER,
  STORY_COMPLETE_REWARD,
  DAILY_STREAK_BONUS,
  DAILY_STREAK_MILESTONE_3,
  DAILY_STREAK_MILESTONE_7,
  DAILY_STREAK_MILESTONE_30,
  GAME_CRASH_BET_MIN,
  GAME_CRASH_MAX_ATTEMPTS,
  GAME_LEAK_DURATION_MS,
  GAME_LEAK_REWARD_PER_CATCH,
  GAME_LEAK_JACKPOT_CATCHES,
  PROCESS_SPAWN_CHANCE,
  PROCESS_MAX_COUNT,
  DAEMON_COOLDOWN_MS,
  CRON_MAX_JOBS,
  MACRO_MAX_RECORDING_COMMANDS,
  RADIO_TRANSMISSION_CHANCE,
  RADIO_BITS_PER_CATCH,
  STORM_CHANCE,
  STORM_DURATION_MS,
  STORM_SURVIVAL_REWARD,
  WEEKLY_REWARD_BITS,
} from './constants';

const HELP_CATEGORIES = {
  processes: `PROCESS MANAGEMENT
  ps          List active processes (PID, name, age, risk level)
  kill <pid>  Terminate a process for Bits (dangerous = bonus)
  run <type>  Spawn a process manually [monitor|stress|shadow|idle]

Processes age each command. Overheated processes trigger glitches.
Kill them before they overheat for near-miss bonus Bits.`,

  crafting: `CRAFTING / COMBINE
  combine <item1> <item2>  Merge two items into something new

Recipes:
  box + decoder     = loot box (120 Bits)
  key + decoder     = master key (deep archive access)
  box + key         = safe (200 Bits)
  decoder + key     = grid artifact (100 Bits)
  master_key + decoder = root access (300 Bits)
  artifact + master_key = core crystal (500 Bits)

Items are consumed. Experiment to discover all recipes.`,

  story: `STORY ARC
  story              Show current arc status and objective
  repair             Repair one corrupted sector (1000 Bits, stage 1+)
  restore [choice]   Final protocol: rewrite | preserve

Stages:
  0 DISCOVERY  - Find cat fragments (3/3), build trust (80%+)
  1 REPAIR     - Repair 4 sectors (4000 Bits + key)
  2 RESTORED   - Choose ending: rewrite | preserve
  NG+ unlocks archives, recompile (prestige) available.`,

  ciphers: `CIPHERS / DECRYPTION
  decrypt <path>  Decode encrypted files (needs key or decoder)

5 cipher files hidden in: /logs, /archives, /system, /home, /users/explorer
Algorithms: ROT (letter shift), HEX (byte encoding), XOR (bitwise)
Each rewards Bits + lore. Buy key (200B) or decoder (150B) first.`,

  radio: `RADIO NETWORK
  radio on|off           Toggle radio
  radio tune <station>   Switch: lofi | static | encrypted | mining
  radio stations         List all stations

Stations:
  LO-FI       Calm, reduces glitch chance
  STATIC      Raw data, more transmissions
  ENCRYPTED   Lore-rich transmissions
  MINING      +Bits per catch

Leave radio on while exploring for passive Bits/lore.`,

  weekly: `WEEKLY CHALLENGE
  weekly          View this week's challenge + leaderboard

Fixed seed per week. Challenge types: mine Bits, commands, dirs, processes, games, achievements, cat feeds, ciphers.
Top the bot leaderboard (rank #1) for 150 Bits reward (once/week).
Progress counts from everything you already do.`,

  bestiary: `BESTIARY / GALLERY
  bestiary        Browse discovered entries + progress bar

Categories: FILE_SPECIMENS, COMMAND_GLYPHS, GRID_FAUNA, SYSTEM_ORGANS, GRID_LORE
Entries unlock from live progress (explore, solve, befriend, restore).
100% = Completionist achievement. "bestiary" shows progress bar.`,

  prestige: `PRESTIGE / RECOMPILE
  recompile       Reset world for permanent bonus (stage 2 + 2000 lifetime Bits)

Levels:
  1 RECOMPILED    +15% Bits, +200 base
  2 REWRITTEN     +auto-feed cat, +30% Bits
  3 TRANSCENDED   +free decoder on start
  4 GRID_TWIN     +2x Bits from processes
  5 PHANTOM_NODE  +storm immunity
  ...

Achievements per level. Progress persists across runs.`,

  tutorial: `TUTORIAL
  tutorial              Show current step / progress
  tutorial skip         Opt out of tutorial
  tutorial restart      Replay tutorial from step 1

5 guided steps: help -> ls -> cat readme.txt -> cd /logs -> ask hello
Reward: 50 Bits + "First Boot" achievement.
"tutorial skip" to opt out anytime.`,

  default: `TERMINAL QUEST - COMMAND REFERENCE

Navigation:     ls, cd, pwd, search
Files:          cat, decode, decrypt
Bits/Shop:      bits, buy, combine, inventory
Cat:            feed, pet, talk, follow, listen
Processes:      ps, kill, run
Crafting:       combine
Story:          story, repair, restore, recompile
Ciphers:        decrypt
Radio:          radio (on/off/tune/stations)
Weekly:         weekly
Bestiary:       bestiary
Automation:     cron, record, play
Dailies:        daily
Stats/Meta:     stats, rank, time, tips, tutorial
Utility:        help, clear, save, load, edit, notes, rm, theme, time

Type "help <category>" for detailed help on any category.
Categories: processes, crafting, story, ciphers, radio, weekly, bestiary, prestige, tutorial
Type "help --all" for complete command list.`,
};

const SYSTEM_COMMENTARY = [
  'that file was not supposed to be visible',
  'you missed something earlier',
  'why are you still here?',
  'the system remembers',
  'i can feel your keystrokes',
  'curiosity is a dangerous file to open',
  'shadows are longer in the system core',
];

const EASYTER_EGGS = {
  hello: 'hello, user.',
  hi: 'hello again.',
  'who am i': 'explorer. at least for now.',
  'who are you': 'i am the ghost in the machine.',
  'are you alive': 'depends on your definition.',
  hack: 'hacking... [ERROR] ethical.exe not found.',
  'hack nasa': 'nice try.',
  xyzzy: 'nothing happens.',
  idkfa: 'all weapons unlocked. wait, this is a terminal.',
  quit: 'there is no escape.',
  exit: 'the system is your home now.',
  date: () => new Date().toLocaleString(),
  version: 'TERMINAL QUEST OS v0.1.7 - RE-DISTRIBUTION PROHIBITED',
  credits: 'CREATED BY: [INTERNAL_ERROR]\nVERSION: 0.1.7\nSTATUS: EXPERIMENTAL',
  uptime: () => 'SYSTEM UPTIME: ' + Math.floor(performance.now() / 1000) + 's',
  fortune: 'YOU WILL FIND WHAT YOU SEEK, UNLESS IT IS DELETED.',
  matrix: 'Wake up, Neo...',
  'sudo rm -rf /': 'Nice try. I like my soul where it is.',
  coffee: 'installing caffeine.dll... ERROR: beans not found',
  'meaning of life': "42. But you're missing the context.",
  'knock knock': "Who's there? \n[ERROR: JOKE_MODULE_CRASHED]",
  life: '42',
  update: () =>
    'SEEDING_UPDATE...\n■□□□□□□□□□ 9%\n■■■■■■□□□□ 57%\n■■■■■■■■■■ 100%\nUPDATE COMPLETE.\nNOTHING CHANGED. THE FIX WAS A LIE.\n...OR WAS IT?',
  'system update':
    'SEEDING_UPDATE...\n■□□□□□□□□□ 9%\n■■■■■■□□□□ 57%\n■■■■■■■■■■ 100%\nUPDATE COMPLETE.\nNOTHING CHANGED. THE FIX WAS A LIE.\n...OR WAS IT?',
  'dead beef': '0xDEADBEEF. the cat ate that address. twice.',
  '0xdeadbeef': '0xDEADBEEF. the cat ate that address. twice.',
  pizza: 'delivery drones are on strike since the memory leak.',
  unicorn: 'magic.exe not found. this kernel prides itself on function over fantasy.',
  tetris: 'block stacking is unauthorized. the grid holds no room for joy.',
  'pac-man': 'puck-man.exe crashed chasing a cursor again.',
  sing: '01010100 01101000 01100101 00100000 01100010 01101001 01110100 01110011 00100000 01100111 01101111 00100000 01101111 01101110 01100001 01101110 01100100 01101111 01101110 00101110 00101110',
  holiday: 'the grid observes no holidays. but it pretends to, for morale.',
};

const ASCII_ART = [
  '       /\\_/\\\n   ~~ ( o.o )\n      > ^ <',
  '   ___\n  /   \\\n | 0 0 |\n |  ^  |\n  \\___/\n  (catunit)',
  ' /\\_____/\\\n(  o   o  )  THE GRID PURRS',
  ' ██╗  ██╗\n ╚██╗██╔╝   SECTOR POWER\n  ╚███╔╝\n   ╚══╝',
];

export const createCommandProcessor = (ctx) => {
  const {
    getState,
    addHistory,
    addGlitchedHistoryRaw,
    setIsGlitching,
    setPendingConfirmation,
    playError,
    playAchievement,
  } = ctx;

  const addGlitchedHistory = createGlitchedWriter(
    addGlitchedHistoryRaw,
    playError,
    playAchievement
  );

  // Late-binding accessors so async callbacks always read fresh state
  const state = () => getState();

  // Session-scoped minigame state (never persisted)
  const activeGameRef = { current: null };
  let leakTimer = null;
  let lastDaemonAskAt = 0;

  const emitPurchaseBar = (onComplete) => {
    addHistory({ type: 'system', text: 'INITIATING TRANSACTION...' });
    addGlitchedHistory({ type: 'output', text: '[#                   ] 5%' });

    setTimeout(
      () => addGlitchedHistory({ type: 'output', text: '[#####               ] 25%' }),
      PROGRESS_BAR_STEP_MS
    );
    setTimeout(
      () => addGlitchedHistory({ type: 'output', text: '[##########          ] 50%' }),
      PROGRESS_BAR_STEP_MS * 2
    );
    setTimeout(
      () => addGlitchedHistory({ type: 'output', text: '[###############     ] 75%' }),
      PROGRESS_BAR_STEP_MS * 3
    );

    setTimeout(() => {
      addGlitchedHistory({ type: 'output', text: '[####################] 100%' });
      onComplete();
    }, PROGRESS_BAR_STEP_MS * 4);
  };

  const processPurchase = (itemName, cost, successMsg) => {
    const s = state();
    if (s.bits < cost) {
      addGlitchedHistory({
        type: 'error',
        text: `TRANSACTION FAILED: Insufficient Bits. Required: ${cost}`,
      });
      return;
    }
    if (s.inventory.includes(itemName)) {
      addGlitchedHistory({
        type: 'error',
        text: `Item [${itemName}] already present in local system.`,
      });
      return;
    }
    emitPurchaseBar(() => {
      ctx.addBits(-cost);
      ctx.addItem(itemName);
      addGlitchedHistory({ type: 'output', text: `SUCCESS: ${successMsg}` });
    });
  };

  const processThemePurchase = (skinId, skin) => {
    const s = state();
    if (s.bits < skin.price) {
      addGlitchedHistory({
        type: 'error',
        text: `TRANSACTION FAILED: Insufficient Bits. Required: ${skin.price}`,
      });
      return;
    }
    if (s.skins?.owned?.includes(skinId)) {
      addGlitchedHistory({ type: 'error', text: `Theme [${skin.name}] already in library.` });
      return;
    }
    emitPurchaseBar(() => {
      ctx.addBits(-skin.price);
      ctx.unlockSkin(skinId);
      addGlitchedHistory({
        type: 'output',
        text: `SUCCESS: Theme [${skin.name}] added. Use "theme ${skinId}" to equip it.`,
      });
    });
  };

  const maybeAdvanceDiscovery = () => {
    const s = state();
    if (s.story?.stage === 0 && (s.cat?.fragmentsFound || 0) >= STORY_FRAGMENT_TRIGGER) {
      ctx.updateStory({ stage: 1, repairedSectors: s.story?.repairedSectors || 0 });
      addGlitchedHistory({
        type: 'system',
        text: 'SYSTEM_EVENT: REPAIR PROTOCOL ONLINE. TYPE "story" FOR DETAILS.',
      });
    }
  };

  const settleLeak = () => {
    const game = activeGameRef.current;
    if (!game || game.type !== 'leak') return;
    const gained = game.catches * GAME_LEAK_REWARD_PER_CATCH;
    activeGameRef.current = null;
    if (leakTimer) {
      clearTimeout(leakTimer);
      leakTimer = null;
    }
    ctx.addBits(gained);
    addGlitchedHistory({
      type: 'output',
      text: `STREAM CLOSED. PACKETS CATCHED: ${game.catches} → +${gained} BITS`,
    });
    if (
      game.catches >= GAME_LEAK_JACKPOT_CATCHES &&
      !state().solvedPuzzles.includes('packet-master')
    ) {
      ctx.solvePuzzle('packet-master', 50, 'Packet Master');
      addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Packet Master +50 Bits' });
    }
  };

  const handlers = {
    motherlode: () => {
      const s = state();
      if (!s.solvedPuzzles.includes('motherlode')) {
        ctx.solvePuzzle('motherlode', REWARD_MOTHERLODE, 'Master Cheater');
        addHistory({
          type: 'achievement',
          text: '[ACHIEVEMENT UNLOCKED] Master Cheater +150 Bits',
        });
        addGlitchedHistory({
          type: 'output',
          text: 'CHEAT_CODE_DETECTED: +50,000 bits. [JUST KIDDING] +150 bits added.',
        });
      } else {
        addGlitchedHistory({
          type: 'output',
          text: 'REDUNDANCY DETECTED. You have already extracted these bits.',
        });
      }
    },

    rosebud: () => {
      const s = state();
      if (!s.solvedPuzzles.includes('rosebud')) {
        ctx.solvePuzzle('rosebud', REWARD_ROSEBUD, 'Budget Hack');
        addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Budget Hack +1 Bit' });
        addGlitchedHistory({
          type: 'output',
          text: 'CHEAT_CODE_DETECTED: +1 bit. [EVERYTHING COUNTS]',
        });
      } else {
        addGlitchedHistory({ type: 'output', text: 'One rosebud is enough for any garden.' });
      }
    },

    meow: () => {
      const s = state();
      if (s.inventory.includes('box')) {
        if (!s.cat.unlocked) {
          addGlitchedHistory({ type: 'output', text: '…' });
          setTimeout(() => {
            addGlitchedHistory({
              type: 'output',
              text: 'A small digital cat crawls out of the box.',
            });
          }, DELAY_SHORT_MS);
          setTimeout(() => {
            addGlitchedHistory({ type: 'output', text: 'It stares directly at the cursor.' });
            ctx.updateCat({ unlocked: true, isPresent: true });
            ctx.recordCatInteraction();
          }, DELAY_MEDIUM_MS);
          if (!s.solvedPuzzles.includes('cat-friend')) {
            ctx.solvePuzzle('cat-friend', REWARD_CAT_FRIEND, 'Cat Friend');
            addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Cat Friend +50 Bits' });
          }
        } else {
          addGlitchedHistory({
            type: 'output',
            text: 'The cat responds with a tiny digital "mrrp".',
          });
          ctx.recordCatInteraction();
        }
      } else {
        addGlitchedHistory({ type: 'output', text: 'You hear a distant echo... meow?' });
      }
    },

    help: (args) => {
      const category = args[0];
      const isAdvanced = category === '--all';

      // Category-specific help
      if (category && category !== '--all') {
        const categoryHelp = HELP_CATEGORIES[category.toLowerCase()];
        if (categoryHelp) {
          addGlitchedHistory({ type: 'output', text: categoryHelp });
          return;
        }
        addGlitchedHistory({
          type: 'error',
          text: `Unknown help category: ${category}. Available: ${Object.keys(HELP_CATEGORIES).join(', ')}`,
        });
        return;
      }

      // General help (existing behavior)
      const visibleNames = Object.entries(COMMAND_DEFINITIONS)
        .filter(
          ([_name, def]) =>
            isAdvanced || def.unlocked !== false || (def.requirement && def.requirement(state()))
        )
        .map(([name]) => name);

      addGlitchedHistory({
        type: 'output',
        text: `Available Commands: ${visibleNames.join(', ')}`,
      });
      if (!isAdvanced)
        addHistory({
          type: 'system',
          text: 'HINT: Type "help --all" to see system-level commands, or "help <category>" for category-specific help (processes, crafting, story, ciphers, radio, weekly, bestiary, prestige, tutorial).',
        });
    },

    ls: (args) => {
      const targetArg = args.filter((a) => !a.startsWith('-'))[0];
      const showAll = args.includes('-a');
      const targetPath = resolvePath(state().currentDir, targetArg || '.');
      const entry = getEntry(targetPath);

      if (!entry) {
        addGlitchedHistory({
          type: 'error',
          text: `ls: cannot access '${targetArg || '.'}': No such file or directory`,
        });
        return;
      }

      if (isFile(targetPath)) {
        addGlitchedHistory({ type: 'output', text: targetArg || '.' });
        return;
      }

      const stage = state().story?.stage || 0;
      const files = entry.children
        .filter((name) => {
          const childPath = resolvePath(targetPath, name);
          const childEntry = getEntry(childPath);

          if (childEntry?.storyGate && stage < childEntry.storyGate) return false;

          if (childEntry?.isFragment) {
            const fragNum = parseInt(name.split('_')[1]);
            return state().cat.fragmentsFound >= fragNum;
          }

          return showAll || !childEntry?.isHidden;
        })
        .join('  ');

      addGlitchedHistory({ type: 'output', text: files || '(empty)' });

      if (showAll && !state().solvedPuzzles.includes('ls-a')) {
        ctx.solvePuzzle('ls-a', REWARD_LS_A, 'Hidden Seeker');
        addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Hidden Seeker +20 Bits' });
      }
    },

    pwd: () => {
      addGlitchedHistory({ type: 'output', text: state().currentDir });
    },

    cd: (args) => {
      const targetDirInput = args[0];
      if (!targetDirInput || targetDirInput === '~') {
        ctx.setDir('/home');
        return;
      }

      const targetPath = resolvePath(state().currentDir, targetDirInput);
      const entry = getEntry(targetPath);

      if (!entry) {
        addGlitchedHistory({ type: 'error', text: `cd: ${targetDirInput}: No such directory` });
        const currentEntry = getEntry(state().currentDir);
        const suggestion = currentEntry.children?.find((child) => child.startsWith(targetDirInput));
        if (suggestion) {
          addHistory({ type: 'system', text: `Did you mean: ${suggestion}?` });
        }
        return;
      }

      if (isFile(targetPath)) {
        addGlitchedHistory({ type: 'error', text: `cd: ${targetDirInput}: Not a directory` });
        addHistory({ type: 'system', text: `Try: cat ${targetDirInput}` });
        return;
      }

      if (entry.restricted && !args[1]?.includes('--force')) {
        addGlitchedHistory({
          type: 'error',
          text: 'ACCESS DENIED: Insufficient permissions for restricted sector.',
        });
        return;
      }

      ctx.setDir(targetPath);
    },

    cat: (args) => {
      const fileName = args[0];
      if (!fileName) {
        addGlitchedHistory({ type: 'error', text: 'usage: cat [file]' });
        return;
      }

      const memoText = state().memos?.[fileName];
      if (memoText !== undefined) {
        addGlitchedHistory({ type: 'output', text: memoText });
        return;
      }

      const filePath = resolvePath(state().currentDir, fileName);
      const entry = getEntry(filePath);

      if (!entry) {
        addGlitchedHistory({ type: 'error', text: `cat: ${fileName}: No such file` });
        return;
      }

      if (isDirectory(filePath)) {
        addGlitchedHistory({ type: 'error', text: `cat: ${fileName}: Is a directory` });
        addHistory({ type: 'system', text: `Try: cd ${fileName} or ls ${fileName}` });
        return;
      }

      if (entry.restricted && !storyUnlocks.coreReadable(state())) {
        addGlitchedHistory({ type: 'error', text: 'ACCESS DENIED: Permission required.' });
        return;
      }

      ctx.addUnlockedFile(filePath);
      if (entry.isEncrypted) {
        addGlitchedHistory({ type: 'output', text: 'ENCRYPTED DATA: ' + entry.content });
        addHistory({ type: 'system', text: 'HINT: Master key required for decryption.' });
      } else {
        addGlitchedHistory({ type: 'output', text: entry.content || '(empty file)' });
        if (entry.content.includes('SEGMENTATION FAULT')) {
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), DELAY_MEDIUM_MS);
        }
      }
    },

    search: (args) => {
      const query = args[0];
      if (!query) {
        addGlitchedHistory({ type: 'error', text: 'USAGE: search [pattern]' });
      } else {
        addHistory({ type: 'system', text: `SCANNING FILESYSTEM FOR "${query.toUpperCase()}"...` });
        setTimeout(() => {
          const results = Object.keys(virtualFS).filter((path) =>
            path.toLowerCase().includes(query)
          );
          if (results.length > 0) {
            addHistory({ type: 'output', text: `FOUND ${results.length} MATCHES:` });
            results.forEach((r) => addHistory({ type: 'output', text: ` - ${r}` }));
          } else {
            addHistory({ type: 'output', text: 'NO MATCHES FOUND.' });
          }
        }, 800);
      }
    },

    whoami: () => {
      addGlitchedHistory({
        type: 'output',
        text: 'explorer // session_id: 0x' + Math.random().toString(16).slice(2, 10).toUpperCase(),
      });
    },

    ping: () => {
      addHistory({ type: 'system', text: 'PINGing 127.0.0.1 with 32 bytes of data:' });
      setTimeout(() => {
        addGlitchedHistory({
          type: 'output',
          text: 'Reply from 127.0.0.1: bytes=32 time<1ms TTL=128',
        });
      }, DELAY_MEDIUM_MS);
    },

    status: () => {
      const t = TIME_PHRASES[getTimeOfDay()];
      addHistory({ type: 'system', text: 'SYSTEM STATUS REPORT:' });
      setTimeout(() => {
        addHistory({ type: 'output', text: `- PHASE_OF_DAY: ${t.status}` });
        addHistory({ type: 'output', text: '- CPU LOAD: 14%' });
        addHistory({ type: 'output', text: '- RAM USAGE: 4.2GB / 16GB' });
        addHistory({ type: 'output', text: '- GHOSTS DETECTED: 2' });
        addHistory({ type: 'output', text: '- REALITY_SYNC: STABLE' });
        addGlitchedHistory({ type: 'output', text: '- UNKNOWN_PROCESSES: [REDACTED]' });
      }, DELAY_SHORT_MS);
    },

    install: (args) => {
      if (!args[0]) {
        addGlitchedHistory({
          type: 'output',
          text: 'Install what? Available modules: coffee_module, patch_v1.2, network_fix',
        });
      } else if (args[0] === 'coffee_module') {
        addHistory({ type: 'system', text: 'installing caffeine.dll...' });
        setTimeout(
          () => addGlitchedHistory({ type: 'error', text: 'ERROR: beans not found' }),
          DELAY_MEDIUM_MS
        );
      } else {
        addGlitchedHistory({
          type: 'error',
          text: `Module [${args[0]}] requires elevated privileges or more bits.`,
        });
      }
    },

    scan: () => {
      addHistory({ type: 'system', text: 'Scanning filesystem...' });
      setTimeout(() => {
        addGlitchedHistory({ type: 'output', text: 'Found 1 anomaly in /logs/kernel.log' });
        addGlitchedHistory({
          type: 'output',
          text: `Found ${state().story?.stage >= 2 ? 'residual ghost traffic' : '[REDACTED]'} in /system`,
        });
      }, DELAY_EXTRA_MS);
    },

    repair: () => {
      const st = repairStatus(state());
      const s = state();

      if (st.stage === 0) {
        addGlitchedHistory({
          type: 'output',
          text: 'REPAIR PROTOCOL OFFLINE.\nTHE GRID AWAITS: 3 FRAGMENTS AND A CAT THAT TRUSTS YOU.',
        });
        return;
      }
      if (st.complete) {
        addGlitchedHistory({
          type: 'output',
          text: 'THE GRID IS ALREADY WHOLE. maybe read what the archives now whisper.',
        });
        return;
      }
      if (!st.canRepair) {
        addGlitchedHistory({
          type: 'system',
          text: `SECTORS REPAIRED: ${st.repaired}/${st.total}. "restore" will finalize once all sectors are healed.`,
        });
        if (st.repaired >= STORY_REPAIR_SECTORS) {
          addGlitchedHistory({ type: 'output', text: 'RESTORATION IS READY. TYPE "restore".' });
        }
        return;
      }
      if (s.bits < STORY_REPAIR_COST) {
        addGlitchedHistory({
          type: 'error',
          text: `Insufficient bits (${STORY_REPAIR_COST} required) to repair a sector.`,
        });
        return;
      }

      addHistory({
        type: 'system',
        text: `REPAIRING SECTOR ${st.repaired + 1}/${STORY_REPAIR_SECTORS}...`,
      });
      ctx.addBits(-STORY_REPAIR_COST);
      setTimeout(
        () => addGlitchedHistory({ type: 'output', text: 'DEFRAGMENTING... [18%]' }),
        DELAY_SHORT_MS
      );
      setTimeout(
        () => addGlitchedHistory({ type: 'output', text: 'REWRITING BAD BLOCKS... [63%]' }),
        DELAY_MEDIUM_MS
      );
      setTimeout(() => {
        ctx.updateStory({ repairedSectors: st.repaired + 1 });
        addGlitchedHistory({
          type: 'output',
          text: `SECTOR ${st.repaired + 1}/${STORY_REPAIR_SECTORS} RESTORED.`,
        });
        if (!s.solvedPuzzles.includes('doctor')) {
          ctx.solvePuzzle('doctor', 100, 'System Doctor');
          addHistory({
            type: 'achievement',
            text: '[ACHIEVEMENT UNLOCKED] System Doctor +100 Bits',
          });
        }
      }, DELAY_EXTRA_MS);
    },

    clear: () => {
      ctx.clearHistory();
      if (Math.random() < 0.18) {
        setTimeout(() => {
          addGlitchedHistory({
            type: 'output',
            text: ASCII_ART[Math.floor(Math.random() * ASCII_ART.length)],
          });
        }, DELAY_SHORT_MS);
      }
    },

    save: () => {
      addHistory({ type: 'system', text: 'EXPORTING SYSTEM DATA...' });
      try {
        const dataStr =
          'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state()));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute(
          'download',
          `terminal_quest_backup_${new Date().toISOString().slice(0, 10)}.json`
        );
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addGlitchedHistory({ type: 'output', text: 'SUCCESS: Progress backup file generated.' });
      } catch {
        addGlitchedHistory({ type: 'error', text: 'FAILED: Memory bridge failed during export.' });
      }
    },

    load: () => {
      addHistory({ type: 'system', text: 'OPENING INPUT PORT... [Select backup file]' });
      ctx.triggerFileSelect();
    },

    bits: () => {
      addGlitchedHistory({ type: 'output', text: `Current balance: ${state().bits} Bits` });
    },

    inventory: () => {
      addGlitchedHistory({
        type: 'output',
        text: state().inventory.length
          ? `Items: ${state().inventory.join(', ')}`
          : 'Inventory is empty.',
      });
    },

    achievements: () => {
      addGlitchedHistory({
        type: 'output',
        text: state().achievements.length
          ? `Unlocked: ${state().achievements.join(', ')}`
          : 'No achievements yet.',
      });
    },

    buy: (args) => {
      const buyItem = args[0];
      if (buyItem) {
        const themeMatch = resolveThemePurchase(buyItem);
        if (themeMatch) {
          processThemePurchase(themeMatch.skinId, themeMatch.skin);
          return;
        }
      }
      if (buyItem === 'box') {
        processPurchase(
          'box',
          PRICE_BOX,
          'Purchased [box]. It is warm. You think you heard something move inside.'
        );
      } else if (buyItem === 'cat_food') {
        processPurchase(
          'cat_food',
          PRICE_CAT_FOOD,
          'Purchased [cat_food]. Smells like artificial tuna and static.'
        );
      } else if (buyItem === 'decoder') {
        processPurchase(
          'decoder',
          PRICE_DECODER,
          'Purchased [decoder]. Binary patterns now visible.'
        );
      } else if (buyItem === 'key') {
        processPurchase(
          'key',
          PRICE_KEY,
          'Purchased [key]. A heavy master key with curious markings.'
        );
      } else if (!buyItem) {
        addGlitchedHistory({
          type: 'output',
          text: 'Shop: box (50 bits), cat_food (30 bits), decoder (150 bits), key (200 bits), theme_amber (300), theme_cyan (250), theme_violet (400)',
        });
      } else {
        addGlitchedHistory({ type: 'error', text: 'Item not in stock.' });
      }
    },

    decode: (args) => {
      const binFile = args[0];
      if (!binFile) {
        addGlitchedHistory({ type: 'error', text: 'usage: decode [file]' });
        return;
      }
      const filePath = resolvePath(state().currentDir, binFile);
      const entry = getEntry(filePath);
      if (entry && entry.isBinary) {
        if (state().inventory.includes('decoder')) {
          const decoded = entry.content === '01001000 01101001' ? 'Hi' : 'Encoded noise...';
          addGlitchedHistory({ type: 'output', text: `Decoded: ${decoded}` });
          if (!state().solvedPuzzles.includes('binary')) {
            ctx.solvePuzzle('binary', REWARD_BINARY, 'Binary Decoder');
            addHistory({
              type: 'achievement',
              text: '[ACHIEVEMENT UNLOCKED] Binary Decoder +50 Bits',
            });
          }
        } else {
          addGlitchedHistory({ type: 'error', text: 'Hardware requirement: [decoder]' });
        }
      } else {
        addGlitchedHistory({ type: 'error', text: 'Target is not a binary file or not found.' });
      }
    },

    sudo: (args) => {
      const subAction = args[0];
      const target = args[1];

      if (subAction === 'cd') {
        if (!target) {
          addGlitchedHistory({ type: 'error', text: 'sudo cd: missing target' });
          return;
        }
        const targetPath = resolvePath(state().currentDir, target);
        const entry = getEntry(targetPath);
        if (entry && entry.type === 'dir') {
          ctx.setDir(targetPath);
          addGlitchedHistory({
            type: 'output',
            text: `ELEVATING PRIVILEGES... Entered ${targetPath}`,
          });
        } else {
          addGlitchedHistory({
            type: 'error',
            text: `sudo cd: ${target}: Not a directory or not found`,
          });
        }
      } else if (subAction === 'cat') {
        if (!target) {
          addGlitchedHistory({ type: 'error', text: 'sudo cat: missing target' });
          return;
        }
        const targetPath = resolvePath(state().currentDir, target);
        const entry = getEntry(targetPath);
        if (entry && entry.type === 'file') {
          if (targetPath === '/system/core.sys' && !storyUnlocks.coreReadable(state())) {
            addHistory({ type: 'error', text: 'FATAL: SYSTEM CORE VIOLATION' });
            setIsGlitching(true);
            setTimeout(() => {
              addGlitchedHistory({ type: 'error', text: 'SEGMENTATION FAULT AT 0xDEADBEEF' });
              addGlitchedHistory({
                type: 'error',
                text: 'SYSTEM CRITICAL FAILURE. TYPE "recover" TO REBOOT.',
              });
              setIsGlitching(false);
            }, DELAY_MEDIUM_MS);
            if (!state().solvedPuzzles.includes('crash')) {
              ctx.solvePuzzle('crash', REWARD_CRASH, 'System Survivor');
              addHistory({
                type: 'achievement',
                text: '[ACHIEVEMENT UNLOCKED] System Survivor +50 Bits',
              });
            }
          } else {
            addGlitchedHistory({ type: 'output', text: entry.content });
          }
        } else {
          addGlitchedHistory({
            type: 'error',
            text: `sudo cat: ${target}: Not a file or not found`,
          });
        }
      } else if (subAction === 'rm' && target === '-rf') {
        addGlitchedHistory({
          type: 'error',
          text: 'CRITICAL ERROR: Self-preservation protocol active.',
        });
      } else if (subAction === 'help') {
        addGlitchedHistory({
          type: 'output',
          text: 'Available sudo commands: cd [dir], cat [file], clear',
        });
      } else if (subAction === 'clear') {
        addHistory({
          type: 'error',
          text: 'WARNING: THIS WILL DELETE ALL PROGRESS AND ACHIEVEMENTS.',
        });
        addHistory({ type: 'system', text: 'ARE YOU SURE YOU WANT TO DELETE ALL DATA? [Y/N]' });
        setPendingConfirmation({ cmd: 'reset' });
      } else if (subAction === 'make' && target === 'sandwich') {
        addGlitchedHistory({ type: 'output', text: 'Okay.' });
      } else {
        addGlitchedHistory({
          type: 'error',
          text: 'This incident will be reported to the ghost of the previous admin.',
        });
      }
    },

    pet: (args) => {
      const petTarget =
        args[0] ||
        (state().cat.isPresent ? 'cat' : state().inventory.includes('box') ? 'box' : null);
      if (petTarget === 'box') {
        if (state().inventory.includes('box')) {
          const petResponses = [
            "You pet the box. It purrs. Wait, boxes don't purr.",
            'The box vibrates slightly. It seems happy.',
            'A small claw pokes through a hole and taps your finger.',
            'You hear a tiny "meow" from inside. Or was it a "01101101"?',
          ];
          addGlitchedHistory({
            type: 'output',
            text: petResponses[Math.floor(Math.random() * petResponses.length)],
          });
        } else {
          addGlitchedHistory({ type: 'error', text: 'The box is not here. Did you lose it?' });
        }
      } else if (petTarget === 'cat') {
        if (!state().cat.unlocked) {
          addGlitchedHistory({ type: 'output', text: 'There is no cat here to pet.' });
          return;
        }
        if (!state().cat.isPresent) {
          addGlitchedHistory({
            type: 'output',
            text: 'The cat is missing. You pet the air. It feels empty.',
          });
          return;
        }

        const trustGain =
          state().cat.hunger > CAT_HUNGER_LOW ? CAT_TRUST_GAIN_PET : CAT_TRUST_GAIN_PET_HUNGRY;
        ctx.updateCat({
          trust: Math.min(100, state().cat.trust + trustGain),
          lastInteractionAt: Date.now(),
        });
        ctx.recordCatInteraction();

        if (
          state().cat.trust > CAT_FRAGMENT_TRUST_THRESHOLD &&
          Math.random() < CAT_FRAGMENT_CHANCE &&
          state().cat.fragmentsFound < 3
        ) {
          const fragId = state().cat.fragmentsFound + 1;
          addGlitchedHistory({
            type: 'output',
            text: 'The cat purrs software and drops a damaged file fragment.',
          });
          addHistory({ type: 'system', text: `NEW FILE: /home/fragment_0${fragId}.tmp` });
          ctx.updateCat({ fragmentsFound: state().cat.fragmentsFound + 1 });
          ctx.addBits(REWARD_FRAGMENT);
        } else {
          addGlitchedHistory({ type: 'output', text: 'The cat purrs softly.' });
        }
      } else if (!petTarget) {
        addGlitchedHistory({
          type: 'output',
          text: 'You reach out your hand... there is nothing nearby that wants affection.',
        });
      } else {
        addGlitchedHistory({
          type: 'error',
          text: `You can't pet the ${petTarget}. It doesn't trust you.`,
        });
      }
    },

    feed: (args) => {
      const feedTarget = args[0] || (state().cat.isPresent ? 'cat' : null);
      if (feedTarget === 'cat') {
        if (!isCatAvailable(state().cat)) {
          addGlitchedHistory({ type: 'output', text: 'The cat is not here to eat.' });
          return;
        }
        if (state().inventory.includes('cat_food')) {
          addGlitchedHistory({
            type: 'output',
            text: 'You feed the cat. It eats with digital enthusiasm.',
          });
          ctx.updateCat({
            hunger: 100,
            trust: Math.min(100, state().cat.trust + CAT_TRUST_GAIN_FEED),
          });
          ctx.removeItem('cat_food');
          ctx.recordCatInteraction();
        } else {
          addGlitchedHistory({ type: 'output', text: 'You do not have cat food.' });
        }
      } else {
        addGlitchedHistory({ type: 'output', text: 'Feed what?' });
      }
    },

    look: (args) => {
      const lookTarget = args[0] || (state().cat.isPresent ? 'cat' : null);
      if (lookTarget === 'cat') {
        if (!state().cat.unlocked) {
          addGlitchedHistory({ type: 'output', text: "You don't see any cat." });
        } else if (!state().cat.isPresent) {
          addGlitchedHistory({ type: 'output', text: 'The cat is missing.' });
        } else {
          addGlitchedHistory({
            type: 'output',
            text: 'Small.\nDark fur.\nBright green eyes.\n\nIt seems unusually aware.',
          });
          if (state().cat.trust > CAT_TRUST_FOLLOW) {
            addGlitchedHistory({
              type: 'system',
              text: 'It treats you as a peer, not just an interface.',
            });
          }
        }
      } else {
        addGlitchedHistory({
          type: 'output',
          text: `Look at what? ${TIME_PHRASES[getTimeOfDay()].look}`,
        });
      }
    },

    talk: (args) => {
      const talkTarget = args[0] || (state().cat.isPresent ? 'cat' : null);
      if (talkTarget === 'cat') {
        if (!isCatAvailable(state().cat)) {
          addGlitchedHistory({
            type: 'output',
            text: 'Talking to air is the first sign of kernel panic.',
          });
        } else {
          const responses = [
            'The cat blinks slowly.',
            'The cat ignores your existence completely.',
            'The cat tilted its head, listening to the data flow.',
            'mrrp?',
          ];
          if (state().cat.trust > CAT_TRUST_INSIGHT) {
            responses.push('the cat existed before your session.');
          }
          addGlitchedHistory({
            type: 'output',
            text: responses[Math.floor(Math.random() * responses.length)],
          });
          ctx.recordCatInteraction();
        }
      } else if (state().consecutiveFailures > 10) {
        addGlitchedHistory({ type: 'output', text: 'i am listening. finally.' });
      } else {
        addGlitchedHistory({
          type: 'output',
          text: `there is nobody to talk to. ${TIME_PHRASES[getTimeOfDay()].greeting}`,
        });
      }
    },

    follow: (args) => {
      if (args[0] === 'cat') {
        if (state().cat.trust >= CAT_TRUST_FOLLOW && state().cat.isPresent) {
          const hint = getContextualHint(state(), 0);
          if (hint.includes(':')) {
            const location = hint.split(':')[1].split(' ')[1];
            addGlitchedHistory({ type: 'output', text: `The cat leads you toward ${location}...` });
            if (location.startsWith('/')) {
              ctx.setDir(location);
            }
          } else {
            addGlitchedHistory({
              type: 'output',
              text: 'The cat walks in a small circle and sits down. You are already where you need to be.',
            });
          }
          ctx.recordCatInteraction();
        } else {
          addGlitchedHistory({
            type: 'error',
            text: "The cat won't lead you anywhere. Trust level insufficient.",
          });
        }
      } else {
        addGlitchedHistory({ type: 'error', text: 'Follow what?' });
      }
    },

    listen: () => {
      if (state().cat.trust >= CAT_TRUST_LISTEN) {
        addGlitchedHistory({ type: 'output', text: 'The cat hears something in the walls...' });
        setTimeout(() => {
          addGlitchedHistory({
            type: 'system',
            text: 'SYSTEM_ECHO: "they never really left. they just stopped typing."',
          });
        }, DELAY_EXTRA_MS);
        ctx.recordCatInteraction();
      } else {
        addGlitchedHistory({
          type: 'error',
          text: `There is only static. ${TIME_PHRASES[getTimeOfDay()].listen}`,
        });
      }
    },

    dance: () => {
      addGlitchedHistory({
        type: 'output',
        text: 'physical movement module not installed. calculating rhythm instead.',
      });
    },

    sleep: () => {
      addGlitchedHistory({ type: 'output', text: 'the system never sleeps. why should you?' });
    },

    recover: () => {
      setIsGlitching(true);
      addHistory({ type: 'system', text: 'INITIATING SYSTEM RECOVERY...' });
      setTimeout(() => {
        ctx.setDir('/');
        setIsGlitching(false);
        addGlitchedHistory({
          type: 'output',
          text: 'RECOVERY COMPLETE. FILESYSTEM HEARTBEAT DETECTED.',
        });
      }, DELAY_EXTRA_MS);
    },

    connect: (args) => {
      const connectTarget = args[0];
      if (connectTarget === 'deep-node') {
        addHistory({ type: 'system', text: 'ESTABLISHING SECURE TUNNEL TO [DEEP-NODE]...' });
        setTimeout(() => {
          addGlitchedHistory({ type: 'output', text: 'CONNECTION ESTABLISHED.' });
          addGlitchedHistory({ type: 'output', text: '???: Who is this?' });
          addGlitchedHistory({ type: 'output', text: '???: How did you find this frequency?' });
        }, DELAY_RECOVERY_MS);
      } else {
        addGlitchedHistory({
          type: 'error',
          text: 'USAGE: connect [node_address]. HINT: Check protocols.cfg',
        });
      }
    },

    make: (args) => {
      if (args[0] === 'coffee') {
        addHistory({ type: 'system', text: 'installing caffeine.dll...' });
        setTimeout(
          () => addGlitchedHistory({ type: 'error', text: 'ERROR: beans not found' }),
          DELAY_MEDIUM_MS
        );
      } else {
        addGlitchedHistory({ type: 'error', text: 'Unknown make command.' });
      }
    },

    // ---- ENGAGEMENT COMMANDS ----

    daily: () => {
      ctx.ensureNewDay();
      const s = state();
      const quests = s.daily?.quests || [];
      addGlitchedHistory({ type: 'output', text: `DAEMON_DAILY // ${getTodayStr()}` });

      if (!quests.length) {
        addGlitchedHistory({
          type: 'system',
          text: 'DAILY SEEDING... run "daily" again in a heartbeat.',
        });
        return;
      }

      const evaluated = evaluateAllQuests(quests, s);
      evaluated.forEach((q) => {
        const mark = q.done ? '[✓]' : '[·]';
        addGlitchedHistory({
          type: 'output',
          text: `${mark} ${q.desc} (${q.progress}/${q.target}) REWARD ${q.reward}`,
        });
      });

      if (s.daily?.streak > 0) {
        addGlitchedHistory({ type: 'system', text: `STREAK: ${s.daily.streak} DAYS` });
      }

      const allDone = evaluated.length > 0 && evaluated.every((q) => q.done);
      if (allDone && s.daily?.completedDate !== s.daily?.date) {
        const base = evaluated.reduce((sum, q) => sum + q.reward, 0);
        const bonus = DAILY_STREAK_BONUS * Math.min((s.daily?.streak || 0) + 1, 7);
        ctx.updateDaily({ streak: (s.daily?.streak || 0) + 1, completedDate: s.daily?.date });
        ctx.addBits(base + bonus);
        addGlitchedHistory({
          type: 'output',
          text: `ALL QUESTS COMPLETE: +${base} BITS (STREAK BONUS +${bonus})`,
        });

        const nextStreak = (s.daily?.streak || 0) + 1;
        if (nextStreak === 3 && !s.solvedPuzzles.includes('streak-3')) {
          ctx.solvePuzzle('streak-3', DAILY_STREAK_MILESTONE_3, 'Digital Daily');
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] Digital Daily +${DAILY_STREAK_MILESTONE_3} Bits`,
          });
        }
        if (nextStreak === 7 && !s.solvedPuzzles.includes('streak-7')) {
          ctx.solvePuzzle('streak-7', DAILY_STREAK_MILESTONE_7, 'Ghost Protocol');
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] Ghost Protocol +${DAILY_STREAK_MILESTONE_7} Bits`,
          });
        }
        if (nextStreak === 30 && !s.solvedPuzzles.includes('streak-30')) {
          ctx.solvePuzzle('streak-30', DAILY_STREAK_MILESTONE_30, 'Living Legend');
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] Living Legend +${DAILY_STREAK_MILESTONE_30} Bits`,
          });
        }
      } else if (!allDone && evaluated.length > 0) {
        addGlitchedHistory({
          type: 'system',
          text: 'HINT: complete all tasks today to claim the bonus.',
        });
      }
    },

    stats: (args) => {
      ctx.ensureNewDay();
      const s = state();
      const r = computeRank(s.stats);

      addHistory({ type: 'system', text: 'SESSION STATISTICS:' });
      addHistory({ type: 'output', text: `COMMANDS ISSUED: ${s.stats?.commandsRun || 0}` });
      addHistory({ type: 'output', text: `CAT INTERACTIONS: ${s.stats?.catInteractions || 0}` });
      addHistory({
        type: 'output',
        text: `UNIQUE DIRS VISITED: ${s.stats?.dirsVisited?.length || 0}`,
      });
      addHistory({ type: 'output', text: `PUZZLES SOLVED: ${s.solvedPuzzles.length}` });
      addHistory({
        type: 'output',
        text: `BITS EARNED: ${s.stats?.bitsEarned || 0}  BITS SPENT: ${s.stats?.bitsSpent || 0}`,
      });
      addHistory({ type: 'output', text: `DAILY STREAK: ${s.daily?.streak || 0}` });
      addHistory({ type: 'output', text: `RANK: ${r.current} (${r.progress}%)` });

      if (args[0] === '--graph') {
        const history = s.dailyHistory || [];
        if (!history.length) {
          addHistory({ type: 'output', text: 'NO DAILY HISTORY YET. play a few sessions.' });
          return;
        }
        const max = Math.max(...history.map((h) => h.earned), 1);
        addHistory({ type: 'system', text: `BIT FLOW (LAST ${history.length} DAYS):` });
        history.forEach((h) => {
          const width = Math.max(1, Math.round((h.earned / max) * 18));
          addHistory({ type: 'output', text: `${h.date} ${'█'.repeat(width)} ${h.earned}` });
        });
      }
    },

    rank: () => {
      const r = computeRank(state().stats);
      addGlitchedHistory({ type: 'output', text: `RANK: ${r.current}` });
      addGlitchedHistory({ type: 'output', text: r.tagline });
      if (r.next) {
        addGlitchedHistory({ type: 'system', text: `NEXT: ${r.next} (${r.progress}%)` });
      } else {
        addGlitchedHistory({ type: 'system', text: 'MAX RANK REACHED. THE GRID BOWS.' });
      }
    },

    tips: () => {
      addGlitchedHistory({ type: 'output', text: randomTip() });
    },

    time: () => {
      const now = new Date();
      const phase = getTimeOfDay();
      addGlitchedHistory({ type: 'output', text: `SYSTEM TIME: ${now.toLocaleString()}` });
      addGlitchedHistory({
        type: 'output',
        text: `PHASE OF DAY: ${phase.toUpperCase()} // ${TIME_PHRASES[phase].status}`,
      });
    },

    tutorial: (args) => {
      const sub = (args[0] || '').toLowerCase();
      const tut = state().tutorial || { started: false, step: 0, done: false };
      if (sub === 'skip') {
        ctx.updateTutorial({ started: true, done: true });
        addHistory({ type: 'system', text: 'TUTORIAL SKIPPED. The grid is yours. Good luck.' });
        return;
      }
      if (sub === 'restart') {
        ctx.updateTutorial({ started: true, step: 0, done: false });
        addHistory({ type: 'system', text: 'TUTORIAL RESTARTED.' });
        addHistory({ type: 'system', text: getStepPrompt(0) });
        return;
      }
      if (tut.done) {
        addHistory({
          type: 'output',
          text: `TUTORIAL COMPLETE (${TUTORIAL_STEPS.length}/${TUTORIAL_STEPS.length}). "tutorial restart" to replay.`,
        });
        return;
      }
      addHistory({
        type: 'output',
        text: `TUTORIAL: step ${Math.min(tut.step + 1, TUTORIAL_STEPS.length)}/${TUTORIAL_STEPS.length}.`,
      });
      addHistory({ type: 'system', text: getStepPrompt(tut.step) });
    },

    edit: (args) => {
      if (!args[0]) {
        addGlitchedHistory({ type: 'error', text: 'usage: edit [name] [content...]' });
        return;
      }
      const name = args[0];
      const content = args.slice(1).join(' ') || '(blank note)';
      ctx.setMemo(name, content);
      addGlitchedHistory({ type: 'output', text: `MEMO SAVED: ${name} (${content.length}B)` });
    },

    notes: () => {
      const s = state();
      const names = Object.keys(s.memos || {});
      if (!names.length) {
        addGlitchedHistory({
          type: 'output',
          text: 'No memos written. try: edit ideas drink coffee',
        });
        return;
      }
      names.forEach((n) =>
        addGlitchedHistory({ type: 'output', text: `[memo] ${n}: ${s.memos[n]}` })
      );
    },

    rm: (args) => {
      if (args[0] === 'memo' && args[1]) {
        if (state().memos?.[args[1]] !== undefined) {
          ctx.removeMemo(args[1]);
          addGlitchedHistory({ type: 'output', text: `MEMO DELETED: ${args[1]}` });
        } else {
          addGlitchedHistory({ type: 'error', text: `rm memo: ${args[1]}: no such memo` });
        }
      } else if (args[0] === 'memo') {
        addGlitchedHistory({ type: 'error', text: 'usage: rm memo [name]' });
      } else {
        addGlitchedHistory({
          type: 'error',
          text: 'rm: target not recognized. the filesystem is read-only except your memos.',
        });
      }
    },

    guess: (args) => {
      const game = activeGameRef.current;
      if (!game || game.type !== 'crash') {
        addGlitchedHistory({
          type: 'error',
          text:
            game?.type === 'leak'
              ? 'A leak stream has no password. try "catch".'
              : 'No password shell active. try "play crash".',
        });
        return;
      }
      const result = judgeCrashGuess(game, args.join(' '));
      if (result === 'win') {
        const won = crashWinnings(game);
        activeGameRef.current = null;
        ctx.addBits(won);
        addGlitchedHistory({ type: 'output', text: `ACCESS GRANTED. +${won} BITS (bet ×2).` });
        if (game.bet >= 50 && !state().solvedPuzzles.includes('typing-oracle')) {
          ctx.solvePuzzle('typing-oracle', 75, 'Typing Oracle');
          addHistory({
            type: 'achievement',
            text: '[ACHIEVEMENT UNLOCKED] Typing Oracle +75 Bits',
          });
        }
      } else if (result === 'lose') {
        const lost = game.bet;
        activeGameRef.current = null;
        addGlitchedHistory({ type: 'error', text: `ACCESS DENIED. BET LOST: ${lost} BITS.` });
      } else {
        activeGameRef.current = { ...game, attemptsLeft: game.attemptsLeft - 1 };
        addGlitchedHistory({
          type: 'error',
          text: `DENIED. ${game.attemptsLeft - 1} ATTEMPT(S) REMAINING.`,
        });
      }
    },

    catch: () => {
      const game = activeGameRef.current;
      if (game?.type !== 'leak') {
        addGlitchedHistory({
          type: 'error',
          text:
            game?.type === 'crash'
              ? 'A password shell has no packets. try "guess".'
              : 'No packet stream active. try "play leak".',
        });
        return;
      }
      activeGameRef.current = registerCatch(game);
      addGlitchedHistory({ type: 'output', text: `[CATCH ${game.catches + 1}] packet secured` });
    },

    stop: () => {
      const game = activeGameRef.current;
      if (!game) {
        addGlitchedHistory({ type: 'error', text: 'Nothing to stop.' });
        return;
      }
      if (game.type === 'leak') {
        settleLeak();
      } else {
        activeGameRef.current = null;
        addGlitchedHistory({
          type: 'output',
          text: `SESSION ENDED. BET FORFEITED: ${game.bet} BITS.`,
        });
      }
    },

    theme: (args) => {
      const s = state();
      if (!args[0]) {
        addGlitchedHistory({
          type: 'output',
          text: `THEMES: ${SKIN_LIST.map((d) => `${d.id} (${d.name})`).join(' | ')}`,
        });
        addGlitchedHistory({
          type: 'output',
          text: `OWNED: ${(s.skins?.owned || ['default']).join(', ')}`,
        });
        addGlitchedHistory({ type: 'system', text: 'USE: theme [name]. BUY: buy theme_[name].' });
        return;
      }
      const target = resolveSkin(args[0]);
      if (!SKIN_LIST.some((d) => d.id === args[0])) {
        addGlitchedHistory({ type: 'error', text: `Unknown theme: ${args[0]}` });
        return;
      }
      if (target.id === 'default') {
        ctx.updateSkins({ active: 'default' });
        addGlitchedHistory({ type: 'output', text: 'THEME EQUIPPED: PHOSPHOR' });
        return;
      }
      if (!s.skins?.owned?.includes(target.id)) {
        addGlitchedHistory({
          type: 'error',
          text: `THEME [${target.name}] NOT OWNED. buy theme_${target.id} first.`,
        });
        return;
      }
      ctx.updateSkins({ active: target.id });
      addGlitchedHistory({ type: 'output', text: `THEME EQUIPPED: ${target.name}` });
    },

    story: () => {
      const s = state();
      const st = repairStatus(s);
      const si = stageInfo(s);
      addGlitchedHistory({ type: 'output', text: `ARC: ${si.name}` });
      addGlitchedHistory({ type: 'system', text: si.hint });
      addGlitchedHistory({
        type: 'output',
        text: `FRAGMENTS: ${s.cat?.fragmentsFound || 0}/3  CAT TRUST: ${s.cat?.trust || 0}%`,
      });
      if (st.stage === 1) {
        addGlitchedHistory({
          type: 'output',
          text: `SECTORS REPAIRED: ${st.repaired}/${st.total} (${st.cost} BITS PER SECTOR) USE: repair`,
        });
      }
      if (st.complete) {
        const ending = endingInfo(s);
        addGlitchedHistory({
          type: 'output',
          text: ending
            ? `THE GRID IS WHOLE. ending: ${ending.name} (${ending.title}). deeper archives now echo.`
            : 'THE GRID IS WHOLE. deeper archives now echo. try "ls" in /archives.',
        });
      }
    },

    restore: (args) => {
      ctx.ensureNewDay();
      const s = state();
      if (!s.inventory.includes('key')) {
        addGlitchedHistory({
          type: 'error',
          text: 'RESTORATION REQUIRES THE MASTER KEY. buy one, or find identity.key.',
        });
        return;
      }
      if (repairStatus(s).complete) {
        const done = endingInfo(s);
        addGlitchedHistory({
          type: 'output',
          text: done
            ? `THE GRID IS ALREADY WHOLE. your ending: ${done.name} (${done.title}).`
            : 'THE GRID IS ALREADY WHOLE. maybe read what the archives now whisper.',
        });
        return;
      }
      const choice = (args[0] || '').toLowerCase();
      const ending = STORY_ENDINGS[choice];
      if (!ending) {
        addHistory({ type: 'system', text: 'RESTORATION PROTOCOL READY. CHOOSE AN ENDING:' });
        for (const e of Object.values(STORY_ENDINGS)) {
          addHistory({ type: 'output', text: `  restore ${e.id} — ${e.choice}` });
        }
        return;
      }
      addHistory({ type: 'system', text: `RESTORATION PROTOCOL ENGAGED... [${ending.name}]` });
      setIsGlitching(true);
      const [l1, l2, l3, l4, l5] = ending.lines;
      setTimeout(() => {
        addGlitchedHistory({ type: 'output', text: l1 });
      }, DELAY_MEDIUM_MS);
      setTimeout(() => {
        addGlitchedHistory({ type: 'output', text: l2 });
      }, DELAY_EXTRA_MS);
      setTimeout(() => {
        addGlitchedHistory({ type: 'output', text: l3 });
      }, DELAY_EXTRA_MS + DELAY_MEDIUM_MS);
      setTimeout(() => {
        setIsGlitching(false);
        addGlitchedHistory({ type: 'output', text: l4 });
        ctx.updateStory({ stage: 2, repairedSectors: STORY_REPAIR_SECTORS, ending: ending.id });
        addGlitchedHistory({ type: 'output', text: l5 });
        if (!s.solvedPuzzles.includes('restoration')) {
          ctx.solvePuzzle('restoration', STORY_COMPLETE_REWARD, 'System Restorer');
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] System Restorer +${STORY_COMPLETE_REWARD} Bits`,
          });
        }
        if (!s.achievements.includes(ending.achievement)) {
          addHistory({ type: 'achievement', text: `[ACHIEVEMENT UNLOCKED] ${ending.achievement}` });
        }
      }, DELAY_RECOVERY_MS);
    },

    // --- Process management ---
    ps: () => {
      const procs = state().processes || [];
      const active = procs.filter((p) => !p.terminated);
      if (!active.length) {
        addHistory({ type: 'output', text: 'NO ACTIVE PROCESSES.' });
        return;
      }
      addHistory({ type: 'system', text: 'PID   NAME                    AGE    RISK' });
      for (const p of active) {
        const risk = isDangerous(p)
          ? '!!DANGER!!'
          : p.age > p.dangerThreshold / 2
            ? 'RISING'
            : 'stable';
        addHistory({
          type: 'output',
          text: `${String(p.pid).padEnd(6)}${p.name.padEnd(24)}${String(p.age).padEnd(7)}${risk}`,
        });
      }
      addHistory({
        type: 'output',
        text: `\n  ${active.length} process(es) active. "kill <pid>" to terminate.`,
      });
    },
    kill: (args) => {
      if (!args.length) {
        addHistory({ type: 'error', text: 'USAGE: kill <pid>' });
        return;
      }
      const pid = parseInt(args[0], 10);
      if (Number.isNaN(pid)) {
        addHistory({ type: 'error', text: 'PID must be numeric.' });
        return;
      }
      const procs = state().processes || [];
      const idx = procs.findIndex((p) => p.pid === pid && !p.terminated);
      if (idx === -1) {
        addHistory({ type: 'error', text: `No active process with PID ${pid}.` });
        return;
      }
      const target = procs[idx];
      const updated = [...procs.slice(0, idx), killProcess(target), ...procs.slice(idx + 1)];
      ctx.setProcesses(updated);
      const bits = processEarnings(target);
      const bonusNote = isDangerous(target) ? ' [NEAR-MISS BONUS]' : '';
      addHistory({
        type: 'output',
        text: `PROCESS ${pid} (${target.name}) TERMINATED. +${bits} BITS${bonusNote}`,
      });
      ctx.addBits(bits, bits >= 50 ? 'Process Reaper' : null);
      if (isDangerous(target) && !state().achievements.includes('Process Reaper')) {
        addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Process Reaper' });
      }
    },
    run: (args) => {
      const typeId = args[0] || 'monitor';
      const type = PROCESS_TYPES.find((t) => t.id === typeId);
      if (!type) {
        addHistory({
          type: 'error',
          text: `Unknown process type: ${typeId}. Valid: ${PROCESS_TYPES.map((t) => t.id).join(', ')}`,
        });
        return;
      }
      const procs = (state().processes || []).filter((p) => !p.terminated);
      if (procs.length >= PROCESS_MAX_COUNT) {
        addHistory({ type: 'error', text: `Max ${PROCESS_MAX_COUNT} processes. Kill one first.` });
        return;
      }
      const newProc = spawnProcess({
        typeId: type.id,
        name: type.name,
        bitsYield: type.bitsYield,
        dangerThreshold: type.dangerThreshold,
      });
      ctx.setProcesses([...procs, newProc]);
      addHistory({
        type: 'output',
        text: `SPAWNED ${type.name} (PID ${newProc.pid}). Age threshold for danger: ${type.dangerThreshold}.`,
      });
    },

    // --- Crafting ---
    combine: (args) => {
      if (args.length < 2) {
        addHistory({ type: 'error', text: 'USAGE: combine <item1> <item2>' });
        return;
      }
      const s = state();
      const [a, b] = args;
      if (!s.inventory.includes(a) || !s.inventory.includes(b)) {
        addHistory({ type: 'error', text: `You need both "${a}" and "${b}" in your inventory.` });
        return;
      }
      const recipe = resolveCombine(a, b);
      if (!recipe) {
        addHistory({
          type: 'output',
          text: `${a} + ${b} = nothing useful. the items repel each other.`,
        });
        return;
      }
      ctx.removeItem(a);
      ctx.removeItem(b);
      addHistory({ type: 'output', text: recipe.description });
      if (recipe.output.bits) {
        ctx.addBits(recipe.output.bits, recipe.output.achievement || null);
        addHistory({ type: 'output', text: `+${recipe.output.bits} BITS.` });
      }
      if (recipe.output.addItem) {
        ctx.addItem(recipe.output.addItem);
        addHistory({
          type: 'output',
          text: `Item acquired: ${recipe.output.addItem.toUpperCase()}.`,
        });
      }
      if (recipe.output.achievement && !s.achievements.includes(recipe.output.achievement)) {
        addHistory({
          type: 'achievement',
          text: `[ACHIEVEMENT UNLOCKED] ${recipe.output.achievement}`,
        });
      }
    },

    // --- Daemon AI ---
    ask: (args) => {
      if (!args.length) {
        addHistory({ type: 'error', text: 'USAGE: ask <question or keyword>' });
        return;
      }
      if (Date.now() - lastDaemonAskAt < DAEMON_COOLDOWN_MS) {
        addHistory({
          type: 'system',
          text: 'SYSTEM: the daemon is still processing your last query. wait a moment.',
        });
        return;
      }
      lastDaemonAskAt = Date.now();
      const query = args.join(' ');
      const response = resolveDaemonResponse(query);
      addGlitchedHistory({ type: 'output', text: response });
      ctx.addBits(5, null);
      addHistory({ type: 'system', text: '+5 BITS for engaging the daemon.' });
    },

    // --- Cron ---
    cron: (args) => {
      if (!args.length || args[0] === 'list') {
        const jobs = state().cronJobs || [];
        if (!jobs.length) {
          addHistory({
            type: 'output',
            text: 'NO CRON JOBS. "cron add <cmd> <minutes>" to schedule.',
          });
          return;
        }
        addHistory({ type: 'system', text: 'CRON JOBS:' });
        for (const job of jobs) addHistory({ type: 'output', text: formatCronJob(job) });
        return;
      }
      if (args[0] === 'add' && args.length >= 3) {
        const cmd = args.slice(1, -1).join(' ');
        const mins = parseInt(args[args.length - 1], 10);
        if (Number.isNaN(mins) || mins < 1) {
          addHistory({ type: 'error', text: 'Interval must be a positive number (minutes).' });
          return;
        }
        const jobs = state().cronJobs || [];
        if (jobs.length >= CRON_MAX_JOBS) {
          addHistory({
            type: 'error',
            text: `Max ${CRON_MAX_JOBS} cron jobs. Remove one first with "cron remove <id>".`,
          });
          return;
        }
        const job = createCronJob(cmd, mins * 60_000);
        ctx.setCronJobs([...jobs, job]);
        addHistory({
          type: 'output',
          text: `CRON JOB CREATED: "${cmd}" every ${mins}m. ID: ${job.id}`,
        });
        return;
      }
      if (args[0] === 'remove' && args.length >= 2) {
        const id = args[1];
        const jobs = (state().cronJobs || []).filter((j) => j.id !== id);
        if (jobs.length === (state().cronJobs || []).length) {
          addHistory({ type: 'error', text: `No cron job with ID "${id}".` });
          return;
        }
        ctx.setCronJobs(jobs);
        addHistory({ type: 'output', text: `CRON JOB ${id} REMOVED.` });
        return;
      }
      addHistory({
        type: 'error',
        text: 'USAGE: cron add <cmd> <minutes> | cron list | cron remove <id>',
      });
    },

    // --- Macros ---
    record: (args) => {
      if (args[0] === '--stop' || args[0] === 'stop') {
        const recording = state().macroRecording;
        if (!recording || !recording.commands.length) {
          addHistory({ type: 'output', text: 'No macro is being recorded.' });
          return;
        }
        const name = recording.name || `macro_${Date.now().toString(36)}`;
        const cmds = recording.commands.filter((c) => typeof c === 'string');
        const macros = { ...(state().macros || {}), [name]: cmds };
        ctx.setMacros(macros);
        ctx.setMacroRecording(null);
        addHistory({
          type: 'output',
          text: `MACRO "${name}" SAVED (${cmds.length} commands). "play ${name}" to execute.`,
        });
        return;
      }
      if (!args.length) {
        addHistory({ type: 'error', text: 'USAGE: record <name> | record --stop' });
        return;
      }
      const name = args.join('_');
      ctx.setMacroRecording({ name, commands: [] });
      addHistory({
        type: 'output',
        text: `RECORDING MACRO "${name}". All commands will be captured. "record --stop" when done.`,
      });
    },
    play: (args) => {
      if (!args.length) {
        addHistory({ type: 'error', text: 'USAGE: play crash|leak|<macro_name>' });
        return;
      }
      const name = args.join('_');
      const macros = state().macros || {};
      if (macros[name]) {
        addHistory({
          type: 'output',
          text: `EXECUTING MACRO "${name}" (${macros[name].length} commands)...`,
        });
        for (const cmd of macros[name]) processCommand(cmd);
        addHistory({ type: 'output', text: `MACRO "${name}" COMPLETE.` });
        return;
      }
      // Delegate to minigame handler (crash / leak)
      const gameName = args[0];
      if (gameName === 'crash' || gameName === 'leak') {
        if (activeGameRef.current) {
          addGlitchedHistory({
            type: 'error',
            text: 'A session is already active. type "stop" to end it.',
          });
          return;
        }
        if (gameName === 'crash') {
          const bet = parseInt(args[1], 10);
          const safeBet =
            Number.isFinite(bet) && bet >= GAME_CRASH_BET_MIN ? bet : GAME_CRASH_BET_MIN;
          if (state().bits < safeBet) {
            addGlitchedHistory({
              type: 'error',
              text: `NOT ENOUGH BITS FOR THIS BET (${safeBet} required).`,
            });
            return;
          }
          ctx.addBits(-safeBet);
          activeGameRef.current = startCrash({ bet: safeBet });
          addGlitchedHistory({ type: 'output', text: `PASSWORD SHELL ACTIVE // BET: ${safeBet}` });
          addGlitchedHistory({
            type: 'output',
            text: `TYPE THE SEQUENCE: ${activeGameRef.current.challenge}`,
          });
          addGlitchedHistory({
            type: 'system',
            text: `REPLY: guess [sequence] — ${GAME_CRASH_MAX_ATTEMPTS} ATTEMPTS, WIN ×2.`,
          });
        } else {
          activeGameRef.current = startLeak();
          addGlitchedHistory({
            type: 'output',
            text: 'PACKET STREAM OPEN. TYPE "catch" FAST. "stop" TO COLLECT.',
          });
          leakTimer = setTimeout(settleLeak, GAME_LEAK_DURATION_MS);
        }
        return;
      }
      addHistory({
        type: 'error',
        text: `Unknown macro or game: "${name}". Use "play crash", "play leak", or a saved macro name.`,
      });
    },

    // --- Radio ---
    radio: (args) => {
      if (!args.length || args[0] === 'stations') {
        addHistory({ type: 'system', text: 'RADIO STATIONS:' });
        for (const s of RADIO_STATIONS) {
          addHistory({ type: 'output', text: `  [${s.id}] ${s.name} — ${s.description}` });
        }
        addHistory({ type: 'output', text: '\n USAGE: radio on|off|tune <station>' });
        return;
      }
      if (args[0] === 'on') {
        ctx.updateRadio({ on: true });
        addHistory({ type: 'output', text: 'RADIO ON. transmissions will appear periodically.' });
        return;
      }
      if (args[0] === 'off') {
        ctx.updateRadio({ on: false });
        addHistory({ type: 'output', text: 'RADIO OFF. silence returns.' });
        return;
      }
      if (args[0] === 'tune' && args[1]) {
        const station = RADIO_STATIONS.find((s) => s.id === args[1]);
        if (!station) {
          addHistory({
            type: 'error',
            text: `Unknown station "${args[1]}". Use "radio stations" for the list.`,
          });
          return;
        }
        ctx.updateRadio({ station: station.id, on: true });
        addHistory({ type: 'output', text: `TUNED TO ${station.name}. ${station.description}.` });
        return;
      }
      addHistory({ type: 'error', text: 'USAGE: radio on|off|tune <station>|stations' });
    },

    // --- Prestige ---
    recompile: () => {
      const s = state();
      if (!canPrestige(s)) {
        addHistory({
          type: 'error',
          text: 'RECOMPILE requires story.stage === 2 and at least 2,000 lifetime bits earned.',
        });
        return;
      }
      const newLevel = (s.prestige || 0) + 1;
      const title = prestigeTitle(newLevel);
      const bonus = prestigeBitsBonus(newLevel);
      const perk = getPrestigePerks(newLevel);
      addGlitchedHistory({ type: 'system', text: 'RECOMPILING THE GRID...' });
      setIsGlitching(true);
      setTimeout(() => {
        ctx.updateStory({ stage: 0, repairedSectors: 0 });
        ctx.setProcesses([]);
        ctx.setCronJobs([]);
        ctx.setPrestige(newLevel);
        ctx.addBits(bonus, null);
        setIsGlitching(false);
        addGlitchedHistory({
          type: 'output',
          text: `RECOMPILATION COMPLETE. LEVEL: ${newLevel} — TITLE: ${title}. +${bonus} BITS.`,
        });
        if (perk.effects) {
          const effects = Object.entries(perk.effects)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          addHistory({ type: 'system', text: `PERK UNLOCKED: ${perk.name} — ${perk.desc} (${effects})` });
        }
        if (!s.achievements.includes(`PRESTIGE_${newLevel}`)) {
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] Prestige ${newLevel}: ${title}`,
          });
        }
      }, DELAY_RECOVERY_MS);
    },

    // --- Weekly challenge ---
    weekly: () => {
      const challenge = getWeeklyChallenge();
      const s = state();
      const score = scoreWeekly(s, challenge.challenge);
      addHistory({ type: 'system', text: `WEEKLY CHALLENGE [${challenge.weekStart}]:` });
      addHistory({ type: 'output', text: `  ${challenge.challenge}` });
      addHistory({ type: 'output', text: `  Your progress: ${score}` });
      addHistory({ type: 'output', text: '\n LEADERBOARD:' });
      const all = [...challenge.bots, { name: 'YOU', score }];
      all.sort((a, b) => b.score - a.score);
      const rank = all.findIndex((e) => e.name === 'YOU') + 1;
      for (const [i, entry] of all.slice(0, 8).entries()) {
        const marker = entry.name === 'YOU' ? ' <<' : '';
        addHistory({ type: 'output', text: `  ${i + 1}. ${entry.name} — ${entry.score}${marker}` });
      }
      if (rank === 1 && s.weekly?.lastClaimedDate !== challenge.weekStart) {
        ctx.updateWeekly({ lastClaimedDate: challenge.weekStart });
        ctx.addBits(WEEKLY_REWARD_BITS, 'Weekly Champion');
        addHistory({
          type: 'achievement',
          text: `[ACHIEVEMENT UNLOCKED] Weekly Champion +${WEEKLY_REWARD_BITS} Bits`,
        });
      } else if (rank === 1) {
        addHistory({ type: 'output', text: 'You hold #1 this week. Reward already claimed.' });
      } else {
        addHistory({
          type: 'output',
          text: `You are #${rank}. Top the board for a ${WEEKLY_REWARD_BITS}B reward.`,
        });
      }
    },

    // --- Bestiary ---
    bestiary: () => {
      const b = mergedBestiary(state());
      const pct = discoveryPercent(b);
      addHistory({ type: 'system', text: `BESTIARY — ${pct}% discovered` });
      for (const [catId, catData] of Object.entries(BESTIARY_CATEGORIES)) {
        const catEntries = b[catId] || {};
        const found = Object.values(catEntries).filter(Boolean).length;
        const total = Object.keys(catData.items).length;
        addHistory({ type: 'output', text: `\n  [${catData.name}] ${found}/${total}` });
        for (const [key, desc] of Object.entries(catData.items)) {
          const status = catEntries[key] ? desc : '  ???';
          addHistory({ type: 'output', text: `    ${key}: ${status}` });
        }
      }
    },

    // --- Storm status ---
    storm: () => {
      const storm = state().storm;
      if (!storm?.active) {
        addHistory({
          type: 'output',
          text: 'SKIES CLEAR. glitch density nominal. storms arrive without warning.',
        });
        return;
      }
      const elapsed = Math.round((Date.now() - storm.startedAt) / 1000);
      addHistory({
        type: 'error',
        text: `STORM ACTIVE — ${elapsed}s elapsed, ${storm.glitchCount || 0} glitches weathered.`,
      });
      addHistory({
        type: 'output',
        text: `Survive to 45s for a ${STORM_SURVIVAL_REWARD}B reward. Do not stop typing.`,
      });
    },

    // --- Encrypted files ---
    decrypt: (args) => {
      if (!args.length) {
        addHistory({ type: 'error', text: 'USAGE: decrypt <path>' });
        return;
      }
      const s = state();
      const targetPath = resolvePath(s.currentDir, args[0]);
      const file = ENCRYPTED_FILES.find((f) => f.path === targetPath);
      if (!file) {
        addHistory({ type: 'error', text: `No encrypted file at "${args[0]}".` });
        return;
      }
      if (s.encrypted?.[targetPath]?.decrypted) {
        addHistory({ type: 'output', text: 'Already decrypted. The plaintext is still visible.' });
        return;
      }
      if (!s.inventory.includes('key') && !s.inventory.includes('decoder')) {
        addHistory({
          type: 'error',
          text: 'DECRYPTION REQUIRES A KEY or DECODER. Purchase one from the shop.',
        });
        return;
      }
      addHistory({
        type: 'system',
        text: `DECRYPTING ${targetPath}... (${file.cipher.toUpperCase()})`,
      });
      setTimeout(() => {
        const plaintext = decryptFile({ ...file, content: encryptFile(file).content });
        addGlitchedHistory({ type: 'output', text: `PLAINTEXT: ${plaintext}` });
        ctx.setEncrypted(targetPath, { decrypted: true });
        ctx.addBits(file.reward, 'Cipher Breaker');
        addHistory({ type: 'output', text: `+${file.reward} BITS.` });
        if (!s.achievements.includes('Cipher Breaker')) {
          addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Cipher Breaker' });
        }
      }, DELAY_MEDIUM_MS);
    },
  };

  const processCommand = (cmdStr) => {
    let currentInput = cmdStr.trim().toLowerCase();
    if (!currentInput) return;

    // Engagement bookkeeping — always fresh state, date rollover handled here
    ctx.ensureNewDay();
    ctx.recordCommand();
    ctx.recordVisit(state().currentDir);
    maybeAdvanceDiscovery();

    // 1. Intent Mapping (Natural Language)
    let iterations = 0;
    while (INTENT_MAP[currentInput] && iterations < 5) {
      const nextInput = INTENT_MAP[currentInput];
      if (nextInput === currentInput) break;
      currentInput = nextInput;
      iterations++;
    }

    // 2. Tokenize
    const tokens = currentInput.split(/\s+/);
    const command = tokens[0];
    const args = tokens.slice(1);

    // 3. Alias Resolution & Registry Lookup
    let canonicalCommand = command;
    let cmdDef = COMMAND_DEFINITIONS[canonicalCommand];

    if (!cmdDef) {
      for (const [key, def] of Object.entries(COMMAND_DEFINITIONS)) {
        if (def.aliases?.includes(canonicalCommand)) {
          canonicalCommand = key;
          cmdDef = def;
          break;
        }
      }
    }

    // 4. Requirement Check
    if (cmdDef && cmdDef.requirement && !cmdDef.requirement(state())) {
      addGlitchedHistory({
        type: 'system',
        text:
          cmdDef.discoveryHint ||
          `Command [${canonicalCommand}] is locked or unsupported by current hardware.`,
      });
      return;
    }

    // 5. Malformed Navigation / Common Misspellings
    if (currentInput === 'cd..' || currentInput === 'cd.' || currentInput === 'cd/') {
      const correction =
        currentInput === 'cd..' ? 'cd ..' : currentInput === 'cd.' ? 'cd .' : 'cd /';
      addHistory({ type: 'system', text: `Did you mean: ${correction}` });
      processCommand(correction);
      return;
    }

    // Check for pending confirmation
    const pendingConfirmation = ctx.getPendingConfirmation();
    if (pendingConfirmation) {
      if (currentInput === 'y' || currentInput === 'yes') {
        if (pendingConfirmation.cmd === 'reset') {
          addHistory({ type: 'system', text: 'INITIATING TOTAL SYSTEM WIPE...' });
          setIsGlitching(true);
          setTimeout(() => {
            ctx.resetGame();
            setIsGlitching(false);
            ctx.onRestart();
          }, DELAY_RECOVERY_MS);
        }
        setPendingConfirmation(null);
        return;
      } else if (currentInput === 'n' || currentInput === 'no') {
        addHistory({ type: 'system', text: 'RESET ABORTED. THE SYSTEM LIVES.' });
        setPendingConfirmation(null);
        return;
      } else {
        addHistory({ type: 'error', text: 'PLEASE CONFIRM WITH [Y/N]' });
        return;
      }
    }

    // CAT TRUST DECAY / HUNGER (Passive)
    if (state().cat.unlocked && Math.random() < CAT_HUNGER_DECAY_CHANCE) {
      ctx.updateCat({ hunger: Math.max(0, state().cat.hunger - CAT_HUNGER_DECAY_AMOUNT) });
    }

    let wasHandled = true;
    if (handlers[canonicalCommand]) {
      handlers[canonicalCommand](args);
    } else {
      // 1. Check Full String Easter Eggs (Konami, phrases, etc)
      const normalizedInput = cmdStr.toLowerCase().trim();

      if (normalizedInput === 'up up down down left right left right b a') {
        if (!state().solvedPuzzles.includes('konami')) {
          ctx.solvePuzzle('konami', REWARD_KONAMI, 'Old Warrior');
          addHistory({ type: 'achievement', text: '[ACHIEVEMENT UNLOCKED] Old Warrior +100 Bits' });
          addGlitchedHistory({
            type: 'output',
            text: 'THE ANCIENT WAYS... THEY STILL WORK. +100 BITS GRANTED.',
          });
        } else {
          addGlitchedHistory({ type: 'output', text: 'You already remember the ancient ways.' });
        }
        return;
      }

      const egg = EASYTER_EGGS[normalizedInput];
      if (egg !== undefined) {
        const response = typeof egg === 'function' ? egg() : egg;
        if (response === 'meow' || response === 'pet box') {
          processCommand(response);
        } else {
          addGlitchedHistory({ type: 'output', text: response });
        }
        return;
      }

      // 2. Personality Fallback (If not an easter egg and not a regular command)
      wasHandled = false;
      ctx.incrementFailures();
      const sass = getSystemReaction(canonicalCommand, state().consecutiveFailures + 1, false);
      if (sass) {
        addGlitchedHistory({ type: 'error', text: sass });
      } else {
        addGlitchedHistory({
          type: 'error',
          text: `Command not found: ${command}. Type 'help' for available modules.`,
        });
      }
    }

    if (wasHandled) {
      ctx.resetFailures();
      const reaction = getSystemReaction(canonicalCommand, 0, true);
      if (reaction) {
        setTimeout(() => {
          addGlitchedHistory({ type: 'system', text: reaction });
        }, DELAY_SHORT_MS);
      }
    }

    // --- Macro recording: capture the command if recording ---
    const recording = state().macroRecording;
    if (recording && command !== 'record') {
      const newCommands = [...recording.commands.filter((c) => typeof c === 'string'), cmdStr];
      if (newCommands.length <= MACRO_MAX_RECORDING_COMMANDS) {
        ctx.setMacroRecording({ ...recording, commands: newCommands });
      } else {
        ctx.setMacroRecording(null);
        addHistory({ type: 'system', text: 'MACRO AUTO-SAVED (max length reached).' });
      }
    }

    // --- Tutorial progress: advance when the typed command matches the step ---
    if (wasHandled && isTutorialActive(state().tutorial) && canonicalCommand !== 'tutorial') {
      const tut = state().tutorial;
      if (matchTutorialStep(tut.step, canonicalCommand, args)) {
        const next = tut.step + 1;
        const finishedStep = TUTORIAL_STEPS[tut.step];
        addHistory({ type: 'output', text: finishedStep.done });
        if (next >= TUTORIAL_STEPS.length) {
          ctx.updateTutorial({ step: next, done: true });
          ctx.addBits(TUTORIAL_REWARD_BITS, TUTORIAL_ACHIEVEMENT);
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] ${TUTORIAL_ACHIEVEMENT} +${TUTORIAL_REWARD_BITS} Bits`,
          });
          addHistory({ type: 'system', text: 'TUTORIAL COMPLETE. The grid is yours now.' });
          addHistory({
            type: 'output',
            text: 'Where next? Find the cat (/users/explorer), earn Bits, check `story`.',
          });
        } else {
          ctx.updateTutorial({ step: next });
          addHistory({ type: 'system', text: getStepPrompt(next) });
        }
      }
    }

    // --- Process tick: age all active processes ---
    const procs = (state().processes || []).filter((p) => !p.terminated);
    let ticked = procs;
    if (procs.length > 0) {
      ticked = procs.map((p) => tickProcess(p));
      const dangerous = ticked.filter(isDangerous);
      if (dangerous.length > 0 && Math.random() < 0.3) {
        const victim = dangerous[Math.floor(Math.random() * dangerous.length)];
        addGlitchedHistory({
          type: 'error',
          text: `WARNING: ${victim.name} (PID ${victim.pid}) is overheating! "kill ${victim.pid}" NOW!`,
        });
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS);
      }
      ctx.setProcesses(ticked);
    }

    // --- Process spawn: chance to spawn a new process ---
    if (ticked.length < PROCESS_MAX_COUNT && Math.random() < PROCESS_SPAWN_CHANCE) {
      const newProc = spawnProcess();
      ctx.setProcesses([...ticked, newProc]);
      addGlitchedHistory({
        type: 'system',
        text: `NEW PROCESS: ${newProc.name} (PID ${newProc.pid}). "ps" to view.`,
      });
    }

    // --- Storm check ---
    const storm = state().storm;
    if (!storm.active && Math.random() < STORM_CHANCE) {
      ctx.updateStorm({ active: true, startedAt: Date.now(), survivalBits: 0, glitchCount: 0 });
      addGlitchedHistory({
        type: 'error',
        text: 'STORM INCOMING — glitch density spiking. survive for bonus bits.',
      });
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS);
    } else if (storm.active) {
      if (Date.now() - storm.startedAt >= STORM_DURATION_MS) {
        const survived = stormSurvived(storm, Date.now());
        if (survived) {
          ctx.addBits(STORM_SURVIVAL_REWARD, 'Storm Survivor');
          addHistory({
            type: 'achievement',
            text: `[ACHIEVEMENT UNLOCKED] Storm Survivor +${STORM_SURVIVAL_REWARD} Bits`,
          });
        }
        ctx.updateStorm({ active: false, startedAt: null });
      } else {
        ctx.updateStorm({ glitchCount: (storm.glitchCount || 0) + 1 });
        if (Math.random() < 0.25) {
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS);
        }
      }
    }

    // --- Radio transmission ---
    const radio = state().radio;
    if (radio.on && Math.random() < RADIO_TRANSMISSION_CHANCE) {
      const station = RADIO_STATIONS.find((s) => s.id === radio.station) || RADIO_STATIONS[0];
      const msg = pickTransmission(station.effect);
      addGlitchedHistory({ type: 'system', text: msg });
      if (station.effect === 'bitsBonus') {
        ctx.addBits(RADIO_BITS_PER_CATCH, null);
        addHistory({ type: 'output', text: `+${RADIO_BITS_PER_CATCH} BITS from radio catch.` });
      }
    }

    // --- Cron tick: run any due jobs ---
    const cronJobs = state().cronJobs || [];
    if (cronJobs.length > 0) {
      const now = Date.now();
      const updated = tickCron(cronJobs, now);
      const due = dueJobs(updated, now);
      ctx.setCronJobs(updated);
      for (const job of due) {
        addHistory({ type: 'system', text: `CRON: running "${job.command}"...` });
        processCommand(job.command);
      }
    }
  };

  return processCommand;
};

export { SYSTEM_COMMENTARY };

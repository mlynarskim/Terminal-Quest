import { useState, useEffect, useCallback } from 'react';
import { generateDailyQuests, getTodayStr } from '../game/dailyQuest';
import { DAILY_HISTORY_LIMIT, GAME_VERSION, SHELL_HISTORY_LIMIT } from '../game/constants';

export const SAVE_VERSION = 8;

const INITIAL_STATE = {
  bits: 0,
  inventory: [],
  achievements: [],
  currentDir: '/home',
  unlockedFiles: [],
  history: [
    { type: 'system', text: `TERMINAL QUEST OS v${GAME_VERSION}` },
    { type: 'system', text: 'SYSTEM READY. TYPE "help" FOR A MAP, "man" FOR DETAILS.' },
  ],
  solvedPuzzles: [],
  consecutiveFailures: 0,
  lastPuzzleSolvedAt: Date.now(),
  cat: {
    unlocked: false,
    trust: 0,
    hunger: 100,
    isPresent: false,
    lastInteractionAt: Date.now(),
    fragmentsFound: 0,
  },
  stats: {
    commandsRun: 0,
    bitsEarned: 0,
    bitsSpent: 0,
    catInteractions: 0,
    dirsVisited: [],
    killsCount: 0,
    stormSurvivals: 0,
    radioCatches: 0,
    gameStartTime: null,
    gameCompleted: false,
    gameCompletedTime: null,
  },
  dailyStats: { date: null, commands: 0, bitsEarned: 0, catInteractions: 0, dirsVisited: [] },
  daily: { date: null, quests: [], streak: 0, completedDate: null },
  story: { stage: 0, repairedSectors: 0 },
  memos: {},
  skins: { owned: ['default'], active: 'default' },
  dailyHistory: [],
  processes: [],
  cronJobs: [],
  macros: {},
  macroRecording: null,
  bestiary: {},
  prestige: 0,
  radio: { on: false, station: 'lofi' },
  storm: { active: false, startedAt: null, survivalBits: 0, glitchCount: 0 },
  encrypted: {},
  weekly: { lastClaimedDate: null },
  tutorial: { started: false, step: 0, done: false },
  // v8 — real shell layer, leaderboard, lore journal, glitch events
  fs: { files: {}, dirs: {}, removed: [] },
  profile: { name: null },
  leaderboard: { remote: [], lastSync: null, status: 'local', best: 0, seenRank: null },
  journal: { entries: {} },
  glitch: { active: null, survived: [], lastAt: null, count: 0 },
  shell: { history: [] },
  settings: { chaos: true },
  saveVersion: SAVE_VERSION,
};

export const isValidState = (data) => {
  return Boolean(
    data &&
    typeof data === 'object' &&
    Number.isFinite(data.bits) &&
    Array.isArray(data.inventory) &&
    Array.isArray(data.achievements) &&
    typeof data.currentDir === 'string' &&
    Array.isArray(data.history) &&
    Array.isArray(data.solvedPuzzles) &&
    data.cat &&
    typeof data.cat === 'object'
  );
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Recursive "fill in what is missing" merge. */
const mergeMissing = (base, data) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? mergeMissing(out[key], value) : value;
  }
  return out;
};

/**
 * Fills in anything a save is missing from the defaults, recursively. A hand
 * edited, truncated or older save must never be able to crash the game.
 */
export const hydrateState = (data) =>
  isPlainObject(data) ? mergeMissing(INITIAL_STATE, data) : INITIAL_STATE;

const loadInitialState = () => {
  try {
    const saved = localStorage.getItem('terminal_quest_save');
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved);
    if (!isValidState(parsed)) return INITIAL_STATE;
    return migrateSave(hydrateState(parsed));
  } catch {
    return INITIAL_STATE;
  }
};

const migrateSave = (state) => {
  let migrated = { ...state };
  const fromVersion = state.saveVersion || 1;

  if (fromVersion < 2) {
    migrated = {
      ...migrated,
      stats: { ...migrated.stats, catInteractions: 0, dirsVisited: [] },
      dailyStats: { ...migrated.dailyStats, catInteractions: 0, dirsVisited: [] },
    };
  }
  if (fromVersion < 3) {
    migrated = {
      ...migrated,
      daily: { ...migrated.daily, streak: 0, completedDate: null },
      dailyHistory: [],
    };
  }
  if (fromVersion < 4) {
    migrated = {
      ...migrated,
      story: { stage: 0, repairedSectors: 0 },
      skins: { owned: ['default'], active: 'default' },
    };
  }
  if (fromVersion < 5) {
    migrated = {
      ...migrated,
      processes: [],
      cronJobs: [],
      macros: {},
      macroRecording: null,
      bestiary: {},
      prestige: 0,
      radio: { on: false, station: 'lofi' },
      storm: { active: false, startedAt: null, survivalBits: 0, glitchCount: 0 },
      encrypted: {},
      weekly: { lastClaimedDate: null },
    };
  }
  if (fromVersion < 6) {
    migrated = {
      ...migrated,
      tutorial: { started: false, step: 0, done: false },
    };
  }
  if (fromVersion < 7) {
    migrated = {
      ...migrated,
      objective: { title: '', detail: '', progress: null }, // handled by getObjective()
    };
  }
  if (fromVersion < 8) {
    // v8 turns personal memos into real files, so `ls`, `cat`, `grep` and
    // friends work on them like they do on everything else.
    const memos = migrated.memos || {};
    const files = { ...(migrated.fs?.files || {}) };
    for (const [name, content] of Object.entries(memos)) {
      const path = name.startsWith('/') ? name : `/home/${name}`;
      if (!files[path]) files[path] = { content, created: 0, modified: 0 };
    }
    migrated = {
      ...migrated,
      fs: { files, dirs: {}, removed: [] },
      profile: { name: null },
      leaderboard: { remote: [], lastSync: null, status: 'local', best: 0, seenRank: null },
      journal: { entries: {} },
      glitch: { active: null, survived: [], lastAt: null, count: 0 },
      shell: { history: [] },
      settings: { chaos: true },
    };
  }

  migrated.saveVersion = SAVE_VERSION;
  return migrated;
};

const mergeNested = (base, incoming) => {
  if (!incoming || typeof incoming !== 'object') return base;
  return { ...base, ...incoming };
};

const mergeState = (base, incoming) => {
  if (!isValidState(incoming)) return base;
  incoming = hydrateState(incoming);
  return {
    ...base,
    ...incoming,
    cat: { ...base.cat, ...(incoming.cat || {}) },
    stats: mergeNested(base.stats, incoming.stats),
    dailyStats: mergeNested(base.dailyStats, incoming.dailyStats),
    daily: mergeNested(base.daily, incoming.daily),
    story: mergeNested(base.story, incoming.story),
    skins: mergeNested(base.skins, incoming.skins),
    radio: mergeNested(base.radio, incoming.radio),
    storm: mergeNested(base.storm, incoming.storm),
    weekly: mergeNested(base.weekly, incoming.weekly),
    tutorial: mergeNested(base.tutorial, incoming.tutorial),
    memos: { ...(base.memos || {}), ...(incoming.memos || {}) },
    processes: Array.isArray(incoming.processes) ? incoming.processes : base.processes,
    cronJobs: Array.isArray(incoming.cronJobs) ? incoming.cronJobs : base.cronJobs,
    macros: incoming.macros || base.macros,
    macroRecording:
      incoming.macroRecording !== undefined ? incoming.macroRecording : base.macroRecording,
    bestiary: incoming.bestiary || base.bestiary,
    encrypted: incoming.encrypted || base.encrypted,
    dailyHistory: Array.isArray(incoming.dailyHistory) ? incoming.dailyHistory : base.dailyHistory,
    fs: {
      files: { ...(base.fs?.files || {}), ...(incoming.fs?.files || {}) },
      dirs: { ...(base.fs?.dirs || {}), ...(incoming.fs?.dirs || {}) },
      removed: Array.isArray(incoming.fs?.removed) ? incoming.fs.removed : (base.fs?.removed || []),
    },
    profile: mergeNested(base.profile, incoming.profile),
    leaderboard: mergeNested(base.leaderboard, incoming.leaderboard),
    journal: mergeNested(base.journal, incoming.journal),
    glitch: mergeNested(base.glitch, incoming.glitch),
    shell: mergeNested(base.shell, incoming.shell),
    settings: mergeNested(base.settings, incoming.settings),
  };
};

export const useGameState = () => {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem('terminal_quest_save', JSON.stringify(state));
    } catch {
      // Ignore storage failures (e.g. private mode / quota)
    }
  }, [state]);

  const addHistory = useCallback((entry) => {
    setState((prev) => ({
      ...prev,
      history: [...prev.history, entry],
    }));
  }, []);

  const addBits = useCallback((amount, achievement = null) => {
    setState((prev) => {
      const newAchievements =
        achievement && !prev.achievements.includes(achievement)
          ? [...prev.achievements, achievement]
          : prev.achievements;

      const earnedDelta = amount > 0 ? amount : 0;
      const spentDelta = amount < 0 ? -amount : 0;
      const canCountToday = prev.dailyStats.date === null || prev.dailyStats.date === getTodayStr();

      return {
        ...prev,
        bits: prev.bits + amount,
        achievements: newAchievements,
        stats: {
          ...prev.stats,
          bitsEarned: prev.stats.bitsEarned + earnedDelta,
          bitsSpent: prev.stats.bitsSpent + spentDelta,
        },
        dailyStats:
          earnedDelta > 0 && canCountToday
            ? { ...prev.dailyStats, bitsEarned: prev.dailyStats.bitsEarned + earnedDelta }
            : prev.dailyStats,
      };
    });
  }, []);

  const setDir = useCallback((dir) => setState((prev) => ({ ...prev, currentDir: dir })), []);

  const addItem = useCallback(
    (item) =>
      setState((prev) => ({
        ...prev,
        inventory: [...prev.inventory, item],
      })),
    []
  );

  const removeItem = useCallback(
    (item) =>
      setState((prev) => ({
        ...prev,
        inventory: prev.inventory.filter((i) => i !== item),
      })),
    []
  );

  const addUnlockedFile = useCallback(
    (path) =>
      setState((prev) => ({
        ...prev,
        unlockedFiles: prev.unlockedFiles.includes(path)
          ? prev.unlockedFiles
          : [...prev.unlockedFiles, path],
      })),
    []
  );

  const solvePuzzle = useCallback((id, reward = 0, achievementLabel = null) => {
    setState((prev) => {
      if (prev.solvedPuzzles.includes(id)) return prev;

      const newSolved = [...prev.solvedPuzzles, id];
      const newAchievements =
        achievementLabel && !prev.achievements.includes(achievementLabel)
          ? [...prev.achievements, achievementLabel]
          : prev.achievements;

      return {
        ...prev,
        solvedPuzzles: newSolved,
        achievements: newAchievements,
        bits: prev.bits + reward,
        lastPuzzleSolvedAt: Date.now(),
        consecutiveFailures: 0,
      };
    });
  }, []);

  const incrementFailures = useCallback(
    () =>
      setState((prev) => ({
        ...prev,
        consecutiveFailures: prev.consecutiveFailures + 1,
      })),
    []
  );

  const resetFailures = useCallback(
    () =>
      setState((prev) => ({
        ...prev,
        consecutiveFailures: 0,
      })),
    []
  );

  const clearHistory = useCallback(() => setState((prev) => ({ ...prev, history: [] })), []);

  const resetGame = useCallback(() => {
    try {
      localStorage.removeItem('terminal_quest_save');
    } catch {}
    setState(INITIAL_STATE);
  }, []);

  const loadState = useCallback((newState) => {
    setState((prev) => mergeState(prev, newState));
  }, []);

  const updateCat = useCallback(
    (updates) =>
      setState((prev) => ({
        ...prev,
        cat: { ...prev.cat, ...updates },
      })),
    []
  );

  // --- Session / engagement trackers ---

  const recordCommand = useCallback(() => {
    setState((prev) => {
      const today = getTodayStr();
      const dailyStats =
        prev.dailyStats.date === today
          ? { ...prev.dailyStats, commands: prev.dailyStats.commands + 1 }
          : prev.dailyStats;
      return {
        ...prev,
        stats: { ...prev.stats, commandsRun: prev.stats.commandsRun + 1 },
        dailyStats,
      };
    });
  }, []);

  const recordVisit = useCallback((dir) => {
    setState((prev) => {
      const today = getTodayStr();
      const addUnique = (list) => (list.includes(dir) ? list : [...list, dir]);
      const dailyStats =
        prev.dailyStats.date === today
          ? { ...prev.dailyStats, dirsVisited: addUnique(prev.dailyStats.dirsVisited) }
          : prev.dailyStats;
      return {
        ...prev,
        stats: { ...prev.stats, dirsVisited: addUnique(prev.stats.dirsVisited) },
        dailyStats,
      };
    });
  }, []);

  const recordCatInteraction = useCallback(() => {
    setState((prev) => {
      const today = getTodayStr();
      const dailyStats =
        prev.dailyStats.date === today
          ? { ...prev.dailyStats, catInteractions: prev.dailyStats.catInteractions + 1 }
          : prev.dailyStats;
      return {
        ...prev,
        stats: { ...prev.stats, catInteractions: prev.stats.catInteractions + 1 },
        dailyStats,
      };
    });
  }, []);

  const ensureNewDay = useCallback(() => {
    setState((prev) => {
      const today = getTodayStr();
      if (prev.dailyStats.date === today) return prev;

      const prevDate = prev.dailyStats.date || today;
      const clamped = [
        ...prev.dailyHistory,
        { date: prevDate, earned: prev.dailyStats.bitsEarned },
      ].slice(-DAILY_HISTORY_LIMIT);

      let daily = prev.daily;
      if (daily.date !== today) {
        daily = {
          date: today,
          quests: generateDailyQuests(today),
          streak: daily.streak,
          completedDate: null,
        };
      }

      return {
        ...prev,
        dailyHistory: clamped,
        daily,
        dailyStats: {
          date: today,
          commands: 0,
          bitsEarned: 0,
          catInteractions: 0,
          dirsVisited: [],
        },
      };
    });
  }, []);

  // --- Notes (personal memos) ---

  const setMemo = useCallback(
    (name, content) =>
      setState((prev) => ({
        ...prev,
        memos: { ...prev.memos, [name]: content },
      })),
    []
  );

  const removeMemo = useCallback(
    (name) =>
      setState((prev) => {
        const memos = { ...prev.memos };
        delete memos[name];
        return { ...prev, memos };
      }),
    []
  );

  // --- Story / daily / skins state ---

  const updateStory = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        story: { ...prev.story, ...patch },
      })),
    []
  );

  const updateDaily = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        daily: { ...prev.daily, ...patch },
      })),
    []
  );

  const updateSkins = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        skins: { ...prev.skins, ...patch },
      })),
    []
  );

  const unlockSkin = useCallback(
    (skinId) =>
      setState((prev) => ({
        ...prev,
        skins: {
          ...prev.skins,
          owned: prev.skins.owned.includes(skinId)
            ? prev.skins.owned
            : [...prev.skins.owned, skinId],
        },
      })),
    []
  );

  // --- Processes ---

  const setProcesses = useCallback(
    (processes) =>
      setState((prev) => ({
        ...prev,
        processes,
      })),
    []
  );

  // --- Cron / macros ---

  const setCronJobs = useCallback(
    (cronJobs) =>
      setState((prev) => ({
        ...prev,
        cronJobs,
      })),
    []
  );

  const setMacros = useCallback(
    (macros) =>
      setState((prev) => ({
        ...prev,
        macros,
      })),
    []
  );

  const setMacroRecording = useCallback(
    (macroRecording) =>
      setState((prev) => ({
        ...prev,
        macroRecording,
      })),
    []
  );

  // --- Bestiary ---

  const setBestiary = useCallback(
    (bestiary) =>
      setState((prev) => ({
        ...prev,
        bestiary,
      })),
    []
  );

  // --- Prestige ---

  const setPrestige = useCallback(
    (level) =>
      setState((prev) => ({
        ...prev,
        prestige: level,
      })),
    []
  );

  // --- Radio ---

  const updateRadio = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        radio: { ...prev.radio, ...patch },
      })),
    []
  );

  // --- Storm ---

  const updateStorm = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        storm: { ...prev.storm, ...patch },
      })),
    []
  );

  // --- Encrypted ---

  const setEncrypted = useCallback(
    (path, data) =>
      setState((prev) => ({
        ...prev,
        encrypted: { ...prev.encrypted, [path]: data },
      })),
    []
  );

  // --- Weekly ---

  const updateWeekly = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        weekly: { ...prev.weekly, ...patch },
      })),
    []
  );

  // --- Tutorial ---

  const updateTutorial = useCallback(
    (patch) =>
      setState((prev) => ({
        ...prev,
        tutorial: { ...prev.tutorial, ...patch },
      })),
    []
  );

  // --- Achievement tracking ---

  const setGameStartTime = useCallback(() =>
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        gameStartTime: prev.stats.gameStartTime || Date.now(),
      },
    })),
  []);

  const setGameCompleted = useCallback(() =>
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        gameCompleted: true,
        gameCompletedTime: Date.now(),
      },
    })),
  []);

  const incrementKills = useCallback(() =>
    setState((prev) => ({
      ...prev,
      stats: { ...prev.stats, killsCount: (prev.stats.killsCount || 0) + 1 },
    })),
  []);

  const incrementStormSurvivals = useCallback(() =>
    setState((prev) => ({
      ...prev,
      stats: { ...prev.stats, stormSurvivals: (prev.stats.stormSurvivals || 0) + 1 },
    })),
  []);

  const incrementRadioCatches = useCallback(() =>
    setState((prev) => ({
      ...prev,
      stats: { ...prev.stats, radioCatches: (prev.stats.radioCatches || 0) + 1 },
    })),
  []);

  // --- Writable filesystem (shell redirection, touch, cp, mv, rm) ---

  const setFs = useCallback((fs) => setState((prev) => ({ ...prev, fs })), []);

  const writeFile = useCallback((path, content, append = false) => {
    setState((prev) => {
      const files = prev.fs?.files || {};
      const current = files[path];
      const next = append && current ? `${current.content}${content}` : content;
      return {
        ...prev,
        fs: {
          files: {
            ...files,
            [path]: {
              content: next,
              created: current?.created ?? Date.now(),
              modified: Date.now(),
            },
          },
          dirs: prev.fs?.dirs || {},
          removed: (prev.fs?.removed || []).filter((p) => p !== path),
        },
      };
    });
  }, []);

  // --- Profile (leaderboard handle) ---

  const updateProfile = useCallback(
    (patch) => setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } })),
    []
  );

  // --- Leaderboard ---

  const updateLeaderboard = useCallback(
    (patch) => setState((prev) => ({ ...prev, leaderboard: { ...prev.leaderboard, ...patch } })),
    []
  );

  // --- Lore journal ---

  const updateJournal = useCallback(
    (patch) => setState((prev) => ({ ...prev, journal: { ...prev.journal, ...patch } })),
    []
  );

  const addJournalEntry = useCallback((id) => {
    setState((prev) => {
      if (prev.journal?.entries?.[id]) return prev;
      return {
        ...prev,
        journal: {
          ...prev.journal,
          entries: { ...(prev.journal?.entries || {}), [id]: Date.now() },
        },
      };
    });
  }, []);

  // --- Glitch events ---

  const updateGlitch = useCallback(
    (patch) => setState((prev) => ({ ...prev, glitch: { ...prev.glitch, ...patch } })),
    []
  );

  // --- Player settings (calm grid, chaos) ---

  const updateSettings = useCallback(
    (patch) => setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    []
  );

  // --- Shell history (`history`) ---

  const pushShellHistory = useCallback((command) => {
    setState((prev) => {
      const history = prev.shell?.history || [];
      return {
        ...prev,
        shell: { ...prev.shell, history: [...history, command].slice(-SHELL_HISTORY_LIMIT) },
      };
    });
  }, []);

  const clearShellHistory = useCallback(
    () => setState((prev) => ({ ...prev, shell: { ...prev.shell, history: [] } })),
    []
  );

  return {
    state,
    addHistory,
    addBits,
    setDir,
    addItem,
    solvePuzzle,
    addUnlockedFile,
    incrementFailures,
    resetFailures,
    clearHistory,
    resetGame,
    loadState,
    updateCat,
    removeItem,
    recordCommand,
    recordVisit,
    recordCatInteraction,
    ensureNewDay,
    setMemo,
    removeMemo,
    updateStory,
    updateDaily,
    updateSkins,
    unlockSkin,
    setProcesses,
    setCronJobs,
    setMacros,
    setMacroRecording,
    setBestiary,
    setPrestige,
    updateRadio,
    updateStorm,
    setEncrypted,
    updateWeekly,
    updateTutorial,
    setGameStartTime,
    setGameCompleted,
    incrementKills,
    incrementStormSurvivals,
    incrementRadioCatches,
    setFs,
    writeFile,
    updateProfile,
    updateLeaderboard,
    updateJournal,
    addJournalEntry,
    updateGlitch,
    pushShellHistory,
    clearShellHistory,
    updateSettings,
  };
};

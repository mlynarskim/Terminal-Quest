import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCommandProcessor } from '../game/commandProcessor';

const makeInitialState = () => ({
  bits: 0,
  inventory: [],
  achievements: [],
  currentDir: '/home',
  unlockedFiles: [],
  history: [],
  solvedPuzzles: [],
  consecutiveFailures: 0,
  cat: {
    unlocked: false,
    trust: 0,
    hunger: 100,
    isPresent: false,
    lastInteractionAt: Date.now(),
    fragmentsFound: 0,
  },
  stats: { commandsRun: 0, bitsEarned: 0, bitsSpent: 0, catInteractions: 0, dirsVisited: [] },
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
});

const createHarness = () => {
  let state = makeInitialState();
  let pendingConfirmation = null;

  const actions = {
    setDir: vi.fn((dir) => {
      state = { ...state, currentDir: dir };
    }),
    addBits: vi.fn((amount) => {
      state = { ...state, bits: state.bits + amount };
    }),
    addItem: vi.fn((item) => {
      state = { ...state, inventory: [...state.inventory, item] };
    }),
    removeItem: vi.fn((item) => {
      state = { ...state, inventory: state.inventory.filter((i) => i !== item) };
    }),
    addUnlockedFile: vi.fn((path) => {
      if (!state.unlockedFiles.includes(path))
        state = { ...state, unlockedFiles: [...state.unlockedFiles, path] };
    }),
    solvePuzzle: vi.fn((id, reward, label) => {
      if (!state.solvedPuzzles.includes(id)) {
        state = {
          ...state,
          solvedPuzzles: [...state.solvedPuzzles, id],
          bits: state.bits + reward,
        };
        if (label && !state.achievements.includes(label))
          state = { ...state, achievements: [...state.achievements, label] };
      }
    }),
    incrementFailures: vi.fn(() => {
      state = { ...state, consecutiveFailures: state.consecutiveFailures + 1 };
    }),
    resetFailures: vi.fn(() => {
      state = { ...state, consecutiveFailures: 0 };
    }),
    clearHistory: vi.fn(() => {
      state = { ...state, history: [] };
    }),
    resetGame: vi.fn(() => {
      state = makeInitialState();
    }),
    updateCat: vi.fn((patch) => {
      state = { ...state, cat: { ...state.cat, ...patch } };
    }),
    recordCommand: vi.fn(() => {
      state = { ...state, stats: { ...state.stats, commandsRun: state.stats.commandsRun + 1 } };
    }),
    recordVisit: vi.fn(() => {}),
    recordCatInteraction: vi.fn(() => {
      state = {
        ...state,
        stats: { ...state.stats, catInteractions: state.stats.catInteractions + 1 },
      };
    }),
    ensureNewDay: vi.fn(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (state.daily.date !== today && !state.daily.quests.length) {
        state = {
          ...state,
          daily: { ...state.daily, date: today, quests: [] },
          dailyStats: { ...state.dailyStats, date: today },
        };
      }
    }),
    setMemo: vi.fn((name, content) => {
      state = { ...state, memos: { ...state.memos, [name]: content } };
    }),
    removeMemo: vi.fn((name) => {
      const m = { ...state.memos };
      delete m[name];
      state = { ...state, memos: m };
    }),
    updateStory: vi.fn((patch) => {
      state = { ...state, story: { ...state.story, ...patch } };
    }),
    updateDaily: vi.fn((patch) => {
      state = { ...state, daily: { ...state.daily, ...patch } };
    }),
    updateSkins: vi.fn((patch) => {
      state = { ...state, skins: { ...state.skins, ...patch } };
    }),
    unlockSkin: vi.fn((id) => {
      if (!state.skins.owned.includes(id))
        state = { ...state, skins: { ...state.skins, owned: [...state.skins.owned, id] } };
    }),
    setProcesses: vi.fn((procs) => {
      state = { ...state, processes: procs };
    }),
    setCronJobs: vi.fn((jobs) => {
      state = { ...state, cronJobs: jobs };
    }),
    setMacros: vi.fn((macros) => {
      state = { ...state, macros };
    }),
    setMacroRecording: vi.fn((rec) => {
      state = { ...state, macroRecording: rec };
    }),
    setBestiary: vi.fn((b) => {
      state = { ...state, bestiary: b };
    }),
    setPrestige: vi.fn((level) => {
      state = { ...state, prestige: level };
    }),
    updateRadio: vi.fn((patch) => {
      state = { ...state, radio: { ...state.radio, ...patch } };
    }),
    updateStorm: vi.fn((patch) => {
      state = { ...state, storm: { ...state.storm, ...patch } };
    }),
    setEncrypted: vi.fn((path, data) => {
      state = { ...state, encrypted: { ...state.encrypted, [path]: data } };
    }),
    updateWeekly: vi.fn((patch) => {
      state = { ...state, weekly: { ...state.weekly, ...patch } };
    }),
    updateTutorial: vi.fn((patch) => {
      state = { ...state, tutorial: { ...state.tutorial, ...patch } };
    }),
  };

  const emitCount = { input: 0, output: 0, error: 0, system: 0, achievement: 0 };
  const emitted = [];

  const ctx = {
    getState: () => state,
    getPendingConfirmation: () => pendingConfirmation,
    addHistory: (entry) => {
      emitted.push(entry);
      emitCount[entry.type] = (emitCount[entry.type] || 0) + 1;
      state = { ...state, history: [...state.history, entry] };
    },
    addGlitchedHistoryRaw: (entry) => {
      emitted.push(entry);
      emitCount[entry.type] = (emitCount[entry.type] || 0) + 1;
      state = { ...state, history: [...state.history, entry] };
    },
    setIsGlitching: vi.fn(),
    setPendingConfirmation: vi.fn((p) => {
      pendingConfirmation = p;
    }),
    playError: vi.fn(),
    playAchievement: vi.fn(),
    triggerFileSelect: vi.fn(),
    onRestart: vi.fn(),
    ...actions,
  };

  return {
    process: createCommandProcessor(ctx),
    state: () => state,
    setState: (fn) => {
      state = fn(state);
    },
    emitted,
    emitCount,
    actions,
    onRestart: ctx.onRestart,
    setPending: (v) => {
      pendingConfirmation = v;
    },
  };
};

describe('command processor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Keep command output deterministic: 0.5 < 5% glitch threshold means no
    // random corruption of output text, and no random system reactions.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });
  afterEach(() => vi.useRealTimers());

  it('pwd echoes current directory', () => {
    const h = createHarness();
    h.process('pwd');
    expect(h.emitted[h.emitted.length - 1].text).toBe('/home');
  });

  it('cd changes the directory', () => {
    const h = createHarness();
    h.process('cd .hidden');
    expect(h.actions.setDir).toHaveBeenCalledWith('/home/.hidden');
  });

  it('cd into a restricted dir is denied without --force', () => {
    const h = createHarness();
    h.process('cd system');
    expect(h.actions.setDir).not.toHaveBeenCalled();
  });

  it('cd .. goes to parent', () => {
    const h = createHarness();
    h.actions.setDir('/home/.hidden');
    h.process('cd ..');
    expect(h.actions.setDir).toHaveBeenCalledWith('/home');
  });

  it('ls lists visible files', () => {
    const h = createHarness();
    h.process('ls');
    const last = h.emitted[h.emitted.length - 1];
    expect(last.type).toBe('output');
    expect(last.text).toContain('readme.txt');
    expect(last.text).not.toContain('.hidden');
  });

  it('ls -a reveals hidden entries and awards the puzzle', () => {
    const h = createHarness();
    h.process('ls -a');
    expect(h.emitted.some((e) => e.text.includes('.hidden'))).toBe(true);
    expect(h.actions.solvePuzzle).toHaveBeenCalledWith('ls-a', 20, 'Hidden Seeker');
  });

  it('cat reads a file and marks it unlocked', () => {
    const h = createHarness();
    h.process('cat readme.txt');
    expect(h.actions.addUnlockedFile).toHaveBeenCalledWith('/home/readme.txt');
    expect(h.emitted.some((e) => e.text.includes('Welcome to Terminal Quest'))).toBe(true);
  });

  it('motherlode grants bits exactly once', () => {
    const h = createHarness();
    h.process('motherlode');
    expect(h.state().bits).toBe(150);
    h.process('motherlode');
    expect(h.state().bits).toBe(150);
  });

  it('resolves intent mapping phrases', () => {
    const h = createHarness();
    h.process('go back');
    expect(h.actions.setDir).toHaveBeenCalledWith('/');
  });

  it('unknown commands increment consecutive failures', () => {
    const h = createHarness();
    h.process('nosuchcommand');
    expect(h.state().consecutiveFailures).toBe(1);
    expect(h.actions.incrementFailures).toHaveBeenCalled();
  });

  it('sudo clear requires Y confirmation and wipes game', () => {
    vi.useFakeTimers();
    const h = createHarness();
    h.actions.addBits(500);
    h.process('sudo clear');
    expect(h.emitCount.error).toBeGreaterThan(0);

    h.process('y');
    vi.advanceTimersByTime(3000);
    expect(h.state().bits).toBe(0);
    expect(h.onRestart).toHaveBeenCalled();
  });

  it('pending confirmation rejects non-Y/N responses', () => {
    const h = createHarness();
    h.process('sudo clear');
    const countBefore = h.emitCount.error;
    h.process('maybe');
    expect(h.emitCount.error).toBeGreaterThan(countBefore);
  });

  it('"search" is its own command (filesystem search), not an alias of scan', () => {
    const h = createHarness();
    h.process('search readme');
    expect(h.emitted.some((e) => e.text.includes('SCANNING FILESYSTEM FOR "README"'))).toBe(true);
    // The scan handler output should NOT be produced by "search"
    expect(h.emitted.some((e) => e.text.includes('Scanning filesystem'))).toBe(false);
  });

  it('edit writes a memo and cat reads it back', () => {
    const h = createHarness();
    h.process('edit plans find the third fragment');
    expect(h.state().memos.plans).toBe('find the third fragment');
    h.process('cat plans');
    expect(h.emitted[h.emitted.length - 1].text).toBe('find the third fragment');
  });

  it('notes lists memos and rm memo deletes one', () => {
    const h = createHarness();
    h.process('edit a one');
    h.process('edit b two');
    h.process('notes');
    expect(h.emitted.some((e) => e.text.startsWith('[memo] a:'))).toBe(true);
    expect(h.emitted.some((e) => e.text.startsWith('[memo] b:'))).toBe(true);
    h.process('rm memo a');
    expect(h.state().memos.a).toBeUndefined();
  });

  it('theme requires ownership and equips owned skins', () => {
    const h = createHarness();
    h.process('theme amber');
    expect(h.emitted.some((e) => e.text.includes('NOT OWNED'))).toBe(true);
    h.setState((s) => ({ ...s, skins: { ...s.skins, owned: [...s.skins.owned, 'amber'] } }));
    h.process('theme amber');
    expect(h.state().skins.active).toBe('amber');
  });

  it('play crash runs a win/lose flow against a typed sequence', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, bits: 100 }));
    h.process('play crash 20');
    const gameLine = h.emitted.find((e) => e.text.includes('TYPE THE SEQUENCE'));
    expect(gameLine).toBeTruthy();
    const sequence = gameLine.text.split(': ')[1];
    h.process(`guess ${sequence}`);
    // start deducts the bet (20), win pays out bet ×2 (40) → net balance 100 - 20 + 40
    expect(h.state().bits).toBe(120);
  });

  it('guess without an active game is an error', () => {
    const h = createHarness();
    h.process('guess XK72-AQF4-B1');
    expect(h.emitCount.error).toBeGreaterThan(0);
  });

  it('daily reports seeded quests (empty quests when not yet seeded)', () => {
    const h = createHarness();
    h.process('daily');
    expect(h.emitted.some((e) => e.text.startsWith('DAEMON_DAILY'))).toBe(true);
  });

  it('stats reports session counters', () => {
    const h = createHarness();
    h.setState((s) => ({
      ...s,
      stats: { ...s.stats, commandsRun: 12, bitsEarned: 300, bitsSpent: 50 },
    }));
    h.process('stats');
    // recordCommand runs once per processed command, so 12 + 1 = 13
    expect(h.emitted.some((e) => e.text.includes('COMMANDS ISSUED: 13'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('BITS EARNED: 300'))).toBe(true);
  });

  it('rank reports a rank derived from lifetime bits earned', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, stats: { ...s.stats, bitsEarned: 300 } }));
    h.process('rank');
    expect(h.emitted.some((e) => e.text.includes('BIT_SMITH'))).toBe(true);
  });

  it('time reports the phase of day', () => {
    const h = createHarness();
    h.process('time');
    expect(h.emitted.some((e) => e.text.includes('PHASE OF DAY'))).toBe(true);
  });

  it('story gates repair but reveals the arc', () => {
    const h = createHarness();
    h.process('story');
    expect(h.emitted.some((e) => e.text.includes('ARC: DISCOVERY'))).toBe(true);
    // repair is requirement-gated at stage 0, so a fresh player cannot trigger it
    h.process('repair');
    expect(h.emitted.some((e) => e.text.includes('repair protocol offline'))).toBe(true);
  });

  it('ps shows active processes', () => {
    const h = createHarness();
    h.process('ps');
    expect(h.emitted.some((e) => e.text.includes('NO ACTIVE PROCESSES'))).toBe(true);
  });

  it('kill rejects invalid pid', () => {
    const h = createHarness();
    h.process('kill abc');
    expect(h.emitted.some((e) => e.text.includes('PID must be numeric'))).toBe(true);
  });

  it('combine rejects unknown combinations', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, inventory: ['box', 'box'] }));
    h.process('combine box box');
    expect(h.emitted.some((e) => e.text.includes('nothing useful'))).toBe(true);
  });

  it('ask requires a query', () => {
    const h = createHarness();
    h.process('ask');
    expect(h.emitted.some((e) => e.text.includes('USAGE'))).toBe(true);
  });

  it('cron list shows empty when no jobs', () => {
    const h = createHarness();
    h.process('cron list');
    expect(h.emitted.some((e) => e.text.includes('NO CRON JOBS'))).toBe(true);
  });

  it('radio stations lists all stations', () => {
    const h = createHarness();
    h.process('radio stations');
    expect(h.emitted.some((e) => e.text.includes('LO-FI_GRID'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('MINING_RADIO'))).toBe(true);
  });

  it('weekly shows a challenge', () => {
    const h = createHarness();
    h.process('weekly');
    expect(h.emitted.some((e) => e.text.includes('WEEKLY CHALLENGE'))).toBe(true);
  });

  it('bestiary shows discovery percentage', () => {
    const h = createHarness();
    h.process('bestiary');
    expect(h.emitted.some((e) => e.text.includes('BESTIARY'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('% discovered'))).toBe(true);
  });

  it('recompile is gated behind story stage 2', () => {
    const h = createHarness();
    h.process('recompile');
    expect(h.emitted.some((e) => e.text.includes('recompile unavailable'))).toBe(true);
  });

  it('decrypt rejects unknown path', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, inventory: ['key'] }));
    h.process('decrypt /home/ghost.txt');
    expect(h.emitted.some((e) => e.text.includes('No encrypted file'))).toBe(true);
  });

  it('restore prompts for an ending choice when keyed', () => {
    const h = createHarness();
    h.setState((s) => ({
      ...s,
      inventory: ['key'],
      story: { stage: 1, repairedSectors: 4 },
    }));
    h.process('restore');
    expect(h.emitted.some((e) => e.text.includes('CHOOSE AN ENDING'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('restore rewrite'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('restore preserve'))).toBe(true);
  });

  it('restore requires the master key', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, story: { stage: 1, repairedSectors: 4 } }));
    h.process('restore rewrite');
    expect(h.emitted.some((e) => e.text.includes('MASTER KEY'))).toBe(true);
  });

  it('storm reports clear skies when inactive', () => {
    const h = createHarness();
    h.process('storm');
    expect(h.emitted.some((e) => e.text.includes('SKIES CLEAR'))).toBe(true);
  });

  it('storm reports elapsed time when active', () => {
    const h = createHarness();
    h.setState((s) => ({
      ...s,
      storm: { active: true, startedAt: Date.now() - 5000, glitchCount: 3 },
    }));
    h.process('storm');
    expect(h.emitted.some((e) => e.text.includes('STORM ACTIVE'))).toBe(true);
  });

  it('weekly rewards a rank-1 finish once per week', () => {
    const h = createHarness();
    // 2026-02-23 is a MINE 500 BITS week (top bot: 962) — deterministic rank 1
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-23T12:00:00Z'));
    h.setState((s) => ({
      ...s,
      stats: { ...s.stats, commandsRun: 99999, bitsEarned: 99999, catInteractions: 999 },
      achievements: ['a', 'b', 'c'],
    }));
    h.process('weekly');
    expect(h.emitted.some((e) => e.text.includes('Weekly Champion'))).toBe(true);
    const firstClaim = h.state().weekly.lastClaimedDate;
    expect(firstClaim).toBeTruthy();
    h.process('weekly');
    expect(h.emitted.some((e) => e.text.includes('Reward already claimed'))).toBe(true);
    vi.useRealTimers();
  });

  it('record captures commands and play replays a macro', () => {
    const h = createHarness();
    h.process('record demo');
    h.process('pwd');
    h.process('record --stop');
    expect(h.state().macros.demo).toEqual(['pwd']);
    h.process('play demo');
    expect(h.emitted.some((e) => e.text.includes('MACRO "demo" COMPLETE'))).toBe(true);
  });

  it('story shows the chosen ending once restored', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, story: { stage: 2, repairedSectors: 4, ending: 'preserve' } }));
    h.process('story');
    expect(h.emitted.some((e) => e.text.includes('Glitch Keeper'))).toBe(true);
  });

  it('tutorial advances when the typed command matches the step', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 0, done: false } }));
    h.process('help');
    expect(h.state().tutorial.step).toBe(1);
    expect(h.emitted.some((e) => e.text.includes('STEP 2/5'))).toBe(true);
  });

  it('tutorial ignores non-matching commands', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 0, done: false } }));
    h.process('ls');
    expect(h.state().tutorial.step).toBe(0);
  });

  it('tutorial completes with reward on the final step', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 4, done: false } }));
    h.process('ask hello');
    expect(h.state().tutorial.done).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('TUTORIAL COMPLETE'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('First Boot'))).toBe(true);
  });

  it('tutorial skip and restart work', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 2, done: false } }));
    h.process('tutorial skip');
    expect(h.state().tutorial.done).toBe(true);
    h.process('tutorial restart');
    expect(h.state().tutorial).toMatchObject({ started: true, step: 0, done: false });
    expect(h.emitted.some((e) => e.text.includes('STEP 1/5'))).toBe(true);
  });

  it('tutorial reports progress and completion', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 2, done: false } }));
    h.process('tutorial');
    expect(h.emitted.some((e) => e.text.includes('step 3/5'))).toBe(true);
    h.setState((s) => ({ ...s, tutorial: { started: true, step: 5, done: true } }));
    h.process('tutorial');
    expect(h.emitted.some((e) => e.text.includes('TUTORIAL COMPLETE (5/5)'))).toBe(true);
  });
});

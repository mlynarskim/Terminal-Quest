import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCommandProcessor } from '../game/commandProcessor';
import { hydrateState } from '../hooks/useGameState';

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
  fs: { files: {}, dirs: {}, removed: [] },
  profile: { name: null },
  leaderboard: { remote: [], lastSync: null, status: 'local', best: 0, seenRank: null },
  journal: { entries: {} },
  glitch: { active: null, survived: [], lastAt: null, count: 0 },
  shell: { history: [] },
  settings: { chaos: true },
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
    updateSettings: vi.fn((patch) => {
      state = { ...state, settings: { ...state.settings, ...patch } };
    }),
    incrementKills: vi.fn(() => {
      state = {
        ...state,
        stats: { ...state.stats, killsCount: (state.stats.killsCount || 0) + 1 },
      };
    }),
    setFs: vi.fn((fs) => {
      state = { ...state, fs };
    }),
    writeFile: vi.fn((path, content) => {
      const files = { ...(state.fs?.files || {}), [path]: { content, created: 0, modified: 0 } };
      state = { ...state, fs: { ...state.fs, files } };
    }),
    updateProfile: vi.fn((patch) => {
      state = { ...state, profile: { ...state.profile, ...patch } };
    }),
    updateLeaderboard: vi.fn((patch) => {
      state = { ...state, leaderboard: { ...state.leaderboard, ...patch } };
    }),
    updateJournal: vi.fn((patch) => {
      state = { ...state, journal: { ...state.journal, ...patch } };
    }),
    addJournalEntry: vi.fn((id) => {
      const entries = { ...(state.journal?.entries || {}), [id]: Date.now() };
      state = { ...state, journal: { ...state.journal, entries } };
    }),
    updateGlitch: vi.fn((patch) => {
      state = { ...state, glitch: { ...state.glitch, ...patch } };
    }),
    pushShellHistory: vi.fn((command) => {
      const history = state.shell?.history || [];
      state = { ...state, shell: { ...state.shell, history: [...history, command] } };
    }),
    clearShellHistory: vi.fn(() => {
      state = { ...state, shell: { ...state.shell, history: [] } };
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

  it('ls lists visible files one per line and hides dotfiles', () => {
    const h = createHarness();
    h.process('ls');
    const names = h.emitted.filter((e) => e.type === 'output').map((e) => e.text);
    expect(names).toContain('readme.txt');
    expect(names).toContain('note.txt');
    expect(names).not.toContain('.hidden');
    expect(names).not.toContain('fragment_01.tmp');
  });

  it('ls -l prints permissions, owner and size', () => {
    const h = createHarness();
    h.process('ls -l readme.txt');
    const line = h.emitted.find((e) => e.text.includes('readme.txt'));
    expect(line.text).toContain('-rw-r--r--');
    expect(line.text).toContain('explorer');
  });

  it('supports pipes: cat file | wc -l', () => {
    const h = createHarness();
    h.process('cat readme.txt | wc -c');
    const line = h.emitted[h.emitted.length - 1];
    expect(line.type).toBe('output');
    expect(Number(line.text.trim())).toBeGreaterThan(0);
  });

  it('redirects stdout into a new file', () => {
    const h = createHarness();
    h.process('echo hello grid > note2.txt');
    expect(h.state().fs.files['/home/note2.txt'].content).toContain('hello grid');
    h.process('cat note2.txt');
    expect(h.emitted[h.emitted.length - 1].text).toContain('hello grid');
  });

  it('refuses to delete files the grid owns', () => {
    const h = createHarness();
    h.process('rm readme.txt');
    expect(h.emitted.some((e) => e.text.includes('Operation not permitted'))).toBe(true);
    expect(h.state().fs.removed).not.toContain('/home/readme.txt');
  });

  it('removes files the player created', () => {
    const h = createHarness();
    h.process('echo scratch > scratch.txt');
    h.process('rm scratch.txt');
    expect(h.state().fs.removed).toContain('/home/scratch.txt');
  });

  it('grep searches file contents', () => {
    const h = createHarness();
    h.process('grep -i welcome readme.txt');
    expect(h.emitted.some((e) => e.text.includes('Welcome to Terminal Quest'))).toBe(true);
  });

  it('find locates files by pattern', () => {
    const h = createHarness();
    h.process('find / -name "*.enc"');
    expect(h.emitted.some((e) => e.text.includes('/home/secrets.txt.enc'))).toBe(true);
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

  it('reset requires Y confirmation and wipes game', () => {
    vi.useFakeTimers();
    const h = createHarness();
    h.actions.addBits(500);
    h.process('reset');
    expect(h.emitCount.error).toBeGreaterThan(0);

    h.process('y');
    vi.advanceTimersByTime(3000);
    expect(h.state().bits).toBe(0);
    expect(h.onRestart).toHaveBeenCalled();
  });

  it('clear only wipes the screen, it does not delete the save', () => {
    const h = createHarness();
    h.actions.addBits(500);
    h.process('clear');
    expect(h.actions.clearHistory).toHaveBeenCalled();
    expect(h.state().bits).toBe(500);
  });

  it('pending confirmation rejects non-Y/N responses', () => {
    const h = createHarness();
    h.process('sudo clear');
    const countBefore = h.emitCount.error;
    h.process('maybe');
    expect(h.emitCount.error).toBeGreaterThan(countBefore);
  });

  it('scan is requirement gated, find is the real search', () => {
    const h = createHarness();
    h.process('find / -name readme.txt');
    expect(h.emitted.some((e) => e.text.includes('/home/readme.txt'))).toBe(true);
  });

  it('edit writes a real file and cat reads it back', () => {
    const h = createHarness();
    h.process('edit plans.txt find the third fragment');
    expect(h.state().fs.files['/home/plans.txt'].content).toBe('find the third fragment');
    h.process('cat plans.txt');
    expect(h.emitted[h.emitted.length - 1].text).toBe('find the third fragment');
  });

  it('notes lists the files the player wrote and rm memo deletes one', () => {
    const h = createHarness();
    h.process('edit a.txt one');
    h.process('edit b.txt two');
    h.process('notes');
    expect(h.emitted.some((e) => e.text.includes('/home/a.txt'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('/home/b.txt'))).toBe(true);
    h.process('rm memo a.txt');
    expect(h.state().fs.removed).toContain('/home/a.txt');
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

  it('date reports the time and the phase of day', () => {
    const h = createHarness();
    h.process('date');
    expect(h.emitted.some((e) => e.text.includes('GRID PHASE'))).toBe(true);
  });

  it('date +%Y-%m-%d formats the date', () => {
    const h = createHarness();
    h.process('date +%Y-%m-%d');
    const line = h.emitted[h.emitted.length - 1];
    expect(line.text).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('story gates repair but reveals the arc', () => {
    const h = createHarness();
    h.process('story');
    expect(h.emitted.some((e) => e.text.includes('ARC: DISCOVERY'))).toBe(true);
    // repair is requirement-gated at stage 0, so a fresh player cannot trigger it
    h.process('repair');
    expect(h.emitted.some((e) => e.text.includes('repair protocol offline'))).toBe(true);
  });

  it('ps prints a real process table', () => {
    const h = createHarness();
    h.process('ps');
    expect(h.emitted.some((e) => e.text.includes('PID TTY'))).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('quest-shell'))).toBe(true);
  });

  it('ps aux prints the wide format', () => {
    const h = createHarness();
    h.process('ps aux');
    expect(h.emitted.some((e) => e.text.includes('COMMAND'))).toBe(true);
  });

  it('killing a process twice does not resurrect or double-pay it', () => {
    const h = createHarness();
    h.process('run monitor');
    const pid = h.state().processes[0].pid;
    h.process(`kill ${pid}`);
    const afterFirst = h.state().processes[0].terminated;
    expect(afterFirst).toBe(true);

    h.process(`kill ${pid}`);
    expect(h.state().processes[0].terminated).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('No such process'))).toBe(true);
  });

  it('kill rejects an unknown pid', () => {
    const h = createHarness();
    h.process('kill 9999');
    expect(h.emitted.some((e) => e.text.includes('No such process'))).toBe(true);
  });

  it('kill terminates a process and pays bits', () => {
    const h = createHarness();
    h.process('run monitor');
    const pid = h.state().processes[0].pid;
    h.process(`kill ${pid}`);
    expect(h.emitted.some((e) => e.text.includes('terminated'))).toBe(true);
    expect(h.actions.incrementKills).toHaveBeenCalled();
  });

  // ── Feature 1: leaderboard ──

  it('leaderboard shows a board with the player on it', () => {
    const h = createHarness();
    h.process('leaderboard');
    const board = h.emitted
      .filter((e) => e.type === 'output')
      .map((e) => e.text)
      .join('\n');
    expect(board).toContain('GRID LEADERBOARD');
    expect(board).toContain('YOUR POSITION');
    expect(board).toContain('AGENT');
  });

  it('leaderboard name sanitises and stores the handle', () => {
    const h = createHarness();
    h.process('leaderboard name  Zero Cool! ');
    expect(h.state().profile.name).toBe('Zero Cool');
    h.process('leaderboard name x');
    expect(h.emitted.some((e) => e.text.includes('USAGE: leaderboard name'))).toBe(true);
  });

  it('leaderboard me explains the score', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, stats: { ...s.stats, bitsEarned: 250 } }));
    h.process('leaderboard me');
    const line = h.emitted.find((e) => e.text.includes('LEADERBOARD SCORE:'));
    expect(Number(line.text.split(': ')[1])).toBeGreaterThanOrEqual(250);
    expect(h.emitted.some((e) => e.text.includes('lifetime bits'))).toBe(true);
  });

  it('leaderboard top n limits the table', () => {
    const h = createHarness();
    h.process('leaderboard 3');
    const board = h.emitted.find((e) => e.text.includes('GRID LEADERBOARD')).text;
    const rows = board.split('\n').filter((line) => /^\s+\d+\s+/.test(line));
    expect(rows).toHaveLength(3);
  });

  // ── Feature 2: lore journal ──

  it('lore prints the index and hides unrecovered entries', () => {
    const h = createHarness();
    h.process('lore');
    const index = h.emitted
      .filter((e) => e.type === 'output')
      .map((e) => e.text)
      .join('\n');
    expect(index).toContain('LORE JOURNAL // 0/');
    expect(index).toContain('???');
  });

  it('lore refuses an entry that is not recovered yet', () => {
    const h = createHarness();
    h.process('lore readme');
    expect(h.emitted.some((e) => e.text.includes('NOT RECOVERED YET'))).toBe(true);
  });

  it('lore reads a recovered entry once and pays for it', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, journal: { entries: { readme: Date.now() } } }));
    h.process('lore readme');
    expect(h.emitted.some((e) => e.text.includes('A NOTE LEFT ON THE DESKTOP'))).toBe(true);
    expect(h.state().bits).toBeGreaterThan(0);
    expect(h.state().journal.read.readme).toBeDefined();

    h.setState((s) => ({ ...s, bits: 0 }));
    h.process('lore readme');
    expect(h.state().bits).toBe(0);
  });

  it('lore all dumps the recovered entries', () => {
    const h = createHarness();
    h.setState((s) => ({ ...s, journal: { entries: { readme: Date.now() } } }));
    h.process('lore all');
    expect(h.emitted.some((e) => e.text.includes('DUMPING 1 ENTRIES'))).toBe(true);
  });

  // ── Feature 3: glitch events ──

  it('glitch reports status and hides unknown signatures', () => {
    const h = createHarness();
    h.process('glitch');
    const status = h.emitted
      .filter((e) => e.type === 'output')
      .map((e) => e.text)
      .join('\n');
    expect(status).toContain('GLITCH EVENTS');
    expect(status).toContain('ACTIVE: none');

    h.process('glitch list');
    expect(h.emitted.some((e) => e.text.includes('???????'))).toBe(true);
  });

  it('glitch force opens an event that commands can survive', () => {
    const h = createHarness();
    h.process('glitch force');
    expect(h.state().glitch.active).not.toBeNull();
    expect(h.emitted.some((e) => e.text.includes('Keep typing to survive'))).toBe(true);

    const id = h.state().glitch.active.id;
    // surviving means typing enough commands inside the window
    h.process('pwd');
    expect(h.state().glitch.active.commands).toBeGreaterThanOrEqual(1);
    h.setState((s) => ({
      ...s,
      glitch: { ...s.glitch, active: { ...s.glitch.active, expiresAt: Date.now() - 1 } },
    }));
    h.process('pwd');
    expect(h.state().glitch.survived).toContain(id);
    expect(h.state().glitch.active).toBeNull();
  });

  it('glitch events are lost when the player stops typing', () => {
    const h = createHarness();
    h.process('glitch force');
    h.setState((s) => ({
      ...s,
      glitch: {
        ...s.glitch,
        active: { ...s.glitch.active, commands: 0, expiresAt: Date.now() - 1 },
      },
    }));
    h.process('pwd');
    expect(h.state().glitch.active).toBeNull();
    expect(h.state().glitch.survived).toEqual([]);
    expect(h.emitted.some((e) => e.text.includes('GLITCH EVENT LOST'))).toBe(true);
  });

  it('calm stops the grid from corrupting itself and rolling events', () => {
    const h = createHarness();
    h.process('calm off');
    expect(h.state().settings.chaos).toBe(false);
    expect(h.emitted.some((e) => e.text.includes('CALM GRID'))).toBe(true);

    // forced events still work on a calm grid
    h.process('glitch force --brief');
    expect(h.state().glitch.active).not.toBeNull();
  });

  it('calm is persisted across commands and rejects nonsense', () => {
    const h = createHarness();
    h.process('calm');
    expect(h.state().settings.chaos).toBe(false);
    h.process('calm on');
    expect(h.state().settings.chaos).toBe(true);
    h.process('calm sideways');
    expect(h.state().settings.chaos).toBe(true);
    expect(h.emitted.some((e) => e.text.includes('USAGE: calm'))).toBe(true);
  });

  it('a hand-edited save still drives the terminal once hydrated', () => {
    const h = createHarness();
    const partial = hydrateState({
      bits: 5,
      currentDir: '/logs',
      cat: { trust: 3 },
    });
    h.setState(() => partial);
    expect(() => h.process('ps')).not.toThrow();
    expect(h.emitted.some((e) => e.text.includes('PID TTY'))).toBe(true);
    expect(() => h.process('leaderboard')).not.toThrow();
    expect(() => h.process('lore')).not.toThrow();
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

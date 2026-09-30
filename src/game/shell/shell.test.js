import { describe, it, expect } from 'vitest';
import { createShell } from './index';
import {
  applyCopy,
  applyMkdir,
  applyMove,
  applyRemove,
  applyTouch,
  applyWriteFile,
  canRemove,
  canWrite,
  createFsView,
} from '../fsView';

const NOW = 1_700_000_000_000;

const baseState = (overrides = {}) => ({
  currentDir: '/home',
  fs: { files: {}, dirs: {}, removed: [] },
  story: { stage: 0 },
  cat: { fragmentsFound: 0 },
  shell: { history: [] },
  profile: { name: 'tester' },
  processes: [],
  stats: { commandsRun: 0, bitsEarned: 0 },
  memos: {},
  journal: { entries: {} },
  glitch: {},
  inventory: [],
  solvedPuzzles: [],
  achievements: [],
  unlockedFiles: [],
  dailyStats: { dirsVisited: [] },
  ...overrides,
});

const harness = (overrides) => {
  let state = baseState(overrides);
  const out = [];
  const shell = createShell({
    getState: () => state,
    stdout: (text) => {
      const body = String(text).endsWith('\n') ? String(text).slice(0, -1) : String(text);
      body.split('\n').forEach((line) => out.push({ type: 'out', text: line }));
    },
    stderr: (text) => out.push({ type: 'err', text }),
    setDir: (dir) => {
      state = { ...state, currentDir: dir };
    },
    setFs: (fs) => {
      state = { ...state, fs };
    },
    setProcesses: (processes) => {
      state = { ...state, processes };
    },
    writeFile: (path, content, append = false) => {
      if (!canWrite(state, path)) {
        out.push({ type: 'err', text: `bash: ${path}: Read-only file system` });
        return;
      }
      const view = createFsView(state);
      const existing = append ? (view.read(path) ?? '') : '';
      state = { ...state, fs: applyWriteFile(view.fs, path, existing + content, NOW) };
    },
    noteRead: (path) => {
      state = { ...state, unlockedFiles: [...state.unlockedFiles, path] };
    },
    canReadRestricted: () => (state.story.stage || 0) >= 2,
    userName: () => state.profile.name,
    commandHistory: () => state.shell.history,
    clearHistory: () => {
      state = { ...state, shell: { ...state.shell, history: [] } };
    },
    requestExit: () => {},
    incrementKills: () => {},
    addBits: (amount) => {
      state = { ...state, bits: (state.bits || 0) + amount };
    },
    bootTime: Date.now(),
  });

  const h = {
    shell,
    state: () => state,
    out,
    run: (line) => {
      out.length = 0;
      shell.run(line);
      return out;
    },
    text: (line) => {
      if (line !== undefined) h.run(line);
      return out
        .filter((entry) => entry.type === 'out')
        .map((entry) => entry.text)
        .join('\n');
    },
  };
  return h;
};

describe('navigation', () => {
  it('prints the working directory', () => {
    expect(
      harness()
        .run('pwd')
        .map((e) => e.text)
    ).toEqual(['/home']);
  });

  it('changes directory and remembers the old one', () => {
    const h = harness();
    h.run('cd /logs');
    expect(h.state().currentDir).toBe('/logs');
    h.run('cd -');
    expect(h.state().currentDir).toBe('/home');
    expect(h.out[0].text).toBe('/home');
    h.run('cd -');
    expect(h.state().currentDir).toBe('/logs');
    expect(h.out[0].text).toBe('/logs');
  });

  it('goes home with no argument and with ~', () => {
    const h = harness({ currentDir: '/logs' });
    h.run('cd');
    expect(h.state().currentDir).toBe('/home');
    h.run('cd /logs');
    h.run('cd ~');
    expect(h.state().currentDir).toBe('/home');
  });

  it('refuses restricted directories until the grid is restored', () => {
    const h = harness();
    h.run('cd /system');
    expect(h.state().currentDir).toBe('/home');
    expect(h.out[0].text).toContain('Permission denied');

    const restored = harness({ story: { stage: 2 } });
    restored.run('cd /system');
    expect(restored.state().currentDir).toBe('/system');
  });

  it('errors like a real shell on a bad path', () => {
    const h = harness();
    h.run('cd /nope');
    expect(h.out[0]).toEqual({ type: 'err', text: 'cd: /nope: No such file or directory' });
  });
});

describe('ls', () => {
  it('prints one entry per line and hides dotfiles', () => {
    const h = harness();
    const names = h.run('ls').map((e) => e.text);
    expect(names).toContain('readme.txt');
    expect(names).not.toContain('.hidden');
  });

  it('reveals dotfiles with -a', () => {
    expect(
      harness()
        .run('ls -a')
        .map((e) => e.text)
    ).toContain('.hidden');
  });

  it('prints a long format', () => {
    const line = harness().run('ls -l readme.txt')[0].text;
    expect(line).toMatch(/^-rw-r--r--\s+\d+\s+explorer\s+grid\s+\d+\s+\S+\s+\S+\s+readme\.txt/);
  });

  it('marks directories with -F', () => {
    expect(
      harness()
        .run('ls -aF')
        .map((e) => e.text)
    ).toContain('.hidden/');
  });
});

describe('file creation and removal', () => {
  it('creates files with touch and redirection', () => {
    const h = harness();
    h.run('touch scratch.txt');
    h.run('echo hello > thoughts.txt');
    expect(h.state().fs.files['/home/thoughts.txt'].content).toBe('hello\n');
    expect(h.state().fs.files['/home/scratch.txt'].content).toBe('');
    expect(h.run('cat thoughts.txt')[0].text).toBe('hello');
  });

  it('appends with >>', () => {
    const h = harness();
    h.run('echo one > mylog.txt');
    h.run('echo two >> mylog.txt');
    expect(h.state().fs.files['/home/mylog.txt'].content).toBe('one\ntwo\n');
  });

  it('creates directories recursively with mkdir -p', () => {
    const h = harness();
    h.run('mkdir -p deep/nested');
    expect(h.state().fs.dirs['/home/deep']).toBeDefined();
    expect(h.state().fs.dirs['/home/deep/nested']).toBeDefined();
  });

  it('removes files the player owns and refuses the rest', () => {
    const h = harness();
    h.run('echo mine > mine.txt');
    h.run('rm mine.txt');
    expect(h.state().fs.removed).toContain('/home/mine.txt');

    h.run('rm readme.txt');
    expect(h.out[0].text).toContain('Operation not permitted');
  });

  it('needs -r for directories', () => {
    const h = harness();
    h.run('mkdir scratch');
    h.run('rm scratch');
    expect(h.out[0].text).toContain('Is a directory');
    h.run('rm -r scratch');
    expect(h.state().fs.removed).toContain('/home/scratch');
  });

  it('refuses to write over grid files', () => {
    const h = harness();
    h.run('echo hacked > readme.txt');
    expect(h.state().fs.files['/home/readme.txt']).toBeUndefined();
  });

  it('copies and moves', () => {
    const h = harness();
    h.run('echo copied > a.txt');
    h.run('cp a.txt b.txt');
    expect(h.state().fs.files['/home/b.txt'].content).toBe('copied\n');

    h.run('mv b.txt c.txt');
    expect(h.state().fs.removed).toContain('/home/b.txt');
    expect(h.state().fs.files['/home/c.txt'].content).toBe('copied\n');
  });
});

describe('text processing', () => {
  it('pipes cat into grep and wc', () => {
    const h = harness();
    expect(h.text('cat readme.txt | grep -i terminal | wc -l').trim()).toBe('1');
  });

  it('greps with -n and reports the file name for multiple inputs', () => {
    const h = harness();
    const lines = h.run('grep -n Welcome readme.txt').map((e) => e.text);
    expect(lines[0]).toMatch(/^1:/);
  });

  it('supports head, tail, sort, uniq, cut and tr', () => {
    const h = harness();
    expect(h.run('head -n 1 readme.txt')[0].text).toContain('Welcome to Terminal Quest');
    expect(h.text('echo -e "b\\na\\nb" | sort | uniq')).toBe('a\nb');
    expect(h.text(`cut -d: -f1 /logs/mystery.log`)).toBe('Time');
    expect(h.text('echo abc | tr a-z A-Z')).toBe('ABC');
    expect(h.text('seq 1 3 | tac')).toBe('3\n2\n1');
  });

  it('expands globs', () => {
    const h = harness();
    const names = h.run('ls *.txt').map((e) => e.text);
    expect(names).toEqual(expect.arrayContaining(['note.txt', 'readme.txt']));
  });

  it('reports file types and stats', () => {
    const h = harness();
    expect(h.run('file readme.txt')[0].text).toContain('ASCII text');
    expect(h.run('stat -c %s readme.txt')[0].text).toMatch(/^\d+$/);
  });
});

describe('system information', () => {
  it('answers the questions a terminal operator actually asks', () => {
    const h = harness();
    expect(h.run('whoami')[0].text).toBe('tester');
    expect(h.run('hostname')[0].text).toBe('node-0');
    expect(h.run('uname')[0].text).toBe('TerminalQuest');
    expect(h.run('uname -a')[0].text).toContain('x86_64');
    expect(h.run('date +%Y')[0].text).toMatch(/^\d{4}$/);
    expect(h.run('uptime')[0].text).toContain('load average');
    expect(h.run('id')[0].text).toContain('uid=1337');
  });

  it('documents commands with man', () => {
    const page = harness().text('man grep');
    expect(page).toContain('GREP(1)');
    expect(page).toContain('findstr');
  });

  it('resolves commands with which and type', () => {
    const h = harness();
    expect(h.run('which ls')[0].text).toContain('/bin/quest/ls');
    expect(h.run('type cat')[0].text).toContain('builtin');
    expect(h.run('which nothinghere')[0].text).toContain('not found');
  });

  it('records history and clears it', () => {
    const h = harness({ shell: { history: ['ls', 'pwd'] } });
    expect(h.text('history')).toContain('  1  ls');
    h.run('history -c');
    expect(h.state().shell.history).toEqual([]);
  });

  it('supports env and export', () => {
    const h = harness();
    h.run('export MODE=deep');
    expect(h.text('env | grep MODE')).toBe('MODE=deep');
  });

  it('keeps the grid in charge of exit', () => {
    const h = harness();
    expect(h.text('exit')).toContain('no escape');
  });
});

describe('processes', () => {
  it('spawns, lists and kills', () => {
    const h = harness();
    h.run('run monitor');
    expect(h.state().processes).toHaveLength(1);
    expect(h.text('ps aux')).toContain('monitor_daemon');
    h.run(`kill ${h.state().processes[0].pid}`);
    expect(h.state().processes[0].terminated).toBe(true);
  });

  it('shows a top snapshot with a load average', () => {
    expect(harness().text('top')).toContain('load average');
  });
});

describe('windows compatibility', () => {
  it('maps the DOS and PowerShell names', () => {
    const h = harness();
    expect(h.text('dir')).toContain('readme.txt');
    expect(h.run('type readme.txt')[0].text).toContain('Welcome to Terminal Quest');
    expect(h.run('findstr Welcome readme.txt')[0].text).toContain('Welcome');
    expect(h.run('where ls')[0].text).toContain('/bin/quest/ls');
  });

  it('maps copy, move, del and md', () => {
    const h = harness();
    h.run('echo x > one.txt');
    h.run('copy one.txt two.txt');
    expect(h.state().fs.files['/home/two.txt'].content).toBe('x\n');
    h.run('move two.txt three.txt');
    expect(h.state().fs.removed).toContain('/home/two.txt');
    h.run('md folder');
    expect(h.state().fs.dirs['/home/folder']).toBeDefined();
    h.run('del three.txt');
    expect(h.state().fs.removed).toContain('/home/three.txt');
  });
});

describe('fsView', () => {
  it('merges the grid with the player overlay', () => {
    const view = createFsView(
      baseState({ fs: { files: { '/home/mine.txt': { content: 'x' } }, dirs: {}, removed: [] } })
    );
    const names = view.children('/home').map((st) => st.name);
    expect(names).toContain('readme.txt');
    expect(names).toContain('mine.txt');
    expect(view.isFile('/home/mine.txt')).toBe(true);
  });

  it('hides fragments until the cat found them', () => {
    expect(
      createFsView(baseState())
        .children('/home')
        .map((s) => s.name)
    ).not.toContain('fragment_01.tmp');
    const later = createFsView(baseState({ cat: { fragmentsFound: 1 } }));
    expect(later.children('/home').map((s) => s.name)).toContain('fragment_01.tmp');
  });

  it('honours story gates', () => {
    expect(
      createFsView(baseState())
        .children('/archives')
        .map((s) => s.name)
    ).not.toContain('restore.db');
    const restored = createFsView(baseState({ story: { stage: 2 } }));
    expect(restored.children('/archives').map((s) => s.name)).toContain('restore.db');
  });

  it('applies mutations as pure updates', () => {
    const fs = { files: {}, dirs: {}, removed: [] };
    const withDir = applyMkdir(fs, '/home/a', NOW);
    expect(fs.dirs).toEqual({});
    expect(withDir.dirs['/home/a']).toBeDefined();
    expect(applyRemove(withDir, '/home/a').removed).toContain('/home/a');
    expect(applyWriteFile(fs, '/home/f', 'x', NOW).files['/home/f'].content).toBe('x');
    expect(applyTouch(fs, '/home/f', NOW).files['/home/f'].created).toBe(NOW);
  });

  it('copies a directory subtree', () => {
    let fs = applyMkdir({ files: {}, dirs: {}, removed: [] }, '/home/src', NOW);
    fs = applyWriteFile(fs, '/home/src/inner.txt', 'deep', NOW);
    const copied = applyCopy(fs, '/home/src', '/home/dest', NOW);
    expect(copied.files['/home/dest/inner.txt'].content).toBe('deep');
  });

  it('moves player files and refuses to move grid files', () => {
    const fs = applyWriteFile({ files: {}, dirs: {}, removed: [] }, '/home/a.txt', 'x', NOW);
    expect(applyMove(fs, '/home/a.txt', '/home/b.txt', NOW).files['/home/b.txt'].content).toBe('x');
    const state = baseState();
    expect(canRemove(state, '/home/readme.txt')).toBe(false);
    expect(canWrite(state, '/home/readme.txt')).toBe(false);
    expect(canWrite(state, '/home/new.txt')).toBe(true);
  });
});

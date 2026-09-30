/**
 * The shell layer.
 *
 * Everything a terminal operator types is executed here: pipelines, quoting,
 * redirection, aliases, globs and about fifty real commands. The game-specific
 * verbs (story, buy, play, daily...) stay in `commandProcessor.js`; this layer
 * only knows how to be a shell.
 */

import { ShellError, isShellError, parseCommandLine, tokenize } from './parse';
import { expandGlobs } from './flags';
import { SHELL_ALIAS_TABLE, SHELL_COMMANDS, findShellCommand, shellCommandNames } from './tables';
import { createFsView, normalizeFs } from '../fsView';
import { COMMAND_DEFINITIONS } from '../commandRegistry';

/** Commands whose operands are paths and therefore eligible for globbing. */
const GLOB_AWARE = new Set([
  'ls',
  'cat',
  'head',
  'tail',
  'wc',
  'grep',
  'sort',
  'uniq',
  'cut',
  'rev',
  'tac',
  'nl',
  'file',
  'stat',
  'du',
  'rm',
  'rmdir',
  'cp',
  'mv',
  'touch',
  'tree',
  'find',
  'tee',
  'less',
  'more',
  'basename',
  'dirname',
  'chmod',
  'chgrp',
]);

/**
 * Creates a session-scoped shell.
 *
 * @param {object} ctx game context: every state action plus `getState`.
 * @returns {{run: Function, has: Function, manPage: Function, resolveCommand: Function}}
 */
export const createShell = (ctx) => {
  // Session state, intentionally not persisted: env vars, aliases and OLDPWD.
  //
  // `cwd` and `fs` are seeded from the save at the start of every command line
  // and then owned by the shell for the duration of that line. React state
  // updates are asynchronous, so without this `cd /logs && ls` would list /home.
  const session = {
    env: {},
    aliases: {},
    oldPwd: null,
    depth: 0,
    cwd: '/',
    fs: null,
    processes: [],
  };

  const game = {
    ...ctx,
    get oldPwd() {
      return session.oldPwd;
    },
    set oldPwd(value) {
      session.oldPwd = value;
    },
    setDir: (path) => {
      session.cwd = path;
      ctx.setDir(path);
    },
    setFs: (fs) => {
      session.fs = fs;
      ctx.setFs(fs);
    },
    setProcesses: (processes) => {
      session.processes = processes;
      ctx.setProcesses(processes);
    },
  };

  /**
   * Takes a fresh snapshot of the save for a new command line. Grid commands
   * call this too, so `edit` and `cd` see the same world the shell does.
   */
  const beginCommand = () => {
    const fresh = ctx.getState();
    session.cwd = fresh.currentDir || '/home';
    session.fs = normalizeFs(fresh.fs);
    session.processes = fresh.processes || [];
    return fresh;
  };

  /**
   * The process list as it stands *after* this command line's own changes.
   * Anything that ages or spawns processes must use this, otherwise a kill
   * performed moments earlier gets written back from a stale snapshot.
   */
  game.liveProcesses = () => session.processes;

  /** State as the shell sees it right now: fresh, plus this line's changes. */
  game.viewState = () => ({ ...ctx.getState(), currentDir: session.cwd, fs: session.fs });
  game.fs = () => normalizeFs(session.fs);

  const gameCommandNames = () =>
    new Set(Object.keys(COMMAND_DEFINITIONS).filter((name) => !SHELL_ALIAS_TABLE[name]));

  const resolveCommand = (name) => {
    const key = String(name).toLowerCase();
    const shell = findShellCommand(key);
    if (shell) return { path: `/bin/quest/${shell.name}`, isBuiltin: true };
    if (gameCommandNames().has(key)) return { path: `/usr/bin/${key}`, isBuiltin: false };
    return null;
  };

  const manPage = (name) => {
    const key = String(name).toLowerCase();
    const shell = findShellCommand(key);
    if (shell) {
      const { command } = shell;
      const aliases = (command.aliases || []).length
        ? `ALIASES: ${command.aliases.join(', ')}\n`
        : '';
      return [
        `${shell.name.toUpperCase()}(1)`,
        '',
        'NAME',
        `    ${shell.name} — ${command.summary}`,
        '',
        'SYNOPSIS',
        `    ${command.usage}`,
        aliases,
        'DESCRIPTION',
        `    ${command.description || command.summary}.`,
        '',
        'SEE ALSO',
        '    help, man, type, which',
      ]
        .filter((line) => line !== null)
        .join('\n');
    }
    if (gameCommandNames().has(key)) {
      const def = COMMAND_DEFINITIONS[key];
      return [
        `${key.toUpperCase()}(1)`,
        '',
        'NAME',
        `    ${key} — ${def.description}`,
        '',
        'SYNOPSIS',
        `    ${key}${def.usage ? ` ${def.usage}` : ''}`.trim(),
        (def.aliases || []).length ? `\nALIASES\n    ${def.aliases.join(', ')}\n` : '',
        'DESCRIPTION',
        `    Grid-native command. Not part of the POSIX coreutils set.`,
      ].join('\n');
    }
    return null;
  };

  /** Runs a single command (no redirection), returning stdout. */
  const runCommand = (argv, stdin) => {
    if (argv.length === 0) return '';
    const raw = argv[0].toLowerCase();

    if (raw === 'type' && argv.length > 1) {
      // Windows compatibility: `type notes.txt` prints the file.
      const asFile = argv.slice(1);
      const view = createFsView(game.viewState());
      const looksLikePath = asFile.some(
        (arg) => !arg.startsWith('-') && view.exists(view.resolve(arg))
      );
      if (looksLikePath) argv = ['cat', ...asFile];
    }

    const expanded = [];
    for (const arg of argv) {
      const alias = session.aliases[arg];
      if (alias && session.depth < 5 && expanded.length === 0) {
        expanded.push(...tokenize(alias));
        continue;
      }
      expanded.push(arg);
    }
    argv = expanded;
    if (argv.length === 0) return '';

    const found = findShellCommand(argv[0]);
    if (!found) throw ShellError(`${argv[0]}: command not found`);
    return found.command.run(buildContext(argv.slice(1), stdin));
  };

  const buildContext = (args, stdin) => ({
    args,
    stdin,
    state: game.viewState(),
    view: createFsView(game.viewState()),
    env: session.env,
    aliases: session.aliases,
    game,
  });

  /** Runs a nested command list and returns its stdout (used by `time`/`less`). */
  const runNested = (argv) => runCommand(argv, '');

  game.runNested = runNested;
  game.resolveCommand = resolveCommand;
  game.manPage = manPage;
  game.commandPath = (name) => resolveCommand(name)?.path ?? '';

  /** Executes a whole input line: jobs, pipelines, redirection. */
  const run = (line) => {
    const trimmed = String(line ?? '').trim();
    if (!trimmed) return { ok: true, code: 0, empty: true };

    beginCommand();

    let jobs;
    try {
      jobs = parseCommandLine(trimmed).jobs;
    } catch (error) {
      game.stderr(isShellError(error) ? error.message : `syntax error: ${error.message}`);
      return { ok: false, code: 2 };
    }

    let ok = true;
    let code = 0;
    let previousCode = 0;
    session.depth++;

    for (const job of jobs) {
      // Short-circuit semantics for `&&` and `||`.
      if (job.joiner === '&&' && previousCode !== 0) continue;
      if (job.joiner === '||' && previousCode === 0) continue;

      let stdin = '';
      let stdout = '';

      for (const [index, stage] of job.stages.entries()) {
        let argv = stage.argv;
        if (argv.length === 0) continue;
        if (GLOB_AWARE.has(argv[0].toLowerCase())) {
          // Expand in place: flag/value order must survive untouched.
          const [head, ...rest] = argv;
          const quoted = stage.quoted ? stage.quoted.slice(1) : [];
          argv = [head, ...expandGlobs(createFsView(game.viewState()), rest, quoted)];
        }
        if (argv.some((arg) => arg.startsWith('<(') || arg.startsWith('$('))) {
          game.stderr('bash: process substitution is not supported on this grid');
          ok = false;
          code = 1;
          continue;
        }

        try {
          stdout = runCommand(argv, stdin);
        } catch (error) {
          ok = false;
          code = isShellError(error) ? error.code || 1 : 1;
          const message = error.message || '';
          if (message) game.stderr(`${argv[0]}: ${message}`);
          stdout = '';
        }

        for (const redirect of stage.redirects) {
          const path = createFsView(game.viewState()).resolve(redirect.target);
          game.writeFile(path, stdout, redirect.op === '>>');
          stdout = '';
        }
        if (index === job.stages.length - 1) break;
        stdin = stdout;
      }

      if (stdout) game.stdout(stdout.endsWith('\n') ? stdout.slice(0, -1) : stdout);
      previousCode = code;
    }

    session.depth--;
    return { ok, code };
  };

  return {
    run,
    has: (name) => Boolean(findShellCommand(name)),
    names: shellCommandNames,
    manPage,
    resolveCommand,
    runNested,
    session,
    findShellCommand,
    // Exposed so grid commands can join the same line-of-sight view the shell
    // has, and so writes stay consistent inside a single command line.
    viewState: game.viewState,
    liveProcesses: game.liveProcesses,
    beginCommand,
    setFs: game.setFs,
    setDir: game.setDir,
  };
};

export { ShellError, isShellError, parseCommandLine, tokenize, expandGlobs };
export { findShellCommand, shellCommandNames, SHELL_COMMANDS };

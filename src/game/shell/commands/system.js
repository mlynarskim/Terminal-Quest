/**
 * System information and shell builtins: the commands a terminal operator
 * reaches for out of habit, plus `history`, `export`, `alias`, `man`.
 */

import { ShellError } from '../parse';
import { parseFlags } from '../flags';
import { getTimeOfDay } from '../../tips';

const OS_NAME = 'TerminalQuest';
const GRID_RELEASE = '6.1.7';
const KERNEL = 'grid-kernel 6.1.7-quest';
const HOST = 'node-0';

const uptimeSeconds = (ctx) => Math.max(1, Math.round((Date.now() - ctx.game.bootTime) / 1000));

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0)
    return `${days} day${days === 1 ? '' : 's'}, ${hours}:${String(minutes).padStart(2, '0')}`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
  return `${minutes} min`;
};

const strftime = (date, format) =>
  format.replace(/%([a-zA-Z%])/g, (_m, key) => {
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    const map = {
      Y: String(date.getFullYear()),
      y: String(date.getFullYear()).slice(-2),
      m: pad(date.getMonth() + 1),
      d: pad(date.getDate()),
      H: pad(date.getHours()),
      M: pad(date.getMinutes()),
      S: pad(date.getSeconds()),
      N: pad(date.getMilliseconds(), 3),
      a: date.toLocaleDateString(undefined, { weekday: 'short' }),
      b: date.toLocaleDateString(undefined, { month: 'short' }),
      A: date.toLocaleDateString(undefined, { weekday: 'long' }),
      B: date.toLocaleDateString(undefined, { month: 'long' }),
      e: String(date.getDate()).padStart(2, ' '),
      p: date.getHours() < 12 ? 'AM' : 'PM',
      I: pad(date.getHours() % 12 || 12),
      Z: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      s: String(Math.floor(date.getTime() / 1000)),
      F: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      T: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
      D: `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${pad(date.getFullYear())}`,
      c: date.toLocaleString(),
      n: '\n',
      t: '\t',
      '%': '%',
    };
    return map[key] ?? `%${key}`;
  });

export const SYSTEM_COMMANDS = {
  whoami: {
    summary: 'print the current user',
    usage: 'whoami',
    run: (ctx) => ctx.game.userName(),
  },

  id: {
    summary: 'print user and group identity',
    usage: 'id',
    run: (ctx) =>
      `uid=1337(${ctx.game.userName()}) gid=1337(grid) groups=1337(grid),27(sudo),999(static)`,
  },

  hostname: {
    summary: 'print the host name',
    usage: 'hostname [-a|-i|-s]',
    run: (ctx) => {
      const { flags } = parseFlags(ctx.args, { a: 'bool', i: 'bool', s: 'bool', f: 'bool' });
      if (flags.i) return '127.0.0.1';
      if (flags.a || flags.f) return `${HOST}.grid.local`;
      if (flags.s) return HOST;
      return HOST;
    },
  },

  uname: {
    summary: 'print system information',
    usage: 'uname [-a|-s|-r|-n|-m|-o|-p]',
    run: (ctx) => {
      const { flags } = parseFlags(ctx.args, {
        a: 'bool',
        s: 'bool',
        r: 'bool',
        n: 'bool',
        m: 'bool',
        o: 'bool',
        p: 'bool',
        v: 'bool',
        i: 'bool',
      });
      if (flags.a) return `${OS_NAME} ${HOST} ${KERNEL} #1 quest SMP web x86_64 Grid/Linux`;
      if (flags.r) return KERNEL;
      if (flags.n) return HOST;
      if (flags.m) return 'x86_64';
      if (flags.p) return 'web';
      if (flags.o) return 'Grid/Linux';
      if (flags.v) return '#1 SMaRt CaSe StAbIlIzEr';
      return OS_NAME;
    },
  },

  date: {
    summary: 'print or format the system date',
    usage: 'date [+FORMAT]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        u: 'bool',
        r: 'bool',
        i: 'bool',
        I: 'bool',
      });
      const now = new Date();
      if (flags.u) return now.toUTCString();
      if (flags.r) return now.toISOString();
      if (flags.I) return String(now.getMilliseconds()).padStart(3, '0');
      // `date +%F` is the conventional way to ask for a format.
      if (operands[0]) return strftime(now, operands[0].replace(/^\+/, ''));
      // The grid always adds its own phase of day, whatever you asked for.
      return `${now.toString()}  // GRID PHASE: ${getTimeOfDay().toUpperCase()}`;
    },
  },

  uptime: {
    summary: 'show how long the grid has been running',
    usage: 'uptime',
    run: (ctx) => {
      const phase = getTimeOfDay();
      const seconds = uptimeSeconds(ctx);
      const bits = ctx.state.stats?.bitsEarned || 0;
      return ` ${now()} up ${formatUptime(seconds)},  1 explorer,  load average: ${(
        0.2 +
        (bits % 7) / 10
      ).toFixed(2)}, ${(0.1 + ((ctx.state.stats?.commandsRun || 0) % 5) / 10).toFixed(2)}, ${(
        0.05 +
        (ctx.state.processes?.length || 0) / 20
      ).toFixed(2)}  [${phase.toUpperCase()}]`;
    },
  },

  w: {
    summary: 'show who is logged in and what they are doing',
    usage: 'w',
    run: (ctx) =>
      [
        'USER     TTY      FROM             LOGIN@   IDLE JCPU PCPU WHAT',
        `${ctx.game.userName().padEnd(8)} pts/0    ${HOST.padEnd(16)} ${new Date()
          .toString()
          .slice(4, 16)
          .padEnd(8)}  0.0s  0.4s  0.2s w`,
      ].join('\n'),
  },

  users: {
    summary: 'list logged-in users',
    usage: 'users',
    run: (ctx) => ctx.game.userName(),
  },

  env: {
    aliases: ['set'],
    summary: 'print the environment',
    usage: 'env',
    run: (ctx) =>
      Object.entries({
        USER: ctx.game.userName(),
        HOME: '/home',
        PWD: ctx.view.cwd,
        SHELL: '/bin/quest',
        TERM: 'vt100-glitch',
        PATH: '/bin:/usr/bin:/system',
        GRID: 'corrupted',
        LANGS: 'en_US.UTF-8',
        ...ctx.env,
      })
        .map(([key, value]) => `${key}=${value}`)
        .join('\n'),
  },

  export: {
    summary: 'set an environment variable',
    usage: 'export NAME=value',
    run: (ctx) => {
      if (ctx.args.length === 0) {
        return Object.entries(ctx.env)
          .map(([k, v]) => `export ${k}="${v}"`)
          .join('\n');
      }
      for (const arg of ctx.args) {
        const eq = arg.indexOf('=');
        if (eq === -1) {
          if (ctx.env[arg] === undefined)
            throw ShellError(`export: '${arg}': not a valid identifier`);
          continue;
        }
        ctx.env[arg.slice(0, eq)] = arg.slice(eq + 1).replace(/^["']|["']$/g, '');
      }
      return '';
    },
  },

  unset: {
    summary: 'remove an environment variable',
    usage: 'unset NAME',
    run: (ctx) => {
      for (const arg of ctx.args) delete ctx.env[arg];
      return '';
    },
  },

  alias: {
    summary: 'define or list command aliases',
    usage: 'alias [name[=value]]',
    run: (ctx) => {
      if (ctx.args.length === 0) {
        const entries = Object.entries(ctx.aliases);
        return entries.length
          ? entries.map(([name, value]) => `alias ${name}='${value}'`).join('\n')
          : '(no aliases defined)';
      }
      for (const arg of ctx.args) {
        const eq = arg.indexOf('=');
        if (eq === -1) {
          if (ctx.aliases[arg] === undefined) throw ShellError(`alias: ${arg}: not found`);
          continue;
        }
        ctx.aliases[arg.slice(0, eq)] = arg.slice(eq + 1).replace(/^["']|["']$/g, '');
      }
      return '';
    },
  },

  unalias: {
    summary: 'remove an alias',
    usage: 'unalias name...',
    run: (ctx) => {
      for (const arg of ctx.args) delete ctx.aliases[arg];
      return '';
    },
  },

  type: {
    summary: 'describe how a command would be interpreted',
    usage: 'type name...',
    run: (ctx) => {
      if (ctx.args.length === 0) throw ShellError('usage: type name...');
      return ctx.args
        .map((name) => {
          if (ctx.aliases[name]) return `${name} is aliased to \`${ctx.aliases[name]}'`;
          const resolved = ctx.game.resolveCommand(name);
          if (!resolved) return `${name}: not found`;
          return resolved.isBuiltin ? `${name} is a shell builtin` : `${name} is ${resolved.path}`;
        })
        .join('\n');
    },
  },

  which: {
    aliases: ['where'],
    summary: 'locate a command',
    usage: 'which name...',
    run: (ctx) => {
      if (ctx.args.length === 0) throw ShellError('usage: which name...');
      const lines = [];
      for (const name of ctx.args) {
        if (ctx.aliases[name]) {
          lines.push(`${name}: aliased to \`${ctx.aliases[name]}'`);
          continue;
        }
        const resolved = ctx.game.resolveCommand(name);
        if (resolved) lines.push(`${name}: ${resolved.path}`);
        else lines.push(`${name} not found`);
      }
      return lines.join('\n');
    },
  },

  history: {
    summary: 'show the command history',
    usage: 'history [-c] [n]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { c: 'bool', w: 'bool' });
      if (flags.c) {
        ctx.game.clearHistory();
        return '';
      }
      const entries = ctx.game.commandHistory();
      const count = operands[0] ? Number.parseInt(operands[0], 10) : entries.length;
      const start = Math.max(0, entries.length - (Number.isFinite(count) ? count : entries.length));
      return entries
        .slice(start)
        .map((entry, index) => `${String(start + index + 1).padStart(5)}  ${entry}`)
        .join('\n');
    },
  },

  man: {
    summary: 'show the manual page for a command',
    usage: 'man command',
    run: (ctx) => {
      const name = (ctx.args[0] || '').toLowerCase();
      if (!name) throw ShellError('What manual page do you want?');
      const page = ctx.game.manPage(name);
      if (!page) throw ShellError(`No manual entry for ${name}`);
      return page;
    },
  },

  sleep: {
    summary: 'wait for a number of seconds',
    usage: 'sleep N',
    run: (ctx) => {
      const seconds = Number.parseFloat(ctx.args[0]);
      if (!Number.isFinite(seconds))
        throw ShellError(`invalid time interval '${ctx.args[0] ?? ''}'`);
      return seconds <= 0.5
        ? 'the grid does not sleep. it only pretends to.'
        : `(pretended to sleep ${seconds}s — this grid has no clock you can wait out)`;
    },
  },

  time: {
    summary: 'time a command',
    usage: 'time command [args...]',
    run: (ctx) => {
      const started = Date.now();
      const nested = ctx.game.runNested(ctx.args);
      const elapsed = Date.now() - started;
      const seconds = (elapsed / 1000).toFixed(3);
      return [nested, '', `real\t0m${seconds}s`, `user\t0m${seconds}s`, `sys\t0m0.000s`].join('\n');
    },
  },

  test: {
    aliases: ['['],
    summary: 'evaluate a condition',
    usage: 'test -e|-f|-d|-z|-n file   (also available as [ ])',
    run: (ctx) => {
      let args = ctx.args;
      if (args[0] === '[' && args[args.length - 1] === ']') args = args.slice(1, -1);
      const [flag, target = ''] = args;
      const path = ctx.view.resolve(target);
      const exists = ctx.view.exists(path);
      const isFile = ctx.view.isFile(path);
      const isDir = ctx.view.isDir(path);
      switch (flag) {
        case '-e':
        case '-a':
          return exists ? '0' : '1';
        case '-f':
          return isFile ? '0' : '1';
        case '-d':
          return isDir ? '0' : '1';
        case '-z':
          return target.length === 0 ? '0' : '1';
        case '-n':
          return target.length > 0 ? '0' : '1';
        case '-s':
          return (ctx.view.stat(path)?.size || 0) > 0 ? '0' : '1';
        default:
          throw ShellError('usage: test -e|-f|-d|-z|-n|-s file');
      }
    },
  },

  true: {
    summary: 'do nothing, successfully',
    usage: 'true',
    run: () => '',
  },

  false: {
    summary: 'do nothing, unsuccessfully',
    usage: 'false',
    run: () => {
      throw ShellError('', 1);
    },
  },

  exit: {
    summary: 'leave the current session',
    usage: 'exit',
    run: (ctx) => {
      const code = Number.parseInt(ctx.args[0], 10);
      ctx.game.requestExit(Number.isFinite(code) ? code : 0);
      return 'there is no escape. the grid is your home now.';
    },
  },

  less: {
    summary: 'view a file one screen at a time',
    usage: 'less file...   (this grid scrolls on its own)',
    run: (ctx) => ctx.game.runNested([...ctx.args]),
  },

  more: {
    summary: 'view a file (alias of less on this grid)',
    usage: 'more file...',
    run: (ctx) => ctx.game.runNested([...ctx.args]),
  },

  who: {
    summary: 'show who is logged in',
    usage: 'who',
    run: (ctx) => `${ctx.game.userName()}     pts/0        ${new Date().toString().slice(4, 16)}`,
  },

  groups: {
    summary: 'show group membership',
    usage: 'groups',
    run: (ctx) => `${ctx.game.userName()} grid sudo static`,
  },

  printenv: {
    summary: 'print environment values',
    usage: 'printenv [NAME]',
    run: (ctx) => {
      if (ctx.args[0]) return ctx.env[ctx.args[0]] ?? '';
      return SYSTEM_COMMANDS.env.run(ctx);
    },
  },

  whereis: {
    summary: 'locate documentation and binaries',
    usage: 'whereis name',
    run: (ctx) => {
      const name = (ctx.args[0] || '').toLowerCase();
      const page = ctx.game.manPage(name);
      return page ? `/usr/share/man/quest/${name}.1\n${ctx.game.commandPath(name)}` : '';
    },
  },

  ver: {
    summary: 'print the grid release',
    usage: 'ver',
    run: () => `${OS_NAME} ${GRID_RELEASE} (quest)`,
  },

  hash: {
    summary: 'show cached command locations',
    usage: 'hash [-r]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { r: 'bool' });
      if (flags.r) return '';
      if (operands.length === 0) return '(command hashing is decorative on this grid)';
      return operands
        .map((name) => {
          const resolved = ctx.game.resolveCommand(name);
          return resolved ? `hits\t${name}\t${resolved.path}` : `${name}: not found`;
        })
        .join('\n');
    },
  },
};

const now = () => new Date().toTimeString().slice(0, 8);

export { strftime, formatUptime, uptimeSeconds, OS_NAME, KERNEL, HOST };

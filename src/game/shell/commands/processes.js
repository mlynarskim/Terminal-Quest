/**
 * Process commands. `ps`, `top` and `kill` keep the game mechanics (processes
 * age, overheat and can be farmed for Bits) but speak real UNIX:
 * `ps aux`, `kill -9 4213`, `top` with a load average footer.
 */

import { ShellError } from '../parse';
import { parseFlags } from '../flags';
import {
  PROCESS_TYPES,
  isDangerous,
  killProcess,
  processEarnings,
  spawnProcess,
} from '../../processes';
import { PROCESS_MAX_COUNT } from '../../constants';

const cpuLoad = (proc) => {
  if (isDangerous(proc)) return 97.4;
  if (proc.age > proc.dangerThreshold / 2) return 41.2;
  return Number((0.4 + (proc.pid % 7) / 10).toFixed(1));
};

const memLoad = (proc) => Number((0.1 + (proc.age % 9) / 20).toFixed(1));

const ageLabel = (proc) => `${String(proc.age).padStart(4)}s`;

const stateOf = (proc) => (isDangerous(proc) ? 'R' : 'S');

const header = 'USER         PID %CPU %MEM    VSZ    STAT COMMAND';

const row = (proc) =>
  [
    'explorer',
    String(proc.pid).padEnd(10),
    String(cpuLoad(proc)).padStart(4),
    String(memLoad(proc)).padStart(5),
    `${(1024 + proc.age * 12).toString()}K`.padStart(7),
    stateOf(proc).padStart(5),
    proc.name.toLowerCase(),
  ].join(' ');

export const PROCESS_COMMANDS = {
  ps: {
    aliases: ['tasklist'],
    summary: 'report process status',
    usage: 'ps [aux] [pid...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        a: 'bool',
        u: 'bool',
        x: 'bool',
        e: 'bool',
        f: 'bool',
        p: 'value',
      });
      // `ps aux`, `ps -ef` and `ps axu` are all "show everything" in the wild.
      const pseudo = ['a', 'aux', 'ef', 'ax', 'xu', 'axu', 'uax', 'efax', 'fa'];
      const isPseudo = (arg) => pseudo.includes(arg.toLowerCase());
      flags.a = flags.a || ctx.args.some(isPseudo);
      const procs = (ctx.state.processes || []).filter((p) => !p.terminated);
      const targets = operands.filter((o) => !isPseudo(o));

      if (targets.length) {
        const wanted = targets.filter((o) => /^\d+$/.test(o)).map(Number);
        if (targets[0] === '-p' && flags.p) wanted.push(Number.parseInt(flags.p, 10));
        const selected = procs.filter((p) => wanted.includes(p.pid));
        if (selected.length === 0) {
          return flags.a || flags.u || flags.x ? `${header}\n` : `  PID TTY          TIME CMD\n`;
        }
        if (flags.a || flags.u || flags.x) return [header, ...selected.map(row)].join('\n');
        return [
          '  PID TTY      STAT   TIME COMMAND',
          ...selected.map((p) =>
            [
              String(p.pid).padStart(5),
              '?',
              stateOf(p).padStart(4),
              ageLabel(p),
              p.name.toLowerCase(),
            ].join(' ')
          ),
        ].join('\n');
      }

      if (flags.a || flags.u || flags.x) {
        return [header, ...procs.map(row), ...gridProcesses(ctx)].join('\n');
      }
      return [
        '  PID TTY      STAT   TIME COMMAND',
        ...procs.map((p) =>
          [
            String(p.pid).padStart(5),
            '?',
            stateOf(p).padStart(4),
            ageLabel(p),
            p.name.toLowerCase(),
          ].join(' ')
        ),
        '  4882 ?        Ss     0:01 quest-shell',
      ].join('\n');
    },
  },

  top: {
    summary: 'display and update sorted processes',
    usage: 'top [-b] [-n N]',
    run: (ctx) => {
      const procs = [...(ctx.state.processes || []).filter((p) => !p.terminated)].sort(
        (a, b) => cpuLoad(b) - cpuLoad(a)
      );
      const bits = ctx.state.stats?.bitsEarned || 0;
      const load = (0.2 + (bits % 7) / 10).toFixed(2);
      return [
        `top - up ${Math.max(1, Math.round((Date.now() - ctx.game.bootTime) / 1000))}s,  1 explorer,  load average: ${load}, ${(
          0.1 +
          ((ctx.state.stats?.commandsRun || 0) % 5) / 10
        ).toFixed(2)}, 0.05`,
        `Tasks: ${procs.length + 1} total, ${procs.filter((p) => isDangerous(p)).length} overheating`,
        '%Cpu(s): 14.2 us, 3.1 sy, 82.7 idle',
        '',
        header,
        ...procs.map(row),
        `  4882 explorer  0.3  0.1   4120K S     quest-shell`,
        '',
        `  PID USER      PRI  NI  VIRT  RES  SHR S  %CPU %MEM     TIME+ COMMAND`,
        ...procs.map((p) =>
          [
            String(p.pid).padStart(5),
            'explorer',
            '20',
            '0',
            `${1024 + p.age * 12}K`.padStart(6),
            `${512 + p.age * 6}K`.padStart(5),
            '8K',
            stateOf(p),
            String(cpuLoad(p)).padStart(5),
            String(memLoad(p)).padStart(4),
            ageLabel(p),
            p.name.toLowerCase(),
          ].join(' ')
        ),
        '',
        'q to quit',
      ].join('\n');
    },
  },

  kill: {
    aliases: ['taskkill'],
    summary: 'terminate a process',
    usage: 'kill [-9|-TERM|-SIGKILL] pid...',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        9: 'bool',
        15: 'bool',
        TERM: 'bool',
        SIGTERM: 'bool',
        KILL: 'bool',
        SIGKILL: 'bool',
        l: 'bool',
      });
      const pids = operands.filter((o) => /^\d+$/.test(o)).map(Number);
      if (pids.length === 0) {
        const signal = Object.keys(flags)[0];
        if (signal) {
          const code = { 9: 9, 15: 15, TERM: 15, SIGTERM: 15, KILL: 9, SIGKILL: 9 }[signal];
          return ` 1 KILL   0 ${code === 9 ? 'SIGKILL' : 'SIGTERM'}\n 2 INT    0 2\n 3 QUIT   0 3\n15 TERM   0 ${15}`;
        }
        throw ShellError('usage: kill [-signal] pid');
      }

      const procs = ctx.state.processes || [];
      const killed = [];
      for (const pid of pids) {
        const index = procs.findIndex((p) => p.pid === pid && !p.terminated);
        if (index === -1) throw ShellError(`kill: (${pid}) - No such process`);
        const target = procs[index];
        const bits = processEarnings(target);
        const next = [...procs];
        next[index] = killProcess(target);
        ctx.game.setProcesses(next);
        killed.push({ pid, target, bits });
        ctx.game.incrementKills?.();
        if (bits > 0) {
          ctx.game.addBits(bits, isDangerous(target) ? 'Process Reaper' : null);
          if (isDangerous(target)) ctx.game.announce?.('achievement', 'Process Reaper');
        }
      }

      return killed
        .map(
          ({ pid, target, bits }) =>
            `[${pid}] ${target.name} terminated${isDangerous(target) ? ' (near-miss bonus)' : ''} +${bits} BITS`
        )
        .join('\n');
    },
  },

  run: {
    summary: 'spawn a background process',
    usage: 'run [monitor|stress|shadow|idle]',
    run: (ctx) => {
      const typeId = ctx.args[0] || 'monitor';
      const type = PROCESS_TYPES.find((t) => t.id === typeId);
      if (!type) {
        throw ShellError(
          `unknown process type: ${typeId}. Valid: ${PROCESS_TYPES.map((t) => t.id).join(', ')}`
        );
      }
      const procs = (ctx.state.processes || []).filter((p) => !p.terminated);
      if (procs.length >= PROCESS_MAX_COUNT)
        throw ShellError(`cannot fork: max ${PROCESS_MAX_COUNT} processes`);
      const proc = spawnProcess({
        typeId: type.id,
        name: type.name,
        bitsYield: type.bitsYield,
        dangerThreshold: type.dangerThreshold,
      });
      ctx.game.setProcesses([...procs, proc]);
      return `[${proc.pid}] ${type.name} started — overheat threshold ${type.dangerThreshold}, payout ${type.bitsYield} BITS`;
    },
  },

  pgrep: {
    summary: 'find a process by name',
    usage: 'pgrep name',
    run: (ctx) => {
      const [name] = ctx.args;
      if (!name) throw ShellError('usage: pgrep pattern');
      const needle = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
      return (ctx.state.processes || [])
        .filter((p) => !p.terminated && p.name.toLowerCase().includes(needle))
        .map((p) => String(p.pid))
        .join('\n');
    },
  },
};

const gridProcesses = (ctx) => [
  `root         1  0.0  0.1   2048K S     init`,
  `root       412  0.4  0.6  12288K S     sector-daemon`,
  `root       877  0.1  0.2   4096K S     corruption-monitor`,
  `grid       4882  ${Number((ctx.state.processes?.length ? 0.6 : 0.3).toFixed(1))}  0.1   4120K S     quest-shell`,
];

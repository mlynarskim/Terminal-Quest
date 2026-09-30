/**
 * Filesystem commands. These are the real thing: `ls -l`, `cd -`, `rm -r`,
 * `cp`, `mv`, `mkdir -p`, `tree`, `find`, `stat` and friends behave the way
 * they do in macOS/Linux (and PowerShell users get `dir`, `ls` and `cat`).
 *
 * Every command receives the shell context:
 *   { view, state, cwd, stdin, env, game }
 * and returns stdout as a string. Errors are thrown as ShellError.
 */

import { ShellError } from '../parse';
import { globToRegExp, inlineCount, parseFlags, toPaths } from '../flags';
import {
  applyCopy,
  applyMkdir,
  applyMove,
  applyRemove,
  applyTouch,
  canRemove,
  canWrite,
  formatMtime,
  formatSize,
  basename,
  dirname,
  joinPath,
} from '../../fsView';

const USER = 'explorer';
const GROUP = 'grid';

const perms = (st) => (st.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
const octal = (st) => (st.type === 'dir' ? '0755' : '0644');

const longLine = (st, flags) => {
  const size = formatSize(st.size || 0, Boolean(flags.h)).padStart(5);
  const when = formatMtime(st.modified || st.created || Date.now());
  const links = st.type === 'dir' ? 2 : 1;
  const marker = st.source === 'user' ? '+' : ' ';
  return `${perms(st)} ${links} ${USER}  ${GROUP} ${size} ${when} ${st.name}${marker}`;
};

const describe = (st) => {
  if (st.type === 'dir') return 'directory';
  if (st.isBinary) return 'data (binary, little-endian)';
  if (st.isEncrypted) return 'data (encrypted block)';
  if (st.isFragment) return 'data (damaged fragment, partially recoverable)';
  if (st.source === 'user') return 'ASCII text, written by the player';
  if (st.name.endsWith('.log')) return 'ASCII text, log entries';
  if (st.name.endsWith('.tmp')) return 'ASCII text, damaged';
  return 'ASCII text';
};

const renderText = (text, flags) => {
  const source = typeof text === 'string' ? text : '';
  return source
    .split('\n')
    .map((line, index) => {
      let rendered = flags.n || flags.b ? `${String(index + 1).padStart(6)}\t${line}` : line;
      if (flags.A && flags.E) rendered += '$';
      else if (flags.E) rendered += '$';
      else if (flags.A) rendered = `^I${rendered.replace(/\t/g, '^I')}`;
      return rendered;
    })
    .join('\n');
};

/** Applies a transform to each input file, or to stdin when no file is given. */
const mapOverInputs = (ctx, operands, transform) => {
  if (operands.length === 0) return transform(ctx.stdin ?? '');
  const out = [];
  for (const path of toPaths(ctx.view, operands)) {
    const st = ctx.view.stat(path);
    if (!st) throw ShellError(`${path}: No such file or directory`);
    if (st.type === 'dir') throw ShellError(`${path}: Is a directory`);
    ctx.game.noteRead(path, st);
    out.push(transform(st.content));
  }
  return out.join('\n');
};

export const FILESYSTEM_COMMANDS = {
  ls: {
    summary: 'list directory contents',
    aliases: ['dir'],
    usage: 'ls [-l] [-a] [-1] [-h] [-r] [-R] [-S] [-t] [-F] [-d] [file...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        l: 'bool',
        a: 'bool',
        A: 'bool',
        h: 'bool',
        r: 'bool',
        S: 'bool',
        t: 'bool',
        F: 'bool',
        d: 'bool',
        1: 'bool',
        n: 'bool',
      });
      const paths = toPaths(ctx.view, operands);
      const targets = paths.length > 0 ? paths : [ctx.view.cwd];
      const chunks = [];
      let targetIndex = 0;

      for (const target of targets) {
        const st = ctx.view.stat(target);
        if (!st) {
          ctx.game.stderr(`ls: cannot access '${target}': No such file or directory`);
          targetIndex++;
          continue;
        }
        if (st.type === 'file' || flags.d) {
          chunks.push(
            flags.l ? longLine(st, flags) : `${st.name}${flags.F && st.type === 'dir' ? '/' : ''}`
          );
          targetIndex++;
          continue;
        }

        let entries = ctx.view.children(st.path, { all: Boolean(flags.a || flags.A) });
        if (flags.a || flags.A) ctx.game.onFlag?.('ls-a');
        if (flags.S) entries = [...entries].sort((a, b) => (b.size || 0) - (a.size || 0));
        if (flags.t) entries = [...entries].sort((a, b) => (b.modified || 0) - (a.modified || 0));
        if (flags.r) entries = [...entries].reverse();

        const header = [];
        if (targets.length > 1) {
          if (targetIndex > 0) chunks.push('');
          header.push(`${st.path}:`);
        }
        if (flags.l) {
          const blocks = entries.reduce((sum, e) => sum + Math.ceil((e.size || 0) / 1024), 0);
          header.push(`total ${blocks || Math.ceil((st.size || 0) / 1024)}`);
        }
        targetIndex++;

        const body = entries.map((entry) => {
          if (flags.l) return longLine(entry, flags);
          if (flags.F) return `${entry.name}${entry.type === 'dir' ? '/' : ''}`;
          return entry.name;
        });

        chunks.push([...header, ...(body.length ? body : ['(empty)'])].join('\n'));
      }

      return chunks.join('\n');
    },
  },

  cd: {
    summary: 'change the working directory',
    aliases: ['chdir'],
    usage: 'cd [dir|-]   (no argument goes home)',
    run: (ctx) => {
      const target = ctx.args[0];
      if (!target) {
        ctx.game.setDir('/home');
        return '';
      }
      if (target === '-') {
        if (!ctx.game.oldPwd) throw ShellError('OLDPWD not set');
        const previous = ctx.game.oldPwd;
        ctx.game.setDir(previous);
        ctx.game.oldPwd = ctx.view.cwd;
        return previous;
      }

      const path = ctx.view.resolve(target);
      const st = ctx.view.stat(path);
      if (!st) throw ShellError(`${target}: No such file or directory`);
      if (st.type !== 'dir') throw ShellError(`${target}: Not a directory`);
      if (st.restricted && !ctx.game.canReadRestricted())
        throw ShellError(`${target}: Permission denied`);
      ctx.game.oldPwd = ctx.view.cwd;
      ctx.game.setDir(path);
      return '';
    },
  },

  pwd: {
    summary: 'print the working directory',
    aliases: ['get-location'],
    usage: 'pwd',
    run: (ctx) => ctx.view.cwd,
  },

  cat: {
    summary: 'print file contents',
    aliases: ['get-content'],
    usage: 'cat [-n] [-b] [-E] [file...]   (reads stdin when no file is given)',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        n: 'bool',
        b: 'bool',
        E: 'bool',
        A: 'bool',
      });
      const paths = toPaths(ctx.view, operands);
      if (paths.length === 0 && !ctx.stdin) throw ShellError('usage: cat [file]');

      const chunks = [];
      for (const path of paths) {
        const st = ctx.view.stat(path);
        if (!st) throw ShellError(`${path}: No such file or directory`);
        if (st.type === 'dir') throw ShellError(`${path}: Is a directory`);
        ctx.game.noteRead(path, st);
        chunks.push(renderText(st.content, flags));
      }
      if (paths.length === 0) chunks.push(renderText(ctx.stdin, flags));
      return paths.length > 1 ? chunks.join('\n\n') : chunks[0];
    },
  },

  head: {
    summary: 'print the first lines of a file',
    usage: 'head [-n N] [-c N] [file...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { n: 'value', c: 'value' });
      const requested =
        flags.n !== undefined ? Number.parseInt(flags.n, 10) : inlineCount(ctx.args);
      const lines = requested === null || !Number.isFinite(requested) ? 10 : requested;
      const chars = flags.c !== undefined ? Number.parseInt(flags.c, 10) : null;
      return mapOverInputs(ctx, operands, (text) => {
        if (chars !== null) return text.slice(0, chars);
        return text.split('\n').slice(0, lines).join('\n');
      });
    },
  },

  tail: {
    summary: 'print the last lines of a file',
    usage: 'tail [-n N] [file...]   (-f is unavailable on this grid)',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { n: 'value', c: 'value', f: 'bool' });
      if (flags.f) throw ShellError('cannot follow end of this filesystem');
      const requested =
        flags.n !== undefined ? Number.parseInt(flags.n, 10) : inlineCount(ctx.args);
      const count = requested === null || !Number.isFinite(requested) ? 10 : requested;
      return mapOverInputs(ctx, operands, (text) => {
        const all = text.split('\n');
        return (count >= 0 ? all.slice(-count) : all.slice(0, -count)).join('\n');
      });
    },
  },

  touch: {
    summary: 'create an empty file or update its timestamp',
    aliases: ['new-item'],
    usage: 'touch file...',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { a: 'bool', m: 'bool', c: 'bool', d: 'bool' });
      if (operands.length === 0) throw ShellError('missing file operand');
      const now = Date.now();
      for (const path of toPaths(ctx.view, operands)) {
        const parent = ctx.view.stat(dirname(path));
        if (!parent || parent.type !== 'dir') {
          throw ShellError(`cannot touch '${path}': No such file or directory`);
        }
        if (!canWrite(ctx.state, path))
          throw ShellError(`cannot touch '${path}': Read-only file system`);
        ctx.game.setFs(applyTouch(ctx.game.fs(), path, now));
      }
      return '';
    },
  },

  mkdir: {
    summary: 'create a directory',
    aliases: ['md'],
    usage: 'mkdir [-p] dir...',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { p: 'bool' });
      if (operands.length === 0) throw ShellError('missing operand');
      const now = Date.now();

      for (const path of toPaths(ctx.view, operands)) {
        const existing = ctx.view.stat(path);
        if (existing) {
          if (flags.p && existing.type === 'dir') continue;
          throw ShellError(`cannot create directory '${path}': File exists`);
        }
        const missing = [];
        let cursor = dirname(path);
        while (cursor !== '/' && !ctx.view.stat(cursor)) {
          missing.unshift(cursor);
          cursor = dirname(cursor);
        }
        const parent = ctx.view.stat(cursor);
        if (!parent || parent.type !== 'dir') {
          throw ShellError(`cannot create directory '${path}': No such file or directory`);
        }
        if (missing.length > 1 && !flags.p) {
          throw ShellError(`cannot create directory '${path}': No such file or directory`);
        }
        for (const dir of missing) ctx.game.setFs(applyMkdir(ctx.game.fs(), dir, now));
        if (!missing.includes(path)) ctx.game.setFs(applyMkdir(ctx.game.fs(), path, now));
      }
      return '';
    },
  },

  rm: {
    summary: 'remove files and directories',
    aliases: ['del', 'erase'],
    usage: 'rm [-r] [-f] file...   (rm memo [name] deletes a note)',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        r: 'bool',
        R: 'bool',
        f: 'bool',
        v: 'bool',
      });
      if (operands.length === 0) throw ShellError('missing operand');

      if (operands[0] === 'memo') {
        const name = operands[1];
        if (!name) throw ShellError('usage: rm memo [name]');
        const path = joinPath(ctx.view.cwd, name);
        if (!canRemove(ctx.state, path)) throw ShellError(`cannot remove '${name}': No such memo`);
        ctx.game.setFs(applyRemove(ctx.game.fs(), path));
        return `MEMO DELETED: ${name}`;
      }

      const recursive = Boolean(flags.r || flags.R);
      for (const path of toPaths(ctx.view, operands)) {
        const st = ctx.view.stat(path);
        if (!st) {
          if (flags.f) continue;
          throw ShellError(`cannot remove '${path}': No such file or directory`);
        }
        if (st.type === 'dir' && !recursive)
          throw ShellError(`cannot remove '${path}': Is a directory`);
        if (!canRemove(ctx.state, path)) {
          throw ShellError(
            `cannot remove '${path}': Operation not permitted (the grid keeps its own)`
          );
        }
        ctx.game.setFs(applyRemove(ctx.game.fs(), path, { recursive }));
        if (flags.v) ctx.game.stdout(`removed '${path}'`);
      }
      return '';
    },
  },

  rmdir: {
    summary: 'remove an empty directory',
    aliases: ['rd'],
    usage: 'rmdir dir...',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { p: 'bool' });
      if (operands.length === 0) throw ShellError('missing operand');
      for (const path of toPaths(ctx.view, operands)) {
        const st = ctx.view.stat(path);
        if (!st) throw ShellError(`failed to remove '${path}': No such file or directory`);
        if (st.type !== 'dir') throw ShellError(`failed to remove '${path}': Not a directory`);
        if (ctx.view.children(path, { all: true }).length > 0) {
          throw ShellError(`failed to remove '${path}': Directory not empty`);
        }
        if (!canRemove(ctx.state, path)) {
          throw ShellError(`failed to remove '${path}': Operation not permitted`);
        }
        ctx.game.setFs(applyRemove(ctx.game.fs(), path));
      }
      return '';
    },
  },

  cp: {
    summary: 'copy files and directories',
    aliases: ['copy'],
    usage: 'cp [-r] source... target',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        r: 'bool',
        R: 'bool',
        i: 'bool',
        f: 'bool',
      });
      if (operands.length < 2) throw ShellError('missing file operand');
      const paths = toPaths(ctx.view, operands);
      const target = paths.pop();
      const targetSt = ctx.view.stat(target);

      for (const source of paths) {
        const st = ctx.view.stat(source);
        if (!st) throw ShellError(`cannot stat '${source}': No such file or directory`);
        if (st.type === 'dir' && !(flags.r || flags.R)) {
          throw ShellError(`-r not specified; omitting directory '${source}'`);
        }
        const dest = targetSt && targetSt.type === 'dir' ? joinPath(target, st.name) : target;
        const destParent = ctx.view.stat(dirname(dest));
        if (!destParent || destParent.type !== 'dir') {
          throw ShellError(`cannot create regular file '${dest}': No such file or directory`);
        }
        if (st.type === 'file' && !canWrite(ctx.state, dest)) {
          throw ShellError(`cannot create regular file '${dest}': Read-only file system`);
        }
        ctx.game.setFs(applyCopy(ctx.game.fs(), st.path, dest, Date.now()));
      }
      return '';
    },
  },

  mv: {
    summary: 'move or rename files',
    aliases: ['move'],
    usage: 'mv source... target',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { i: 'bool', f: 'bool', n: 'bool' });
      if (operands.length < 2) throw ShellError('missing file operand');
      const paths = toPaths(ctx.view, operands);
      const target = paths.pop();
      const targetSt = ctx.view.stat(target);

      for (const source of paths) {
        const st = ctx.view.stat(source);
        if (!st) throw ShellError(`cannot stat '${source}': No such file or directory`);
        const dest = targetSt && targetSt.type === 'dir' ? joinPath(target, st.name) : target;
        if (st.source !== 'user') {
          throw ShellError(
            `cannot move '${source}': Operation not permitted (the grid keeps its own)`
          );
        }
        if (!canWrite(ctx.state, dest))
          throw ShellError(`cannot move to '${dest}': Read-only file system`);
        ctx.game.setFs(applyMove(ctx.game.fs(), st.path, dest, Date.now()));
      }
      return '';
    },
  },

  tree: {
    summary: 'print the directory tree',
    usage: 'tree [-a] [-L depth] [dir]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        a: 'bool',
        L: 'value',
        d: 'bool',
        f: 'bool',
      });
      const root = operands.length ? ctx.view.resolve(operands[0]) : ctx.view.cwd;
      const st = ctx.view.stat(root);
      if (!st) throw ShellError(`${operands[0] ?? root}: No such file or directory`);
      if (st.type !== 'dir') return st.name;

      const maxDepth = flags.L !== undefined ? Number.parseInt(flags.L, 10) : 3;
      const lines = [root];
      let dirs = 0;
      let files = 0;

      const walk = (dirPath, prefix, depth) => {
        if (Number.isFinite(maxDepth) && depth > maxDepth) return;
        ctx.view.children(dirPath, { all: Boolean(flags.a) }).forEach((entry, index, list) => {
          const last = index === list.length - 1;
          lines.push(`${prefix}${last ? '└── ' : '├── '}${entry.name}`);
          if (entry.type === 'dir') {
            dirs++;
            walk(entry.path, `${prefix}${last ? '    ' : '│   '}`, depth + 1);
          } else {
            files++;
          }
        });
      };

      walk(st.path, '', 1);
      lines.push('', `${dirs} directories, ${files} files`);
      return lines.join('\n');
    },
  },

  find: {
    summary: 'search for files and directories',
    usage: 'find [path...] [-name pattern] [-iname pattern] [-type f|d] [-maxdepth N]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        name: 'value',
        iname: 'value',
        type: 'value',
        path: 'value',
        maxdepth: 'value',
        i: 'bool',
      });

      const roots = operands.length
        ? toPaths(ctx.view, operands)
        : flags.path
          ? [ctx.view.resolve(flags.path)]
          : [ctx.view.cwd];

      const pattern = flags.name ?? flags.iname;
      const nameRe = pattern ? globToRegExp(pattern) : null;
      const maxDepth =
        flags.maxdepth !== undefined ? Number.parseInt(flags.maxdepth, 10) : Infinity;
      const found = [];

      // find(1) spells types "f" and "d", not "file" and "dir".
      const wantedType = flags.type === 'd' ? 'dir' : flags.type === 'f' ? 'file' : flags.type;
      const matches = (st) => {
        const nameOk = nameRe ? nameRe.test(st.name) : true;
        const typeOk = wantedType ? st.type === wantedType : true;
        return nameOk && typeOk;
      };

      const walk = (dirPath, depth) => {
        if (depth > maxDepth) return;
        for (const st of ctx.view.children(dirPath, { all: true })) {
          if (matches(st)) found.push(st.path);
          if (st.type === 'dir') walk(st.path, depth + 1);
        }
      };

      for (const root of roots) {
        const st = ctx.view.stat(root);
        if (!st) throw ShellError(`'${root}': No such file or directory`);
        if (nameRe && matches(st)) found.push(st.path);
        if (st.type === 'dir') walk(st.path, 1);
      }
      return found.join('\n');
    },
  },

  file: {
    summary: 'describe a file type',
    usage: 'file file...',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { b: 'bool', i: 'bool', L: 'bool' });
      if (operands.length === 0) throw ShellError('usage: file file...');
      const out = [];
      for (const path of toPaths(ctx.view, operands)) {
        const st = ctx.view.stat(path);
        out.push(
          st ? `${path}: ${describe(st)}` : `${path}: cannot open (No such file or directory)`
        );
      }
      return out.join('\n');
    },
  },

  stat: {
    summary: 'show file metadata',
    usage: 'stat [-c format] file...',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        c: 'value',
        f: 'bool',
        L: 'bool',
        t: 'bool',
      });
      if (operands.length === 0) throw ShellError('missing operand');
      const paths = toPaths(ctx.view, operands);

      const readOne = (path) => {
        const st = ctx.view.stat(path);
        if (!st) throw ShellError(`cannot statx '${path}': No such file or directory`);
        return st;
      };

      if (flags.c) {
        return paths
          .map((path) => {
            const st = readOne(path);
            return String(flags.c).replace(/%([a-zA-Z%])/g, (_m, key) => {
              switch (key) {
                case 'n':
                  return st.name;
                case 'N':
                  return `"${st.name}"`;
                case 's':
                  return String(st.size || 0);
                case 'F':
                  return st.type;
                case 'U':
                  return USER;
                case 'G':
                  return GROUP;
                case 'a':
                  return octal(st);
                case 'A':
                  return st.type === 'dir' ? 'directory' : 'regular file';
                case 'X':
                  return String(Math.round((st.modified || st.created || Date.now()) / 1000));
                case 'y':
                  return String(st.modified || st.created || 0);
                case '%':
                  return '%';
                default:
                  return '?';
              }
            });
          })
          .join('\n');
      }

      return paths
        .map((path) => {
          const st = readOne(path);
          return [
            `  File: ${st.path}`,
            `  Size: ${st.size || 0}\t\tBlocks: ${Math.max(1, Math.ceil((st.size || 0) / 512))}`,
            `Access: (${octal(st)})\tUid: ( 0/${USER})\tGid: ( 0/${GROUP})`,
            `Modify: ${formatMtime(st.modified || st.created || Date.now())}`,
            `Origin: ${st.source === 'user' ? 'player write' : 'grid'}`,
          ].join('\n');
        })
        .join('\n\n');
    },
  },

  du: {
    summary: 'estimate space usage',
    usage: 'du [-h] [-s] [dir...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { h: 'bool', s: 'bool', a: 'bool' });
      const roots = toPaths(ctx.view, operands.length ? operands : ['.']);
      const lines = [];
      let total = 0;

      for (const root of roots) {
        const st = ctx.view.stat(root);
        if (!st) throw ShellError(`cannot access '${root}': No such file or directory`);
        let size = st.size || 0;
        if (st.type === 'dir') {
          for (const child of ctx.view.walk(st.path)) size += child.size || 0;
        }
        total += size;
        lines.push(`${formatSize(size, Boolean(flags.h))}\t${st.path}`);
      }
      if (roots.length > 1) lines.push(`${formatSize(total, Boolean(flags.h))}\ttotal`);
      return lines.join('\n');
    },
  },

  df: {
    summary: 'report filesystem usage',
    usage: 'df [-h]',
    run: (ctx) => {
      const capacity = 1_048_576;
      const used = ctx.view.walk('/', { all: true }).reduce((sum, st) => sum + (st.size || 0), 0);
      const percent = Math.min(100, Math.round((used / capacity) * 100));
      const pad = (n, width) => String(n).padStart(width);
      return [
        'Filesystem      1K-blocks    Used Available Use% Mounted on',
        `dev/grid0 ${pad(capacity, 11)}${pad(used, 7)}${pad(capacity - used, 10)}${pad(`${percent}%`, 5)} /`,
      ].join('\n');
    },
  },

  basename: {
    summary: 'strip the directory from a path',
    usage: 'basename path [suffix]',
    run: (ctx) => {
      const [path, suffix] = ctx.args;
      if (!path) throw ShellError('missing operand');
      let name = basename(path);
      if (suffix && name !== suffix && name.endsWith(suffix)) name = name.slice(0, -suffix.length);
      return name;
    },
  },

  dirname: {
    summary: 'strip the last component from a path',
    usage: 'dirname path',
    run: (ctx) => {
      const [path] = ctx.args;
      if (!path) throw ShellError('missing operand');
      return dirname(path);
    },
  },
};

/**
 * Text processing commands: echo, printf, grep, sort, uniq, cut, tr, wc,
 * rev, tac, nl. All of them read from files or stdin, so they compose into
 * pipelines.
 */

import { ShellError } from '../parse';
import { expandGlobs, parseFlags, toPaths } from '../flags';

const readInputs = (ctx, operands) => {
  const paths = toPaths(ctx.view, expandGlobs(ctx.view, operands));
  if (paths.length === 0) return [{ name: '', content: ctx.stdin ?? '' }];
  return paths.map((path) => {
    const st = ctx.view.stat(path);
    if (!st) throw ShellError(`${path}: No such file or directory`);
    if (st.type === 'dir') throw ShellError(`${path}: Is a directory`);
    ctx.game.noteRead(path, st);
    return { name: path, content: st.content };
  });
};

/** Splits text into lines the way a filter sees them (no phantom last line). */
const toLines = (content) => {
  const lines = String(content ?? '').split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
};

/** `a-z` inside a tr set means the whole range, not three characters. */
const expandRanges = (set) =>
  set.replace(/(\w)-(\w)/g, (_m, from, to) => {
    const start = from.charCodeAt(0);
    const end = to.charCodeAt(0);
    if (end < start) return _m;
    let out = '';
    for (let code = start; code <= end; code++) out += String.fromCharCode(code);
    return out;
  });

/** Real coreutils terminate their output with a newline, which is what makes
 *  `cat f | grep x | wc -l` count anything at all. */
const emit = (lines) => `${lines.join('\n')}\n`;

/** `head -3` — a bare digit after the flag means "that many lines". */
const fromStdin = (ctx, flag) => {
  if (!ctx.stdin) throw ShellError('no input. pipe something in or pass a file');
  return { name: flag, content: ctx.stdin };
};

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const charClass = (spec) => {
  if (spec === '[:alpha:]') return 'a-zA-Z';
  if (spec === '[:digit:]') return '0-9';
  if (spec === '[:alnum:]') return 'a-zA-Z0-9';
  if (spec === '[:space:]') return '\\s';
  if (spec === '[:upper:]') return 'A-Z';
  if (spec === '[:lower:]') return 'a-z';
  if (spec === '[:punct:]') return escapeRe('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~');
  return null;
};

/** Expands POSIX character classes used inside `[...]`. */
const expandClasses = (pattern) =>
  pattern.replace(/\[:(\w+):\]/g, (_m, name) => charClass(`[:${name}:]`) ?? _m);

export const TEXT_COMMANDS = {
  echo: {
    summary: 'write arguments to stdout',
    usage: 'echo [-n] [-e] text...   (use quotes to keep spaces)',
    run: (ctx) => {
      const argv = [...ctx.args];
      let newline = true;
      let escapes = false;
      while (argv.length && (argv[0] === '-n' || argv[0] === '-e')) {
        if (argv[0] === '-n') newline = false;
        else escapes = true;
        argv.shift();
      }
      let text = argv.join(' ');
      if (escapes) {
        text = text
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\');
      }
      return text + (newline ? '\n' : '');
    },
  },

  printf: {
    summary: 'format and print data',
    usage: 'printf format [argument...]   (supports %s %d %% and \\n)',
    run: (ctx) => {
      const [format = '', ...rest] = ctx.args;
      let index = 0;
      const output = format.replace(/%[sd%]/g, (token) => {
        if (token === '%%') return '%';
        const value = rest[index++];
        if (token === '%d') {
          const num = Number.parseInt(value ?? '0', 10);
          return Number.isFinite(num) ? String(num) : '0';
        }
        return value ?? '';
      });
      return output.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    },
  },

  grep: {
    summary: 'search for a pattern',
    aliases: ['findstr'],
    usage: 'grep [-i] [-v] [-n] [-c] [-l] [-o] [-w] [-E] pattern [file...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        i: 'bool',
        v: 'bool',
        n: 'bool',
        c: 'bool',
        l: 'bool',
        o: 'bool',
        w: 'bool',
        E: 'bool',
        r: 'bool',
        R: 'bool',
        q: 'bool',
        a: 'bool',
        F: 'bool',
      });
      const [rawPattern, ...rest] = operands;
      if (!rawPattern) throw ShellError('usage: grep [-invcl] pattern [file...]');

      const pattern = expandClasses(rawPattern);
      const body = flags.w ? `\\b(?:${pattern})\\b` : pattern;
      const test = new RegExp(body, flags.i ? 'i' : '');
      const global = new RegExp(body, flags.i ? 'gi' : 'g');
      const sources = rest.length ? readInputs(ctx, rest) : [fromStdin(ctx, '(standard input)')];
      const multi = rest.length > 1;
      const out = [];
      const matchedFiles = [];

      for (const source of sources) {
        let fileMatches = 0;
        toLines(source.content).forEach((line, index) => {
          const keep = flags.v ? !test.test(line) : test.test(line);
          if (!keep) return;
          fileMatches++;
          if (flags.c || flags.q || flags.l) return;
          const body = flags.o ? (line.match(global) || []).join('\n') : line;
          const prefix = `${multi ? `${source.name}:` : ''}${flags.n ? `${index + 1}:` : ''}`;
          out.push(`${prefix}${body}`);
        });
        if (fileMatches > 0) matchedFiles.push(source.name);
        if (flags.c) out.push(`${multi ? `${source.name}:` : ''}${fileMatches}`);
      }

      if (flags.l) return emit(matchedFiles);
      if (flags.q) return '';
      return emit(out);
    },
  },

  sort: {
    summary: 'sort lines',
    usage: 'sort [-n] [-r] [-u] [-f] [-k N] [file...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        n: 'bool',
        r: 'bool',
        u: 'bool',
        f: 'bool',
        k: 'value',
        h: 'bool',
      });
      const sources = readInputs(ctx, operands);
      const lines = sources.flatMap((s) => toLines(s.content));
      const keyIndex =
        flags.k !== undefined ? Number.parseInt(String(flags.k).split(',')[0], 10) - 1 : 0;

      lines.sort((a, b) => {
        const ka = (a.split('\t')[keyIndex] ?? '').toLowerCase();
        const kb = (b.split('\t')[keyIndex] ?? '').toLowerCase();
        if (flags.n) {
          const na = Number.parseFloat(ka);
          const nb = Number.parseFloat(kb);
          if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
        }
        const result = ka < kb ? -1 : ka > kb ? 1 : 0;
        return flags.r ? -result : result;
      });

      const deduped = flags.u ? [...new Set(lines)] : lines;
      return emit(deduped);
    },
  },

  uniq: {
    summary: 'filter repeated lines',
    usage: 'uniq [-c] [-d] [-u] [file]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        c: 'bool',
        d: 'bool',
        u: 'bool',
        i: 'bool',
      });
      const sources = readInputs(ctx, operands);
      const lines =
        sources.length === 1
          ? toLines(sources[0].content)
          : sources.flatMap((s) => toLines(s.content));
      const groups = [];
      for (const line of lines) {
        const last = groups[groups.length - 1];
        if (last && last.line === line) last.count++;
        else groups.push({ line, count: 1 });
      }

      const out = [];
      for (const group of groups) {
        if (flags.d && group.count < 2) continue;
        if (flags.u && group.count > 1) continue;
        out.push(flags.c ? `${String(group.count).padStart(7)} ${group.line}` : group.line);
      }
      return emit(out);
    },
  },

  cut: {
    summary: 'extract columns',
    usage: 'cut -d DELIM -f LIST [file]  |  cut -c LIST [file]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        d: 'value',
        f: 'value',
        c: 'value',
        s: 'bool',
      });
      if (flags.f === undefined && flags.c === undefined) {
        throw ShellError('you must specify a list of bytes, characters, or fields');
      }
      const sources = readInputs(ctx, operands);
      const out = [];

      for (const source of sources) {
        for (const line of toLines(source.content)) {
          if (flags.c !== undefined) {
            out.push(
              String(flags.c)
                .split(',')
                .flatMap((part) => {
                  const [from, to] = part.split('-');
                  const start = Number.parseInt(from, 10) - 1;
                  const end = to ? Number.parseInt(to, 10) : start + 1;
                  return line.slice(Math.max(0, start), end);
                })
                .join('')
            );
            continue;
          }
          const delim = String(flags.d ?? '\t')
            .replace(/\\t/g, '\t')
            .replace(/\\n/g, '\n');
          const parts = line.split(delim);
          out.push(
            String(flags.f)
              .split(',')
              .flatMap((part) => {
                if (part.includes('-')) {
                  const [from, to] = part.split('-');
                  return parts.slice(Number.parseInt(from, 10) - 1, Number.parseInt(to, 10));
                }
                return [parts[Number.parseInt(part, 10) - 1] ?? ''];
              })
              .join(delim)
          );
        }
      }
      return out.join('\n');
    },
  },

  tr: {
    summary: 'translate or delete characters',
    usage: 'tr [-d] [-s] set1 [set2]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        d: 'bool',
        s: 'bool',
        c: 'bool',
        t: 'bool',
      });
      const expand = (set) =>
        String(set).replace(/\\t/g, '\t').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      const [set1Raw = '', set2Raw = ''] = operands.map(expand);
      if (!set1Raw) throw ShellError('usage: tr [-d] [-s] SET1 [SET2]');

      const set1 = expandRanges(expandClasses(set1Raw));
      const set2 = set2Raw ? expandRanges(expandClasses(set2Raw)) : '';
      const source = ctx.stdin ?? '';
      const classSource = set1.replace(/[\\\]^-]/g, '\\$&');

      if (flags.d) {
        const removed = source.replace(new RegExp(`[${classSource}]`, 'g'), '');
        return flags.s ? removed.replace(new RegExp(`([${classSource}])\\1+`, 'g'), '$1') : removed;
      }

      let out = '';
      for (const ch of source) {
        const index = set1.indexOf(ch);
        if (index === -1) {
          out += ch;
          continue;
        }
        if (!set2) continue;
        out += set2[Math.min(index, set2.length - 1)] ?? ch;
      }
      return flags.s ? out.replace(/(.)\1+/g, '$1') : out;
    },
  },

  wc: {
    summary: 'count lines, words and characters',
    usage: 'wc [-l|-w|-c|-m] [file...]',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, {
        l: 'bool',
        w: 'bool',
        c: 'bool',
        m: 'bool',
      });
      const sources = readInputs(ctx, operands);
      const showAll = !flags.l && !flags.w && !flags.c && !flags.m;
      const countLines = (content) => (content.match(/\n/g) || []).length;
      const rows = sources.map((source) => {
        const lines = countLines(source.content);
        const words = source.content.split(/\s+/).filter(Boolean).length;
        const chars = source.content.length;
        const columns = [];
        if (showAll || flags.l) columns.push(String(lines).padStart(7));
        if (showAll || flags.w) columns.push(String(words).padStart(7));
        if (showAll || flags.m) columns.push(String(chars).padStart(7));
        if (flags.c) columns.push(String(chars).padStart(8));
        return `${columns.join(' ')} ${source.name}`.trimEnd();
      });

      if (sources.length > 1) {
        const total = sources.reduce(
          (acc, source) => {
            acc.lines += (source.content.match(/\n/g) || []).length;
            acc.words += source.content.split(/\s+/).filter(Boolean).length;
            acc.chars += source.content.length;
            return acc;
          },
          { lines: 0, words: 0, chars: 0 }
        );
        const columns = [];
        if (showAll || flags.l) columns.push(String(total.lines).padStart(7));
        if (showAll || flags.w) columns.push(String(total.words).padStart(7));
        if (showAll || flags.m) columns.push(String(total.chars).padStart(7));
        if (flags.c) columns.push(String(total.chars).padStart(8));
        rows.push(`${columns.join(' ')} total`.trimEnd());
      }
      return rows.join('\n');
    },
  },

  rev: {
    summary: 'reverse each line',
    usage: 'rev [file]',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, {});
      const sources = readInputs(ctx, operands);
      return emit(sources.flatMap((s) => toLines(s.content).map((l) => [...l].reverse().join(''))));
    },
  },

  tac: {
    summary: 'print lines in reverse order',
    usage: 'tac [file]',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, {});
      const sources = readInputs(ctx, operands);
      return emit(sources.flatMap((s) => toLines(s.content).reverse()));
    },
  },

  nl: {
    summary: 'number lines',
    usage: 'nl [file]',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { b: 'value', w: 'value', ba: 'bool' });
      const sources = readInputs(ctx, operands);
      return emit(
        sources.flatMap((source) =>
          toLines(source.content).map((line, index) => `${String(index + 1).padStart(6)}\t${line}`)
        )
      );
    },
  },

  seq: {
    summary: 'print a sequence of numbers',
    usage: 'seq [first [incr]] last',
    run: (ctx) => {
      const { operands } = parseFlags(ctx.args, { w: 'value', s: 'value', f: 'value' });
      const numbers = operands.map((value) => Number(value));
      if (numbers.some((n) => !Number.isFinite(n))) {
        throw ShellError('usage: seq [first [incr]] last');
      }
      // seq LAST | seq FIRST LAST | seq FIRST INCR LAST
      const [a, b, c] = numbers;
      const start = numbers.length === 1 ? 1 : a;
      const end = numbers.length === 1 ? a : numbers.length === 2 ? b : c;
      const step = numbers.length === 3 ? b : 1;
      if (step === 0) throw ShellError('seq: increment must not be zero');
      const out = [];
      const limit = 10_000;
      if (step > 0)
        for (let v = start; v <= end && out.length < limit; v += step) out.push(String(v));
      else for (let v = start; v >= end && out.length < limit; v += step) out.push(String(v));
      return emit(out);
    },
  },

  tee: {
    summary: 'copy stdin to a file and to stdout',
    usage: 'tee [-a] file...',
    run: (ctx) => {
      const { flags, operands } = parseFlags(ctx.args, { a: 'bool' });
      if (operands.length === 0) throw ShellError('usage: tee [-a] file...');
      for (const path of toPaths(ctx.view, operands)) {
        const existing = flags.a ? ctx.view.read(path) : null;
        const content = `${existing ?? ''}${ctx.stdin ?? ''}`;
        ctx.game.writeFile(path, content, Boolean(flags.a));
      }
      return ctx.stdin ?? '';
    },
  },
};

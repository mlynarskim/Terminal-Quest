/**
 * Flag parsing and glob expansion for the shell layer.
 *
 * Supports the shapes terminal users actually type: clustered short flags
 * (`-lah`), attached values (`-n5`, `--lines=5`), detached values (`-n 5`),
 * `--` terminators and `*` / `?` globbing against the virtual filesystem.
 */

import { ShellError } from './parse';
import { dirname, basename } from '../fsView';

/**
 * @param {string[]} argv
 * @param {Record<string, boolean|'value'>} spec short/long flag definitions
 * @returns {{flags: Record<string, any>, operands: string[]}}
 */
export const parseFlags = (argv, spec = {}) => {
  const flags = {};
  const operands = [];
  let literal = false;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (literal || token === '-' || !token.startsWith('-')) {
      operands.push(token);
      continue;
    }
    if (token === '--') {
      literal = true;
      continue;
    }

    if (token.startsWith('--')) {
      const eq = token.indexOf('=');
      const name = eq === -1 ? token.slice(2) : token.slice(2, eq);
      const inline = eq === -1 ? null : token.slice(eq + 1);
      if (spec[name] === 'value') {
        if (inline !== null) flags[name] = inline;
        else if (i + 1 < argv.length) flags[name] = argv[++i];
        else throw ShellError(`option '--${name}' requires an argument`);
      } else {
        flags[name] = inline === null ? true : inline !== 'false' && inline !== '0';
      }
      continue;
    }

    const cluster = token.slice(1);
    // GNU style single-dash long options: `find -name x`, `cut -f 1`.
    if (spec[cluster] !== undefined) {
      if (spec[cluster] === 'value') {
        if (i + 1 < argv.length) flags[cluster] = argv[++i];
        else throw ShellError(`option requires an argument -- '${cluster}'`);
      } else {
        flags[cluster] = true;
      }
      continue;
    }
    for (let j = 0; j < cluster.length; j++) {
      const ch = cluster[j];
      if (spec[ch] === 'value') {
        const attached = cluster.slice(j + 1);
        if (attached) {
          flags[ch] = attached;
        } else if (i + 1 < argv.length) {
          flags[ch] = argv[++i];
        } else {
          throw ShellError(`option requires an argument -- '${ch}'`);
        }
        break;
      }
      flags[ch] = true;
    }
  }

  return { flags, operands };
};

/** Translates a `*`/`?` pattern into a regex. */
export const globToRegExp = (pattern) => {
  let out = '^';
  for (const ch of pattern) {
    if (ch === '*') out += '.*';
    else if (ch === '?') out += '.';
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`${out}$`, 'i');
};

export const hasGlob = (token) => /[*?]/.test(token);

/**
 * Expands glob tokens against the current directory, in place, preserving the
 * order of every other argument. Non-glob tokens pass through untouched, and
 * an unmatched glob is left as-is — exactly what a shell does when nothing
 * matched.
 */
export const expandGlobs = (view, tokens, quoted = []) => {
  const out = [];
  tokens.forEach((token, index) => {
    if (quoted[index] || !hasGlob(token)) {
      out.push(token);
      return;
    }
    const slash = token.lastIndexOf('/');
    const dirPart = slash === -1 ? view.cwd : view.resolve(token.slice(0, slash || 1));
    const pattern = slash === -1 ? token : token.slice(slash + 1);
    const regex = globToRegExp(pattern);
    const matches = view
      .children(dirPart, { all: true })
      .filter((st) => regex.test(st.name))
      .map((st) => (slash === -1 ? st.name : st.path));
    if (matches.length === 0) out.push(token);
    else out.push(...matches.sort());
  });
  return out;
};

/** `head -3` — a bare digit after the flag means "that many lines". */
export const inlineCount = (args) => {
  const match = args.find((arg) => /^-\d+$/.test(arg));
  return match ? Number.parseInt(match.slice(1), 10) : null;
};

/** Turns operand path arguments into absolute paths (handles `.`, `..`, `~`). */
export const toPaths = (view, operands) => operands.map((operand) => view.resolve(operand));

export { basename, dirname };

/**
 * Filesystem view for the virtual grid.
 *
 * The world itself (`virtualFS`) is read-only game content. Anything the
 * player creates lives in a persisted overlay stored on the game state:
 *
 *   state.fs = { files: { [path]: { content, created, modified } },
 *                dirs:  { [path]: { created } },
 *                removed: [path] }
 *
 * The view merges the two layers and is what every shell command reads from.
 * Grid files can be copied but never overwritten or deleted — the game would
 * stop making sense otherwise — while anything the player writes is fully
 * theirs to `rm`.
 */

import { normalizePath, resolvePath, virtualFS } from './fileSystem';

export const EMPTY_FS = { files: {}, dirs: {}, removed: [] };

export const basename = (path) => {
  const p = normalizePath(path);
  if (p === '/') return '/';
  return p.slice(p.lastIndexOf('/') + 1);
};

export const dirname = (path) => {
  const p = normalizePath(path);
  if (p === '/') return '/';
  const cut = p.lastIndexOf('/');
  return cut <= 0 ? '/' : p.slice(0, cut);
};

export const joinPath = (dir, name) => normalizePath(`${dir === '/' ? '' : dir}/${name}`);

export const isUnder = (path, dir) => path === dir || path.startsWith(`${dir}/`);

/** Normalises whatever the save file contains into a usable overlay. */
export const normalizeFs = (fs) => {
  if (!fs || typeof fs !== 'object') return { ...EMPTY_FS, files: {}, dirs: {}, removed: [] };
  return {
    files: fs.files && typeof fs.files === 'object' ? fs.files : {},
    dirs: fs.dirs && typeof fs.dirs === 'object' ? fs.dirs : {},
    removed: Array.isArray(fs.removed) ? fs.removed : [],
  };
};

/**
 * Builds a read model over the grid + player overlay.
 * Pure: safe to call on every render or command.
 */
export const createFsView = (state) => {
  const fs = normalizeFs(state?.fs);
  const cwd = state?.currentDir || '/home';
  const stage = state?.story?.stage || 0;
  const fragmentsFound = state?.cat?.fragmentsFound || 0;
  const removed = new Set(fs.removed);

  const isVisible = (entry) => {
    if (!entry) return false;
    if (entry.source === 'user') return true;
    if (entry.storyGate) return stage >= entry.storyGate;
    if (entry.isFragment) {
      const n = parseInt(String(entry.name).split('_')[1], 10);
      return Number.isFinite(n) ? fragmentsFound >= n : true;
    }
    return !entry.isHidden;
  };

  const stat = (path) => {
    const p = normalizePath(path);
    if (removed.has(p)) return null;

    const userFile = fs.files[p];
    if (userFile) {
      const content = typeof userFile.content === 'string' ? userFile.content : '';
      return {
        path: p,
        name: basename(p),
        type: 'file',
        source: 'user',
        content,
        size: content.length,
        created: userFile.created || 0,
        modified: userFile.modified || 0,
      };
    }

    const userDir = fs.dirs[p];
    if (userDir) {
      return {
        path: p,
        name: basename(p),
        type: 'dir',
        source: 'user',
        created: userDir.created || 0,
        modified: userDir.modified || userDir.created || 0,
      };
    }

    const entry = virtualFS[p];
    if (!entry) return null;
    const content = typeof entry.content === 'string' ? entry.content : '';
    return {
      path: p,
      name: basename(p),
      type: entry.type,
      source: 'grid',
      content,
      size: content.length,
      children: entry.children,
      created: 0,
      modified: 0,
      isHidden: Boolean(entry.isHidden),
      isFragment: Boolean(entry.isFragment),
      isBinary: Boolean(entry.isBinary),
      isEncrypted: Boolean(entry.isEncrypted),
      restricted: Boolean(entry.restricted),
      storyGate: entry.storyGate,
    };
  };

  const gridChildren = (dirPath) => {
    const entry = virtualFS[dirPath];
    if (!entry || entry.type !== 'dir' || !Array.isArray(entry.children)) return [];
    return entry.children;
  };

  /** Direct children of a directory, merged from both layers, sorted. */
  const children = (dirPath, { all = false } = {}) => {
    const dir = normalizePath(dirPath);
    const found = new Map();
    const add = (name) => {
      if (!name || found.has(name)) return;
      const st = stat(joinPath(dir, name));
      if (st) found.set(name, st);
    };

    for (const name of gridChildren(dir)) add(name);
    for (const path of Object.keys(fs.dirs)) {
      if (dirname(path) === dir) add(basename(path));
    }
    for (const path of Object.keys(fs.files)) {
      if (dirname(path) === dir) add(basename(path));
    }

    return [...found.values()]
      .filter((st) => all || isVisible(st))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  /** Depth-first walk of every visible entry below `fromPath`. */
  const walk = (fromPath = '/', { all = false, maxDepth = Infinity } = {}) => {
    const out = [];
    const visit = (dirPath, depth) => {
      if (depth > maxDepth) return;
      for (const st of children(dirPath, { all })) {
        out.push(st);
        if (st.type === 'dir') visit(st.path, depth + 1);
      }
    };
    visit(normalizePath(fromPath), 1);
    return out;
  };

  return {
    cwd,
    fs,
    stage,
    stat,
    children,
    walk,
    isVisible,
    resolve: (target) => resolvePath(cwd, target),
    exists: (path) => stat(path) !== null,
    isDir: (path) => stat(path)?.type === 'dir',
    isFile: (path) => stat(path)?.type === 'file',
    read: (path) => {
      const st = stat(path);
      return st && st.type === 'file' ? st.content : null;
    },
    /** Every user-created file, sorted by path. Used by `notes` and the journal. */
    userFiles: () =>
      Object.keys(fs.files)
        .map((p) => stat(p))
        .filter((st) => st && st.type === 'file')
        .sort((a, b) => a.path.localeCompare(b.path)),
  };
};

// ── Mutations ────────────────────────────────────────────────────────────────
// Each helper is pure: it takes an overlay and returns a new one.

const withFile = (fs, path, content, now) => ({
  ...fs,
  files: {
    ...fs.files,
    [normalizePath(path)]: {
      content,
      created: fs.files[normalizePath(path)]?.created ?? now,
      modified: now,
    },
  },
  removed: fs.removed.filter((p) => p !== normalizePath(path)),
});

export const applyWriteFile = (fs, path, content, now) =>
  withFile(normalizeFs(fs), path, content, now);

export const applyTouch = (fs, path, now) => {
  const clean = normalizeFs(fs);
  const p = normalizePath(path);
  if (clean.files[p]) {
    return {
      ...clean,
      files: { ...clean.files, [p]: { ...clean.files[p], modified: now } },
    };
  }
  return withFile(clean, p, '', now);
};

export const applyMkdir = (fs, path, now) => {
  const clean = normalizeFs(fs);
  const p = normalizePath(path);
  return {
    ...clean,
    dirs: { ...clean.dirs, [p]: { created: clean.dirs[p]?.created ?? now } },
    removed: clean.removed.filter((x) => x !== p),
  };
};

/** Removes a file, or a directory (with its subtree when `recursive`). */
export const applyRemove = (fs, path, { recursive = false } = {}) => {
  const clean = normalizeFs(fs);
  const p = normalizePath(path);
  const drop = (prefix) => clean.removed.includes(prefix);

  const nextFiles = { ...clean.files };
  const nextDirs = { ...clean.dirs };
  for (const key of Object.keys(nextFiles)) {
    if (key === p || (recursive && isUnder(key, p))) delete nextFiles[key];
  }
  for (const key of Object.keys(nextDirs)) {
    if (key === p || (recursive && isUnder(key, p))) delete nextDirs[key];
  }

  const removed = [...clean.removed];
  if (!drop(p)) removed.push(p);
  if (recursive) {
    for (const key of [...Object.keys(clean.files), ...Object.keys(clean.dirs)]) {
      if (isUnder(key, p) && !removed.includes(key)) removed.push(key);
    }
  }

  return { ...clean, files: nextFiles, dirs: nextDirs, removed };
};

export const applyCopy = (fs, fromPath, toPath, now) => {
  const view = createFsView({ fs, currentDir: '/' });
  const src = view.stat(fromPath);
  if (!src) return normalizeFs(fs);

  if (src.type === 'file') return applyWriteFile(fs, toPath, src.content, now);

  const clean = normalizeFs(fs);
  let next = applyMkdir(clean, toPath, now);
  for (const st of view.walk(src.path, { all: true })) {
    const target = joinPath(toPath, st.path.slice(src.path.length + 1));
    next =
      st.type === 'dir'
        ? applyMkdir(next, target, now)
        : applyWriteFile(next, target, st.content, now);
  }
  return next;
};

export const applyMove = (fs, fromPath, toPath, now) => {
  const view = createFsView({ fs, currentDir: '/' });
  const src = view.stat(fromPath);
  if (!src) return normalizeFs(fs);
  const copied = applyCopy(fs, src.path, toPath, now);
  if (src.source === 'user') {
    return applyRemove(copied, src.path, { recursive: true });
  }
  return copied;
};

/** True when the player is allowed to create/overwrite this path. */
export const canWrite = (state, path) => {
  const view = createFsView(state);
  const st = view.stat(path);
  if (!st) return true;
  return st.source === 'user';
};

/** True when the player is allowed to delete this path. */
export const canRemove = (state, path) => {
  const view = createFsView(state);
  const st = view.stat(path);
  if (!st) return false;
  return st.source === 'user' && st.path !== '/';
};

/** Human readable size, `-h` style. */
export const formatSize = (bytes, human = false) => {
  if (!human) return String(bytes);
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

/** `ls -l` style timestamp. */
export const formatMtime = (ms) => {
  const d = new Date(ms || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
};

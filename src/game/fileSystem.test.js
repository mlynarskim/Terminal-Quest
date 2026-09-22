import { describe, it, expect } from 'vitest';
import { normalizePath, resolvePath, getEntry, isDirectory, isFile } from '../game/fileSystem';

describe('normalizePath', () => {
  it('handles empty input', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath(null)).toBe('/');
  });

  it('collapses multiple slashes', () => {
    expect(normalizePath('//home///user//')).toBe('/home/user');
  });

  it('ensures leading slash', () => {
    expect(normalizePath('home')).toBe('/home');
  });

  it('strips trailing slash (except root)', () => {
    expect(normalizePath('/home/')).toBe('/home');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('resolvePath', () => {
  it('resolves ~ and empty to home', () => {
    expect(resolvePath('/home', '~')).toBe('/home');
    expect(resolvePath('/home', '')).toBe('/home');
  });

  it('resolves root target', () => {
    expect(resolvePath('/home', '/')).toBe('/');
  });

  it('resolves relative paths', () => {
    expect(resolvePath('/home', 'readme.txt')).toBe('/home/readme.txt');
    expect(resolvePath('/home', '.hidden')).toBe('/home/.hidden');
  });

  it('resolves .. parent traversal', () => {
    expect(resolvePath('/home/.hidden', '..')).toBe('/home');
    expect(resolvePath('/home/.hidden', '../..')).toBe('/');
  });

  it('resolves absolute paths', () => {
    expect(resolvePath('/home', '/system')).toBe('/system');
  });
});

describe('getEntry', () => {
  it('returns entries from the virtual FS', () => {
    const entry = getEntry('/home');
    expect(entry).toBeDefined();
    expect(entry.type).toBe('dir');
  });

  it('returns undefined for missing paths', () => {
    expect(getEntry('/nonexistent')).toBeUndefined();
  });
});

describe('isDirectory / isFile', () => {
  it('distinguishes dirs, files, and missing entries', () => {
    expect(isDirectory('/home')).toBe(true);
    expect(isFile('/home')).toBe(false);
    expect(isFile('/home/readme.txt')).toBe(true);
    expect(isDirectory('/home/readme.txt')).toBe(false);
    expect(isDirectory('/nope')).toBe(false);
    expect(isFile('/nope')).toBe(false);
  });
});

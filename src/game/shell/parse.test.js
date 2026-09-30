import { describe, it, expect } from 'vitest';
import { parseCommandLine, tokenize, ShellError, isShellError } from './parse';
import { parseFlags, globToRegExp, hasGlob, inlineCount } from './flags';

describe('parseCommandLine', () => {
  it('keeps argument case intact', () => {
    const { jobs } = parseCommandLine('cat ReadMe.TXT');
    expect(jobs[0].stages[0].argv).toEqual(['cat', 'ReadMe.TXT']);
  });

  it('splits pipelines into stages', () => {
    const { jobs } = parseCommandLine('cat a.txt | grep x | wc -l');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].stages.map((s) => s.argv[0])).toEqual(['cat', 'grep', 'wc']);
  });

  it('splits sequential jobs and remembers the joiner', () => {
    const { jobs } = parseCommandLine('ls; pwd');
    expect(jobs).toHaveLength(2);
    expect(jobs[1].joiner).toBe(';');
  });

  it('records && and || joiners', () => {
    const { jobs } = parseCommandLine('test -f a && echo yes || echo no');
    expect(jobs.map((j) => j.joiner)).toEqual([';', '&&', '||']);
  });

  it('strips quotes but marks the token as quoted', () => {
    const { jobs } = parseCommandLine(`grep "two words" file.txt`);
    const stage = jobs[0].stages[0];
    expect(stage.argv).toEqual(['grep', 'two words', 'file.txt']);
    expect(stage.quoted).toEqual([false, true, false]);
  });

  it('supports single quotes, escapes and empty arguments', () => {
    expect(tokenize(`echo 'it'\\''s'`)).toEqual(['echo', "it's"]);
    expect(tokenize('echo ""')).toEqual(['echo', '']);
    expect(tokenize('echo "line\\nbreak"')).toEqual(['echo', 'line\nbreak']);
  });

  it('keeps pipes inside quotes', () => {
    expect(tokenize(`grep "a|b" f`)).toEqual(['grep', 'a|b', 'f']);
  });

  it('parses > and >> redirection', () => {
    const { jobs } = parseCommandLine('echo hi > out.txt');
    const stage = jobs[0].stages[0];
    expect(stage.argv).toEqual(['echo', 'hi']);
    expect(stage.redirects).toEqual([{ op: '>', target: 'out.txt' }]);

    const appended = parseCommandLine('echo hi >> out.txt').jobs[0].stages[0];
    expect(appended.redirects).toEqual([{ op: '>>', target: 'out.txt' }]);
  });

  it('handles redirection on a later pipeline stage', () => {
    const { jobs } = parseCommandLine('ls | grep txt > found.txt');
    const [last] = jobs[0].stages.slice(1);
    expect(last.redirects[0].target).toBe('found.txt');
  });

  it('rejects unbalanced quotes and background jobs', () => {
    expect(() => parseCommandLine('echo "open')).toThrow(/matching quote/);
    expect(() => parseCommandLine('ls &')).toThrow(/background jobs/);
    expect(isShellError(ShellError('x'))).toBe(true);
  });

  it('rejects a dangling pipe', () => {
    expect(() => parseCommandLine('ls |')).toThrow(/syntax error/);
  });

  it('ignores comments', () => {
    expect(tokenize('ls # this is a note')).toEqual(['ls']);
  });
});

describe('parseFlags', () => {
  const spec = { l: 'bool', a: 'bool', n: 'value', name: 'value' };

  it('reads clustered short flags', () => {
    expect(parseFlags(['-la'], spec).flags).toEqual({ l: true, a: true });
  });

  it('reads attached and detached values', () => {
    expect(parseFlags(['-n5'], spec).flags.n).toBe('5');
    expect(parseFlags(['-n', '5'], spec).flags.n).toBe('5');
    expect(parseFlags(['--name=x'], spec).flags.name).toBe('x');
  });

  it('reads GNU style single dash long options', () => {
    const { flags, operands } = parseFlags(['-name', '*.enc'], spec);
    expect(flags.name).toBe('*.enc');
    expect(operands).toEqual([]);
  });

  it('keeps operands and stops after --', () => {
    const { operands } = parseFlags(['-l', '--', '-weird-name'], spec);
    expect(operands).toEqual(['-weird-name']);
  });

  it('rejects a missing value', () => {
    expect(() => parseFlags(['-n'], spec)).toThrow(/requires an argument/);
  });
});

describe('glob helpers', () => {
  it('detects globs', () => {
    expect(hasGlob('*.txt')).toBe(true);
    expect(hasGlob('readme.txt')).toBe(false);
  });

  it('builds case-insensitive patterns', () => {
    expect(globToRegExp('*.enc').test('SECRETS.TXT.ENC')).toBe(true);
    expect(globToRegExp('readme.?xt').test('readme.txt')).toBe(true);
    expect(globToRegExp('*.enc').test('readme.txt')).toBe(false);
  });

  it('reads a bare line count like head -3', () => {
    expect(inlineCount(['-3'])).toBe(3);
    expect(inlineCount(['-n', '5'])).toBeNull();
  });
});

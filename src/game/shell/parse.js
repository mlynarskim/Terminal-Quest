/**
 * Command line parsing: quotes, escapes, pipes, sequencing and redirection.
 * Deliberately small — enough POSIX for `cat x | grep y | wc -l > out.txt`
 * without turning the game into a full bash.
 */

export const ShellError = (message, code = 1) => {
  const err = new Error(message);
  err.isShellError = true;
  err.code = code;
  return err;
};

export const isShellError = (error) => Boolean(error && error.isShellError);

const isBlank = (ch) => ch === ' ' || ch === '\t';

/**
 * @returns {{jobs: Array<{stages: Array<{argv: string[], redirects: Array<{op: string, target: string}>}>}>}}
 */
export const parseCommandLine = (input) => {
  const jobs = [];
  let stages = [];
  let argv = [];
  let quoted = [];
  let redirects = [];

  let token = '';
  let hasToken = false;
  let tokenQuoted = false;
  let quote = null;
  let pendingRedirect = null;

  const pushToken = () => {
    if (!hasToken) return;
    argv.push(token);
    quoted.push(tokenQuoted);
    token = '';
    hasToken = false;
    tokenQuoted = false;
  };

  const pushStage = () => {
    pushToken();
    if (pendingRedirect) {
      redirects.push(pendingRedirect);
      pendingRedirect = null;
    }
    if (argv.length === 0 && redirects.length === 0) {
      if (stages.length > 0) throw ShellError('syntax error near unexpected token `|`');
      return;
    }
    stages.push({ argv, quoted, redirects });
    argv = [];
    quoted = [];
    redirects = [];
  };

  let joiner = ';';
  const pushJob = (nextJoiner) => {
    pushStage();
    if (stages.length > 0) jobs.push({ joiner, stages });
    stages = [];
    joiner = nextJoiner;
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\\' && quote !== "'") {
      const next = input[i + 1];
      if (next === undefined) {
        token += '\\';
        hasToken = true;
        break;
      }
      if (quote === '"') {
        const escapes = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', "'": "'" };
        token += escapes[next] ?? next;
      } else {
        token += next;
      }
      hasToken = true;
      i++;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
        hasToken = true; // '' is a valid empty argument
        tokenQuoted = true;
      } else {
        token += ch;
        hasToken = true;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      hasToken = true;
      tokenQuoted = true;
      continue;
    }

    if (ch === '#' && !hasToken) break; // comment to end of line

    if (ch === '|' || ch === ';' || ch === '&') {
      if (ch === '|' && input[i + 1] === '|') {
        i++;
        pushJob('||');
        continue;
      }
      if (ch === '&') {
        if (input[i + 1] === '&' || input[i + 1] === '|') {
          const operator = input[i + 1] === '&' ? '&&' : '||';
          i++;
          pushJob(operator);
          continue;
        }
        throw ShellError('background jobs are not supported by this grid');
      }
      if (ch === ';') pushJob(';');
      else pushStage();
      continue;
    }

    if (ch === '>') {
      pushToken();
      if (pendingRedirect) redirects.push(pendingRedirect);
      const op = input[i + 1] === '>' ? '>>' : '>';
      if (op === '>>') i++;
      pendingRedirect = { op, target: '' };
      continue;
    }

    if (pendingRedirect) {
      if (isBlank(ch)) continue;
      pendingRedirect.target += ch;
      continue;
    }

    if (isBlank(ch)) {
      pushToken();
      if (pendingRedirect) {
        redirects.push(pendingRedirect);
        pendingRedirect = null;
      }
      continue;
    }

    token += ch;
    hasToken = true;
  }

  if (quote) throw ShellError('unexpected EOF while looking for matching quote');
  if (pendingRedirect && !pendingRedirect.target) {
    throw ShellError('syntax error near unexpected token `newline`');
  }
  pushStage();
  if (stages.length > 0) jobs.push({ joiner, stages });

  if (jobs.length === 0) throw ShellError('no command given');
  return { jobs };
};

/** Splits an argv array on unquoted whitespace, keeping the original case. */
export const tokenize = (line) => parseCommandLine(line).jobs[0].stages[0].argv;

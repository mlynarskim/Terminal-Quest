/**
 * The command tables. Kept separate from the shell runner so the registry can
 * import it without a cycle (`shell/index.js` needs the registry for `man`).
 */

import { FILESYSTEM_COMMANDS } from './commands/filesystem';
import { TEXT_COMMANDS } from './commands/text';
import { SYSTEM_COMMANDS } from './commands/system';
import { PROCESS_COMMANDS } from './commands/processes';

export const SHELL_COMMANDS = {
  ...FILESYSTEM_COMMANDS,
  ...TEXT_COMMANDS,
  ...SYSTEM_COMMANDS,
  ...PROCESS_COMMANDS,
};

/** name -> canonical name, including every alias. */
export const SHELL_ALIAS_TABLE = {};
for (const [name, command] of Object.entries(SHELL_COMMANDS)) {
  SHELL_ALIAS_TABLE[name] = name;
  for (const alias of command.aliases || []) {
    if (!SHELL_ALIAS_TABLE[alias]) SHELL_ALIAS_TABLE[alias] = name;
  }
}

export const findShellCommand = (name) => {
  const canonical = SHELL_ALIAS_TABLE[String(name).toLowerCase()];
  if (!canonical) return null;
  return { name: canonical, command: SHELL_COMMANDS[canonical] };
};

export const shellCommandNames = () => Object.keys(SHELL_COMMANDS).sort();

/** Registry entries for every shell command, so `help` lists them all. */
export const shellCommandDefinitions = () =>
  Object.entries(SHELL_COMMANDS).map(([name, command]) => ({
    name,
    description: command.summary,
    aliases: command.aliases || [],
    unlocked: true,
  }));

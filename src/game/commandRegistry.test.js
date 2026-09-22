import { describe, it, expect } from 'vitest';
import { COMMAND_DEFINITIONS, INTENT_MAP } from '../game/commandRegistry';

describe('INTENT_MAP', () => {
  it('maps natural language to commands', () => {
    expect(INTENT_MAP['go back']).toBe('cd ..');
    expect(INTENT_MAP['help me']).toBe('help');
    expect(INTENT_MAP['where am i']).toBe('pwd');
  });

  it('does not contain mapping loops of length 1', () => {
    for (const [key, value] of Object.entries(INTENT_MAP)) {
      expect(value).not.toBe(key);
    }
  });
});

describe('COMMAND_DEFINITIONS', () => {
  it('has unique aliases across commands', () => {
    const seen = new Map();
    for (const [name, def] of Object.entries(COMMAND_DEFINITIONS)) {
      for (const alias of def.aliases || []) {
        expect(seen.has(alias), `alias "${alias}" is duplicated`).toBe(false);
        seen.set(alias, name);
      }
    }
  });

  it('defines core commands', () => {
    for (const cmd of ['help', 'ls', 'cd', 'pwd', 'cat', 'clear']) {
      expect(COMMAND_DEFINITIONS[cmd]).toBeDefined();
    }
  });

  it('has no alias that collides with a command name', () => {
    const names = new Set(Object.keys(COMMAND_DEFINITIONS));
    for (const def of Object.values(COMMAND_DEFINITIONS)) {
      for (const alias of def.aliases || []) {
        expect(names.has(alias), `alias "${alias}" collides with a command name`).toBe(false);
      }
    }
  });
});

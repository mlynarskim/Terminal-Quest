import { describe, it, expect } from 'vitest';
import { resolveDaemonResponse } from './daemon';

describe('daemon', () => {
  it('responds to greetings', () => {
    const resp = resolveDaemonResponse('hello there');
    expect(resp.toLowerCase()).toContain('system:');
  });

  it('responds to lore queries', () => {
    const resp = resolveDaemonResponse('what happened to this place');
    expect(resp.toLowerCase()).toContain('system:');
  });

  it('responds to cat-related queries', () => {
    const resp = resolveDaemonResponse('tell me about the cat');
    expect(resp.toLowerCase()).toContain('system:');
  });

  it('responds to random gibberish with a fallback', () => {
    const resp = resolveDaemonResponse('xyzzy plugh');
    expect(resp.toLowerCase()).toContain('system:');
  });

  it('responds to farewell', () => {
    const resp = resolveDaemonResponse('goodbye');
    expect(resp.toLowerCase()).toContain('system:');
  });
});

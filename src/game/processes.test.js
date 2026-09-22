import { describe, it, expect } from 'vitest';
import {
  spawnProcess,
  tickProcess,
  isDangerous,
  killProcess,
  processEarnings,
  PROCESS_TYPES,
} from './processes';

describe('processes', () => {
  it('spawns a process with an incrementing pid', () => {
    const a = spawnProcess();
    const b = spawnProcess();
    expect(b.pid).toBe(a.pid + 1);
    expect(a.terminated).toBe(false);
    expect(a.age).toBe(0);
  });

  it('ticks age upward', () => {
    const proc = spawnProcess();
    const ticked = tickProcess(proc);
    expect(ticked.age).toBe(1);
  });

  it('is dangerous when age exceeds threshold', () => {
    const proc = spawnProcess({ dangerThreshold: 3 });
    expect(isDangerous(proc)).toBe(false);
    // age 0 → tick → 1 → tick → 2 → tick → 3 (>= threshold)
    expect(isDangerous(tickProcess(tickProcess(tickProcess(proc))))).toBe(true);
  });

  it('kill terminates the process', () => {
    const proc = spawnProcess();
    const killed = killProcess(proc);
    expect(killed.terminated).toBe(true);
    expect(killed.terminatedAt).toBeTypeOf('number');
  });

  it('processEarnings pays base yield', () => {
    const proc = spawnProcess({ bitsYield: 40 });
    expect(processEarnings(proc)).toBe(40);
  });

  it('processEarnings gives near-miss bonus when dangerous', () => {
    const proc = spawnProcess({ bitsYield: 40, dangerThreshold: 1 });
    const dangerous = tickProcess(proc);
    expect(processEarnings(dangerous)).toBe(40 + 20);
  });

  it('PROCESS_TYPES has all expected types', () => {
    const ids = PROCESS_TYPES.map((t) => t.id);
    expect(ids).toContain('monitor');
    expect(ids).toContain('stress');
    expect(ids).toContain('shadow');
    expect(ids).toContain('idle');
  });
});

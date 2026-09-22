import { describe, it, expect } from 'vitest';
import { createCronJob, tickCron, dueJobs, formatCronJob } from './cron';

describe('cron', () => {
  it('creates a job with an id and nextRun', () => {
    const job = createCronJob('feed', 60_000);
    expect(job.id).toBeTruthy();
    expect(job.command).toBe('feed');
    expect(job.interval).toBe(60_000);
    expect(job.nextRun).toBeGreaterThan(Date.now());
  });

  it('enqueues a job when its time has come', () => {
    const job = createCronJob('ls', 60_000);
    const now = Date.now() + 60_001;
    const updated = tickCron([job], now);
    expect(updated[0].nextRun).toBe(now + 60_000);
  });

  it('dueJobs returns only jobs whose time has come', () => {
    const job = createCronJob('ls', 60_000);
    const future = createCronJob('feed', 60_000);
    const all = [job, { ...future, nextRun: Date.now() + 999999 }];
    const due = dueJobs(all, Date.now() + 60_001);
    expect(due.length).toBe(1);
    expect(due[0].command).toBe('ls');
  });

  it('formatCronJob produces a readable string', () => {
    const job = createCronJob('feed', 120_000);
    const str = formatCronJob(job);
    expect(str).toContain('feed');
    expect(str).toContain('2m');
  });

  it('tickCron does not fire disabled jobs', () => {
    const job = { ...createCronJob('ls', 60_000), enabled: false };
    const updated = tickCron([job], Date.now() + 999999);
    expect(updated[0].nextRun).toBe(job.nextRun);
  });
});

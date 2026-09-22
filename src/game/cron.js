export const createCronJob = (command, intervalMs) => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  command,
  interval: Math.max(intervalMs, 60_000),
  createdAt: Date.now(),
  nextRun: Date.now() + Math.max(intervalMs, 60_000),
  enabled: true,
});

export const tickCron = (jobs, now) =>
  jobs.map((job) =>
    job.enabled && now >= job.nextRun ? { ...job, nextRun: now + job.interval } : job
  );

export const dueJobs = (jobs, now) => jobs.filter((job) => job.enabled && now >= job.nextRun);

export const formatCronJob = (job) => {
  const mins = Math.round(job.interval / 60_000);
  const next = Math.max(0, Math.round((job.nextRun - Date.now()) / 60_000));
  return `[${job.id}] "${job.command}" every ${mins}m — next in ${next}m`;
};

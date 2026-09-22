let nextPid = 1;

export const PROCESS_TYPES = [
  {
    id: 'monitor',
    name: 'MONITOR_DAEMON',
    growthRate: 1,
    bitsYield: 20,
    dangerThreshold: 6,
    description: 'Silently logs all I/O operations.',
  },
  {
    id: 'stress',
    name: 'STRESS_TEST',
    growthRate: 2,
    bitsYield: 35,
    dangerThreshold: 5,
    description: 'Pounds the CPU with synthetic load.',
  },
  {
    id: 'shadow',
    name: 'SHADOW_SCANNER',
    growthRate: 3,
    bitsYield: 50,
    dangerThreshold: 4,
    description: 'Crawls every directory for leaked credentials.',
  },
  {
    id: 'idle',
    name: 'IDLE_DAEMON',
    growthRate: 1,
    bitsYield: 15,
    dangerThreshold: 10,
    description: 'Does nothing. Somehow still leaks memory.',
  },
];

export const randomProcessType = () =>
  PROCESS_TYPES[Math.floor(Math.random() * PROCESS_TYPES.length)];

export const spawnProcess = (overrides = {}) => {
  const type = randomProcessType();
  return {
    pid: nextPid++,
    typeId: type.id,
    name: type.name,
    bitsYield: type.bitsYield,
    dangerThreshold: type.dangerThreshold,
    age: 0,
    terminated: false,
    spawnedAt: Date.now(),
    ...overrides,
  };
};

export const tickProcess = (proc) => ({
  ...proc,
  age: proc.age + 1,
});

export const isDangerous = (proc) => proc.age >= proc.dangerThreshold;

export const killProcess = (proc) => ({
  ...proc,
  terminated: true,
  terminatedAt: Date.now(),
});

export const processEarnings = (proc) => {
  const bonus = proc.age >= proc.dangerThreshold ? Math.floor(proc.bitsYield * 0.5) : 0;
  return proc.bitsYield + bonus;
};

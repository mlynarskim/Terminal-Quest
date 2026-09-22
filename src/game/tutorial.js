export const TUTORIAL_REWARD_BITS = 50;
export const TUTORIAL_ACHIEVEMENT = 'First Boot';

export const TUTORIAL_STEPS = [
  {
    id: 'help',
    prompt: 'STEP 1/5 — type "help" to list every command the grid admits to.',
    match: (cmd) => cmd === 'help',
    done: 'Good. That list is your map. Most of the game is typed, not clicked.',
  },
  {
    id: 'ls',
    prompt: 'STEP 2/5 — type "ls" to see where you are.',
    match: (cmd) => cmd === 'ls',
    done: 'Those names are real places. You can go to them.',
  },
  {
    id: 'cat',
    prompt: 'STEP 3/5 — type "cat readme.txt". Reading is how the grid talks back.',
    match: (cmd, args) => cmd === 'cat' && args.join(' ').includes('readme.txt'),
    done: 'Files hold lore, hints, puzzles — and sometimes lies.',
  },
  {
    id: 'cd',
    prompt: 'STEP 4/5 — type "cd /logs" (or "cd logs"). Movement is half the game.',
    match: (cmd, args) => cmd === 'cd' && args.join(' ').includes('logs'),
    done: 'New directory, new secrets. "cd .." climbs back up.',
  },
  {
    id: 'ask',
    prompt:
      'STEP 5/5 — type "ask hello". The daemon answers questions — and pays 5 Bits for curiosity.',
    match: (cmd) => cmd === 'ask',
    done: 'The daemon heard you. It always does.',
  },
];

export const getTutorialIntro = () => [
  { type: 'system', text: 'NEW SIGNAL DETECTED. first connection from this terminal.' },
  { type: 'output', text: 'You are inside a damaged system. It speaks in commands.' },
  { type: 'output', text: 'I will teach you the first five. Afterwards, the grid is yours.' },
  { type: 'system', text: 'TUTORIAL START — "tutorial skip" opts out any time.' },
  { type: 'system', text: TUTORIAL_STEPS[0].prompt },
];

export const getStepPrompt = (index) =>
  TUTORIAL_STEPS[index] ? TUTORIAL_STEPS[index].prompt : null;

export const matchTutorialStep = (index, cmd, args) => {
  const step = TUTORIAL_STEPS[index];
  if (!step) return false;
  try {
    return Boolean(step.match(cmd, args || []));
  } catch {
    return false;
  }
};

export const isTutorialActive = (tutorial) =>
  Boolean(tutorial && tutorial.started && !tutorial.done);

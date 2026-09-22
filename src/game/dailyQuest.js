import {
  DAILY_QUEST_COUNT,
  DAILY_TARGET_BITS,
  DAILY_TARGET_CAT,
  DAILY_TARGET_COMMANDS,
  DAILY_TARGET_DIRS,
} from './constants';

export const getTodayStr = () => new Date().toISOString().slice(0, 10);

const hashString = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

const QUESTS = [
  {
    id: 'earn_bits',
    desc: 'EARN {target} BITS TODAY',
    target: DAILY_TARGET_BITS,
    rewardMultiplier: 1,
    evaluate: (ctx) => ctx.dailyStats?.bitsEarned || 0,
  },
  {
    id: 'command_run',
    desc: 'ISSUE {target} COMMANDS',
    target: DAILY_TARGET_COMMANDS,
    rewardMultiplier: 0.8,
    evaluate: (ctx) => ctx.dailyStats?.commands || 0,
  },
  {
    id: 'explore',
    desc: 'VISIT {target} UNIQUE DIRECTORIES',
    target: DAILY_TARGET_DIRS,
    rewardMultiplier: 0.9,
    evaluate: (ctx) => ctx.dailyStats?.dirsVisited?.length || 0,
  },
  {
    id: 'cat_bond',
    desc: 'INTERACT WITH THE CAT {target} TIMES',
    target: DAILY_TARGET_CAT,
    rewardMultiplier: 1.1,
    evaluate: (ctx) => ctx.dailyStats?.catInteractions || 0,
  },
  {
    id: 'decode_payload',
    desc: 'DECODE A BINARY FILE',
    target: 1,
    rewardMultiplier: 1.4,
    evaluate: (ctx) => (ctx.solvedPuzzles?.includes('binary') ? 1 : 0),
  },
  {
    id: 'decrypt_shadow',
    desc: 'DECRYPT AN ENCRYPTED FILE',
    target: 1,
    rewardMultiplier: 1.4,
    evaluate: (ctx) => (ctx.solvedPuzzles?.includes('decryption') ? 1 : 0),
  },
];

const QUEST_POOL = QUESTS.map((q) => ({ ...q, reward: 0 }));
for (const q of QUEST_POOL) {
  q.reward = Math.round(q.rewardMultiplier * 40);
  delete q.rewardMultiplier;
}

export const generateDailyQuests = (dateStr) => {
  const seed = hashString(dateStr);
  const count = Math.min(DAILY_QUEST_COUNT, QUEST_POOL.length);
  const picked = [];
  let offset = seed;
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 31 + offset) % QUEST_POOL.length;
    const quest = {
      ...QUEST_POOL[idx],
      desc: QUEST_POOL[idx].desc.replace('{target}', QUEST_POOL[idx].target),
    };
    if (!picked.some((p) => p.id === quest.id)) {
      picked.push(quest);
    }
    offset = (offset * 7 + 3) % 97;
  }
  return picked;
};

export const evaluateQuest = (quest, state) => {
  const progress = quest.evaluate(state);
  return { ...quest, progress, done: progress >= quest.target };
};

export const evaluateAllQuests = (quests, state) => quests.map((q) => evaluateQuest(q, state));

export const isNewDay = (lastDate, today = getTodayStr()) => lastDate !== today;

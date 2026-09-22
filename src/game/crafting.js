export const RECIPES = [
  {
    inputs: ['box', 'decoder'],
    output: { id: 'loot_box', name: 'LOOT_BOX', bits: 120, achievement: 'DECRYPTOR' },
    description: 'The decoder cracks the lock — BITS spill out.',
  },
  {
    inputs: ['key', 'decoder'],
    output: {
      id: 'master_key',
      name: 'MASTER_KEY',
      bits: 0,
      achievement: 'DEEP_ACCESS',
      addItem: 'master_key',
    },
    description: 'A master key. Unlocks sealed archives deep in /system.',
  },
  {
    inputs: ['box', 'key'],
    output: { id: 'safe', name: 'SAFE', bits: 200, achievement: 'SAFECRACKER' },
    description: 'The key fits perfectly. A cache of BITS inside.',
  },
  {
    inputs: ['decoder', 'key'],
    output: {
      id: 'artifact',
      name: 'GRID_ARTIFACT',
      bits: 100,
      achievement: 'ARTIFACT_HUNTER',
      addItem: 'artifact',
    },
    description: 'The decoder and key resonate. A grid artifact materialises.',
  },
  {
    inputs: ['master_key', 'decoder'],
    output: { id: 'root_pass', name: 'ROOT_PASS', bits: 300, achievement: 'ROOT_ACCESS' },
    description: 'Total system access. The grid yields its deepest secrets.',
  },
  {
    inputs: ['artifact', 'master_key'],
    output: { id: 'core_crystal', name: 'CORE_CRYSTAL', bits: 500, achievement: 'CRYSTAL_KEEPER' },
    description: 'The core crystal — the living heart of the grid.',
  },
];

export const resolveCombine = (itemA, itemB) => {
  const norm = (s) => String(s).toLowerCase().replace(/[_ ]+/g, '').trim();
  const a = norm(itemA);
  const b = norm(itemB);

  return (
    RECIPES.find(
      (r) =>
        (norm(r.inputs[0]) === a && norm(r.inputs[1]) === b) ||
        (norm(r.inputs[0]) === b && norm(r.inputs[1]) === a)
    ) || null
  );
};

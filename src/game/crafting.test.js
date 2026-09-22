import { describe, it, expect } from 'vitest';
import { resolveCombine } from './crafting';

describe('crafting', () => {
  it('combines box + decoder into loot_box', () => {
    const recipe = resolveCombine('box', 'decoder');
    expect(recipe).toBeTruthy();
    expect(recipe.output.id).toBe('loot_box');
    expect(recipe.output.bits).toBe(120);
  });

  it('combines key + decoder into master_key', () => {
    const recipe = resolveCombine('key', 'decoder');
    expect(recipe).toBeTruthy();
    expect(recipe.output.id).toBe('master_key');
    expect(recipe.output.addItem).toBe('master_key');
  });

  it('is order-independent', () => {
    const a = resolveCombine('decoder', 'box');
    const b = resolveCombine('box', 'decoder');
    expect(a.output.id).toBe(b.output.id);
  });

  it('returns null for invalid combinations', () => {
    expect(resolveCombine('box', 'box')).toBeNull();
    expect(resolveCombine('random', 'thing')).toBeNull();
  });

  it('combines artifact + master_key into core_crystal', () => {
    const recipe = resolveCombine('artifact', 'master_key');
    expect(recipe).toBeTruthy();
    expect(recipe.output.id).toBe('core_crystal');
    expect(recipe.output.bits).toBe(500);
  });
});

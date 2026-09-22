import { describe, it, expect } from 'vitest';
import { RADIO_STATIONS, pickTransmission, TRANSMISSIONS } from './radio';

describe('radio', () => {
  it('has all expected stations', () => {
    const ids = RADIO_STATIONS.map((s) => s.id);
    expect(ids).toContain('lofi');
    expect(ids).toContain('static');
    expect(ids).toContain('encrypted');
    expect(ids).toContain('mining');
  });

  it('pickTransmission for lore returns a lore message', () => {
    const msg = pickTransmission('lore');
    expect(TRANSMISSIONS.lore).toContain(msg);
  });

  it('pickTransmission for bitsBonus returns a bits message', () => {
    const msg = pickTransmission('bitsBonus');
    expect(TRANSMISSIONS.bits).toContain(msg);
  });

  it('pickTransmission for glitchReduce returns a neutral message', () => {
    const msg = pickTransmission('glitchReduce');
    expect(TRANSMISSIONS.neutral).toContain(msg);
  });
});

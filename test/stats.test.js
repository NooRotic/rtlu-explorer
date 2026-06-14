import { describe, it, expect } from 'vitest';
import { snapshotStats } from '../src/engine/stats.js';

describe('snapshotStats', () => {
  it('counts entities and links and reads doc total from version', () => {
    const snap = {
      entities: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      links: [{ source: 'a', target: 'b' }],
      version: { hindsight_bank_total_docs: 1454 },
    };
    expect(snapshotStats(snap)).toEqual({ entities: 3, links: 1, docs: 1454 });
  });

  it('is null-safe when fields are missing', () => {
    expect(snapshotStats(null)).toEqual({ entities: 0, links: 0, docs: 0 });
    expect(snapshotStats({})).toEqual({ entities: 0, links: 0, docs: 0 });
    expect(snapshotStats({ entities: [{ id: 'a' }] })).toEqual({ entities: 1, links: 0, docs: 0 });
  });
});

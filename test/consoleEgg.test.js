import { describe, it, expect, vi } from 'vitest';
import { installConsoleEgg } from '../src/engine/consoleEgg.js';

const content = {
  title: 'SHAOLIN OBSERVATORY',
  intro: ['a', 'b', 'c'],
  ascii: 'WW',
  aphorisms: ['one', 'two', 'three', 'four'],
  help: [{ cmd: 'wu.wisdom()', desc: 'x' }, { cmd: 'wu.stats()', desc: 'y' }],
  numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
  statsTail: 'in the lab.',
  creed: 'C.R.E.A.M. Code Rules Everything Around Me.',
};

function fresh(stats = { entities: 2559, links: 4632, docs: 1454 }) {
  const logger = { log: vi.fn() };
  const target = {};
  const api = installConsoleEgg({ content, stats, target, logger });
  return { api, target, logger };
}

describe('installConsoleEgg', () => {
  it('installs target.wu with the four commands', () => {
    const { api, target } = fresh();
    expect(target.wu).toBe(api);
    ['help', 'wisdom', 'cipher', 'stats'].forEach((k) => expect(typeof api[k]).toBe('function'));
  });

  it('formats live stats with thousands separators and themed tail', () => {
    const { api } = fresh();
    expect(api.stats()).toBe('2,559 entities. 4,632 connections. Drawn from 1,454 documents in the lab.');
  });

  it('is null-safe for missing stats', () => {
    const { api } = fresh(null);
    expect(api.stats()).toBe('0 entities. 0 connections. Drawn from 0 documents in the lab.');
  });

  it('wisdom returns a pooled line and cycles the whole pool', () => {
    const { api } = fresh();
    const seen = new Set();
    for (let i = 0; i < content.aphorisms.length; i++) seen.add(api.wisdom());
    expect(seen).toEqual(new Set(content.aphorisms));
  });

  it('cipher includes the ascii + creed', () => {
    const { api } = fresh();
    const out = api.cipher();
    expect(out).toContain(content.ascii);
    expect(out).toContain(content.creed);
  });

  it('each command returns its string and also logs once', () => {
    const { api, logger } = fresh();
    const before = logger.log.mock.calls.length;
    const r = api.help();
    expect(typeof r).toBe('string');
    expect(logger.log.mock.calls.length).toBe(before + 1);
  });

  it('is idempotent — second install returns same api, logs no extra banner', () => {
    const logger = { log: vi.fn() };
    const target = {};
    const a1 = installConsoleEgg({ content, stats: {}, target, logger });
    const afterFirst = logger.log.mock.calls.length;
    const a2 = installConsoleEgg({ content, stats: {}, target, logger });
    expect(a2).toBe(a1);
    expect(logger.log.mock.calls.length).toBe(afterFirst);
  });
});

// test/search.test.js
import { describe, it, expect } from 'vitest';
import { searchEntities } from '../src/engine/search.js';

const NODES = [
  { id: 'rza', name: 'RZA' },
  { id: 'rae', name: 'Raekwon' },
  { id: 'meth', name: 'Method Man' },
  { id: 'methlab', name: 'Tical (Method Lab)' },
  { id: 'gza', name: 'GZA' },
];
const DEGREE = { rza: 254, rae: 262, meth: 294, methlab: 3, gza: 106 };

describe('searchEntities', () => {
  it('returns [] for blank query', () => {
    expect(searchEntities('  ', NODES, DEGREE)).toEqual([]);
  });

  it('ranks prefix matches above substring matches', () => {
    const r = searchEntities('meth', NODES, DEGREE).map((x) => x.id);
    // "Method Man" (prefix) before "Tical (Method Lab)" (substring)
    expect(r[0]).toBe('meth');
    expect(r).toContain('methlab');
    expect(r.indexOf('meth')).toBeLessThan(r.indexOf('methlab'));
  });

  it('is case-insensitive and breaks ties by degree', () => {
    // both 'rza' and 'rae' start with 'r'; rae has higher degree -> first
    const r = searchEntities('R', NODES, DEGREE).map((x) => x.id);
    expect(r[0]).toBe('rae');
    expect(r[1]).toBe('rza');
  });

  it('honors the limit', () => {
    expect(searchEntities('a', NODES, DEGREE, 2).length).toBeLessThanOrEqual(2);
  });

  it('returns id, name, and degree on each hit', () => {
    const [hit] = searchEntities('gza', NODES, DEGREE);
    expect(hit).toEqual({ id: 'gza', name: 'GZA', degree: 106 });
  });
});

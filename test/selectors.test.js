// test/selectors.test.js
import { describe, it, expect } from 'vitest';
import { topNByDegree, neighborsOf, entityStats } from '../src/engine/selectors.js';

const NODES = [
  { id: 'wu', name: 'Wu-Tang Clan' },
  { id: 'meth', name: 'Method Man' },
  { id: 'a', name: 'Shaolin' },
  { id: 'b', name: 'Killa Beez' },
];
const DEGREE = { wu: 3, meth: 2, a: 1, b: 1 };
const LINKS = [
  { source: 'wu', target: 'meth', weight: 56 },
  { source: 'wu', target: 'a', weight: 3 },
  { source: 'meth', target: 'b', weight: 1 },
];

describe('topNByDegree', () => {
  it('keeps the N highest-degree nodes', () => {
    const ids = topNByDegree(NODES, DEGREE, 2).map((n) => n.id);
    expect(ids).toEqual(['wu', 'meth']);
  });
  it('returns all nodes when N >= node count', () => {
    expect(topNByDegree(NODES, DEGREE, 99)).toHaveLength(4);
  });
});

describe('neighborsOf', () => {
  it('returns the focus id plus its directly-linked node ids', () => {
    const set = neighborsOf('wu', LINKS);
    expect(set.has('wu')).toBe(true);
    expect(set.has('meth')).toBe(true);
    expect(set.has('a')).toBe(true);
    expect(set.has('b')).toBe(false);
  });
});

describe('entityStats', () => {
  it('summarizes degree, count, and strongest tie for the drawer', () => {
    const node = { id: 'wu', name: 'Wu-Tang Clan', count: 457 };
    const stats = entityStats(node, { wu: 3 }, LINKS, (id) => ({ name: { meth: 'Method Man', a: 'Shaolin' }[id] }));
    expect(stats.degree).toBe(3);
    expect(stats.count).toBe(457);
    expect(stats.strongest).toEqual({ name: 'Method Man', weight: 56 });
    expect(stats.topEdges[0]).toEqual({ name: 'Method Man', weight: 56 });
    expect(stats.topEdges.length).toBeLessThanOrEqual(5);
  });
});

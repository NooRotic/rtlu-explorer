// test/buildGraph.test.js
import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/engine/buildGraph.js';

const SUN_NAMES = ['Wu-Tang Clan', 'Method Man'];

function fixture() {
  const entities = [
    { id: 'wu', name: 'Wu-Tang Clan', count: 457, type: null, categories: [] },
    { id: 'meth', name: 'Method Man', count: 416, type: null, categories: [] },
    { id: 'a', name: 'Shaolin', count: 10, type: null, categories: [] },
    { id: 'iso', name: 'Lonely', count: 1, type: null, categories: [] }, // isolated
  ];
  const links = [
    { source: 'wu', target: 'meth', edge_type: 'cooccurrence', weight: 56 },
    { source: 'a', target: 'meth', edge_type: 'cooccurrence', weight: 5 },
    { source: 'a', target: 'wu', edge_type: 'cooccurrence', weight: 2 },
  ];
  return { entities, links };
}

describe('buildGraph', () => {
  it('computes undirected degree per node', () => {
    const { degree } = buildGraph(fixture(), { sunNames: SUN_NAMES, superHub: 'Wu-Tang Clan' });
    expect(degree.meth).toBe(2);
    expect(degree.wu).toBe(2);
    expect(degree.a).toBe(2);
    expect(degree.iso).toBe(0);
  });

  it('classifies tiers from the roster: super-hub > sun > dust', () => {
    const { byId } = buildGraph(fixture(), { sunNames: SUN_NAMES, superHub: 'Wu-Tang Clan' });
    expect(byId.wu.tier).toBe('super');
    expect(byId.meth.tier).toBe('sun');
    expect(byId.a.tier).toBe('dust');
  });

  it('assigns each dust node to its strongest sun orbit', () => {
    const { byId } = buildGraph(fixture(), { sunNames: SUN_NAMES, superHub: 'Wu-Tang Clan' });
    // 'a' ties to meth(5) stronger than wu(2) -> orbit = meth
    expect(byId.a.orbit).toBe('meth');
    expect(byId.iso.orbit).toBe(null); // isolated -> no orbit
  });

  it('returns links with string source/target untouched (FG mutates its own copy)', () => {
    const { links } = buildGraph(fixture(), { sunNames: SUN_NAMES, superHub: 'Wu-Tang Clan' });
    expect(typeof links[0].source).toBe('string');
    expect(links[0].weight).toBe(56);
  });
});

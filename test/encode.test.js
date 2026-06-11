// test/encode.test.js
import { describe, it, expect } from 'vitest';
import { encode, registerStrategy, listStrategies } from '../src/engine/encode.js';
import { wuTangTheme } from '../src/theme/wu-tang/index.js';

const CTX = (over = {}) => ({
  theme: wuTangTheme,
  degree: { wu: 214, meth: 294, dust: 2 },
  maxCount: 457,
  maxDegree: 294,
  focusSet: null,
  strategy: 'structural',
  ...over,
});

describe('encode (structural)', () => {
  it('paints the super-hub and suns in gold, dust in ash', () => {
    const wu = encode({ id: 'wu', tier: 'super', count: 457 }, CTX());
    const dust = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX());
    expect(wu.color).toBe(wuTangTheme.palette.gold);
    expect(dust.color).toBe(wuTangTheme.palette.ash);
  });

  it('sizes suns by count and dust by degree, suns larger than dust', () => {
    const sun = encode({ id: 'meth', tier: 'sun', count: 416 }, CTX());
    const dust = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX());
    expect(sun.size).toBeGreaterThan(dust.size);
  });

  it('dims nodes outside the focus set during drill-in', () => {
    const focusSet = new Set(['meth']);
    const inFocus = encode({ id: 'meth', tier: 'sun', count: 416 }, CTX({ focusSet }));
    const outFocus = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX({ focusSet }));
    expect(outFocus.opacity).toBeLessThan(inFocus.opacity);
  });
});

describe('encode (community lens)', () => {
  it('is registered as a second lens and colors by orbit', () => {
    expect(listStrategies()).toContain('community');
    const a = encode({ id: 'a', tier: 'dust', orbit: 'meth', count: 2 }, CTX({ strategy: 'community' }));
    const b = encode({ id: 'b', tier: 'dust', orbit: 'rza', count: 2 }, CTX({ strategy: 'community' }));
    expect(a.color).not.toBe(b.color); // different orbits -> different hues
  });
});

describe('encode registry', () => {
  it('lets a new strategy be registered (Phase-2.5 type-color path)', () => {
    registerStrategy('type', () => ({ color: '#123456', size: 1, glow: 0, opacity: 1 }));
    const r = encode({ id: 'x', tier: 'dust', type: 'person', count: 1 }, CTX({ strategy: 'type' }));
    expect(r.color).toBe('#123456');
  });
});

describe('encode highlight states', () => {
  it('white-hots and enlarges connected DUST in a hover set', () => {
    const hoverSet = new Set(['dust']);
    const base = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX());
    const hot = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX({ hoverSet }));
    expect(hot.color).toBe(wuTangTheme.palette.whiteHot);
    expect(hot.size).toBeGreaterThan(base.size);
    expect(hot.opacity).toBe(1);
  });

  it('keeps suns gold (not white) when highlighted — no white blob', () => {
    const focusSet = new Set(['meth']);
    const hot = encode({ id: 'meth', tier: 'sun', count: 416 }, CTX({ focusSet }));
    expect(hot.color).toBe(wuTangTheme.palette.gold);
    expect(hot.opacity).toBe(1);
  });

  it('still dims nodes outside an active focus set', () => {
    const focusSet = new Set(['meth']);
    const out = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX({ focusSet }));
    expect(out.opacity).toBeLessThan(0.5);
  });

  it('hover highlight does not dim non-hovered nodes when nothing is selected', () => {
    const hoverSet = new Set(['x']);
    const other = encode({ id: 'dust', tier: 'dust', count: 2 }, CTX({ hoverSet }));
    expect(other.opacity).toBeGreaterThan(0.5); // unchanged, not dimmed
  });
});

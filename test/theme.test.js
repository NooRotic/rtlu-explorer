import { describe, it, expect } from 'vitest';
import { wuTangTheme } from '../src/theme/wu-tang/index.js';

describe('wuTangTheme contract', () => {
  it('exposes the locked palette tokens', () => {
    const p = wuTangTheme.palette;
    expect(p.bgBase).toBe('#070912');
    expect(p.gold).toBe('#E8B306');
    expect(p.amber).toBe('#C2570F');
    expect(p.ash).toBe('#9AA3AD');
    expect(p.cyan).toBe('#7FE8FF');
  });

  it('declares the three-face type system', () => {
    const t = wuTangTheme.typography;
    expect(t.title).toMatch(/Saira Stencil One/);
    expect(t.body).toMatch(/Special Elite/);
    expect(t.data).toMatch(/Space Mono/);
  });

  it('owns the sun roster (super-hub + 10 emcees)', () => {
    expect(wuTangTheme.suns.superHub).toBe('Wu-Tang Clan');
    expect(wuTangTheme.suns.roster).toHaveLength(11);
    expect(wuTangTheme.suns.roster).toContain('Method Man');
    expect(wuTangTheme.suns.roster).toContain('Cappadonna');
    expect(wuTangTheme.suns.roster).toContain("Ol' Dirty Bastard");
  });

  it('provides motion + nebula constants the engine needs', () => {
    expect(wuTangTheme.motion.cameraTweenMs).toBeGreaterThan(0);
    expect(Array.isArray(wuTangTheme.nebula.layers)).toBe(true);
    expect(wuTangTheme.nebula.layers.length).toBeGreaterThan(0);
  });
});

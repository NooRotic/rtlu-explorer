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

  it('exposes silver dock tokens and a brighter subtitle token', () => {
    const p = wuTangTheme.palette;
    expect(p.silver).toMatch(/^#/);
    expect(p.silverEdge).toMatch(/^#/);
    expect(p.coinInk).toMatch(/^#/);   // coin background (near-black)
    expect(p.subtle).toMatch(/^#/);    // brighter-than-mute subtitle
  });

  it('carries the Wu mark asset url and tribute disclaimer copy', () => {
    expect(typeof wuTangTheme.assets.wuMark).toBe('string');
    expect(wuTangTheme.assets.wuMark.length).toBeGreaterThan(0);
    expect(wuTangTheme.copy.disclaimer).toMatch(/tribute/i);
    expect(wuTangTheme.copy.dock).toBeTruthy();
    expect(wuTangTheme.copy.search.placeholder).toMatch(/.+/);
    expect(wuTangTheme.copy.stars.title).toMatch(/.+/);
  });

  it('carries the About-modal copy', () => {
    const a = wuTangTheme.copy.about;
    expect(a.heading).toMatch(/.+/);
    expect(Array.isArray(a.sections)).toBe(true);
    expect(a.sections.length).toBeGreaterThanOrEqual(4);
    expect(a.numbersTitle).toMatch(/.+/);
    expect(a.tribute).toMatch(/tribute/i);
    expect(Array.isArray(a.links)).toBe(true);
    expect(wuTangTheme.copy.about.openLabel).toMatch(/.+/);
  });

  it('carries the console-egg content', () => {
    const c = wuTangTheme.console;
    expect(Array.isArray(c.intro)).toBe(true);
    expect(c.intro.length).toBeGreaterThanOrEqual(3);
    expect(c.ascii).toMatch(/.+/);
    expect(Array.isArray(c.aphorisms)).toBe(true);
    expect(c.aphorisms.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(c.help)).toBe(true);
    expect(c.help[0]).toHaveProperty('cmd');
    expect(c.help[0]).toHaveProperty('desc');
    expect(c.numbersUnits.entities).toMatch(/.+/);
    expect(c.statsTail).toMatch(/.+/);
    expect(c.creed).toMatch(/Code Rules/);
  });
});

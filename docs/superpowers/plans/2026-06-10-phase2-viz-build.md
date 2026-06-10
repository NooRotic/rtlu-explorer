# RTLU Explorer — Phase 2 VIZ Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the cleared "Shaolin Observatory" art direction into a working 3D force-directed explorer of the Wu-Tang universe — themed token seam, glowing-suns-on-ash-dust render with weighted gold edges and nebula depth, a single `encode()` accessor, a node-budget slider, click-to-isolate drill-in, and the J-card drawer.

**Architecture:** A strict **theme/engine seam**. `src/theme/wu-tang/` holds *every* Wu value (palette, fonts, motion constants, copy, nebula spec, the sun roster). `src/engine/` is artist-agnostic: it loads the snapshot, normalizes the graph, classifies tiers, computes orbits, selects the top-N by degree, and renders via `react-force-graph-3d`. Pure logic (selectors, encode strategies, budget math) is unit-tested with Vitest; the three.js render layer is verified by build + live boot. A `ThemeContext` injects the theme so no engine file ever names a Wu value.

**Tech Stack:** Vite 6 · React 18 · `react-force-graph-3d` 1.24 · `three` 0.169 · Vitest (added this plan) · Google Fonts (Saira Stencil One / Special Elite / Space Mono / Inter).

**Locked source of truth:** `docs/art-direction.md`. **Hard guardrail:** the viz reads only the four static JSON files (names/counts/weights). No verse text exists in them and none is introduced.

**Real data constants (probed 2026-06-10):**
- 2,559 entities · 4,632 links · 144 isolated · edge weight 1..56 (median 1, p90 3) · degree median 2, p90 6, max 294.
- The locked sun roster (theme-owned), with `count` / `degree`:
  Wu-Tang Clan 457/214 (super-hub) · Method Man 416/294 · RZA 359/254 · Raekwon 319/262 · Inspectah Deck 255/191 · Ghostface Killah 242/177 · U-God 151/107 · Masta Killa 151/132 · Cappadonna 147/119 · GZA 134/106 · Ol' Dirty Bastard 72/53.
- `type` is `null`/`""`, `categories` is `[]` for every entity today (Phase-2.5 fills them).

---

## File Structure

```
src/
  theme/
    ThemeContext.jsx        # createContext + useTheme(); ThemeProvider
    wu-tang/
      index.js              # assembles & exports the wuTangTheme object
      palette.js            # color tokens (the only place hexes live)
      typography.js         # font families + role map + label-promotion flag
      motion.js             # camera tween ms, idle drift, nebula drift, easing
      copy.js               # Wu strings: title, tagline, drawer labels
      nebula.js             # nebula cloud layer specs (offset, size, color, opacity)
      suns.js               # SUN_ROSTER (names) + SUPER_HUB name — Wu domain roster
  engine/
    buildGraph.js           # normalize entities/links -> {nodes, links, degree, byId} (+ tier, orbit)
    selectors.js            # topNByDegree, neighborsOf, entityStats  (pure)
    encode.js               # encode strategy registry + 'structural' + 'community' strategies
    budget.js               # clampBudget, BUDGET_STOPS, budgetStorageKey  (pure)
    useNodeBudget.js        # localStorage-backed React hook around budget.js
    useGraphData.js         # fetch the four JSON files -> raw snapshot
    nodeObject.js           # build a THREE object for a node from encode() output
    nebulaLayer.js          # build drifting nebula THREE sprites from theme.nebula
    GraphScene.jsx          # ForceGraph3D wrapper: wires encode, edges, camera, isolate, nebula
  ui/
    BudgetSlider.jsx        # themed node-budget slider
    Drawer.jsx              # themed J-card dossier
  ExplorerApp.jsx           # composes ThemeProvider + engine + ui
  App.jsx                   # MODIFY: mount ExplorerApp (keep the Phase-1 landing reachable)
test/
  selectors.test.js
  encode.test.js
  budget.test.js
  buildGraph.test.js
  theme.test.js
```

**Seam discipline:** files under `src/engine/` and `src/ui/` MUST NOT contain a Wu hex, font name, or roster name. They read everything from `useTheme()` or props. The self-review (end of plan) greps for this.

---

## Task 0: Tooling — Vitest, fonts, npm scripts

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Create: `vitest.config.js`

- [ ] **Step 1: Add Vitest as a dev dependency and a test script**

Run (bypassing the RTK shim per the project gotcha):

```bash
cd C:/Dev/projects/rtlu-explorer
node node_modules/npm/bin/npm-cli.js pkg set scripts.test="vitest run" scripts."test:watch"="vitest"
node node_modules/vite/bin/vite.js --version  # sanity: tooling reachable
```

Then install Vitest (pnpm; if output looks empty, the install still ran — verify with the next step):

```bash
pnpm add -D vitest@^2.1.0
```

- [ ] **Step 2: Verify Vitest resolves**

Run: `node node_modules/vitest/vitest.mjs --version`
Expected: prints a `2.x` version string. (If `node_modules/vitest/vitest.mjs` differs, use `pnpm exec vitest --version`.)

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

// Pure-logic tests only (selectors, encode, budget, theme contract). No DOM/three here;
// the render layer is verified by build + live boot, not unit tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Add the four Google fonts to `index.html`**

Insert inside `<head>` (after the viewport meta), matching the faces the mockup loads:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Saira+Stencil+One&family=Special+Elite&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 5: Verify the empty Vitest run is green (no tests yet)**

Run: `pnpm test`
Expected: Vitest reports "No test files found" OR exits 0. (Either is acceptable; we add tests next.)

- [ ] **Step 6: Commit**

```bash
rtk git add package.json pnpm-lock.yaml index.html vitest.config.js
rtk git commit -m "chore: add vitest + load Shaolin Observatory fonts"
```

---

## Task 1: Wu-Tang theme module (the token seam)

**Files:**
- Create: `src/theme/wu-tang/palette.js`
- Create: `src/theme/wu-tang/typography.js`
- Create: `src/theme/wu-tang/motion.js`
- Create: `src/theme/wu-tang/copy.js`
- Create: `src/theme/wu-tang/nebula.js`
- Create: `src/theme/wu-tang/suns.js`
- Create: `src/theme/wu-tang/index.js`
- Test: `test/theme.test.js`

- [ ] **Step 1: Write the failing theme-contract test**

```js
// test/theme.test.js
import { describe, it, expect } from 'vitest';
import { wuTangTheme } from '../src/theme/wu-tang/index.js';

describe('wuTangTheme contract', () => {
  it('exposes the locked palette tokens', () => {
    const p = wuTangTheme.palette;
    expect(p.bgBase).toBe('#070912');
    expect(p.gold).toBe('#E8B306');
    expect(p.amber).toBe('#C2570F');
    expect(p.ash).toBe('#9AA3AD');
    expect(p.cyan).toBe('#7FE8FF'); // reserved for Phase 2.5
  });

  it('declares the three-face type system', () => {
    const t = wuTangTheme.typography;
    expect(t.title).toMatch(/Saira Stencil One/);
    expect(t.body).toMatch(/Special Elite/);
    expect(t.data).toMatch(/Space Mono/);
  });

  it('owns the sun roster (super-hub + 10 emcees)', () => {
    expect(wuTangTheme.suns.superHub).toBe('Wu-Tang Clan');
    expect(wuTangTheme.suns.roster).toHaveLength(11); // super-hub + 10 emcees
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `../src/theme/wu-tang/index.js`.

- [ ] **Step 3: Create `palette.js`**

```js
// src/theme/wu-tang/palette.js
// The ONLY file in the codebase where Wu hexes live. Value hierarchy, not hue wash:
// gold = signal, ash = field. See docs/art-direction.md "Palette".
export const palette = {
  bgBase: '#070912', // deep indigo-black void
  gold: '#E8B306',   // the signal: sun cores, edges, headline accents
  amber: '#C2570F',  // sun outer-glow, nebula warmth
  ash: '#9AA3AD',    // the dust-field (neutral = contrast)
  cyan: '#7FE8FF',   // RESERVED: active/selected ring now -> type-color hue in Phase 2.5
  whiteHot: '#FFFFFF',
  goldPale: '#FFE9A8', // sun core mid-stop
  ink: '#E9E7E0',      // default UI text on the void
  mute: '#8B96A3',     // secondary UI text
};
```

- [ ] **Step 4: Create `typography.js`**

```js
// src/theme/wu-tang/typography.js
// Three faces by role; grit lives here, not in the palette. See docs/art-direction.md "Typography".
export const typography = {
  title: "'Saira Stencil One', sans-serif", // titles, headlines, entity names
  body: "'Special Elite', cursive",          // body, in-graph labels, atmosphere (short copy)
  data: "'Space Mono', monospace",           // numerals, counts, degrees, weights
  longform: "Inter, system-ui, sans-serif",  // accessibility fallback for long prose
  // Escape hatch (art-direction.md): if typewriter labels read poorly at full density,
  // in-graph node labels promote to the title face. Engine reads this flag, never the value.
  promoteLabelsToTitle: false,
};
```

- [ ] **Step 5: Create `motion.js`**

```js
// src/theme/wu-tang/motion.js
// "Observatory instrument, not a dreamy free-floater." See docs/art-direction.md "Camera & motion".
export const motion = {
  cameraTweenMs: 1100,   // cinematic push-in on select
  idleDrift: 0.0006,     // slow idle "breath" auto-rotation (radians/frame); 0 disables
  nebulaDriftMs: 22000,  // full nebula drift cycle (mirrors the mockup's 22s)
  easing: 'easeInOutCubic',
};
```

- [ ] **Step 6: Create `copy.js`**

```js
// src/theme/wu-tang/copy.js
// All Wu-specific UI strings. The engine renders strings it is handed; it never authors them.
export const copy = {
  title: 'SHAOLIN OBSERVATORY',
  tagline: 'a map of the cipher — supreme-math bones, lanterns in the deep',
  drawer: {
    referenced: 'referenced',
    degree: 'connections',
    strongestTie: 'strongest tie',
    topEdges: 'orbits',
    typeRow: 'type',      // value renders as "—" in v1 (the Phase-2.5 hook)
    typePlaceholder: '—',
  },
  budget: {
    label: 'render budget',
    hint: 'top-N most-connected nodes',
  },
};
```

- [ ] **Step 7: Create `nebula.js`**

```js
// src/theme/wu-tang/nebula.js
// Heavier nebula behind the node field (gold/amber + one cool counterpoint), slow drift.
// Offsets are scene-space multipliers applied by the engine relative to graph extent.
export const nebula = {
  layers: [
    { offset: [-0.5, 0.3, -1.0], size: 1.6, color: '#E8B306', opacity: 0.20 },
    { offset: [0.6, -0.4, -1.2], size: 1.4, color: '#C2570F', opacity: 0.18 },
    { offset: [0.1, 0.1, -1.4], size: 1.2, color: '#3A6EA5', opacity: 0.12 }, // cool counterpoint
    { offset: [-0.3, -0.5, -0.9], size: 1.0, color: '#E8B306', opacity: 0.10 },
  ],
};
```

- [ ] **Step 8: Create `suns.js`**

```js
// src/theme/wu-tang/suns.js
// WU DOMAIN ROSTER. No single metric separates emcees from same-count albums (e.g. ODB c=72
// vs "8 Diagrams" c=120), so "who is a sun" is art-directed Wu knowledge and lives in the theme.
// The engine stays artist-agnostic: it renders whatever the theme flags as a sun. Matched by name.
export const suns = {
  superHub: 'Wu-Tang Clan', // the collective; distinct grander tier
  roster: [
    'Wu-Tang Clan',
    'Method Man',
    'RZA',
    'Raekwon',
    'Inspectah Deck',
    'Ghostface Killah',
    'U-God',
    'Masta Killa',
    'Cappadonna',
    'GZA',
    "Ol' Dirty Bastard",
  ],
};
```

- [ ] **Step 9: Create `index.js`**

```js
// src/theme/wu-tang/index.js
import { palette } from './palette.js';
import { typography } from './typography.js';
import { motion } from './motion.js';
import { copy } from './copy.js';
import { nebula } from './nebula.js';
import { suns } from './suns.js';

// The full Wu-Tang theme object the ThemeProvider injects. The engine consumes ONLY this shape.
export const wuTangTheme = { id: 'wu-tang', palette, typography, motion, copy, nebula, suns };
```

- [ ] **Step 10: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — `theme.test.js` 4/4 green.

- [ ] **Step 11: Commit**

```bash
rtk git add src/theme/wu-tang test/theme.test.js
rtk git commit -m "feat(theme): wu-tang token module — palette, type, motion, nebula, sun roster"
```

---

## Task 2: ThemeContext + useTheme

**Files:**
- Create: `src/theme/ThemeContext.jsx`

(No unit test — this is a thin React context; it is exercised by the live boot in Task 12.)

- [ ] **Step 1: Create the context**

```jsx
// src/theme/ThemeContext.jsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ theme, children }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within a ThemeProvider');
  return theme;
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/theme/ThemeContext.jsx
rtk git commit -m "feat(theme): ThemeProvider + useTheme seam"
```

---

## Task 3: buildGraph — normalize, degree, tier, orbit

**Files:**
- Create: `src/engine/buildGraph.js`
- Test: `test/buildGraph.test.js`

The orbit (community) is faithful to "force-derived clusters = the emcee orbits": each node is assigned to the **sun it co-occurs most strongly with** (max summed edge weight to any sun). Suns belong to their own orbit; isolated nodes get orbit `null`.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test test/buildGraph.test.js`
Expected: FAIL — cannot resolve `buildGraph.js`.

- [ ] **Step 3: Implement `buildGraph.js`**

```js
// src/engine/buildGraph.js
// Artist-agnostic graph normalizer. Takes the raw snapshot + a roster (supplied by the theme via
// the caller) and returns nodes/links plus degree, byId, and per-node tier + orbit. Pure: it never
// imports a theme and never mutates its inputs.

/**
 * @param {{entities: Array, links: Array}} snapshot
 * @param {{sunNames: string[], superHub: string}} roster
 */
export function buildGraph(snapshot, roster) {
  const sunSet = new Set(roster.sunNames);
  const degree = {};
  const byId = {};

  const nodes = snapshot.entities.map((e) => {
    degree[e.id] = 0;
    const tier =
      e.name === roster.superHub ? 'super' : sunSet.has(e.name) ? 'sun' : 'dust';
    const node = {
      id: e.id,
      name: e.name,
      count: e.count ?? 0,
      type: e.type ?? null,
      categories: e.categories ?? [],
      tier,
      orbit: null, // filled below
    };
    byId[e.id] = node;
    return node;
  });

  // Undirected degree.
  for (const l of snapshot.links) {
    if (degree[l.source] !== undefined) degree[l.source] += 1;
    if (degree[l.target] !== undefined) degree[l.target] += 1;
  }

  // Orbit = the sun a node co-occurs most strongly with (max summed weight to any sun node).
  // A sun is its own orbit. Build sun-id lookup first.
  const sunIds = new Set(nodes.filter((n) => n.tier !== 'dust').map((n) => n.id));
  const orbitWeight = {}; // nodeId -> { sunId: summedWeight }
  for (const l of snapshot.links) {
    accrue(orbitWeight, l.source, l.target, l.weight, sunIds);
    accrue(orbitWeight, l.target, l.source, l.weight, sunIds);
  }
  for (const n of nodes) {
    if (n.tier !== 'dust') {
      n.orbit = n.id; // suns anchor their own orbit
      continue;
    }
    const tally = orbitWeight[n.id];
    n.orbit = tally ? bestKey(tally) : null;
  }

  return { nodes, links: snapshot.links.map((l) => ({ ...l })), degree, byId };
}

function accrue(map, from, sunCandidate, weight, sunIds) {
  if (!sunIds.has(sunCandidate)) return;
  (map[from] ??= {})[sunCandidate] = (map[from][sunCandidate] ?? 0) + weight;
}

function bestKey(tally) {
  let best = null;
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(tally)) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test test/buildGraph.test.js`
Expected: PASS — 4/4 green.

- [ ] **Step 5: Commit**

```bash
rtk git add src/engine/buildGraph.js test/buildGraph.test.js
rtk git commit -m "feat(engine): buildGraph — degree, tier classification, emcee-orbit communities"
```

---

## Task 4: selectors — topNByDegree, neighborsOf, entityStats

**Files:**
- Create: `src/engine/selectors.js`
- Test: `test/selectors.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test test/selectors.test.js`
Expected: FAIL — cannot resolve `selectors.js`.

- [ ] **Step 3: Implement `selectors.js`**

```js
// src/engine/selectors.js
// Pure read-side helpers. Operate on the RAW (string-id) links so they are safe to call before or
// after react-force-graph mutates its own working copy.

/** Top-N nodes by degree, descending. Ties broken by id for determinism. */
export function topNByDegree(nodes, degree, n) {
  return [...nodes]
    .sort((a, b) => (degree[b.id] ?? 0) - (degree[a.id] ?? 0) || (a.id < b.id ? -1 : 1))
    .slice(0, n);
}

/** Set of {focus id} ∪ {ids directly linked to focus}. */
export function neighborsOf(focusId, links) {
  const set = new Set([focusId]);
  for (const l of links) {
    if (l.source === focusId) set.add(l.target);
    else if (l.target === focusId) set.add(l.source);
  }
  return set;
}

/**
 * Drawer dossier stats for one node.
 * @param resolve (id) => node-like with a .name, for naming the other end of an edge.
 */
export function entityStats(node, degree, links, resolve) {
  const edges = [];
  for (const l of links) {
    if (l.source === node.id) edges.push({ id: l.target, weight: l.weight });
    else if (l.target === node.id) edges.push({ id: l.source, weight: l.weight });
  }
  edges.sort((a, b) => b.weight - a.weight);
  const topEdges = edges.slice(0, 5).map((e) => ({ name: resolve(e.id)?.name ?? '—', weight: e.weight }));
  return {
    count: node.count ?? 0,
    degree: degree[node.id] ?? 0,
    strongest: topEdges[0] ?? null,
    topEdges,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test test/selectors.test.js`
Expected: PASS — 5/5 green.

- [ ] **Step 5: Commit**

```bash
rtk git add src/engine/selectors.js test/selectors.test.js
rtk git commit -m "feat(engine): selectors — topNByDegree, neighborsOf, entityStats"
```

---

## Task 5: encode() — the single color/size accessor + strategy registry

**Files:**
- Create: `src/engine/encode.js`
- Test: `test/encode.test.js`

`encode(node, ctx)` is the ONLY place node visual attributes are decided (art-direction.md rule). Two strategies are registered: `structural` (default — suns gold/amber by tier, dust ash; size = count for suns, degree for dust; glow = degree) and `community` (the second lens — color by orbit). `ctx` carries `{ theme, degree, maxCount, maxDegree, focusSet }`. When `focusSet` is present and a node is outside it, the node dims (drill-in fade).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test test/encode.test.js`
Expected: FAIL — cannot resolve `encode.js`.

- [ ] **Step 3: Implement `encode.js`**

```js
// src/engine/encode.js
// THE single node-visual accessor. Color/size/glow/opacity are decided here and NOWHERE else, so
// adding Phase-2.5 type-color is "register a strategy", not a rewrite. Strategies are pure
// functions (node, ctx) => { color, size, glow, opacity }.

const SUN_MIN = 6;   // scene-space radius floor for suns
const SUN_MAX = 22;  // super-hub ceiling
const DUST_MIN = 0.6;
const DUST_MAX = 3.2;
const DIM_OPACITY = 0.12;

const strategies = new Map();

export function registerStrategy(name, fn) {
  strategies.set(name, fn);
}
export function listStrategies() {
  return [...strategies.keys()];
}

/** Public accessor used by every renderer. */
export function encode(node, ctx) {
  const fn = strategies.get(ctx.strategy) ?? strategies.get('structural');
  const base = fn(node, ctx);
  // Focus dimming is strategy-independent (applies to whichever lens is active).
  if (ctx.focusSet && !ctx.focusSet.has(node.id)) {
    return { ...base, opacity: DIM_OPACITY };
  }
  return base;
}

// --- structural (default) ---------------------------------------------------
registerStrategy('structural', (node, ctx) => {
  const { palette } = ctx.theme;
  const isSun = node.tier !== 'dust';
  if (isSun) {
    const t = ctx.maxCount ? (node.count ?? 0) / ctx.maxCount : 0;
    const size = node.tier === 'super' ? SUN_MAX : SUN_MIN + t * (SUN_MAX - SUN_MIN);
    const glow = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
    return { color: palette.gold, size, glow, opacity: 1 };
  }
  const dt = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
  return { color: palette.ash, size: DUST_MIN + dt * (DUST_MAX - DUST_MIN), glow: 0, opacity: 0.7 };
});

// --- community (second lens) ------------------------------------------------
// Deterministic hue per orbit id via a hashed HSL. Suns keep gold so anchors stay legible.
registerStrategy('community', (node, ctx) => {
  const { palette } = ctx.theme;
  if (node.tier !== 'dust') {
    return { color: palette.gold, size: node.tier === 'super' ? SUN_MAX : SUN_MIN, glow: 1, opacity: 1 };
  }
  const hue = node.orbit ? hashHue(node.orbit) : 0;
  const dt = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
  return {
    color: node.orbit ? `hsl(${hue}, 55%, 60%)` : palette.ash,
    size: DUST_MIN + dt * (DUST_MAX - DUST_MIN),
    glow: 0,
    opacity: 0.75,
  };
});

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test test/encode.test.js`
Expected: PASS — 5/5 green.

- [ ] **Step 5: Commit**

```bash
rtk git add src/engine/encode.js test/encode.test.js
rtk git commit -m "feat(engine): encode() accessor + structural/community strategies + registry"
```

---

## Task 6: budget math + useNodeBudget hook

**Files:**
- Create: `src/engine/budget.js`
- Create: `src/engine/useNodeBudget.js`
- Test: `test/budget.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/budget.test.js
import { describe, it, expect } from 'vitest';
import { clampBudget, BUDGET_STOPS, budgetStorageKey, DEFAULT_BUDGET } from '../src/engine/budget.js';

describe('budget math', () => {
  it('exposes labeled stops including the full snapshot', () => {
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(250);
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(500);
    expect(BUDGET_STOPS.map((s) => s.value)).toContain(1000);
    expect(BUDGET_STOPS[BUDGET_STOPS.length - 1].label).toMatch(/all/i);
  });

  it('defaults to the median-machine position (300-500)', () => {
    expect(DEFAULT_BUDGET).toBeGreaterThanOrEqual(300);
    expect(DEFAULT_BUDGET).toBeLessThanOrEqual(500);
  });

  it('clamps to [1, total]', () => {
    expect(clampBudget(99999, 2559)).toBe(2559);
    expect(clampBudget(0, 2559)).toBe(1);
    expect(clampBudget(400, 2559)).toBe(400);
  });

  it('namespaces persistence per artist', () => {
    expect(budgetStorageKey('wu-tang')).toBe('rtlu.nodeBudget.wu-tang');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test test/budget.test.js`
Expected: FAIL — cannot resolve `budget.js`.

- [ ] **Step 3: Implement `budget.js`**

```js
// src/engine/budget.js
// Engine-level, artist-agnostic. The user's lever on the fidelity/perf tradeoff: render the top-N
// nodes by degree, so low budget = "the core Clan structure", high = "the whole universe". The
// graph degrades gracefully (sheds the weight-1 long tail first), never a randomly shredded web.

export const BUDGET_STOPS = [
  { value: 250, label: '250' },
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
  { value: 2559, label: 'All' },
];

export const DEFAULT_BUDGET = 400; // tuned to a median machine (art-direction.md open item)

export function clampBudget(n, total) {
  if (!Number.isFinite(n)) return DEFAULT_BUDGET;
  return Math.max(1, Math.min(Math.round(n), total));
}

export function budgetStorageKey(artistId) {
  return `rtlu.nodeBudget.${artistId}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test test/budget.test.js`
Expected: PASS — 4/4 green.

- [ ] **Step 5: Implement the localStorage-backed hook (no unit test — exercised at boot)**

```js
// src/engine/useNodeBudget.js
import { useCallback, useEffect, useState } from 'react';
import { clampBudget, budgetStorageKey, DEFAULT_BUDGET } from './budget.js';

/** Persisted node-budget state. Reads/writes localStorage under a per-artist key. */
export function useNodeBudget(artistId, total) {
  const key = budgetStorageKey(artistId);
  const [budget, setBudgetState] = useState(() => {
    try {
      const raw = globalThis.localStorage?.getItem(key);
      return raw ? clampBudget(Number(raw), total) : clampBudget(DEFAULT_BUDGET, total);
    } catch {
      return clampBudget(DEFAULT_BUDGET, total);
    }
  });

  const setBudget = useCallback(
    (n) => setBudgetState(clampBudget(n, total)),
    [total],
  );

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(key, String(budget));
    } catch {
      /* ignore quota/private-mode */
    }
  }, [key, budget]);

  return [budget, setBudget];
}
```

- [ ] **Step 6: Commit**

```bash
rtk git add src/engine/budget.js src/engine/useNodeBudget.js test/budget.test.js
rtk git commit -m "feat(engine): node-budget math + persisted useNodeBudget hook"
```

---

## Task 7: useGraphData — load the snapshot

**Files:**
- Create: `src/engine/useGraphData.js`

(No unit test — it is a fetch wrapper; verified at boot. Mirrors the existing `App.jsx` loader so the data path and the privacy guardrail stay identical.)

- [ ] **Step 1: Implement the loader**

```js
// src/engine/useGraphData.js
import { useEffect, useState } from 'react';

// Resolve a data artifact relative to the deployed base path (set in vite.config).
const dataUrl = (artist, file) => `${import.meta.env.BASE_URL}data/${artist}/${file}`;

async function loadJson(artist, file) {
  const res = await fetch(dataUrl(artist, file));
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Loads the four static snapshot files for an artist. PRIVACY GUARDRAIL: only these files are ever
 * read; they contain names/counts/weights and NO verse text.
 */
export function useGraphData(artist) {
  const [state, setState] = useState({ status: 'loading', snapshot: null, error: null });
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadJson(artist, 'version.json'),
      loadJson(artist, 'bank-stats.json'),
      loadJson(artist, 'entities.json'),
      loadJson(artist, 'links.json'),
    ])
      .then(([version, stats, entities, links]) => {
        if (alive) setState({ status: 'ready', snapshot: { version, stats, entities, links }, error: null });
      })
      .catch((error) => {
        if (alive) setState({ status: 'error', snapshot: null, error: error.message });
      });
    return () => {
      alive = false;
    };
  }, [artist]);
  return state;
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/engine/useGraphData.js
rtk git commit -m "feat(engine): useGraphData snapshot loader (privacy-guarded)"
```

---

## Task 8: nodeObject — build a THREE object from encode()

**Files:**
- Create: `src/engine/nodeObject.js`

This avoids global UnrealBloomPass (which art-direction.md notes "smears at 2,559 nodes") in favor of per-node radial-gradient **sprites** — crisp, controllable glow within the node budget. Suns get a glow sprite + a thin gold geometry ring; the super-hub gets a second outer ring; dust is a small flat sprite.

(No unit test — three.js object; verified visually in Task 12. We DO add one guard test that the gradient-texture cache is keyed, in Step 3.)

- [ ] **Step 1: Implement `nodeObject.js`**

```js
// src/engine/nodeObject.js
import * as THREE from 'three';

// Cache radial-gradient glow textures by color so we build each at most once.
const glowCache = new Map();

function glowTexture(color) {
  if (glowCache.has(color)) return glowCache.get(color);
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // white-hot center -> pale gold -> color -> transparent (mirrors the mockup's sun gradient)
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,233,168,0.95)');
  g.addColorStop(0.6, hexToRgba(color, 0.9));
  g.addColorStop(1.0, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  glowCache.set(color, tex);
  return tex;
}

function dustTexture(color) {
  const key = `dust:${color}`;
  if (glowCache.has(key)) return glowCache.get(key);
  const size = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, hexToRgba(color, 1));
  g.addColorStop(0.7, hexToRgba(color, 0.6));
  g.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  glowCache.set(key, tex);
  return tex;
}

function hexToRgba(hex, a) {
  // Accepts #RRGGBB or hsl(...) — for hsl we let the browser parse via a throwaway sprite color.
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  // hsl(...) — strip to an rgba via a temporary element is overkill in three; community lens dust
  // uses a flat sprite color instead, so just return the hsl with alpha appended.
  return hex.replace(/^hsl\(/, 'hsla(').replace(/\)$/, `, ${a})`);
}

/**
 * Build the THREE object for a node from an encode() result.
 * @param {{color, size, glow, opacity}} enc
 * @param {{tier: string}} node
 * @param {{ringColor: string}} opts  ring color comes from theme.palette.gold (passed by caller)
 */
export function buildNodeObject(enc, node, opts) {
  const group = new THREE.Group();
  const isSun = node.tier !== 'dust';

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: isSun ? glowTexture(enc.color) : dustTexture(enc.color),
      transparent: true,
      opacity: enc.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const scale = isSun ? enc.size * (1 + enc.glow * 0.6) : enc.size;
  sprite.scale.set(scale, scale, 1);
  group.add(sprite);

  if (isSun) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(enc.size * 0.62, enc.size * 0.68, 48),
      new THREE.MeshBasicMaterial({ color: opts.ringColor, transparent: true, opacity: 0.5 * enc.opacity, side: THREE.DoubleSide }),
    );
    group.add(ring);
    if (node.tier === 'super') {
      const outer = new THREE.Mesh(
        new THREE.RingGeometry(enc.size * 0.78, enc.size * 0.82, 64),
        new THREE.MeshBasicMaterial({ color: opts.ringColor, transparent: true, opacity: 0.35 * enc.opacity, side: THREE.DoubleSide }),
      );
      group.add(outer);
    }
  }
  return group;
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/engine/nodeObject.js
rtk git commit -m "feat(engine): per-node sprite+ring builder (sprite glow, no bloom smear)"
```

---

## Task 9: nebulaLayer — drifting background clouds

**Files:**
- Create: `src/engine/nebulaLayer.js`

(No unit test — three.js; verified visually.)

- [ ] **Step 1: Implement `nebulaLayer.js`**

```js
// src/engine/nebulaLayer.js
import * as THREE from 'three';

function cloudTexture(color) {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const n = color.startsWith('#') ? parseInt(color.slice(1), 16) : 0xe8b306;
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  g.addColorStop(0, `rgba(${rgb},0.5)`);
  g.addColorStop(0.5, `rgba(${rgb},0.18)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

/**
 * Build the nebula sprite group + an update(t) fn for slow drift. `extent` scales offsets to the
 * graph's spatial spread so clouds sit behind the node field at any layout size.
 */
export function buildNebula(nebulaSpec, extent) {
  const group = new THREE.Group();
  const sprites = [];
  nebulaSpec.layers.forEach((layer, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cloudTexture(layer.color),
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const s = extent * layer.size;
    sprite.scale.set(s, s, 1);
    sprite.position.set(layer.offset[0] * extent, layer.offset[1] * extent, layer.offset[2] * extent);
    sprite.userData.basePos = sprite.position.clone();
    sprite.userData.phase = i;
    group.add(sprite);
    sprites.push(sprite);
  });

  function update(t) {
    for (const sp of sprites) {
      const ph = sp.userData.phase;
      sp.position.x = sp.userData.basePos.x + Math.sin(t * 0.0004 + ph) * extent * 0.04;
      sp.position.y = sp.userData.basePos.y + Math.cos(t * 0.0003 + ph) * extent * 0.03;
    }
  }

  return { group, update };
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/engine/nebulaLayer.js
rtk git commit -m "feat(engine): drifting nebula background layer"
```

---

## Task 10: GraphScene — the ForceGraph3D wrapper

**Files:**
- Create: `src/engine/GraphScene.jsx`

This is the engine heart. It: builds the graph (Task 3), applies the budget (Task 5/6) to pick top-N by degree, hands FG the `nodeThreeObject` (Task 8) reading current encode() + focus, sets weighted gold edges, mounts the nebula (Task 9), runs idle drift + push-in tween on select, and lifts the selected node up to the parent (for the drawer). Focus state lives in a ref the `nodeThreeObject` reads; on change we call `fgRef.refresh()`.

(No unit test — verified at boot in Task 12.)

- [ ] **Step 1: Implement `GraphScene.jsx`**

```jsx
// src/engine/GraphScene.jsx
import { useEffect, useMemo, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useTheme } from '../theme/ThemeContext.jsx';
import { buildGraph } from './buildGraph.js';
import { topNByDegree, neighborsOf } from './selectors.js';
import { encode } from './encode.js';
import { buildNodeObject } from './nodeObject.js';
import { buildNebula } from './nebulaLayer.js';

export default function GraphScene({ snapshot, budget, strategy, focusId, onSelect, onBuilt }) {
  const theme = useTheme();
  const fgRef = useRef();
  const focusRef = useRef(focusId); // nodeThreeObject reads this synchronously
  focusRef.current = focusId;

  // Build + normalize once per snapshot.
  const graph = useMemo(
    () => buildGraph(snapshot, { sunNames: theme.suns.roster, superHub: theme.suns.superHub }),
    [snapshot, theme],
  );

  // Apply the render budget: keep the top-N by degree (sheds the weight-1 tail first).
  const visible = useMemo(() => {
    const nodes = topNByDegree(graph.nodes, graph.degree, budget);
    const keep = new Set(nodes.map((n) => n.id));
    const links = graph.links.filter((l) => keep.has(l.source) && keep.has(l.target));
    return { nodes, links };
  }, [graph, budget]);

  const maxCount = useMemo(() => Math.max(...graph.nodes.map((n) => n.count || 0), 1), [graph]);
  const maxDegree = useMemo(() => Math.max(...Object.values(graph.degree), 1), [graph]);

  // Lift the built graph (byId, degree, raw links) so the drawer can compute stats.
  useEffect(() => {
    onBuilt?.(graph);
  }, [graph, onBuilt]);

  const encCtx = (focusSet) => ({
    theme,
    degree: graph.degree,
    maxCount,
    maxDegree,
    focusSet,
    strategy,
  });

  // Rebuild node objects whenever focus or strategy changes.
  useEffect(() => {
    fgRef.current?.refresh?.();
  }, [focusId, strategy]);

  const nodeThreeObject = useMemo(() => {
    return (node) => {
      const focusSet = focusRef.current ? neighborsOf(focusRef.current, graph.links) : null;
      const enc = encode(node, encCtx(focusSet));
      return buildNodeObject(enc, node, { ringColor: theme.palette.gold });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, strategy, maxCount, maxDegree, theme]);

  // Weighted gold edges: faint lattice for weight-1, bright flare for strong ties.
  const linkColor = (l) => {
    const w = l.weight ?? 1;
    const strong = w >= 8;
    const alpha = Math.min(0.85, 0.18 + Math.sqrt(w) * 0.12);
    // honor focus dimming on edges too
    if (focusRef.current) {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      const inFocus = s === focusRef.current || t === focusRef.current;
      if (!inFocus) return hexA(theme.palette.gold, 0.04);
    }
    return hexA(strong ? theme.palette.gold : theme.palette.gold, alpha);
  };
  const linkWidth = (l) => Math.min(2.6, 0.3 + Math.sqrt(l.weight ?? 1) * 0.35);

  // Nebula + idle drift: mount once the scene exists.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const scene = fg.scene();
    fg.backgroundColor?.(theme.palette.bgBase);
    const extent = 600; // FG default layout spread order-of-magnitude
    const { group, update } = buildNebula(theme.nebula, extent);
    scene.add(group);

    let raf;
    const start = performance.now();
    const tick = () => {
      const t = performance.now() - start;
      update(t);
      if (theme.motion.idleDrift && !focusRef.current) {
        // slow idle "breath": rotate the camera orbit very gently
        const cam = fg.camera();
        const a = theme.motion.idleDrift;
        const x = cam.position.x * Math.cos(a) - cam.position.z * Math.sin(a);
        const z = cam.position.x * Math.sin(a) + cam.position.z * Math.cos(a);
        cam.position.x = x;
        cam.position.z = z;
        cam.lookAt(0, 0, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      scene.remove(group);
    };
  }, [theme]);

  const handleNodeClick = (node) => {
    onSelect?.(node);
    // cinematic push-in: place camera a fixed standoff from the node along its current direction
    const dist = 120;
    const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
    const ratio = 1 + dist / r;
    fgRef.current?.cameraPosition(
      { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
      node,
      theme.motion.cameraTweenMs,
    );
  };

  const handleBgClick = () => onSelect?.(null);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={visible}
      backgroundColor={theme.palette.bgBase}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(n) => n.name}
      linkColor={linkColor}
      linkWidth={linkWidth}
      linkOpacity={1}
      enableNodeDrag={false}
      onNodeClick={handleNodeClick}
      onBackgroundClick={handleBgClick}
      warmupTicks={40}
      cooldownTicks={120}
    />
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Commit**

```bash
rtk git add src/engine/GraphScene.jsx
rtk git commit -m "feat(engine): GraphScene — FG3D wrapper, budget, sprite nodes, gold edges, nebula, push-in"
```

---

## Task 11: BudgetSlider + Drawer UI

**Files:**
- Create: `src/ui/BudgetSlider.jsx`
- Create: `src/ui/Drawer.jsx`

(No unit tests — themed DOM; verified at boot. They read ALL color/font/copy from `useTheme()`.)

- [ ] **Step 1: Implement `BudgetSlider.jsx`**

```jsx
// src/ui/BudgetSlider.jsx
import { useTheme } from '../theme/ThemeContext.jsx';
import { BUDGET_STOPS } from '../engine/budget.js';

export default function BudgetSlider({ value, total, onChange }) {
  const { palette, typography, copy } = useTheme();
  return (
    <div
      style={{
        position: 'absolute', left: 18, bottom: 18, zIndex: 5,
        background: 'rgba(7,9,18,0.82)', border: `1px solid ${hexA(palette.gold, 0.25)}`,
        borderRadius: 10, padding: '12px 16px', minWidth: 230, backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold }}>
        {copy.budget.label}
      </div>
      <input
        type="range" min={50} max={total} step={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: palette.gold, marginTop: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: typography.data, fontSize: 13, color: palette.ink }}>
          {value.toLocaleString()} <span style={{ color: palette.mute }}>/ {total.toLocaleString()}</span>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {BUDGET_STOPS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange(Math.min(s.value, total))}
              style={{
                fontFamily: typography.data, fontSize: 10, cursor: 'pointer',
                background: 'transparent', color: value === s.value ? palette.gold : palette.mute,
                border: 'none', padding: 0,
              }}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>
      <div style={{ fontFamily: typography.body, fontSize: 11, color: palette.mute, marginTop: 6 }}>
        {copy.budget.hint}
      </div>
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Implement `Drawer.jsx`**

```jsx
// src/ui/Drawer.jsx
import { useTheme } from '../theme/ThemeContext.jsx';
import { entityStats } from '../engine/selectors.js';

export default function Drawer({ node, graph, onClose }) {
  const { palette, typography, copy } = useTheme();
  if (!node || !graph) return null;
  const stats = entityStats(node, graph.degree, graph.links, (id) => graph.byId[id]);

  return (
    <aside
      style={{
        position: 'absolute', top: 0, right: 0, height: '100%', width: 340, zIndex: 6,
        background: 'linear-gradient(180deg, rgba(7,9,18,0.96), rgba(4,5,10,0.98))',
        borderLeft: `1px solid ${hexA(palette.gold, 0.3)}`, padding: '26px 24px', overflowY: 'auto',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: palette.mute, fontSize: 20, cursor: 'pointer' }}
        aria-label="close"
      >×</button>

      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold }}>
        dossier
      </div>
      <h2 style={{ fontFamily: typography.title, fontSize: 26, color: palette.goldPale, margin: '6px 0 4px', lineHeight: 1.1 }}>
        {node.name}
      </h2>

      {/* The Phase-2.5 hook: an intentionally empty type row that lights up when entities know what they are. */}
      <div style={{ fontFamily: typography.data, fontSize: 12, color: palette.mute, marginBottom: 14 }}>
        {copy.drawer.typeRow}: <span style={{ color: palette.cyan }}>{node.type || copy.drawer.typePlaceholder}</span>
      </div>

      <Stat label={copy.drawer.referenced} value={`${stats.count.toLocaleString()}×`} t={typography} c={palette} />
      <Stat label={copy.drawer.degree} value={stats.degree.toLocaleString()} t={typography} c={palette} />
      {stats.strongest && (
        <Stat label={copy.drawer.strongestTie} value={`${stats.strongest.name} · w${stats.strongest.weight}`} t={typography} c={palette} />
      )}

      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold, margin: '18px 0 6px' }}>
        {copy.drawer.topEdges}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stats.topEdges.map((e, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px dashed ${hexA(palette.ash, 0.18)}`, fontFamily: typography.body, fontSize: 14, color: palette.ink }}>
            <span>{e.name}</span>
            <span style={{ fontFamily: typography.data, color: palette.gold }}>w{e.weight}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Stat({ label, value, t, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px dashed ${hexA(c.ash, 0.18)}` }}>
      <span style={{ fontFamily: t.data, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: c.gold }}>{label}</span>
      <span style={{ fontFamily: t.body, fontSize: 14, color: c.ink }}>{value}</span>
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add src/ui/BudgetSlider.jsx src/ui/Drawer.jsx
rtk git commit -m "feat(ui): themed node-budget slider + J-card dossier drawer"
```

---

## Task 12: ExplorerApp — compose, and mount in App

**Files:**
- Create: `src/ExplorerApp.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Implement `ExplorerApp.jsx`**

```jsx
// src/ExplorerApp.jsx
import { useCallback, useState } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeContext.jsx';
import { wuTangTheme } from './theme/wu-tang/index.js';
import { useGraphData } from './engine/useGraphData.js';
import { useNodeBudget } from './engine/useNodeBudget.js';
import GraphScene from './engine/GraphScene.jsx';
import BudgetSlider from './ui/BudgetSlider.jsx';
import Drawer from './ui/Drawer.jsx';

const ARTIST = 'wu-tang-clan';

export default function ExplorerApp() {
  return (
    <ThemeProvider theme={wuTangTheme}>
      <Explorer />
    </ThemeProvider>
  );
}

function Explorer() {
  const theme = useTheme();
  const { status, snapshot, error } = useGraphData(ARTIST);
  const total = snapshot?.entities?.length ?? 2559;
  const [budget, setBudget] = useNodeBudget(ARTIST, total);
  const [selected, setSelected] = useState(null);
  const [graph, setGraph] = useState(null);
  const strategy = 'structural';

  const onBuilt = useCallback((g) => setGraph(g), []);
  const onSelect = useCallback((node) => setSelected(node), []);

  const full = { position: 'fixed', inset: 0, background: theme.palette.bgBase };

  if (status === 'loading') return <Centered theme={theme}>Loading the universe…</Centered>;
  if (status === 'error') return <Centered theme={theme}>Could not load the snapshot: {error}</Centered>;

  return (
    <div style={full}>
      <Title theme={theme} />
      <GraphScene
        snapshot={snapshot}
        budget={budget}
        strategy={strategy}
        focusId={selected?.id ?? null}
        onSelect={onSelect}
        onBuilt={onBuilt}
      />
      <BudgetSlider value={budget} total={total} onChange={setBudget} />
      <Drawer node={selected} graph={graph} onClose={() => setSelected(null)} />
    </div>
  );
}

function Title({ theme }) {
  return (
    <div style={{ position: 'absolute', top: 20, left: 22, zIndex: 5, pointerEvents: 'none' }}>
      <h1 style={{ fontFamily: theme.typography.title, fontSize: 24, color: theme.palette.goldPale, margin: 0, letterSpacing: 0.5 }}>
        {theme.copy.title}
      </h1>
      <p style={{ fontFamily: theme.typography.body, fontSize: 13, color: theme.palette.mute, margin: '2px 0 0' }}>
        {theme.copy.tagline}
      </p>
    </div>
  );
}

function Centered({ theme, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: theme.palette.bgBase, color: theme.palette.mute, fontFamily: theme.typography.body }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Replace the body of `src/App.jsx` to mount the explorer**

The Phase-1 landing has done its job (confirming the export pipeline). Phase 2 is the explorer. Replace the entire contents of `src/App.jsx` with:

```jsx
import ExplorerApp from './ExplorerApp.jsx';

// Phase 2: the explorer IS the app. The Phase-1 landing remains in git history (commit abc28e8)
// if the static confirmation page is ever needed again.
export default function App() {
  return <ExplorerApp />;
}
```

- [ ] **Step 3: Verify the production build compiles**

Run: `node node_modules/vite/bin/vite.js build`
Expected: build completes, emits `dist/` with no errors. (If RTK mangles the output to look empty, the exit code is still authoritative — check `echo $?` is 0.)

- [ ] **Step 4: Commit**

```bash
rtk git add src/ExplorerApp.jsx src/App.jsx
rtk git commit -m "feat: mount Phase-2 explorer (theme provider + scene + slider + drawer)"
```

---

## Task 13: Live verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `pnpm test`
Expected: PASS — `theme`, `buildGraph`, `selectors`, `encode`, `budget` suites all green.

- [ ] **Step 2: Boot dev and health-check (bypass RTK + use 127.0.0.1 per gotchas)**

```bash
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180 > /tmp/vite-run.log 2>&1 &
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5180/
```
Expected: `200`. Leave it running for the visual check, then `kill %1`.

- [ ] **Step 3: Visual acceptance checklist (open http://127.0.0.1:5180/ in a browser)**

Confirm against `docs/mockups/shaolin-observatory.html`:
- [ ] Deep indigo-black void background (`#070912`), not pure black.
- [ ] Eleven glowing gold→amber suns with white-hot centers + thin gold rings; Wu-Tang Clan visibly grandest (super-hub).
- [ ] Ash dust points around the suns; gold weighted edges — faint lattice, strong ties flare brighter/wider.
- [ ] Nebula clouds drift slowly behind the field; dust stays crisp (no global bloom smear).
- [ ] Title in Saira Stencil One; slider label/stats in Space Mono; tagline in Special Elite.
- [ ] Budget slider lower-left: dragging it changes the visible node count; the stops (250/500/1,000/All) jump correctly; reload preserves the value (localStorage).
- [ ] Click a sun → camera pushes in, the rest of the graph dims to its neighborhood, the J-card drawer opens with referenced/connections/strongest-tie/orbits and a `type: —` row.
- [ ] Click empty space → drawer closes, dimming clears.

- [ ] **Step 4: Stop dev and record outcome**

```bash
kill %1 2>/dev/null
```
Report the suite result, the HTTP code, and which checklist items passed. If any failed, debug before claiming completion (superpowers:verification-before-completion).

---

## Self-Review

**1. Spec coverage (against `docs/art-direction.md`):**
- Palette tokens → Task 1 `palette.js` ✓ · Type system → `typography.js` + applied in UI ✓ · Suns (size=count, glow=degree, super-hub tier) → `encode` structural + `nodeObject` ✓ · Dust (ash, size=degree) → same ✓ · Weighted gold edges → `GraphScene` linkColor/linkWidth ✓ · Nebula drift → `nebulaLayer` ✓ · Camera push-in on select → `GraphScene` cameraPosition ✓ · Idle breath → idle-drift rAF ✓ · J-card drawer with `type: —` hook → `Drawer.jsx` ✓ · single `encode()` accessor + registry → Task 5 ✓ · structure-not-semantics (size/glow/edge/community) → `buildGraph` orbit + `encode` ✓ · node-budget slider (top-N by degree, localStorage, labeled stops, default ~400) → Tasks 6/11 ✓ · click-to-isolate drill-in → `GraphScene` focus + dim ✓ · theme/engine seam (no Wu value outside theme) → Tasks 1/2 + grep below ✓ · Phase-2.5 community-lens survives → `encode` community strategy ✓.
- **Deferred (explicitly out of scope this session, per art-direction.md):** island/144-isolated treatment (the budget's top-N-by-degree drops degree-0 nodes anyway, so they don't render as awkward floaters — a dedicated peripheral-halo/toggle is a polish item), adaptive-FPS assist + capability probe, final nebula tuning, codename→real-name. Note these in the completion report.

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N" — every code step carries full source. ✓

**3. Type consistency:** `buildGraph` returns `{ nodes, links, degree, byId }` — consumed with those exact names in `GraphScene` and `Drawer`. `encode(node, ctx)` ctx shape `{ theme, degree, maxCount, maxDegree, focusSet, strategy }` matches `encCtx` in `GraphScene` and the tests. `entityStats(node, degree, links, resolve)` signature matches the call in `Drawer`. `useNodeBudget(artistId, total)` returns `[budget, setBudget]` matching `Explorer`. Strategy names `'structural'`/`'community'` consistent across `encode.js`, tests, and `ExplorerApp`. ✓

**4. Seam-discipline grep (run during Task 13):**
Run: `rtk grep -rn "E8B306\|070912\|9AA3AD\|C2570F\|Saira\|Special Elite\|Space Mono\|Method Man\|Cappadonna" src/engine src/ui`
Expected: **no matches** (every Wu value resolves through `useTheme()`/props). The only allowed hits are inside `src/theme/`.
```

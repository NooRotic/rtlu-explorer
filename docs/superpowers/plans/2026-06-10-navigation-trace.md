# RTLU Explorer — Phase 2.1 "Navigation & Trace" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Wu universe navigable and legible to a first-time visitor — a Wu-member dock + universal search, white-hot connection tracing on hover/select, bigger catchable dust, and a toggleable peripheral-halo home for the 144 islands.

**Architecture:** Builds on the merged Phase 2 explorer. Keeps the theme/engine seam: new Wu values (silver tokens, the Wu mark asset, copy) go in `src/theme/wu-tang/`; new pure logic (`search.js`, `encode` highlight states) is artist-agnostic and Vitest-tested; new UI (`WuDock`, `SearchBox`, `StarsPanel`) reads everything via `useTheme()`/props. The single `encode()` accessor is *extended* (not bypassed) with `hoverSet`/`focusSet` highlight states. The render layer is verified by build + headless-Chrome boot.

**Tech Stack:** Vite 6 · React 18 · `react-force-graph-3d` 1.24 · `three` 0.169 · Vitest. Spec: `docs/superpowers/specs/2026-06-10-navigation-trace-design.md`.

**Hard guardrail (unchanged):** reads only the four static JSON files; no verse text. **IP:** the Wu "W" is a trademark used as a noncommercial tribute — this plan adds the required "unofficial / not affiliated" disclaimer.

---

## File Structure

```
src/theme/wu-tang/
  palette.js          MODIFY  + silver, silverEdge, coinInk, subtle tokens
  copy.js             MODIFY  + dock/search/stars/disclaimer strings
  assets/wu-mark.svg  CREATE  gold Wu "W" (user-provided; placeholder until then)
  assets.js           CREATE  imports + exports the asset URL(s)
  index.js            MODIFY  + assets on the theme object
src/engine/
  search.js           CREATE  pure searchEntities(query, nodes, limit)
  encode.js           MODIFY  + hoverSet/focusSet white-hot+enlarge; bigger dust
  islandHalo.js       CREATE  buildIslandHalo(islands, extent, theme) -> THREE group
  GraphScene.jsx      MODIFY  hover wiring, white trace, visible-set union,
                              focus-driven fly-to, island halo + toggle
src/ui/
  SearchBox.jsx       CREATE  input + results dropdown
  WuCoin.jsx          CREATE  presentational member coin
  WuDock.jsx          CREATE  silver dock: coins + magnify + breathe-open search
  StarsPanel.jsx      CREATE  right slide-out top-N list + trigger title
  BudgetSlider.jsx    MODIFY  accept a position prop (top-left placement)
src/ExplorerApp.jsx   MODIFY  control cluster, selection flow, swap, subtitle, footer
test/
  search.test.js      CREATE
  encode.test.js      MODIFY  + highlight-state tests
README.md             MODIFY  + tribute disclaimer
```

**Seam rule (enforced by Task 11 grep):** no Wu hex/font/roster/mark literal in `src/engine/` or `src/ui/` — all via `useTheme()`/props.

---

## Task 1: Theme additions — silver tokens, copy, Wu mark asset

**Files:**
- Modify: `src/theme/wu-tang/palette.js`
- Modify: `src/theme/wu-tang/copy.js`
- Create: `src/theme/wu-tang/assets/wu-mark.svg`
- Create: `src/theme/wu-tang/assets.js`
- Modify: `src/theme/wu-tang/index.js`
- Test: `test/theme.test.js` (extend)

- [ ] **Step 1: Extend the theme contract test**

Add these cases inside `test/theme.test.js` (keep existing ones):

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run test/theme.test.js`
Expected: FAIL — `palette.silver` undefined / `assets` undefined.

- [ ] **Step 3: Add palette tokens**

In `src/theme/wu-tang/palette.js`, add these keys to the `palette` object (after `mute`):

```js
  subtle: '#C7CDD4',     // brighter than mute — subtitle/secondary text with real contrast
  silver: '#C8CDD2',     // brushed-metal dock face
  silverEdge: '#5A6470', // dock border / bevel
  coinInk: '#0A0C12',    // coin background (near-black, sits on silver)
```

- [ ] **Step 4: Add copy strings**

In `src/theme/wu-tang/copy.js`, add these keys to the `copy` object (after `budget`):

```js
  islands: { label: 'islands', hint: 'unlinked entities (halo)' },
  dock: 'members',
  search: { placeholder: 'search the universe…', empty: 'no match' },
  stars: { title: 'WU-STARS', hint: 'most-connected' },
  disclaimer: 'Unofficial fan tribute — not affiliated with or endorsed by Wu-Tang Clan.',
```

- [ ] **Step 5: Create the Wu mark asset (placeholder until the real SVG is dropped in)**

Create `src/theme/wu-tang/assets/wu-mark.svg`. **If the user has provided the exact gold Wu "W" SVG, save that here verbatim instead.** Otherwise use this stylized-W placeholder so the build is unblocked:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" fill="#E8B306">
  <path d="M6 6 L20 74 L34 30 L50 74 L66 30 L80 74 L94 6 L80 6 L72 50 L58 8 L50 8 L42 8 L28 50 L20 6 Z"/>
</svg>
```

- [ ] **Step 6: Create the assets module**

`src/theme/wu-tang/assets.js`:

```js
// Vite resolves an imported .svg to its served URL string at build time.
import wuMark from './assets/wu-mark.svg';

export const assets = { wuMark };
```

- [ ] **Step 7: Wire assets into the theme**

In `src/theme/wu-tang/index.js`, import and include `assets`:

```js
import { palette } from './palette.js';
import { typography } from './typography.js';
import { motion } from './motion.js';
import { copy } from './copy.js';
import { nebula } from './nebula.js';
import { suns } from './suns.js';
import { assets } from './assets.js';

// The full Wu-Tang theme object the ThemeProvider injects. The engine consumes ONLY this shape.
export const wuTangTheme = { id: 'wu-tang', palette, typography, motion, copy, nebula, suns, assets };
```

- [ ] **Step 8: Run to verify it passes**

Run: `pnpm exec vitest run test/theme.test.js`
Expected: PASS (note: the `.svg` import resolves under Vitest because Vite handles it; if Vitest errors on the svg import, that means `assets.js` is imported by the test via `index.js` — it is, and Vite's transform covers `.svg` → URL string. Confirm green.)

- [ ] **Step 9: Commit**

```bash
git add src/theme/wu-tang test/theme.test.js
git commit -m "feat(theme): silver dock tokens, nav copy, Wu mark asset + tribute disclaimer"
```

---

## Task 2: search.js — pure universal entity search

**Files:**
- Create: `src/engine/search.js`
- Test: `test/search.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run test/search.test.js`
Expected: FAIL — cannot resolve `search.js`.

- [ ] **Step 3: Implement `search.js`**

```js
// src/engine/search.js
// Pure, artist-agnostic name search over the full entity set. Ranks prefix matches above
// substring matches; ties broken by degree (most-connected first), then name. No theme import.

/**
 * @param {string} query
 * @param {Array<{id,name}>} nodes
 * @param {Record<string, number>} degree
 * @param {number} limit
 * @returns {Array<{id, name, degree}>}
 */
export function searchEntities(query, nodes, degree, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  for (const n of nodes) {
    const name = n.name.toLowerCase();
    const idx = name.indexOf(q);
    if (idx === -1) continue;
    hits.push({ id: n.id, name: n.name, degree: degree[n.id] ?? 0, rank: idx === 0 ? 0 : 1 });
  }
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      b.degree - a.degree ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  return hits.slice(0, limit).map(({ id, name, degree }) => ({ id, name, degree }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run test/search.test.js`
Expected: PASS — 5/5.

- [ ] **Step 5: Commit**

```bash
git add src/engine/search.js test/search.test.js
git commit -m "feat(engine): pure universal entity search (prefix>substring, degree tie-break)"
```

---

## Task 3: encode.js — hover/focus white-hot+enlarge highlight states + bigger dust

**Files:**
- Modify: `src/engine/encode.js`
- Test: `test/encode.test.js` (extend)

Highlight rule (applied in the `encode()` wrapper, after the strategy runs, so it works for any lens):
- A node in `hoverSet` or `focusSet` is **highlighted**: dust → white-hot + enlarged; suns stay gold but full-opacity (no white-blob from a 200-neighbor hub).
- If `focusSet` is active and the node is *not* in it → dimmed (existing behavior).
- Dust baseline sizes raised so the web reads and dust is catchable.

- [ ] **Step 1: Add the failing highlight tests**

Add inside `test/encode.test.js` (keep existing tests; reuse the existing `CTX` helper):

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run test/encode.test.js`
Expected: FAIL — highlighted dust still ash / not enlarged.

- [ ] **Step 3: Modify `encode.js`**

Replace the constants block and the `encode()` wrapper. Change `DUST_MIN`/`DUST_MAX` and add `ENLARGE`; rewrite `encode()` to apply highlight before dim:

Constants (replace the existing five-const block near the top):

```js
const SUN_MIN = 6;   // scene-space radius floor for suns
const SUN_MAX = 22;  // super-hub ceiling
const DUST_MIN = 1.4; // raised (was 0.6) so the web reads + dust is catchable
const DUST_MAX = 5.0; // raised (was 3.2)
const DIM_OPACITY = 0.12;
const ENLARGE = 1.9;  // how much connected/hovered dust grows when highlighted
```

`encode()` wrapper (replace the existing one):

```js
/** Public accessor used by every renderer. */
export function encode(node, ctx) {
  const fn = strategies.get(ctx.strategy) ?? strategies.get('structural');
  const base = fn(node, ctx);
  const highlighted =
    (ctx.hoverSet && ctx.hoverSet.has(node.id)) ||
    (ctx.focusSet && ctx.focusSet.has(node.id));
  if (highlighted) {
    // Dust goes white-hot + enlarges (trace the connection); suns keep gold (avoid white blob).
    const isDust = node.tier === 'dust';
    return {
      ...base,
      color: isDust ? ctx.theme.palette.whiteHot : base.color,
      size: isDust ? base.size * ENLARGE : base.size,
      glow: Math.max(base.glow ?? 0, isDust ? 0.6 : base.glow ?? 0),
      opacity: 1,
    };
  }
  // Focus dimming (only when a selection is active and this node isn't part of it).
  if (ctx.focusSet && !ctx.focusSet.has(node.id)) {
    return { ...base, opacity: DIM_OPACITY };
  }
  return base;
}
```

(The `structural` and `community` strategies and `hashHue` are unchanged.)

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run test/encode.test.js`
Expected: PASS — original tests + 4 new highlight tests all green.

- [ ] **Step 5: Commit**

```bash
git add src/engine/encode.js test/encode.test.js
git commit -m "feat(engine): encode hover/focus white-hot+enlarge highlight; bigger dust"
```

---

## Task 4: islandHalo.js — peripheral-halo field for unlinked entities

**Files:**
- Create: `src/engine/islandHalo.js`

(No unit test — three.js; verified at boot. Deterministic placement so layout is stable across renders.)

- [ ] **Step 1: Implement `islandHalo.js`**

```js
// src/engine/islandHalo.js
import * as THREE from 'three';

const HALO_INTENSITY = 0.22; // fixed ash opacity — islands are quiet edge-of-universe texture
const POINT_SIZE = 2.4;

// Deterministic point on a sphere shell from an integer index (Fibonacci sphere — even, stable).
function shellPoint(i, n, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / Math.max(1, n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius];
}

/**
 * Build a faint ash halo of the unlinked entities on an outer sphere shell.
 * @param {Array<{id,name}>} islands  degree-0 nodes
 * @param {number} extent  graph spatial scale (radius multiplier)
 * @param {{palette:{ash:string}}} theme
 * @returns {THREE.Points} a points cloud (non-interactive; toggle via .visible)
 */
export function buildIslandHalo(islands, extent, theme) {
  const radius = extent * 1.35; // sits outside the active web
  const positions = new Float32Array(islands.length * 3);
  islands.forEach((_, i) => {
    const [x, y, z] = shellPoint(i, islands.length, radius);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  });
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(theme.palette.ash),
    size: POINT_SIZE,
    transparent: true,
    opacity: HALO_INTENSITY,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geom, mat);
  points.name = 'island-halo';
  return points;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/islandHalo.js
git commit -m "feat(engine): peripheral island-halo field (Fibonacci shell, fixed faint ash)"
```

---

## Task 5: GraphScene — hover trace, white edges, visible-set union, focus fly-to, island halo + toggle

**Files:**
- Modify: `src/engine/GraphScene.jsx`

(No unit test — verified at boot. This is the integration task; take it carefully.)

The current `GraphScene` signature is
`GraphScene({ snapshot, budget, strategy, focusId, onSelect, onBuilt })`.
Add a `showIslands` prop and the following behavior. Below are the exact edits.

- [ ] **Step 1: Add `showIslands` to the props and a hover ref**

Change the function signature line and add a hover ref next to the existing `focusRef`:

```jsx
export default function GraphScene({ snapshot, budget, strategy, focusId, showIslands, onSelect, onBuilt }) {
```

After the existing `const tweenUntilRef = useRef(0);` line, add:

```jsx
  const hoverRef = useRef(null); // hovered node id — read synchronously by encoder + linkColor
```

- [ ] **Step 2: Union the selected node + neighbors into the visible set**

Replace the existing `visible` useMemo with this (adds selected + its neighbors only when the selection is outside the budget, to avoid re-heating the sim on in-budget clicks):

```jsx
  // Apply the render budget: keep the top-N by degree. Additionally guarantee the selected node
  // and its neighbors render (so search/stars can target nodes below the budget and the camera can
  // fly to them). Fresh link copies: FG mutates source/target in place after the first tick.
  const visible = useMemo(() => {
    const top = topNByDegree(graph.nodes, graph.degree, budget);
    const keep = new Set(top.map((n) => n.id));
    if (focusId && !keep.has(focusId)) {
      neighborsOf(focusId, graph.links).forEach((id) => keep.add(id));
    }
    const nodes = graph.nodes.filter((n) => keep.has(n.id));
    const links = graph.links
      .filter((l) => keep.has(l.source) && keep.has(l.target))
      .map((l) => ({ ...l }));
    return { nodes, links };
  }, [graph, budget, focusId]);
```

- [ ] **Step 3: Pass hover/focus sets into the encoder**

Replace the `encCtx` function so it carries both sets:

```jsx
  const encCtx = (hoverSet, focusSet) => ({
    theme,
    degree: graph.degree,
    maxCount,
    maxDegree,
    hoverSet,
    focusSet,
    strategy,
  });
```

And replace the `nodeThreeObject` memo body to compute both sets from the refs:

```jsx
  const nodeThreeObject = useMemo(() => {
    return (node) => {
      const focusSet = focusRef.current ? neighborsOf(focusRef.current, graph.links) : null;
      const hoverSet = hoverRef.current ? neighborsOf(hoverRef.current, graph.links) : null;
      const enc = encode(node, encCtx(hoverSet, focusSet));
      return buildNodeObject(enc, node, { ringColor: theme.palette.gold });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, strategy, maxCount, maxDegree, theme]);
```

- [ ] **Step 4: White-hot edges for hover/focus neighborhoods**

Replace `linkColor` with this (a link is white-hot when both endpoints are in the active highlight set — hover takes precedence; focus still dims non-members):

```jsx
  const ends = (l) => [
    typeof l.source === 'object' ? l.source.id : l.source,
    typeof l.target === 'object' ? l.target.id : l.target,
  ];
  const linkColor = (l) => {
    const w = l.weight ?? 1;
    const alpha = Math.min(0.85, 0.18 + Math.sqrt(w) * 0.12);
    const [s, t] = ends(l);
    const hoverSet = hoverRef.current ? neighborsOf(hoverRef.current, graph.links) : null;
    const focusSet = focusRef.current ? neighborsOf(focusRef.current, graph.links) : null;
    const hot =
      (hoverSet && hoverSet.has(s) && hoverSet.has(t)) ||
      (focusSet && focusSet.has(s) && focusSet.has(t));
    if (hot) return hexA(theme.palette.whiteHot, 0.95);
    if (focusRef.current) return hexA(theme.palette.gold, 0.04); // selected isolate dims the rest
    return hexA(theme.palette.gold, alpha); // hover (no selection) leaves the rest as gold
  };
```

- [ ] **Step 5: Hover handler + refresh**

Add a hover handler near `handleNodeClick`:

```jsx
  const handleNodeHover = (node) => {
    hoverRef.current = node?.id ?? null;
    document.body.style.cursor = node ? 'pointer' : 'default';
    fgRef.current?.refresh?.();
  };
```

- [ ] **Step 6: Fly the camera whenever focus changes from ANY source**

The existing push-in lives inside `handleNodeClick`. Extract it into a `flyTo(node)` helper and ALSO call it from a `focusId` effect (so dock/search/stars selections fly too). Replace `handleNodeClick` and add the helper + effect:

```jsx
  const flyTo = (node) => {
    if (!node) return;
    const dist = 120;
    const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0) || 1;
    const ratio = 1 + dist / r;
    tweenUntilRef.current = performance.now() + theme.motion.cameraTweenMs;
    fgRef.current?.cameraPosition(
      { x: (node.x || 0) * ratio, y: (node.y || 0) * ratio, z: (node.z || 0) * ratio },
      node,
      theme.motion.cameraTweenMs,
    );
  };

  const handleNodeClick = (node) => onSelect?.(node);
  const handleBgClick = () => onSelect?.(null);

  // Fly to the selected node from any trigger (canvas/dock/search/stars). One rAF defer lets a
  // freshly-unioned node receive simulation coords before we read node.x/y/z.
  useEffect(() => {
    if (!focusId) return;
    const id = requestAnimationFrame(() => {
      const node = (fgRef.current?.graphData?.()?.nodes || visible.nodes).find((n) => n.id === focusId);
      flyTo(node);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, visible]);
```

- [ ] **Step 7: Mount the island halo and toggle it**

Add a dedicated effect after the nebula effect (it reuses the same `extent = 600`). The halo group is added once per graph and shown/hidden by `showIslands`:

```jsx
  // Island halo: faint peripheral field of the 144 degree-0 entities, toggleable, budget-independent.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const scene = fg.scene();
    const islands = graph.nodes.filter((n) => (graph.degree[n.id] ?? 0) === 0);
    const halo = buildIslandHalo(islands, 600, theme);
    scene.add(halo);
    return () => {
      scene.remove(halo);
      halo.geometry.dispose();
      halo.material.dispose();
    };
  }, [graph, theme]);

  // Toggle visibility without rebuilding.
  useEffect(() => {
    const halo = fgRef.current?.scene?.().getObjectByName('island-halo');
    if (halo) halo.visible = !!showIslands;
  }, [showIslands, graph]);
```

- [ ] **Step 8: Add the imports and wire the new handlers/props on `<ForceGraph3D>`**

At the top, add to the existing imports:

```jsx
import { buildIslandHalo } from './islandHalo.js';
```

On the `<ForceGraph3D …>` element, add `onNodeHover={handleNodeHover}` (keep all existing props):

```jsx
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      onBackgroundClick={handleBgClick}
```

- [ ] **Step 9: Verify the build compiles**

Run: `node node_modules/vite/bin/vite.js build`
Expected: exit 0.

- [ ] **Step 10: Commit**

```bash
git add src/engine/GraphScene.jsx
git commit -m "feat(engine): hover white-trace, selected-set union + fly-to, island halo toggle"
```

---

## Task 6: SearchBox UI

**Files:**
- Create: `src/ui/SearchBox.jsx`

(No unit test — themed DOM; the ranking it uses is tested in Task 2.)

- [ ] **Step 1: Implement `SearchBox.jsx`**

```jsx
// src/ui/SearchBox.jsx
import { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { searchEntities } from '../engine/search.js';

export default function SearchBox({ graph, onPick }) {
  const { palette, typography, copy } = useTheme();
  const [q, setQ] = useState('');
  const results = useMemo(
    () => (graph ? searchEntities(q, graph.nodes, graph.degree, 8) : []),
    [q, graph],
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={copy.search.placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7,
          background: 'rgba(7,9,18,0.9)', border: `1px solid ${hexA(palette.gold, 0.3)}`,
          color: palette.ink, fontFamily: typography.body, fontSize: 13, outline: 'none',
        }}
      />
      {q.trim() && (
        <ul style={{
          listStyle: 'none', margin: '6px 0 0', padding: 4, position: 'absolute', bottom: '100%',
          left: 0, right: 0, marginBottom: 6, maxHeight: 260, overflowY: 'auto',
          background: 'rgba(7,9,18,0.97)', border: `1px solid ${hexA(palette.gold, 0.25)}`, borderRadius: 8,
        }}>
          {results.length === 0 && (
            <li style={{ padding: '8px 10px', color: palette.mute, fontFamily: typography.body, fontSize: 12 }}>
              {copy.search.empty}
            </li>
          )}
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => { onPick?.(r.id); setQ(''); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '7px 8px',
                  color: palette.ink, fontFamily: typography.body, fontSize: 13, textAlign: 'left',
                }}
              >
                <span>{r.name}</span>
                <span style={{ fontFamily: typography.data, color: palette.gold, fontSize: 11 }}>deg {r.degree}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/SearchBox.jsx
git commit -m "feat(ui): universal search box (results dropdown over all entities)"
```

---

## Task 7: WuCoin + WuDock

**Files:**
- Create: `src/ui/WuCoin.jsx`
- Create: `src/ui/WuDock.jsx`

(No unit test — themed DOM; verified at boot.)

- [ ] **Step 1: Implement `WuCoin.jsx`**

```jsx
// src/ui/WuCoin.jsx
import { useTheme } from '../theme/ThemeContext.jsx';

// Presentational member coin: black circle, gold Wu mark, name centered underneath.
export default function WuCoin({ node, scale = 1, onClick, onHover }) {
  const { palette, typography, assets } = useTheme();
  const size = 46;
  return (
    <button
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onHover?.(node)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        transform: `scale(${scale})`, transformOrigin: 'bottom center',
        transition: 'transform 140ms ease-out', width: size + 18,
      }}
      title={node.name}
    >
      <span style={{
        width: size, height: size, borderRadius: '50%', background: palette.coinInk,
        border: `1px solid ${hexA(palette.gold, 0.5)}`, display: 'grid', placeItems: 'center',
        boxShadow: `0 2px 6px rgba(0,0,0,0.5)`,
      }}>
        <img src={assets.wuMark} alt="" style={{ width: size * 0.62, height: size * 0.62 }} draggable={false} />
      </span>
      <span style={{
        fontFamily: typography.title, fontSize: 9, color: palette.goldPale, letterSpacing: 0.3,
        whiteSpace: 'nowrap', maxWidth: size + 16, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {node.name}
      </span>
    </button>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Implement `WuDock.jsx`**

```jsx
// src/ui/WuDock.jsx
import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import WuCoin from './WuCoin.jsx';
import SearchBox from './SearchBox.jsx';

// Silver floating dock: the 11 member coins with macOS-style magnify, and a search field that
// "breathes open" beneath the coins on hover. Members come from the byId map keyed by the roster.
export default function WuDock({ graph, roster, onSelect }) {
  const { palette, typography, copy } = useTheme();
  const [hovered, setHovered] = useState(null); // coin index under pointer
  const [open, setOpen] = useState(false);      // dock expanded (search visible)
  const [searchFocused, setSearchFocused] = useState(false);

  if (!graph) return null;
  const members = roster.map((name) => byName(graph, name)).filter(Boolean);

  // Dock magnification: neighbors of the hovered coin scale partially.
  const scaleFor = (i) => {
    if (hovered == null) return 1;
    const d = Math.abs(i - hovered);
    return d === 0 ? 1.5 : d === 1 ? 1.25 : d === 2 ? 1.08 : 1;
  };

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setHovered(null); if (!searchFocused) setOpen(false); }}
      style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '10px 16px 12px', borderRadius: 16,
        background: `linear-gradient(180deg, ${palette.silver}, ${hexA(palette.silverEdge, 0.9)})`,
        border: `1px solid ${palette.silverEdge}`, boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ fontFamily: typography.data, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.coinInk, opacity: 0.7 }}>
        {copy.dock}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {members.map((m, i) => (
          <div key={m.id} onMouseEnter={() => setHovered(i)}>
            <WuCoin node={m} scale={scaleFor(i)} onClick={onSelect} />
          </div>
        ))}
      </div>
      <div style={{
        width: 240, overflow: 'hidden',
        maxHeight: open ? 48 : 0, opacity: open ? 1 : 0,
        transition: 'max-height 200ms ease, opacity 200ms ease',
      }}>
        <div
          onFocus={() => setSearchFocused(true)}
          onBlur={() => { setSearchFocused(false); setOpen(false); }}
        >
          <SearchBox graph={graph} onPick={(id) => onSelect(byId(graph, id))} />
        </div>
      </div>
    </div>
  );
}

const byId = (graph, id) => graph.byId[id] ?? null;
const byName = (graph, name) => Object.values(graph.byId).find((n) => n.name === name) ?? null;

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/WuCoin.jsx src/ui/WuDock.jsx
git commit -m "feat(ui): Wu-Dock — silver member dock, magnify, breathe-open search"
```

---

## Task 8: StarsPanel (right slide-out top-N list + trigger)

**Files:**
- Create: `src/ui/StarsPanel.jsx`

(No unit test — themed DOM; uses tested `topNByDegree`.)

- [ ] **Step 1: Implement `StarsPanel.jsx`**

```jsx
// src/ui/StarsPanel.jsx
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { topNByDegree } from '../engine/selectors.js';

// Top-right trigger title + a panel that slides in from the far right with the top-N most-connected
// entities ("the stars"). Picking a row selects it (parent swaps this panel for the J-card drawer).
export default function StarsPanel({ graph, open, onToggle, onPick }) {
  const { palette, typography, copy } = useTheme();
  const stars = useMemo(
    () => (graph ? topNByDegree(graph.nodes, graph.degree, 50) : []),
    [graph],
  );

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', top: 22, right: 24, zIndex: 7, background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: typography.data, fontSize: 13, letterSpacing: 1,
          color: palette.gold, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {copy.stars.title} <span style={{ transition: 'transform 200ms', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
      </button>

      <aside style={{
        position: 'absolute', top: 0, right: 0, height: '100%', width: 300, zIndex: 6,
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 260ms ease',
        background: 'linear-gradient(180deg, rgba(7,9,18,0.96), rgba(4,5,10,0.98))',
        borderLeft: `1px solid ${hexA(palette.gold, 0.3)}`, padding: '60px 18px 18px', overflowY: 'auto',
      }}>
        <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold, marginBottom: 10 }}>
          {copy.stars.hint}
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {stars.map((n, i) => (
            <li key={n.id}>
              <button
                onClick={() => onPick?.(n)}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', gap: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '8px 6px', borderTop: `1px dashed ${hexA(palette.ash, 0.16)}`,
                  color: palette.ink, fontFamily: typography.body, fontSize: 14, textAlign: 'left',
                }}
              >
                <span><span style={{ color: palette.mute, fontFamily: typography.data, fontSize: 11 }}>{i + 1}. </span>{n.name}</span>
                <span style={{ fontFamily: typography.data, color: palette.gold, fontSize: 11 }}>deg {graph.degree[n.id]}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/StarsPanel.jsx
git commit -m "feat(ui): WU-STARS right slide-out top-N list + trigger"
```

---

## Task 9: ExplorerApp wiring — control cluster, selection flow, swap, subtitle, footer; BudgetSlider position

**Files:**
- Modify: `src/ui/BudgetSlider.jsx`
- Modify: `src/ExplorerApp.jsx`

- [ ] **Step 1: Make BudgetSlider position-configurable**

In `src/ui/BudgetSlider.jsx`, change the signature and the wrapper's positioning so it can be placed in the top-left cluster. Replace the function signature line:

```jsx
export default function BudgetSlider({ value, total, onChange, style }) {
```

And replace the outer `<div style={{ ... }}>` opening so position comes from the caller (drop the absolute `left/bottom`, keep the look):

```jsx
    <div
      style={{
        background: 'rgba(7,9,18,0.82)', border: `1px solid ${hexA(palette.gold, 0.25)}`,
        borderRadius: 10, padding: '12px 16px', minWidth: 230, backdropFilter: 'blur(6px)',
        ...style,
      }}
    >
```

- [ ] **Step 2: Add the islands toggle + persistence helper, and rewire ExplorerApp**

Replace the entire contents of `src/ExplorerApp.jsx` with:

```jsx
// src/ExplorerApp.jsx
import { useCallback, useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeContext.jsx';
import { wuTangTheme } from './theme/wu-tang/index.js';
import { useGraphData } from './engine/useGraphData.js';
import { useNodeBudget } from './engine/useNodeBudget.js';
import GraphScene from './engine/GraphScene.jsx';
import BudgetSlider from './ui/BudgetSlider.jsx';
import Drawer from './ui/Drawer.jsx';
import WuDock from './ui/WuDock.jsx';
import StarsPanel from './ui/StarsPanel.jsx';

const ARTIST = 'wu-tang-clan';
const ISLANDS_KEY = `rtlu.showIslands.${ARTIST}`;

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
  const [starsOpen, setStarsOpen] = useState(false);
  const [showIslands, setShowIslands] = useState(() => {
    try { return globalThis.localStorage?.getItem(ISLANDS_KEY) !== 'false'; } catch { return true; }
  });
  const strategy = 'structural';

  useEffect(() => {
    try { globalThis.localStorage?.setItem(ISLANDS_KEY, String(showIslands)); } catch { /* ignore */ }
  }, [showIslands]);

  const onBuilt = useCallback((g) => setGraph(g), []);
  // Selecting from anywhere closes the stars list (swap) and opens the entity.
  const select = useCallback((node) => { setSelected(node); setStarsOpen(false); }, []);
  // Opening the stars list closes any open drawer (swap).
  const toggleStars = useCallback(() => { setStarsOpen((o) => { if (!o) setSelected(null); return !o; }); }, []);

  if (status === 'loading') return <Centered theme={theme}>Loading the universe…</Centered>;
  if (status === 'error') return <Centered theme={theme}>Could not load the snapshot: {error}</Centered>;

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.palette.bgBase }}>
      <Title theme={theme} />

      <GraphScene
        snapshot={snapshot}
        budget={budget}
        strategy={strategy}
        focusId={selected?.id ?? null}
        showIslands={showIslands}
        onSelect={select}
        onBuilt={onBuilt}
      />

      {/* Top-left control cluster: budget slider + islands toggle, under the title */}
      <div style={{ position: 'absolute', top: 86, left: 18, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BudgetSlider value={budget} total={total} onChange={setBudget} />
        <IslandsToggle theme={theme} on={showIslands} onChange={setShowIslands} />
      </div>

      <StarsPanel graph={graph} open={starsOpen} onToggle={toggleStars} onPick={select} />
      <WuDock graph={graph} roster={theme.suns.roster} onSelect={select} />
      <Drawer node={selected} graph={graph} onClose={() => setSelected(null)} />

      <footer style={{
        position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', zIndex: 4,
        fontFamily: theme.typography.data, fontSize: 9, color: theme.palette.mute, pointerEvents: 'none',
      }}>
        {theme.copy.disclaimer}
      </footer>
    </div>
  );
}

function IslandsToggle({ theme, on, onChange }) {
  const { palette, typography, copy } = theme;
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        background: 'rgba(7,9,18,0.82)', border: `1px solid ${hexA(palette.gold, 0.25)}`,
        borderRadius: 10, padding: '8px 14px', backdropFilter: 'blur(6px)',
      }}
    >
      <span style={{
        width: 28, height: 16, borderRadius: 8, background: on ? hexA(palette.gold, 0.5) : hexA(palette.ash, 0.25),
        position: 'relative', transition: 'background 160ms', flex: '0 0 auto',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12, borderRadius: '50%',
          background: on ? palette.gold : palette.mute, transition: 'left 160ms',
        }} />
      </span>
      <span style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold }}>
        {copy.islands.label}
      </span>
    </button>
  );
}

function Title({ theme }) {
  return (
    <div style={{ position: 'absolute', top: 20, left: 22, zIndex: 5, pointerEvents: 'none' }}>
      <h1 style={{ fontFamily: theme.typography.title, fontSize: 24, color: theme.palette.goldPale, margin: 0, letterSpacing: 0.5 }}>
        {theme.copy.title}
      </h1>
      <p style={{ fontFamily: theme.typography.body, fontSize: 13, color: theme.palette.subtle, margin: '2px 0 0' }}>
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

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 3: Verify build + full suite**

Run: `node node_modules/vite/bin/vite.js build` → exit 0.
Run: `pnpm exec vitest run` → all suites green (theme + buildGraph + selectors + encode + budget + search).

- [ ] **Step 4: Commit**

```bash
git add src/ui/BudgetSlider.jsx src/ExplorerApp.jsx
git commit -m "feat: wire dock + search + stars + islands toggle; top-left controls; subtitle + footer"
```

---

## Task 10: README tribute disclaimer

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a disclaimer section**

Append to `README.md`:

```markdown

## Disclaimer

This is an **unofficial fan tribute** and is **not affiliated with, authorized, or endorsed by Wu-Tang Clan** or its members. The Wu-Tang name and "W" mark are trademarks of their respective owners and are used here for identification in a noncommercial, transformative work. The site contains no song lyrics — only entity names, reference counts, and co-occurrence weights derived from a private analysis pipeline.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add unofficial-tribute / trademark disclaimer"
```

---

## Task 11: Live verification

**Files:** none.

- [ ] **Step 1: Full unit suite**

Run: `pnpm exec vitest run`
Expected: theme + buildGraph + selectors + encode + budget + search suites all green.

- [ ] **Step 2: Seam grep (architectural invariant)**

Run: `grep -rnE "E8B306|070912|9AA3AD|C2570F|7FE8FF|C8CDD2|Saira|Special Elite|Space Mono|Method Man|Cappadonna|SHAOLIN|wu-mark" src/engine src/ui`
Expected: NO matches (every Wu value resolves via `useTheme()`/props/asset import; `hexA()` helpers operate on passed-in strings).

- [ ] **Step 3: Boot + headless verify (per the project's verified recipe — run vite + chrome + driver in ONE shell; node writes screenshots to `C:/tmp`)**

Boot: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5188` (background within the same shell), wait for HTTP 200.
Then drive headless Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9224 --remote-allow-origins=* --user-data-dir=<fresh>`) and screenshot. (See memory `rfg3d-gotchas-and-headless-verify`.)

- [ ] **Step 4: Visual acceptance checklist**

- [ ] Wu-Dock at bottom-center: silver bar wrapping 11 black/gold-W coins with names; hovering a coin magnifies it (+ neighbors); hovering the dock breathes open the search field; roll-out contracts.
- [ ] Clicking a coin flies the camera in + opens that member's J-card + white-isolates its web.
- [ ] Search: typing finds entities; picking a **dust** node renders it (was below budget) and flies to it.
- [ ] "WU-STARS" top-right (in-line with the title) slides a top-50 list in from the right; clicking a row swaps the list out and the J-card in.
- [ ] Hovering any node flashes its edges white-hot + enlarges connected dust; moving away restores. With a node selected, its web stays white-hot + connected dust enlarged, rest dimmed.
- [ ] Islands: faint ash halo ring around the periphery; the top-left **islands** toggle hides/shows it; state survives reload.
- [ ] Budget slider sits top-left under the title; subtitle is clearly readable; tribute disclaimer along the bottom.

- [ ] **Step 5: Report** the suite result, seam-grep result, and which checklist items passed (screenshots). Debug any failure before claiming completion.

---

## Self-Review

**1. Spec coverage:**
- Wu-Dock (silver, coins, magnify, breathe-open search, click→select) → Tasks 1,6,7 ✓
- Search over all 2,559 → Tasks 2,6 ✓
- WU-STARS right slide-out + swap → Tasks 8,9 ✓
- Hover/select white-trace via single `encode()` + white edges → Tasks 3,5 ✓
- Bigger dust → Task 3 ✓
- Islands peripheral halo + toggle (default on, persisted, top-left) → Tasks 4,5,9 ✓
- Budget slider → top-left; brighter subtitle; footer disclaimer + README → Tasks 9,10 ✓
- Out-of-budget selection union + focus-driven fly-to → Task 5 ✓
- IP disclaimer → Tasks 1,9,10 ✓
- Theme seam preserved + grep → Task 11 ✓

**2. Placeholder scan:** No TBD/"handle edge cases"/"similar to". The Wu mark is a real placeholder SVG with explicit instruction to swap in the user's asset — that is a deliberate, complete fallback, not a plan-gap. ✓

**3. Type consistency:** `searchEntities(query, nodes, degree, limit)` — same call in SearchBox and tests. `encode` ctx now `{theme, degree, maxCount, maxDegree, hoverSet, focusSet, strategy}` — matches `encCtx(hoverSet, focusSet)` in GraphScene and the new tests. `buildIslandHalo(islands, extent, theme)` returns a named `THREE.Points` ('island-halo') — GraphScene toggles via `getObjectByName('island-halo')`. `graph` shape `{nodes, links, degree, byId}` consumed consistently by SearchBox, WuDock (`byId`, `byName`), StarsPanel, Drawer. `select(node)`/`toggleStars` wiring consistent in ExplorerApp. GraphScene props now include `showIslands`. ✓

**Risk note for the implementer:** the focus-driven `flyTo` uses `fgRef.current.graphData()` to find the live (coord-bearing) node; if that accessor returns undefined in this FG version, fall back to `visible.nodes` (already coded). If a freshly-unioned node has no coords on the first rAF, the camera simply flies to origin-ish for one frame then a subsequent select re-fires — acceptable; do not block on it.

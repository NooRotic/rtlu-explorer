# RTLU Explorer — Phase 2.1 "Navigation & Trace" Design

**Status:** Draft for review · 2026-06-10
**Builds on:** the merged Phase 2 explorer (`main`). Same theme/engine seam, same data, same privacy guardrail (reads only the four static JSON files; no verse text).
**Goal:** Make the universe *navigable and legible to a first-time user* — a Wu-member dock + search to answer "what do I do / where do I start," white-hot connection tracing on hover/select, bigger catchable dust, and a quiet home for the 144 islands.

---

## Why

The graph renders beautifully but gives a new visitor no entry point, and dust nodes are too small to click or trace. This phase adds the **navigation affordances** and the **connection-tracing feedback** that turn a pretty galaxy into an explorable one.

## Guardrails carried forward

- **Theme/engine seam:** all Wu values (palette incl. new silver tokens, the Wu mark asset, copy strings) live in `src/theme/wu-tang/`. Engine + generic UI read them via `useTheme()`/props. New pure logic stays artist-agnostic.
- **Palette discipline:** dust stays **ash** by default so gold reads as signal. White is used only as a transient/selected **value** highlight (brightness), never as a new hue — the reserved `--cyan` channel stays untouched for Phase-2.5 type-color.
- **No fabricated entity types.** Search/stars rank by structure (name match, degree) only.

## IP note

The Wu-Tang "W" is a registered trademark/copyrighted mark, not public domain. Used here as a noncommercial fan tribute. Mitigation (required by this spec): a visible **"Unofficial fan tribute — not affiliated with or endorsed by Wu-Tang Clan"** disclaimer in the app footer and README. The gold W SVG is user-provided.

---

## Components

### 1. Wu-Dock — `src/ui/WuDock.jsx` (+ `WuCoin.jsx`)
A **silver brushed-metal floating dock**, bottom-center, that "wraps around" the **11 Wu-member-sun coins** (the theme sun roster, in roster order).
- **Coin:** black circle, **gold Wu mark** inside, **member name centered underneath** (title face). Coin art comes from `theme.assets.wuMark` + `theme.palette` (black fill, gold mark, silver dock).
- **Magnify:** hovering a coin scales it up (and lightly scales immediate neighbors, dock-style); roll-out returns. Pure CSS transform/transition driven by hover state — no layout thrash.
- **Breathe-open search:** resting dock = just the coin row. **Hover the dock → it expands (height/opacity transition) to reveal the search field beneath the coins**; roll-out → contracts back to "wrapping the coins." Search stays open while focused/typing even if the pointer briefly leaves (so the user can move to the field).
- **Click a coin →** selects that sun (same path as clicking its dot: `onSelect(node)` → drawer + white-isolate + camera fly-to).
- Decomposition: `WuDock` owns layout + open/close + magnify state; `WuCoin` is a pure presentational coin (`{node, scale, onClick}`). `SearchBox` (below) is embedded but independently testable.

### 2. Search — `src/ui/SearchBox.jsx` + `src/engine/search.js` (pure)
- `search.js`: `searchEntities(query, nodes, limit=8)` — case-insensitive, ranks **prefix matches > substring matches**, tie-break by degree then name. Returns `[{id, name, degree}]`. **Unit-tested.**
- `SearchBox`: controlled input + results dropdown over **all 2,559 entities**; pick a result → `onSelect(node)`. This is the real fix for "I can't click that tiny dust dot."

### 3. WU-STARS panel — `src/ui/StarsPanel.jsx`
- A **clickable title top-right, in-line with "SHAOLIN OBSERVATORY"** (left). Label: **"WU-STARS"** (data face, gold, with an affordance cue — e.g. a ▸/“open” glyph so it reads as clickable).
- Click → panel **slides in from the far right**, holding the **scrollable top-N-by-degree list** (`topNByDegree`, e.g. top 50) — the "stars" (most-connected entities). Each row: name (title face) + degree (data face). Click a row → `onSelect(node)`.
- **Swap behavior (D2):** Stars panel and the detail J-card share the right edge. Opening one closes the other; picking a Stars row closes the list and opens that entity's J-card. Never stacked (small-screen friendly).

### 4. Hover + select trace — `src/engine/GraphScene.jsx` + `encode.js`
Extend the **single `encode()` accessor** (keep the discipline) with two new ctx sets:
- `hoverSet` — the hovered node + its direct neighbors.
- `connectedSet` — the selected node + neighbors (drives the persistent state).

Behavior:
- **Hover any node** (`onNodeHover` → `hoverRef` + `fgRef.refresh()`): hovered node + its neighbors go **white-hot** and **enlarge**; their shared edges render **white-hot** (transient). Cursor → pointer. Roll-out restores.
- **Select** (existing focus flow): persistent — connected edges stay **white-hot**, **connected dust enlarges**, everything else dims (the current gold-dim isolate becomes a white-glow isolate). Stays until deselect.
- Edge coloring in `GraphScene.linkColor` gains white-hot for `hoverSet`/`connectedSet` membership; otherwise unchanged weighted gold.

### 5. Dust upticks — `encode.js`
- Raise the dust size range (baseline bigger so the web reads and dust is catchable) — tune constants `DUST_MIN`/`DUST_MAX` upward.
- Connected/hovered dust enlarges further (from sets above). Dust stays ash unless in a hover/connected set, then white-hot.

### 6. Islands → peripheral-halo field + toggle — `src/engine/GraphScene.jsx` (+ helper)
The 144 unlinked (degree-0) entities render as a **faint ash halo ring on an outer shell**, behind/around the active web — present but quiet, never mid-scene floaters. Implementation: a dedicated layer of fixed-position points on a large sphere shell (deterministic placement; very low opacity ash from a fixed theme intensity constant; non-magnified). They are not part of the force sim and do not clutter the core.

**Halo toggle (decision B):** an **on/off toggle, default on**, lives in the top-left control cluster (with the budget slider). It is the art-direction's documented "peripheral halo vs. off-by-default toggle" choice. Not a budget — just visibility; intensity is a fixed constant, not a control (islands are 144 trivially-cheap points, so there is no perf lever to expose). State (`showIslands`) lives in `ExplorerApp`, persisted in `localStorage` for parity with the budget. Halo is independent of the node budget either way.

### 7. Layout moves — `src/ExplorerApp.jsx` + `BudgetSlider.jsx`
- **Top-left control cluster, under the title:** the **budget slider** (D3) and the **islands-halo toggle** (§6) grouped together.
- **Brighten the subtitle/tagline** for contrast (from `palette.mute` to a brighter token, e.g. `palette.ink` or a new `palette.subtle` ≈ `#C7CDD4`).
- **Footer disclaimer** line (IP note).

---

## Data flow & the key wrinkle: selecting out-of-budget nodes

Selection can now originate from **dock / search / stars**, not just a canvas click — and search/stars can target a node **outside the current top-N budget**, which therefore isn't in the scene (no coords → camera can't fly, no isolate).

**Resolution:** `GraphScene` computes the visible set as
`visible.nodes = topN(budget) ∪ {selected} ∪ neighbors(selected)`
so the selected entity **and its neighborhood always render** regardless of budget. A `useEffect` keyed on `focusId` runs the camera push-in whenever focus changes from *any* source (dock/search/stars/canvas), once the node has simulation coords (guard for the just-added node — fly on the next tick via `onEngineTick`/a short retry, or use `d3` fixed position for the freshly added selected node).

Selection state stays in `ExplorerApp` (`selected`) and flows down via `focusId` — unchanged contract, new triggers.

## Components & interfaces (summary)

| Unit | Responsibility | Depends on |
|---|---|---|
| `engine/search.js` | pure name search/rank | nodes array |
| `ui/SearchBox.jsx` | input + results, emits onSelect | search.js, useTheme |
| `ui/WuCoin.jsx` | presentational coin | useTheme, theme.assets |
| `ui/WuDock.jsx` | dock layout, magnify, breathe-open | WuCoin, SearchBox, useTheme, roster |
| `ui/StarsPanel.jsx` | right slide-out top-N list + trigger | topNByDegree, useTheme |
| `engine/encode.js` | + hover/connected/dust states | (ctx only) |
| `engine/GraphScene.jsx` | hover wiring, white trace, islands halo, focus-driven fly-to, visible-set union | encode, selectors, neighborsOf |
| `theme/wu-tang/*` | silver tokens, wuMark asset, dock/search/stars/disclaimer copy | — |

## Testing

- **Unit (Vitest):** `searchEntities` ranking (prefix > substring, degree tie-break, limit); `encode` new states (hover/connected → white-hot + enlarged; non-members unchanged; focus dimming still applies). Extend existing encode tests.
- **Visual (live, headless Chrome):** dock magnify + breathe-open search; coin click flies+selects; search jumps to a dust node and renders it; WU-STARS slide-out + row-click swap to J-card; hover white-trace; select persistent white web + enlarged connected dust; islands halo present and quiet + toggle hides/shows it (and persists across reload); slider top-left; subtitle contrast.

## Out of scope (defer)

Adaptive-FPS assist + capability probe; codename→real-name; Phase-2.5 type-color; mobile/Phase-3. Multi-artist theme-switcher stays Phase 4.

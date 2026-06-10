# RTLU Explorer — Phase 2 Art Direction

**Direction:** *Shaolin Observatory* (working codename)
**Status:** Locked 2026-06-10 via the pre-Phase-2 art-direction sprint. This document is the gate: viz code may proceed against it. Until this doc is signed off, no three.js / force-graph code is written.
**Scope:** The Wu-Tang desktop 3D universe (Phase 2). Single artist. The mobile scrollytelling (Phase 3) inherits the palette + type system but is a separate artifact.

Visual reference: [`docs/mockups/shaolin-observatory.html`](./mockups/shaolin-observatory.html) (the locked look) and [`docs/mockups/three-directions.html`](./mockups/three-directions.html) (the three competing directions this was chosen from).

---

## The decision in one line

**Direction 2 (Supreme Mathematics — a legible luminous blueprint) as the structural backbone, with Direction A (Shaolin cinema — depth, glow, nebula) grafted onto the hubs, and Wu street-grit delivered through typography and gold edges rather than a flooded palette.**

It beat two alternatives in the sprint:
- **Direction 1 — "Shaolin, After Dark"** (Shaw Brothers cinema, warm monochrome): most visceral, but heavy bloom smears at 2,559 nodes and warm-monochrome leaves no hue headroom for type-color later.
- **Direction 3 — "Tape Grit"** (flat black/yellow brutalist, halftone): unmistakably Wu and great small, but flat treatment fights the 3D-galaxy premise. *Not discarded* — it becomes the 2D companion skin for the Phase-3 mobile trailer and Phase-4 OG/share cards.

Direction 2 won the backbone because three forces aligned: crisp lines stay **legible at 2,559-node scale** where bloom mushes; it reserves a **whole hue channel** for the Phase-2.5 type-color upgrade; and the Five-Percenter frame is **peak-Wu without leaning on the logo**.

---

## The design driver: the data is a power-law sky

The art direction exists to serve the actual shape of the snapshot, not the reverse:

- **2,559 entities, 4,632 co-occurrence edges.**
- **A few suns, a vast dust-field.** Reference count: median **1**, p90 **5**, max **457**. Degree: median **2**, p90 **6**, max **294**. Nine-plus blazing hubs, then a steep cliff.
- **144 isolated entities** with no links at all.
- Edge weights are mostly faint: median weight **1**, p90 **3**, max **56**.

Every visual decision below is judged by one test: *does it make the nine-suns-and-dust shape beautiful and legible?*

### The cores (the "suns")

The luminous cores are the **ten Clan emcees**, sized by reference count and brightened by degree — **whoever the verses actually orbit**, not a hand-picked list:

| Emcee | ref count | degree |
|---|---|---|
| Method Man | 416 | 294 |
| RZA | 359 | 254 |
| Raekwon | 319 | 262 |
| Inspectah Deck | 255 | 191 |
| Ghostface Killah | 242 | 177 |
| U-God | 151 | 107 |
| Masta Killa | 151 | 132 |
| **Cappadonna** | 147 | 119 |
| GZA | 134 | 106 |
| Ol' Dirty Bastard | 72 | 53 |

Cappadonna — the Clan's "unofficial tenth member" — is independently confirmed as a top-tier hub by the graph (above two of the official nine in degree), so he is a full sun, not an afterthought. Above all ten sits the **Wu-Tang Clan group node** itself (ref 457, deg 214) as the single brightest super-hub — conceptually the collective, not an emcee, and treated as a distinct visual tier.

---

## Visual system

### Palette — gold signal on a neutral field

The core idea is a **value hierarchy, not a hue wash**: gold reads as "the signal," neutral ash as "the field." This is what keeps a gold-edged graph from collapsing into monochrome mush.

| Token | Hex | Role |
|---|---|---|
| `--bg-base` | `#070912` | Deep indigo-black void |
| `--gold` | `#E8B306` | The signal: sun cores, edges, headline accents |
| `--amber` | `#C2570F` | Sun outer-glow, nebula warmth |
| `--ash` | `#9AA3AD` | The dust-field (neutral = contrast) |
| `--cyan` | `#7FE8FF` | **Reserved.** Selection/hover now → type-color hue channel in Phase 2.5 |

`--cyan` is deliberately spent on almost nothing in v1 (just the active/selected ring) so the cool hue channel stays available for semantic type-color later. See *Phase-2.5 type-color* below.

### Typography

Three faces, by role. Grit lives here (the "from-the-streets" feel) rather than in the palette.

| Role | Face | Notes |
|---|---|---|
| Titles, headlines, entity names | **Saira Stencil One** (stencil) | Crates / spray / military — gritty but legible |
| Body, in-graph labels, atmosphere, dossier prose | **Special Elite** (typewriter grime) | Zine / xerox / documentary feel. Short copy only. |
| Data, numerals, stats | **Space Mono** | The "Supreme Mathematics" numeral layer — degrees, counts, weights |
| Long-form readable UI text | **Inter** | Accessibility fallback where typewriter would tire the eye |

**Readability escape hatch (decided up front):** typewriter faces punish long paragraphs and tiny dense labels. If in-graph node labels read poorly at full 2,559-node density, those labels **promote to Stencil** (justifiable — entity names are titles). Typewriter is reserved for short copy and captions.

### Nodes

- **Suns (the ten emcees + group node):** radial gold→amber gradient with a white-hot center; soft bloom halo; a thin gold geometry ring (the supreme-math motif). **Size = reference count.** Glow intensity scales with degree. The group node gets a distinct, slightly grander treatment as the super-hub tier.
- **Dust (everything else):** small **ash** points (size = degree), with a sparse scatter of warm gold motes near the hubs for atmosphere. Neutral by default so the gold structure pops.
- **Islands (144 unlinked entities):** a deliberate outer dust-field treatment (a faint peripheral halo), and/or a toggle — never awkward floaters mid-scene.

### Edges

- **Gold, weighted.** A faint gold lattice carries the bulk (the thousands of weight-1 ties sit quietly in the back); **heavy co-occurrences flare bright with a slight bloom.** Opacity and width scale with edge weight.
- Tuned a notch bolder than a pure-minimal treatment (per direction review), but still restrained enough to stay legible.

### Depth — nebula clouds

- **Heavier nebula** layers (gold/amber + one cool counterpoint), **slowly drifting/animated** in the final build, behind the node field.
- Glow and atmosphere live on the **hubs and background only** — the dust-field stays crisp so depth never costs legibility.

### Camera & motion

- **Observatory instrument**, not a dreamy free-floater: clean-angle snaps, a slow idle "breath," and a cinematic push-in on selection.
- Hover raises a node; select tweens the camera to it and isolates its neighborhood (see below).

### Drawer (entity detail)

- A **J-card dossier**: Stencil entity name, Special Elite prose, Space Mono stats (referenced ×N, degree, strongest tie + weight, top edges).
- A visible **`type: —`** row — the intentional hook that lights up in Phase 2.5 when entities know what they are.

---

## Encoding strategy — structure, not semantics (v1)

Entity `type`/`categories` are empty in the export because the bank exposes no entity typing yet. v1 therefore encodes the hierarchy from **structure we actually have**, fabricating nothing:

- **Size** = reference count
- **Glow / ring** = degree
- **Edge brightness + width** = co-occurrence weight
- **Color / community** = force-derived clusters (the emcee orbits), *not* semantic type

**Implementation rule that makes this cheap to evolve:** node color comes from a single `encode(node)` accessor, never an inline `node.color = …` scattered across components. Adding type-color later is then "register a new encode strategy," not a rewrite.

---

## The dense-web / legibility plan

The graph is a **genuine force-directed web** — every edge is a real `{source, target, weight}` co-occurrence, and the d3-force simulation in `react-force-graph-3d` lets linked nodes attract and unlinked ones drift, so the layout emerges from true structure (akin to Hindsight's control-panel graph views). The difference is **scope**: we render the *entire* artist universe at once, where a control panel usually shows one neighborhood. Mitigations so the whole universe doesn't read as a hairball:

1. **Anchors.** The ten suns give the eye fixed landmarks — the web reads as "ten dense cores with filaments," not uniform noise.
2. **Edge value-hierarchy.** Faint lattice for weight-1, bright flares for strong ties — the *meaningful* structure pops, noise recedes.
3. **Default focused view + drill-in (control-panel behavior).** First paint is the hubs + their neighborhoods, with a **"show everything" toggle**. Clicking a node **isolates its local web** (rest fades), tweens the camera in, and fills the drawer with its edges. This is the "explore the connections properly" interaction.
4. **Island handling.** The 144 unlinked entities are a deliberate outer field / toggle.
5. **Perf levers** against the open 60fps target: degree/weight thresholds for the default view, opacity-by-weight, and capping live edge counts. (See *Open items*.)

---

## Architecture — the theme / engine seam

Going all-in on Wu and reusing the build for future artists (Canibus, Mitski) only conflict if they're one layer. They aren't:

- **Engine (artist-agnostic):** graph loading, force layout, camera tweens, hover/select, drawer behavior, perf. Never mentions Wu.
- **Theme (swappable):** `theme/wu-tang/` holds *all* Wu specifics — palette tokens, the three font choices, asset paths, motion constants, copy, and the iconographic flourishes (gold, geometry rings, numerology motifs).

**Discipline now (cheap, ~10–15% of Phase 2):** no Wu value is hardcoded outside the theme module. **Deferred to Phase 4 (YAGNI, one artist today):** runtime theme-switcher, theme registry, multi-build matrix. Multi-artist ships as **separate sites from separate builds** (`--mode wu-tang`, `--mode canibus`) on a shared engine — so an engine fix benefits every artist without backporting. Forking-at-a-tag stays available as a fallback if a future artist must diverge radically.

---

## Phase-2.5 — type-color upgrade (planned, not built)

When the bank can emit entity types (people / places / themes / wordplay / aliases), color-by-type becomes a satisfying v2 reveal rather than a v1 blocker:

- The export schema **already emits** `type` and `categories` (empty today) — so the viz data path doesn't change shape; values just go from `""` to e.g. `"person"`. **Near-zero rework**, conditional only on the `encode()` accessor + a dimension-agnostic legend, both adopted in v1.
- The reserved **`--cyan` cool channel** absorbs the new type-hues without fighting the gold palette.
- Community-coloring from v1 **survives as a second lens** (community vs. type), not thrown away.
- v1 even **de-risks** v2: it provides a free check that force-derived communities roughly match semantic types before investing in upstream extraction.
- The upstream typing work itself (start the container, add a typing pass, re-extract ~1,454 docs, re-export) is an **invariant cost** paid whenever it's done — sequencing structure-first does not inflate it.

---

## Hard guardrails (carried from the project)

- **No verse text, ever.** The viz reads only the static JSON snapshot (entity names, counts, edge weights). No lyrics exist in it and none are introduced.
- **No live Hindsight.** Pure static artifact; the bank can stay stopped for all viz work.
- **No fabricated entity types** in v1.

---

## Open items (decide during/early in implementation)

- **Performance budget:** confirm a hard target (design doc proposes ~60fps at 500 visible nodes on a 5-year-old MacBook) and the default-view node/edge thresholds that hit it.
- **Default focused view:** exact rule — top-N hubs by degree + their first-degree neighbors? what N?
- **Island treatment:** peripheral halo vs. off-by-default toggle.
- **Codename → real name:** "Shaolin Observatory" is a working title; the site name is still open (candidates include *The Cipher*, *Cipher Atlas*).
- **Nebula motion:** final drift speed/intensity in the live build.

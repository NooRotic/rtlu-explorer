# RTLU Explorer — Pre-launch: About Modal · OG Card · SEO (Design)

**Status:** Locked for planning · 2026-06-12
**Builds on:** the merged Phase 2 / 2.1 explorer + the staged deploy setup (`polish-deploy`). Ships before go-live at `wu-atlas.nooroticx.tv`.
**Goal:** Give the site a voice (what it is / what powers it / how to read it), a shareable link-preview, and the SEO to be found — without breaking the theme/engine seam or the privacy/tribute guardrails.

---

## 1. Brand resolution (foundational)

- **Displayed brand stays `SHAOLIN OBSERVATORY`** (unchanged in-app title).
- **SEO/OG title:** `Shaolin Observatory — a 3D map of the Wu-Tang universe`.
- **`og:site_name`:** `The Wu-Tang Atlas`. "Atlas" is the system/family word; the URL (`wu-atlas`) is the address. Brand ≠ slug is intentional.
- Meta **description** (carries searchable terms, no lyrics claim): *"An interactive 3D map of the people, places, and references woven through Wu-Tang Clan's verses — built from a knowledge graph, not the lyrics themselves. Explore the cipher."*

## 2. About / Starter modal

**Component:** `src/ui/AboutModal.jsx` — themed, J-card styling (stencil headers, typewriter body, Space Mono numbers), centered dialog over a dimmed/blurred backdrop. ~`min(560px, 92vw)` wide, scrollable, max-height ~`86vh`.

**Copy location (seam):** all prose lives in `theme/wu-tang/copy.js` as `copy.about` (a structured object: `{ heading, sections: [{ title, body }], links: [{ label, href }] }`). The component renders whatever it's handed — no Wu prose hardcoded in `src/ui`. Multi-artist later = swap copy.

**The six sections (content locked):**
1. **What this is** — "a map of the cipher." The graph *is* the work; **no lyrics** — the network of people, places & references *about* the verses (transformative).
2. **What powers it** — a private **Hindsight knowledge graph** → exported entity/relationship **snapshot (static JSON)** → rendered as a **3D force-directed galaxy** (`react-force-graph-3d` / three.js). No live backend; the bank stays offline.
3. **How to read it** — suns = the Clan emcees (**size = times referenced, glow = connections**); gold edges = **how often two are named together** (weight); ash dust = everything else; faint outer halo = unlinked "islands"; white trace on click = the connected web. v1 encodes **structure, not meaning**.
4. **How to use it** — the **dock** (jump to a member), **search** (find any entity), **WU-STARS** (most-connected), **click to isolate + trace**, the **render-budget** slider, the **islands** toggle.
5. **The numbers** — live: `{entities} entities · {links} connections · from {docs} documents`.
6. **Tribute & source** — unofficial fan tribute (not affiliated/endorsed); links: **GitHub repo** (`https://github.com/NooRotic/rtlu-explorer`) + "part of **Rip The Lyrical Universe**".

**Live numbers:** a pure helper `src/engine/stats.js` → `snapshotStats(snapshot)` returns `{ entities, links, docs }` from `snapshot.entities.length`, `snapshot.links.length`, `snapshot.version.hindsight_bank_total_docs` (fallback `0`/`—` if missing). Unit-tested. The modal renders these, never hardcoded figures.

**Trigger & lifecycle:**
- **First visit:** auto-open once, gated by `localStorage` key `rtlu.seenIntro.wu-tang-clan` (set on first dismiss). Returning visitors don't get gated.
- **Re-open:** an **"ⓘ ABOUT"** button in the top-left control cluster, under the tagline (top-right stays WU-STARS).
- **Dismiss:** X button, click on backdrop, and `Esc`. Focus-trap is out of scope (YAGNI for v1) but the dialog gets `role="dialog"` + `aria-modal` + `aria-label`.
- **State:** `aboutOpen` boolean in `ExplorerApp`; `seenIntro` read on mount to decide initial auto-open.

## 3. OG share-card — `public/og.png` (hybrid)

1200×630 PNG, built with the **social-preview skill's** deterministic compositing scripts:
- **Background:** a real headless graph frame (captured via the project's headless-Chrome recipe), darkened + slightly blurred/faded so it reads as atmosphere.
- **Foreground title block:** the **Wu-W** mark, **SHAOLIN OBSERVATORY** in stencil, the tagline, `wu-atlas.nooroticx.tv`, and the stats line — composed within the **center safe-area** so it survives the 1.91:1 link-crop.
- **Fallback:** if the software-render screenshot is too faint to read behind the title, ship a **fully-designed** card (void bg + drawn gold suns/lattice motif + title block) — same title block, no screenshot dependency.
- Lives at `public/og.png` → copied to `dist/og.png` → referenced absolutely as `https://wu-atlas.nooroticx.tv/og.png`.

## 4. SEO / `<head>` (index.html) + launch assets

All static in `index.html` (crawlers read the built HTML; no SSR needed). Replace the current bare `<title>` + single description with:
- `<title>Shaolin Observatory — a 3D map of the Wu-Tang universe</title>`, `meta description` (§1), `<html lang="en">`, `<link rel="canonical" href="https://wu-atlas.nooroticx.tv/">`, `<meta name="theme-color" content="#070912">`.
- **Open Graph:** `og:type=website`, `og:site_name=The Wu-Tang Atlas`, `og:title`, `og:description`, `og:url`, `og:image` (absolute `…/og.png`), `og:image:width=1200`, `og:image:height=630`.
- **Twitter:** `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- **Favicon:** the **Wu-W** at `public/favicon.png` → `<link rel="icon" type="image/png" href="/favicon.png">` (replaces the Vite default; derived from `Wu-Tang-Logo.png`).
- **JSON-LD** (`<script type="application/ld+json">`): a `WebSite` (name, url) + `CreativeWork` (name, description, about: Wu-Tang Clan, author: NooRotic, isBasedOn: the project) graph.
- **`public/robots.txt`:** allow all + `Sitemap:` line.
- **`public/sitemap.xml`:** the single URL `https://wu-atlas.nooroticx.tv/`.

## Files

**New:** `src/ui/AboutModal.jsx`, `src/engine/stats.js`, `test/stats.test.js`, `public/og.png`, `public/favicon.png`, `public/robots.txt`, `public/sitemap.xml`.
**Modified:** `src/theme/wu-tang/copy.js` (+`about`, +`aboutButton` label), `src/ExplorerApp.jsx` (about state + ⓘ button + modal + first-visit), `index.html` (full head + favicon + JSON-LD).

## Components & interfaces

| Unit | Responsibility | Depends on |
|---|---|---|
| `engine/stats.js` | pure `snapshotStats(snapshot) → {entities,links,docs}` | snapshot shape |
| `ui/AboutModal.jsx` | render `copy.about` + live stats; dialog a11y; emits onClose | useTheme, snapshotStats, props |
| `ExplorerApp.jsx` | `aboutOpen` state, first-visit gate, ⓘ ABOUT button, mount modal | localStorage, AboutModal |
| `theme/wu-tang/copy.js` | the about prose + link list (Wu-specific) | — |
| `index.html` | static SEO head, OG/Twitter, favicon, JSON-LD | og.png, favicon.png |
| `public/*` | og.png, favicon.png, robots.txt, sitemap.xml | — |

## Testing

- **Unit (Vitest):** `snapshotStats` — correct counts from a fixture; graceful fallback when `version`/`hindsight_bank_total_docs` missing.
- **Visual (headless Chrome):** about modal auto-opens on first visit, closes via X/backdrop/Esc, re-opens via ⓘ ABOUT, and the `seenIntro` flag suppresses auto-open on reload; live numbers match the snapshot; favicon loads; assert `<head>` contains `og:image`, `twitter:card`, canonical, JSON-LD.
- **OG card:** eyeball the generated 1200×630 at thumbnail scale (title legible, safe-area intact).

## Out of scope / deferred

Focus-trap/restore in the modal (basic a11y attrs only); multi-language; per-section deep-linking; analytics; the multi-artist OG/SEO templating (Phase 4 — copy + og + sitemap become per-build). nebula tuning remains separate.

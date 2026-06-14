# Pre-launch: About Modal · OG Card · SEO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) tracking. **Task 6 (OG card) is controller-driven via the `social-preview` skill, not a mechanical subagent task.**

**Goal:** Give the site a voice (a re-openable About modal), a shareable link-preview (OG card + Open Graph/Twitter meta), and the SEO to be found — shipped before go-live at `https://wu-atlas.nooroticx.tv` (IONOS).

**Architecture:** Keeps the theme/engine seam — About prose lives in `theme/wu-tang/copy.js` (`copy.about`); a pure, tested `engine/stats.js` feeds the modal *live* numbers; `AboutModal.jsx` is themed UI that renders what it's handed. SEO is static `<head>` in `index.html` (crawlers read built HTML; no SSR). The OG image is a static asset at `public/og.png` → `dist/og.png`.

**Tech Stack:** Vite 6 · React 18 · Vitest · social-preview skill (PowerShell compositing) for the OG card.

**Spec:** `docs/superpowers/specs/2026-06-12-about-og-seo-design.md`. **Brand:** displayed = `SHAOLIN OBSERVATORY`; SEO title = `Shaolin Observatory — a 3D map of the Wu-Tang universe`; `og:site_name = The Wu-Tang Atlas`. **Guardrail:** no verse text; unofficial tribute.

---

## File Structure

```
src/engine/stats.js        CREATE  pure snapshotStats(snapshot) -> {entities,links,docs}
src/ui/AboutModal.jsx      CREATE  themed dialog: copy.about + live stats + a11y + close
src/theme/wu-tang/copy.js  MODIFY  + copy.about (heading/sections/numbers/tribute/links) + openLabel
src/ExplorerApp.jsx        MODIFY  aboutOpen state, first-visit gate, "ⓘ ABOUT" button, Esc, mount modal
index.html                 MODIFY  full SEO head: title/desc/canonical/theme-color/OG/Twitter/favicon/JSON-LD
public/favicon.png         CREATE  Wu-W (copy of the logo asset)
public/robots.txt          CREATE  allow all + sitemap
public/sitemap.xml         CREATE  the one URL
public/og.png              CREATE  1200x630 hybrid card (via social-preview skill — Task 6)
test/stats.test.js         CREATE
test/theme.test.js         MODIFY  + assert copy.about shape
```

---

## Task 1: `engine/stats.js` — pure live-stats helper

**Files:** Create `src/engine/stats.js`, Test `test/stats.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/stats.test.js
import { describe, it, expect } from 'vitest';
import { snapshotStats } from '../src/engine/stats.js';

describe('snapshotStats', () => {
  it('counts entities and links and reads doc total from version', () => {
    const snap = {
      entities: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      links: [{ source: 'a', target: 'b' }],
      version: { hindsight_bank_total_docs: 1454 },
    };
    expect(snapshotStats(snap)).toEqual({ entities: 3, links: 1, docs: 1454 });
  });

  it('is null-safe when fields are missing', () => {
    expect(snapshotStats(null)).toEqual({ entities: 0, links: 0, docs: 0 });
    expect(snapshotStats({})).toEqual({ entities: 0, links: 0, docs: 0 });
    expect(snapshotStats({ entities: [{ id: 'a' }] })).toEqual({ entities: 1, links: 0, docs: 0 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run test/stats.test.js`
Expected: FAIL — cannot resolve `stats.js`.

- [ ] **Step 3: Implement `stats.js`**

```js
// src/engine/stats.js
// Pure, artist-agnostic snapshot tallies for the About modal. No theme import.
export function snapshotStats(snapshot) {
  return {
    entities: snapshot?.entities?.length ?? 0,
    links: snapshot?.links?.length ?? 0,
    docs: snapshot?.version?.hindsight_bank_total_docs ?? 0,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run test/stats.test.js`
Expected: PASS — 2/2.

- [ ] **Step 5: Commit**

```bash
git add src/engine/stats.js test/stats.test.js
git commit -m "feat(engine): pure snapshotStats() for live About-modal numbers"
```

---

## Task 2: `copy.about` — the About prose (theme seam)

**Files:** Modify `src/theme/wu-tang/copy.js`, Test `test/theme.test.js`

- [ ] **Step 1: Add the failing contract assertion** to `test/theme.test.js` (inside the existing `describe`):

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run test/theme.test.js`
Expected: FAIL — `copy.about` undefined.

- [ ] **Step 3: Add `about` to the `copy` object** in `src/theme/wu-tang/copy.js` (after `disclaimer`):

```js
  about: {
    openLabel: 'about',
    heading: 'What is this?',
    sections: [

        title: 'What powers it',
        body: 'Every node and edge is exported from a private Hindsight knowledge graph — who and what the verses name, and how often those names surface together. That snapshot ships as static JSON and renders here as a 3D force-directed galaxy (react-force-graph-3d + three.js). No live backend, no lyrics, nothing tracked.',
      },
      {
        title: 'How to read it',
        body: "The bright suns are the Clan — sized by how often they're referenced, brightened by how connected they are. Gold threads are co-occurrences: the more two names appear together, the brighter the tie. Ash dust is everyone else; the faint outer halo is the unlinked “islands.” Click a node to light its web in white. (v1 maps structure, not meaning — colour is gravity, not category.)",
      },
      {
        title: 'How to use it',
        body: 'Use the dock to leap to a member, search to find anyone in the universe, or open WU-STARS for the most-connected. Click to isolate and trace a web; drag the render-budget slider for more or fewer nodes; toggle the islands halo on or off.',
      },
    ],
    numbersTitle: 'the numbers',
    numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
    tributeTitle: 'tribute & source',
    tribute: "An unofficial fan tribute — not affiliated with, authorized, or endorsed by Wu-Tang Clan. The “W” is their mark; this is transformative, noncommercial work built on a network about the music, never the music itself.",
    links: [
      { label: 'GitHub — rtlu-explorer', href: 'https://github.com/NooRotic/rtlu-explorer' },
      { label: 'part of Rip The Lyrical Universe', href: null },
    ],
  },
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run test/theme.test.js`
Expected: PASS (existing + the new About assertion).

- [ ] **Step 5: Commit**

```bash
git add src/theme/wu-tang/copy.js test/theme.test.js
git commit -m "feat(theme): About-modal copy (what it is / powers / read / use / tribute)"
```

---

## Task 3: `AboutModal.jsx` — the themed dialog

**Files:** Create `src/ui/AboutModal.jsx`

(No unit test — themed DOM; verified at boot. Renders `copy.about` + live `stats`.)

- [ ] **Step 1: Implement `AboutModal.jsx`**

```jsx
// src/ui/AboutModal.jsx
import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';

// Re-openable welcome/about dialog. Prose comes from theme.copy.about; numbers are live (from props).
export default function AboutModal({ open, stats, onClose }) {
  const { palette, typography, copy } = useTheme();
  const a = copy.about;

  // Close on Esc whenever open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center',
        background: 'rgba(4,5,10,0.66)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={a.heading}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)', maxHeight: '86vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(9,12,20,0.98), rgba(4,5,10,0.99))',
          border: `1px solid ${hexA(palette.gold, 0.35)}`, borderRadius: 14,
          padding: '26px 26px 22px', position: 'relative', boxShadow: '0 18px 60px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={onClose} aria-label="close"
          style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: palette.mute, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
        >×</button>

        <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold }}>
          {copy.title}
        </div>
        <h2 style={{ fontFamily: typography.title, fontSize: 26, color: palette.goldPale, margin: '4px 0 16px', lineHeight: 1.1 }}>
          {a.heading}
        </h2>

        {a.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '0 0 5px' }}>
              {s.title}
            </h3>
            <p style={{ fontFamily: typography.body, fontSize: 14, lineHeight: 1.55, color: palette.ink, margin: 0 }}>
              {s.body}
            </p>
          </section>
        ))}

        {/* The numbers — live from the snapshot */}
        <div style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '4px 0 6px' }}>
          {a.numbersTitle}
        </div>
        <div style={{ fontFamily: typography.data, fontSize: 14, color: palette.gold, display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <Stat n={stats.entities} unit={a.numbersUnits.entities} c={palette} />
          <span style={{ color: palette.mute }}>·</span>
          <Stat n={stats.links} unit={a.numbersUnits.links} c={palette} />
          <span style={{ color: palette.mute }}>·</span>
          <Stat n={stats.docs} unit={a.numbersUnits.docs} c={palette} prefix="from " />
        </div>

        <h3 style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '0 0 5px' }}>
          {a.tributeTitle}
        </h3>
        <p style={{ fontFamily: typography.body, fontSize: 12.5, lineHeight: 1.5, color: palette.mute, margin: '0 0 14px' }}>
          {a.tribute}
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {a.links.map((l, i) =>
            l.href ? (
              <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                 style={{ fontFamily: typography.data, fontSize: 12, color: palette.gold, textDecoration: 'none', borderBottom: `1px solid ${hexA(palette.gold, 0.4)}` }}>
                {l.label} ↗
              </a>
            ) : (
              <span key={i} style={{ fontFamily: typography.data, fontSize: 12, color: palette.mute }}>{l.label}</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, unit, c, prefix = '' }) {
  return (
    <span>{prefix}<b style={{ color: c.ink }}>{n.toLocaleString()}</b> {unit}</span>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/AboutModal.jsx
git commit -m "feat(ui): About modal — themed dialog, live numbers, Esc/backdrop close"
```

---

## Task 4: Wire the modal into `ExplorerApp` (first-visit + ⓘ ABOUT)

**Files:** Modify `src/ExplorerApp.jsx`

- [ ] **Step 1: Add imports** (after the `StarsPanel` import):

```jsx
import AboutModal from './ui/AboutModal.jsx';
import { snapshotStats } from './engine/stats.js';
```

- [ ] **Step 2: Add the `SEEN_KEY` constant** (next to `ISLANDS_KEY`):

```jsx
const SEEN_KEY = `rtlu.seenIntro.${ARTIST}`;
```

- [ ] **Step 3: Add about state + first-visit gate** inside `Explorer()` (after the `showIslands` state):

```jsx
  const [aboutOpen, setAboutOpen] = useState(false);

  // Auto-open the About modal once, on first visit (only after the snapshot is ready so the numbers
  // are populated). Remember the visit so returning users aren't gated.
  useEffect(() => {
    if (status !== 'ready') return;
    let seen = false;
    try { seen = globalThis.localStorage?.getItem(SEEN_KEY) === 'true'; } catch { /* ignore */ }
    if (!seen) setAboutOpen(true);
  }, [status]);

  const closeAbout = useCallback(() => {
    setAboutOpen(false);
    try { globalThis.localStorage?.setItem(SEEN_KEY, 'true'); } catch { /* ignore */ }
  }, []);
```

- [ ] **Step 4: Add the "ⓘ ABOUT" button to the top-left cluster.** Inside the control-cluster `<div>` (the one holding `BudgetSlider` + `IslandsToggle`), add as the last child:

```jsx
        <button
          onClick={() => setAboutOpen(true)}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            background: 'transparent', border: 'none', padding: '2px 0',
            fontFamily: theme.typography.data, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
            color: theme.palette.mute,
          }}
        >
          <span style={{ color: theme.palette.gold }}>ⓘ</span> {theme.copy.about.openLabel}
        </button>
```

- [ ] **Step 5: Mount the modal.** Add just before the closing `</div>` of the app root (e.g. after `<Drawer … />`):

```jsx
      <AboutModal open={aboutOpen} stats={snapshotStats(snapshot)} onClose={closeAbout} />
```

- [ ] **Step 6: Verify build + suite**

Run: `node node_modules/vite/bin/vite.js build` → exit 0.
Run: `pnpm exec vitest run` → all green (theme + stats + existing suites).

- [ ] **Step 7: Commit**

```bash
git add src/ExplorerApp.jsx
git commit -m "feat: wire About modal — first-visit auto-open, ⓘ ABOUT re-open, live stats"
```

---

## Task 5: SEO `<head>` + favicon + robots + sitemap

**Files:** Modify `index.html`; Create `public/favicon.png`, `public/robots.txt`, `public/sitemap.xml`

- [ ] **Step 1: Create the favicon** — copy the existing Wu-W asset to `public/favicon.png`:

```bash
cp src/theme/wu-tang/assets/Wu-Tang-Logo.png public/favicon.png
```

- [ ] **Step 2: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://wu-atlas.nooroticx.tv/sitemap.xml
```

- [ ] **Step 3: Create `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://wu-atlas.nooroticx.tv/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 4: Replace the `<head>` of `index.html`** with the full SEO head. Replace everything from `<title>` through the closing `</head>` (keep the charset/viewport/font links above it) — i.e. replace lines 12–17 with:

```html
    <title>Shaolin Observatory — a 3D map of the Wu-Tang universe</title>
    <meta
      name="description"
      content="An interactive 3D map of the people, places, and references woven through Wu-Tang Clan's verses — built from a knowledge graph, not the lyrics themselves. Explore the cipher."
    />
    <link rel="canonical" href="https://wu-atlas.nooroticx.tv/" />
    <meta name="theme-color" content="#070912" />
    <link rel="icon" type="image/png" href="/favicon.png" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="The Wu-Tang Atlas" />
    <meta property="og:title" content="Shaolin Observatory — a 3D map of the Wu-Tang universe" />
    <meta
      property="og:description"
      content="An interactive 3D map of the people, places, and references in Wu-Tang Clan's verses — the graph is the work, no lyrics. Explore the cipher."
    />
    <meta property="og:url" content="https://wu-atlas.nooroticx.tv/" />
    <meta property="og:image" content="https://wu-atlas.nooroticx.tv/og.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Shaolin Observatory — a 3D map of the Wu-Tang universe" />
    <meta
      name="twitter:description"
      content="An interactive 3D map of the people, places, and references in Wu-Tang Clan's verses — no lyrics, just the network behind them."
    />
    <meta name="twitter:image" content="https://wu-atlas.nooroticx.tv/og.png" />

    <!-- Structured data -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "Shaolin Observatory",
            "alternateName": "The Wu-Tang Atlas",
            "url": "https://wu-atlas.nooroticx.tv/"
          },
          {
            "@type": "CreativeWork",
            "name": "Shaolin Observatory — a 3D map of the Wu-Tang universe",
            "url": "https://wu-atlas.nooroticx.tv/",
            "description": "An interactive 3D map of the people, places, and references woven through Wu-Tang Clan's verses, built from a knowledge graph rather than the lyrics themselves.",
            "about": { "@type": "MusicGroup", "name": "Wu-Tang Clan" },
            "author": { "@type": "Person", "name": "NooRotic" },
            "creditText": "Unofficial fan tribute — not affiliated with Wu-Tang Clan"
          }
        ]
      }
    </script>
```

- [ ] **Step 5: Verify the build ships the assets**

Run: `node node_modules/vite/bin/vite.js build`
Expected: exit 0; confirm `dist/favicon.png`, `dist/robots.txt`, `dist/sitemap.xml` exist and `dist/index.html` contains `og:image` + `application/ld+json`.

- [ ] **Step 6: Commit**

```bash
git add index.html public/favicon.png public/robots.txt public/sitemap.xml
git commit -m "feat(seo): full head (OG/Twitter/canonical/JSON-LD), Wu-W favicon, robots + sitemap"
```

---

## Task 6: OG share-card `public/og.png` (controller-driven, social-preview skill)

**Files:** Create `public/og.png`

This is **not** a mechanical subagent task — it's a one-off visual asset. The controller runs it using the **social-preview skill**.

- [ ] **Step 1: Capture a hero graph frame** via the project's headless-Chrome recipe (see memory `rfg3d-gotchas-and-headless-verify`): boot `vite` on `127.0.0.1`, headless Chrome `--headless=new --use-angle=swiftshader`, settle ~8s, screenshot a dense, attractive frame (budget ~600–900, maybe a mid-hub selected for the white-trace pop) at 1600×1000 → `C:/tmp/og-bg.png`.
- [ ] **Step 2: Invoke the `social-preview` skill** to composite the **1200×630** card: the captured frame as a darkened/faded background, with a center-safe title block — Wu-W mark + **SHAOLIN OBSERVATORY** (Saira Stencil) + tagline (Special Elite) + `wu-atlas.nooroticx.tv` + the stats line (Space Mono) — output to `public/og.png`. Use the skill's deterministic PowerShell scripts; frame within the 1.91:1 safe-area.
- [ ] **Step 3: Fallback** — if the software-render frame is too faint behind the title, generate a **fully-designed** card instead (void `#070912` bg + drawn gold suns/lattice motif + the same title block). Same output path.
- [ ] **Step 4: Verify** — `node node_modules/vite/bin/vite.js build` → confirm `dist/og.png` exists and is 1200×630; eyeball it at thumbnail scale (title legible, Wu-W crisp, URL readable).
- [ ] **Step 5: Commit**

```bash
git add public/og.png
git commit -m "feat(seo): 1200x630 OG share-card (hybrid graph + title block)"
```

---

## Task 7: Live verification

- [ ] **Step 1: Full suite** — `pnpm exec vitest run` → theme + stats + buildGraph + selectors + encode + budget + search all green.
- [ ] **Step 2: Boot + headless** (per the project recipe, vite+chrome+driver in ONE shell):
  - [ ] First load **auto-opens** the About modal; numbers match the snapshot (2,559 / 4,632 / 1,454).
  - [ ] Close via **X**, **backdrop click**, and **Esc** each work.
  - [ ] Reload → modal does **not** auto-open (seenIntro persisted).
  - [ ] **ⓘ ABOUT** (top-left, under the controls) re-opens it.
  - [ ] Assert `document.head` contains `og:image`, `twitter:card`, `link[rel=canonical]`, and a `script[type="application/ld+json"]`.
  - [ ] Favicon request 200s; `og.png`, `robots.txt`, `sitemap.xml` served at root.
- [ ] **Step 3: Report** suite result + which checklist items passed (screenshots). Debug any failure before claiming done.

---

## Self-Review

**1. Spec coverage:** brand resolution → Task 5 (title/og) ✓ · About modal 6 sections → Tasks 2,3 ✓ · copy in theme → Task 2 ✓ · live stats via pure helper → Tasks 1,3,4 ✓ · first-visit + ⓘ re-open + X/backdrop/Esc → Tasks 3,4 ✓ · OG hybrid card → Task 6 ✓ · full SEO head (canonical/lang/theme-color/OG/Twitter) → Task 5 ✓ (`lang="en"` already on `<html>`) · favicon → Task 5 ✓ · JSON-LD → Task 5 ✓ · robots + sitemap → Task 5 ✓.

**2. Placeholder scan:** none. Task 6 references the social-preview skill (an actual tool), not a vague placeholder; its inputs/outputs are specified. ✓

**3. Type consistency:** `snapshotStats(snapshot) → {entities,links,docs}` — same shape consumed by `AboutModal` `stats` prop and `ExplorerApp` call. `copy.about` shape (`heading/sections[{title,body}]/numbersTitle/numbersUnits{entities,links,docs}/tributeTitle/tribute/links[{label,href}]/openLabel`) matches `AboutModal`'s reads and the Task-2 test. `aboutOpen`/`closeAbout`/`SEEN_KEY` consistent across Task 4. ✓

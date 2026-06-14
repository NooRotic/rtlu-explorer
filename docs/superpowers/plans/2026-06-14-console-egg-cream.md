# Console Easter Egg + C.R.E.A.M. Footer Creed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reward DevTools snoopers with a styled Wu console banner + an interactive `window.wu` API, and sign the page with a quiet C.R.E.A.M. footer creed.

**Architecture:** Theme/engine seam — Wu *content* (banner, ASCII W, aphorisms, creed) lives in `theme/wu-tang/console.js`; the artist-agnostic *mechanism* (`installConsoleEgg`) lives in `engine/consoleEgg.js` and is installed once from `ExplorerApp`'s ready-effect with live `snapshotStats`. The footer gains a two-line stack (creed + existing disclaimer).

**Tech Stack:** Vite 6 · React 18 · Vitest. No new deps. `console.log`/`%c` only — no `alert()`, no native-console overrides.

**Spec:** `docs/superpowers/specs/2026-06-14-console-egg-cream-design.md`.

**Branch:** `feat/console-egg-cream` (already checked out; spec already committed).

---

## File Structure

```
src/engine/consoleEgg.js     CREATE  artist-agnostic installer -> window.wu api (pure/testable)
test/consoleEgg.test.js      CREATE  api shape, stats formatting, cycle, idempotency
src/theme/wu-tang/console.js CREATE  Wu content (data only): title/intro/ascii/aphorisms/help/units/tail/creed
src/theme/wu-tang/index.js   MODIFY  import + expose `console` on wuTangTheme
src/theme/wu-tang/copy.js    MODIFY  + copy.creed { acronym, expansion } (footer)
test/theme.test.js           MODIFY  + theme.console shape, + copy.creed shape
src/ExplorerApp.jsx          MODIFY  install egg in ready-effect; two-line footer kicker
```

---

## Task 1: `engine/consoleEgg.js` — the installer (pure, testable)

**Files:**
- Create: `src/engine/consoleEgg.js`
- Test: `test/consoleEgg.test.js`

- [ ] **Step 1: Write the failing test** — create `test/consoleEgg.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { installConsoleEgg } from '../src/engine/consoleEgg.js';

const content = {
  title: 'SHAOLIN OBSERVATORY',
  intro: ['a', 'b', 'c'],
  ascii: 'WW',
  aphorisms: ['one', 'two', 'three', 'four'],
  help: [{ cmd: 'wu.wisdom()', desc: 'x' }, { cmd: 'wu.stats()', desc: 'y' }],
  numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
  statsTail: 'in the lab.',
  creed: 'C.R.E.A.M. Code Rules Everything Around Me.',
};

function fresh(stats = { entities: 2559, links: 4632, docs: 1454 }) {
  const logger = { log: vi.fn() };
  const target = {};
  const api = installConsoleEgg({ content, stats, target, logger });
  return { api, target, logger };
}

describe('installConsoleEgg', () => {
  it('installs target.wu with the four commands', () => {
    const { api, target } = fresh();
    expect(target.wu).toBe(api);
    ['help', 'wisdom', 'cipher', 'stats'].forEach((k) => expect(typeof api[k]).toBe('function'));
  });

  it('formats live stats with thousands separators and themed tail', () => {
    const { api } = fresh();
    expect(api.stats()).toBe('2,559 entities. 4,632 connections. Drawn from 1,454 documents in the lab.');
  });

  it('is null-safe for missing stats', () => {
    const { api } = fresh(null);
    expect(api.stats()).toBe('0 entities. 0 connections. Drawn from 0 documents in the lab.');
  });

  it('wisdom returns a pooled line and cycles the whole pool', () => {
    const { api } = fresh();
    const seen = new Set();
    for (let i = 0; i < content.aphorisms.length; i++) seen.add(api.wisdom());
    expect(seen).toEqual(new Set(content.aphorisms));
  });

  it('cipher includes the ascii + creed', () => {
    const { api } = fresh();
    const out = api.cipher();
    expect(out).toContain(content.ascii);
    expect(out).toContain(content.creed);
  });

  it('each command returns its string and also logs once', () => {
    const { api, logger } = fresh();
    const before = logger.log.mock.calls.length;
    const r = api.help();
    expect(typeof r).toBe('string');
    expect(logger.log.mock.calls.length).toBe(before + 1);
  });

  it('is idempotent — second install returns same api, logs no extra banner', () => {
    const logger = { log: vi.fn() };
    const target = {};
    const a1 = installConsoleEgg({ content, stats: {}, target, logger });
    const afterFirst = logger.log.mock.calls.length;
    const a2 = installConsoleEgg({ content, stats: {}, target, logger });
    expect(a2).toBe(a1);
    expect(logger.log.mock.calls.length).toBe(afterFirst);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run test/consoleEgg.test.js`
Expected: FAIL — cannot resolve `consoleEgg.js`.

- [ ] **Step 3: Implement `src/engine/consoleEgg.js`**

```js
// src/engine/consoleEgg.js
// Artist-agnostic console easter egg. The theme supplies the words (content); this
// prints a styled banner and installs a `wu` API on the target (window). Every command
// RETURNS its string and also logs it, so it is unit-testable without scraping console.
// Idempotent per target (guards against React StrictMode's double-invoke). No alert(),
// no overriding native console methods — it only ADDS a banner + target.wu.
export function installConsoleEgg({ content, stats, accent = '#E8B306', target = globalThis, logger = console } = {}) {
  if (target.wu) return target.wu; // already installed (StrictMode-safe)

  let idx = 0;
  const u = content.numbersUnits;
  const n = (v) => (v ?? 0).toLocaleString();

  const fmtStats = (s) =>
    `${n(s?.entities)} ${u.entities}. ${n(s?.links)} ${u.links}. Drawn from ${n(s?.docs)} ${u.docs} ${content.statsTail}`;

  const help = () => {
    const body = content.help.map((h) => `  ${h.cmd.padEnd(13)} ${h.desc}`).join('\n');
    const out = `the cipher responds:\n${body}`;
    logger.log(out);
    return out;
  };
  const wisdom = () => {
    const out = content.aphorisms[idx++ % content.aphorisms.length];
    logger.log(out);
    return out;
  };
  const cipher = () => {
    const out = `${content.ascii}\n${content.creed}`;
    logger.log(out);
    return out;
  };
  const statsCmd = () => {
    const out = fmtStats(stats);
    logger.log(out);
    return out;
  };

  const api = { help, wisdom, cipher, stats: statsCmd };

  // Banner — gold on the void, monospace. One log for title+intro, one for the mark.
  const css = `color:${accent}; font-family:monospace; font-size:12px; line-height:1.5;`;
  logger.log(`%c${content.title}\n\n${content.intro.join('\n')}`, css);
  logger.log(`%c${content.ascii}`, `color:${accent}; font-family:monospace;`);

  target.wu = api;
  return api;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run test/consoleEgg.test.js`
Expected: PASS — 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/engine/consoleEgg.js test/consoleEgg.test.js
git commit -m "feat(engine): installConsoleEgg — window.wu API + styled banner (pure, tested)"
```

---

## Task 2: `theme/wu-tang/console.js` — the Wu content + expose on theme

**Files:**
- Create: `src/theme/wu-tang/console.js`
- Modify: `src/theme/wu-tang/index.js`
- Test: `test/theme.test.js`

- [ ] **Step 1: Add the failing assertion** to `test/theme.test.js` (new `it` inside the existing `describe`):

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run test/theme.test.js`
Expected: FAIL — `wuTangTheme.console` is undefined.

- [ ] **Step 3: Create `src/theme/wu-tang/console.js`**

```js
// Wu-specific console easter-egg content. Data only — the engine (consoleEgg.js)
// applies styling and wiring. No verse text: original aphorisms in the site's voice.
export const wuConsole = {
  title: 'SHAOLIN OBSERVATORY',
  intro: [
    "I see you're here for more knowledge.",
    'The Wu is all-encompassing.',
    'C.R.E.A.M.  Code Rules Everything Around Me.',
    'the cipher responds. type  wu.help()',
  ],
  ascii: String.raw`
   __        __
   \ \  /\  / /
    \ \/  \/ /
     \  /\  /
      \/  \/
  S H A O L I N   O B S E R V A T O R Y
`,
  aphorisms: [
    'The cipher has no edges. Every node is a doorway.',
    'Knowledge is the sun. Wisdom is the orbit it pulls.',
    'Supreme mathematics: a reference is a relationship that kept its receipts.',
    'Nothing is hidden from the one who maps the whole.',
    'The graph is the work. The names were always the point.',
    'Build like the lab: every loop deliberate, every node earned.',
  ],
  help: [
    { cmd: 'wu.wisdom()', desc: 'a gem from the lab' },
    { cmd: 'wu.cipher()', desc: 'redraw the mark' },
    { cmd: 'wu.stats()', desc: 'the numbers behind the galaxy' },
  ],
  numbersUnits: { entities: 'entities', links: 'connections', docs: 'documents' },
  statsTail: 'in the lab.',
  creed: 'C.R.E.A.M.  Code Rules Everything Around Me.',
};
```

- [ ] **Step 4: Wire it into `src/theme/wu-tang/index.js`** — add the import and the property. The file becomes:

```js
import { palette } from './palette.js';
import { typography } from './typography.js';
import { motion } from './motion.js';
import { copy } from './copy.js';
import { nebula } from './nebula.js';
import { suns } from './suns.js';
import { assets } from './assets.js';
import { wuConsole } from './console.js';

// The full Wu-Tang theme object the ThemeProvider injects. The engine consumes ONLY this shape.
export const wuTangTheme = { id: 'wu-tang', palette, typography, motion, copy, nebula, suns, assets, console: wuConsole };
```

- [ ] **Step 5: Run to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run test/theme.test.js`
Expected: PASS (existing + the new console assertion).

- [ ] **Step 6: Commit**

```bash
git add src/theme/wu-tang/console.js src/theme/wu-tang/index.js test/theme.test.js
git commit -m "feat(theme): wu console-egg content + expose theme.console"
```

---

## Task 3: `copy.creed` — the footer creed strings

**Files:**
- Modify: `src/theme/wu-tang/copy.js`
- Test: `test/theme.test.js`

- [ ] **Step 1: Add the failing assertion** to `test/theme.test.js` (new `it` inside the existing `describe`):

```js
  it('carries the C.R.E.A.M. footer creed', () => {
    const c = wuTangTheme.copy.creed;
    expect(c.acronym).toBe('C.R.E.A.M.');
    expect(c.expansion).toMatch(/Code Rules Everything Around Me/);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run test/theme.test.js`
Expected: FAIL — `copy.creed` is undefined.

- [ ] **Step 3: Add `creed` to the `copy` object** in `src/theme/wu-tang/copy.js`. Insert immediately after the `disclaimer:` line (before `about:`):

```js
  creed: { acronym: 'C.R.E.A.M.', expansion: 'Code Rules Everything Around Me' },
```

- [ ] **Step 4: Run to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run test/theme.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/wu-tang/copy.js test/theme.test.js
git commit -m "feat(theme): copy.creed — C.R.E.A.M. footer creed strings"
```

---

## Task 4: Wire into `ExplorerApp` — install egg + two-line footer

**Files:**
- Modify: `src/ExplorerApp.jsx`

- [ ] **Step 1: Update the React import** (line 2). Change:

```jsx
import { useCallback, useEffect, useState } from 'react';
```

to:

```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: Add the installer import** — after the `snapshotStats` import (line 13):

```jsx
import { installConsoleEgg } from './engine/consoleEgg.js';
```

- [ ] **Step 3: Add the install effect** — immediately after the `closeAbout` `useCallback` (after line 59):

```jsx
  // Console easter egg: install once when the galaxy is ready, so wu.stats() reflects
  // live numbers and the banner prints as the universe comes alive.
  const eggInstalled = useRef(false);
  useEffect(() => {
    if (status !== 'ready' || eggInstalled.current) return;
    eggInstalled.current = true;
    installConsoleEgg({
      content: theme.console,
      stats: snapshotStats(snapshot),
      accent: theme.palette.gold,
    });
  }, [status, snapshot, theme]);
```

- [ ] **Step 4: Replace the footer** — swap the existing `<footer>…</footer>` block (currently `bottom: 6`, single disclaimer line) for the two-line stack:

```jsx
      <footer style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', zIndex: 4,
        fontFamily: theme.typography.data, fontSize: 9, color: theme.palette.mute,
        pointerEvents: 'none', lineHeight: 1.5,
      }}>
        <div>
          <span style={{ color: theme.palette.gold, letterSpacing: 1 }}>{theme.copy.creed.acronym}</span>
          {' · '}
          {theme.copy.creed.expansion}
        </div>
        <div>{theme.copy.disclaimer}</div>
      </footer>
```

- [ ] **Step 5: Verify build + full suite**

Run: `node node_modules/vite/bin/vite.js build`
Expected: exit 0.
Run: `node node_modules/vitest/vitest.mjs run`
Expected: all green (theme + consoleEgg + stats + existing suites).

- [ ] **Step 6: Commit**

```bash
git add src/ExplorerApp.jsx
git commit -m "feat: install console egg on ready + C.R.E.A.M. two-line footer"
```

---

## Task 5: Headless live smoke (wiring proof)

**Files:** none (verification only).

The unit tests cover the logic; this confirms the *wiring* (theme.console reaches the engine, `window.wu` exists in the real app, banner prints). Per the project recipe, run vite + chrome + driver in ONE shell (background procs die between turns); Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`, software WebGL flags.

- [ ] **Step 1:** Build, then `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4318` (serves `dist/`).
- [ ] **Step 2:** Launch headless Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9226 --remote-allow-origins=* --user-data-dir=<fresh>`), navigate to `http://127.0.0.1:4318/`, settle ~10s.
- [ ] **Step 3:** Via CDP `Runtime.evaluate` (global `WebSocket`, Node 24), assert:
  - `typeof window.wu === 'object'` and `wu.stats()` returns a string matching `/2,559 entities\. 4,632 connections\. Drawn from 1,454 documents in the lab\./`.
  - `wu.wisdom()` returns a non-empty string; `wu.cipher()` contains `Code Rules`.
  - Capture `Runtime.consoleAPICalled` during navigate: at least one banner log fired; zero `Runtime.exceptionThrown`.
- [ ] **Step 4:** DOM check: footer contains `C.R.E.A.M.` and the disclaimer text on two lines (`document.querySelector('footer').textContent` includes both).
- [ ] **Step 5: Report** results. No commit (verification only). Debug any failure before claiming done.

---

## Self-Review

**1. Spec coverage:** console banner + ASCII → Tasks 1,2 ✓ · `wu.help/wisdom/cipher/stats` → Task 1 (logic) + Task 2 (content) ✓ · live stats via snapshotStats → Task 4 wiring ✓ · no `alert()` / no console override → Task 1 implementation (only adds banner + `target.wu`) ✓ · deterministic wisdom cycle (no `Math.random`) → Task 1 closure counter ✓ · idempotent / StrictMode-safe → Task 1 `if (target.wu) return` + Task 4 `useRef` guard ✓ · footer C.R.E.A.M. kicker, `bottom: 6→8`, gold acronym, text in theme → Tasks 3,4 ✓ · theme/engine seam (content in theme, mechanism in engine) → Tasks 1 vs 2 ✓ · tests → Tasks 1,2,3 + Task 5 smoke ✓.

**2. Placeholder scan:** none. ASCII art, aphorisms, help, creed, stats format, footer JSX all concrete. Task 5's CDP steps describe exact assertions (mirrors the established headless recipe), not vague "verify it works".

**3. Type consistency:** `installConsoleEgg({ content, stats, accent, target, logger })` — same signature in Task 1 impl, Task 1 tests, and Task 4 call site. `content` shape (`title/intro/ascii/aphorisms/help[{cmd,desc}]/numbersUnits{entities,links,docs}/statsTail/creed`) defined in Task 2 `console.js` matches Task 1's reads and the Task-2 test. `stats` is `{entities,links,docs}` = `snapshotStats` output (existing). `copy.creed{acronym,expansion}` (Task 3) matches the Task-4 footer reads and the Task-3 test. `theme.console` (Task 2 index wiring) matches Task 4's `theme.console` read.

**Note (intentional spec refinement):** `numbersUnits` lives on `theme.console` (self-contained) rather than being borrowed from `copy.about.numbersUnits` — keeps the engine decoupled from `copy.about`. Same three nouns; 3-word duplication accepted for a clean seam.

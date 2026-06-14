# Console Easter Egg + C.R.E.A.M. Footer Creed — Design Spec

**Date:** 2026-06-14
**Status:** Approved (brainstorm) — pending spec review

## Goal

Reward the curious. Anyone who opens DevTools on the Shaolin Observatory meets a
styled Wu console banner and a small interactive `wu.*` API, in a mystic-sage
voice (the snooper is a *seeker*, not an intruder). On the page itself, a quiet
C.R.E.A.M. creed in the footer — "Code Rules Everything Around Me" — signs the
work without hijacking the poetic subtitle. The two echo the same motif: visible
and quiet on the page, full payoff in the console.

## Guardrails (inherited from the site)

- **No verse text / no copyrighted lyrics** — all console lines are *original*
  aphorisms in the site's cipher/Shaolin/supreme-math voice. C.R.E.A.M. is used
  only as the user's transformative dev-flip ("**Code** Rules Everything Around
  Me"), their established coinage.
- **Punctuation:** colons/periods/parentheses over em-dashes (project voice).
- **Theme/engine seam:** Wu *content* lives in the theme; the *mechanism* lives
  in the engine — same discipline as `copy.js` (theme) and `stats.js` (engine).

## Architecture

```
src/theme/wu-tang/console.js   CREATE  theme   the words + ASCII art (data only)
src/theme/wu-tang/copy.js      MODIFY  theme   + copy.creed { acronym, expansion }
src/theme/wu-tang/<index>      MODIFY  theme   expose `console` on the theme object
src/engine/consoleEgg.js       CREATE  engine  installConsoleEgg({content,stats}) -> api
src/ExplorerApp.jsx            MODIFY  app     install once in the ready-effect; footer kicker
test/consoleEgg.test.js        CREATE          api shape, formatting, double-install guard
test/theme.test.js             MODIFY          + theme.console shape, + copy.creed shape
```

`consoleEgg.js` is artist-agnostic: it takes content + a stats object and does
the printing + `window.wu` wiring. A future `canibus-atlas` supplies a different
`console.js` and inherits the whole mechanism. Verify the exact theme-assembly
file during planning (likely `src/theme/wu-tang/index.js`); `console` joins
`palette`/`typography`/`copy` on the theme object the same way `copy` does.

## Component contracts

### `engine/consoleEgg.js`

```
installConsoleEgg({ content, stats }) -> wuApi | existing wuApi
```

- **content**: the theme's `console` object (see shape below).
- **stats**: `{ entities, links, docs }` (the `snapshotStats(snapshot)` shape).
- **Behavior on first call:** print the styled banner (intro + ASCII via `%c`),
  then define `window.wu`. Returns the api object.
- **Idempotent:** a module-level `installed` flag guards against StrictMode's
  double-invoke and any re-render. Second call is a no-op that returns the
  existing `window.wu`.
- **`window.wu` api** — every command **returns** its string *and* `console.log`s
  it (so unit tests assert return values without scraping the console):
  - `wu.help()`   → the command menu (from `content.help`).
  - `wu.wisdom()` → one line from `content.aphorisms` (rotates; see Randomness).
  - `wu.cipher()` → re-prints the ASCII W + the creed line.
  - `wu.stats()`  → formatted live numbers (see format below).
- **No `alert()`. No overriding native `console` methods.** Add only: a banner +
  `window.wu`.
- **Randomness without `Math.random` foot-guns:** pick the aphorism by a small
  module-level counter that increments each call (`aphorisms[i++ % len]`). This
  is deterministic per page session, cycles the whole pool, and is trivially
  testable. (The workflow runtime also forbids `Math.random` in some contexts;
  the counter sidesteps it entirely.)

### `wu.stats()` format

Engine composes from `stats` + themed nouns:

```
"2,559 entities. 4,632 connections. Drawn from 1,454 documents in the lab."
```

Numbers via `Number.prototype.toLocaleString()`. Nouns (`entities`,
`connections`, `documents`) reuse `copy.about.numbersUnits`; the flavor tail
(`"in the lab."`) is `content.statsTail`. Null-safe: missing stats render `0`.

### `theme.console` shape (in `console.js`)

```js
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
  statsTail: 'in the lab.',
  creed: 'C.R.E.A.M.  Code Rules Everything Around Me.',
};
```

(Console `%c` styling — gold `#…` on the void bg, mono — is applied in the
engine, not stored as data. Exact palette hooks resolved at implementation from
`theme.palette`.)

### `copy.creed` (footer)

```js
creed: { acronym: 'C.R.E.A.M.', expansion: 'Code Rules Everything Around Me' },
```

### Footer (in `ExplorerApp.jsx`)

The existing `<footer>` (currently `bottom: 6`, one muted 9px mono line = the
disclaimer) becomes a two-line stack, lifted to `bottom: 8`:

```
C.R.E.A.M. · Code Rules Everything Around Me      (kicker)
Unofficial fan tribute. Not affiliated with or…   (existing disclaimer)
```

- Kicker line: `copy.creed.acronym` in `palette.gold` with `letterSpacing`,
  a `·` separator, then `copy.creed.expansion` in `palette.mute`. Same 9px mono,
  `pointerEvents: 'none'`, centered.
- Disclaimer line unchanged below it.
- `bottom: 6 → 8` so the two-line stack breathes off the edge.

## Wiring (ExplorerApp ready-effect)

Install inside the existing `status === 'ready'` effect (where the About modal
already receives `snapshotStats(snapshot)`), so `wu.stats()` has live numbers and
the banner prints as the galaxy comes alive. Guard with a `useRef` so it installs
once; the engine's module flag is the second line of defense.

```jsx
installConsoleEgg({ content: theme.console, stats: snapshotStats(snapshot) });
```

## Testing

- **`test/consoleEgg.test.js`**
  - `installConsoleEgg` returns an api with `help/wisdom/cipher/stats`.
  - `stats({entities:2559,links:4632,docs:1454})` returns the exact formatted
    line; null/empty stats render `0`s.
  - `wisdom()` returns a string from `content.aphorisms`; successive calls cycle
    the pool (counter, not random).
  - Double-install guard: second `installConsoleEgg` returns the same api and
    does not re-define/duplicate.
  - Tests inject a fake `content`/`window` so they don't depend on the real
    theme or a browser; assert on returned strings, not console output.
- **`test/theme.test.js`**
  - `theme.console` shape: `intro` (array ≥3), `ascii` (truthy), `aphorisms`
    (array ≥4), `help` (array of `{cmd,desc}`), `statsTail`, `creed`.
  - `copy.creed`: `{ acronym, expansion }`, expansion matches `/Code Rules/`.

## Out of scope (YAGNI)

- DevTools-open *detection* (unreliable; banner-on-load is the right pattern).
- Reactive "escalating mischief" (option C) — not now.
- Obfuscation beyond Vite's default minify (the build already minifies; no
  source maps shipped).
- Console `%c` theming abstraction — inline in the engine; one theme today.

## Self-review

- **Placeholders:** none. ASCII art, aphorisms, help, footer copy all concrete.
  One TODO-at-plan-time: confirm the theme-assembly filename and palette hooks
  (noted explicitly, not a content gap).
- **Consistency:** `stats` shape matches `snapshotStats` and the About modal's
  consumer; `theme.console` reads match the engine; install site matches the
  existing ready-effect pattern.
- **Scope:** single focused plan — two small surfaces (console + footer) sharing
  one motif. No decomposition needed.
- **Ambiguity:** "responses" resolved to a typed `wu.*` API (option B); "alerts"
  resolved to styled console banners (not `alert()`); randomness resolved to a
  deterministic counter.

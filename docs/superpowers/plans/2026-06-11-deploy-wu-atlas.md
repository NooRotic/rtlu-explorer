# Deploy `wu-atlas.nooroticx.tv` — Implementation Plan

> **For agentic workers:** small ops task. Steps use checkbox (`- [ ]`) tracking. Code steps carry exact file contents; manual steps (GitHub/DNS) are the human's and are clearly marked **[MANUAL]**.

**Goal:** Ship the RTLU Explorer to the public at **`https://wu-atlas.nooroticx.tv`**, auto-deployed from `main` via GitHub Actions → GitHub Pages, mirroring the proven **prism** (`twitch-glaze-me`) setup.

**Decision recap (locked):** GitHub Pages (not IONOS) — rtlu is the same Vite+pnpm+`dist/` stack as prism, already public, with **no runtime secrets** (static JSON, fonts from Google CDN), so Pages is near-zero-config and auto-deploys. The heavier wsp-sender IONOS/SSH pattern exists only to preserve gitignored media, which rtlu doesn't have. Naming system: `<artist>-atlas.nooroticx.tv` (RTLU = the *Universe*; each artist site = an *Atlas*). First site: `wu-atlas`.

**Reference:** `prism` (`C:/Dev/projects/twitch-glaze-me/.github/workflows/deploy.yml`) deploys to Pages at `prism.nooroticx.tv` via a `CNAME` file.

**Pre-deploy scan:** ✅ completed 2026-06-11 — no tracked secrets/`.env`, no hardcoded local paths, no debug `console.*`, no TODO/FIXME, no `localhost`/dev URLs; build green; 32/32 tests.

---

## Task 1: Deploy workflow (Pages, on push to `main`)

**Files:** Create `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

Mirrors prism, plus a `pnpm test` gate before build (rtlu has a real suite; prism kept tests in a separate ci.yml). No `env:` block — rtlu has no build-time secrets.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test            # gate: never deploy a red build
      - run: pnpm build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit** — `git add .github/workflows/deploy.yml && git commit -m "ci: GitHub Pages deploy workflow (mirrors prism)"`

---

## Task 2: PR CI (test + build on pull requests)

**Files:** Create `.github/workflows/ci.yml`

Keeps PRs honest without double-running on `main` (deploy.yml already tests `main`).

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2: Commit** — `git add .github/workflows/ci.yml && git commit -m "ci: test + build on pull requests"`

---

## Task 3: Custom-domain `CNAME` (shipped in the build)

**Files:** Create `public/CNAME`

Vite copies `public/` to the `dist/` root, so the Pages artifact includes `dist/CNAME` — the robust way to pin the custom domain for artifact deploys (survives re-deploys; doesn't depend solely on the repo UI setting).

- [ ] **Step 1: Create `public/CNAME`** with exactly one line (no trailing whitespace):

```
wu-atlas.nooroticx.tv
```

- [ ] **Step 2: Verify the build emits it** — `node node_modules/vite/bin/vite.js build` then confirm `dist/CNAME` exists and reads `wu-atlas.nooroticx.tv`.

- [ ] **Step 3: Commit** — `git add public/CNAME && git commit -m "ci: pin custom domain wu-atlas.nooroticx.tv via public/CNAME"`

**Base-path note:** `vite.config.js` keeps `base: './'` (relative). It works at a custom-domain **root** *and* a github.io subpath — strictly more portable than prism's `base:'/'`. No change needed. The data loader already uses `import.meta.env.BASE_URL`, so `public/data/...` fetches resolve correctly at the root.

---

## Task 4: README deploy section

**Files:** Modify `README.md`

- [ ] **Step 1:** Replace the architecture-table row `| `rtlu-explorer` (this) | public | static viz, deployed to IONOS |` with:

```markdown
| `rtlu-explorer` (this) | public | static viz, deployed to GitHub Pages → `wu-atlas.nooroticx.tv` |
```

- [ ] **Step 2:** Replace the entire `## Deploy` section body with:

```markdown
## Deploy

Auto-deployed to **GitHub Pages** at **https://wu-atlas.nooroticx.tv** on every push to `main`
(`.github/workflows/deploy.yml`: install → test → `pnpm build` → upload `dist/` → Pages). The
custom domain is pinned by `public/CNAME` plus a DNS `CNAME` record (`wu-atlas → NooRotic.github.io`).

Multi-artist builds ship as **separate sites** under the same naming system —
`canibus-atlas.nooroticx.tv`, `mitski-atlas.nooroticx.tv` — each its own build/deploy.
```

- [ ] **Step 3: Commit** — `git add README.md && git commit -m "docs: README deploy section → GitHub Pages / wu-atlas.nooroticx.tv"`

---

## Task 5: [MANUAL] GitHub Pages + DNS (the human does these once)

These can't be scripted from here — they're in the GitHub UI and your DNS host.

- [ ] **GitHub repo → Settings → Pages → Build and deployment → Source: `GitHub Actions`.**
- [ ] **(Optional, the `public/CNAME` already covers it):** Settings → Pages → Custom domain = `wu-atlas.nooroticx.tv` → Save; tick **Enforce HTTPS** once the cert provisions.
- [ ] **DNS at the `nooroticx.tv` host** (wherever prism's records live): add a **`CNAME`** record:
  - Host/Name: `wu-atlas`
  - Value/Target: `NooRotic.github.io`  *(apex would need A records; this is a subdomain, so CNAME is correct)*
- [ ] DNS propagation can take minutes–hours; GitHub will show a green check on the Pages custom-domain once it resolves + cert issues.

---

## Task 6: Trigger + verify

- [ ] **Step 1:** Merge `polish-deploy` (this branch) → `main` (the deploy workflow only runs on `main`). The push triggers `deploy.yml`.
- [ ] **Step 2:** Watch the run: `gh run watch` (or repo → Actions). Expect green: install → test (32 passing) → build → deploy.
- [ ] **Step 3: Verify live** at `https://wu-atlas.nooroticx.tv`:
  - [ ] Page loads over **HTTPS**; deep-dark background, graph renders (suns + gold web).
  - [ ] `public/data/...` JSON fetches succeed (Network tab 200s) — confirms relative base works at root.
  - [ ] Dock, search, WU-STARS, drawer, islands toggle all work.
  - [ ] No console errors. Title/fonts correct (Google Fonts load).
  - [ ] Tribute disclaimer visible in footer.
- [ ] **Step 4:** If anything 404s (asset paths), it means the base/CNAME interplay is off — check `dist/CNAME` shipped and Pages custom domain is set; relative `./` assets should otherwise resolve.

---

## Notes / future

- **Multi-artist (Phase 4):** Pages = one custom domain per repo. When Canibus/Mitski arrive, the clean path is a **separate repo per artist** (matches the "separate sites from separate builds" decision) each with its own `deploy.yml` + `CNAME`, OR revisit IONOS (one account, many subdomain docroots via the wsp-sender SSH pattern). Not needed for Wu.
- **Perf (optional later):** the JS bundle is ~1.64 MB (three.js), ~450 KB gzipped — Pages serves gzip automatically, so no `.htaccess` needed (that was an IONOS-only concern).
- **nebula tuning** remains the one open viz-polish item (`theme/wu-tang/nebula.js`) — independent of deploy.

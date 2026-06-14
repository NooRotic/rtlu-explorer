# Deploy `wu-atlas.nooroticx.tv` (IONOS) — Implementation Plan

> Small ops task. Code steps carry exact contents; manual steps (IONOS subdomain, DNS, GitHub secrets) are the human's, marked **[MANUAL]**.

**Goal:** Ship the RTLU Explorer to **`https://wu-atlas.nooroticx.tv`** on **IONOS shared hosting**, deployed from GitHub Actions over SSH/SCP (manual `workflow_dispatch`), mirroring the proven **wsp-cast-sender** pattern.

**Host decision (revised 2026-06-13):** **IONOS, not GitHub Pages** — the user wants the build hosted on the IONOS-served `nooroticx.tv`, not github.io. `base: './'` was originally chosen for IONOS docroots (see `vite.config.js` comment), so it's already correct; no `CNAME` file (DNS points the subdomain at IONOS). The heavier SSH pattern is justified here because that's where the user wants the bytes.

**Naming:** `<artist>-atlas.nooroticx.tv`; first site `wu-atlas`. (RTLU = the *Universe*; each artist site = an *Atlas*.)

**Pre-deploy scan:** ✅ 2026-06-11 — no tracked secrets/`.env`, no hardcoded local paths, no debug `console.*`, no TODO/FIXME, no `localhost`/dev URLs; build green; tests pass.

---

## Task 1: IONOS deploy workflow

**Files:** `.github/workflows/deploy.yml` (already written — verify it matches below)

Manual `workflow_dispatch` (production deploys are deliberate, not on every push). `test` job → `build-and-deploy` job: build `dist/` → backup current docroot → SCP `dist/*` (clean replace) → chmod 644/755 → prune to last 3 backups. Secrets: `SSH_HOST`, `SSH_USERNAME`, `SSH_PASSWORD`, `SSH_PORT`, `DEPLOY_PATH`. No `ENV_FILE` (rtlu has no build-time secrets). Build output is Vite `dist/` (not Next `out/`).

- [ ] Confirm `.github/workflows/deploy.yml` exists with the IONOS SSH/SCP content (test → build → backup → scp `dist/*` → perms → prune).

## Task 2: PR CI (unchanged, host-agnostic)

- [ ] `.github/workflows/ci.yml` runs `pnpm test` + `pnpm build` on pull requests. (Already present; keep.)

## Task 3: Base path (no change)

- [ ] `vite.config.js` keeps `base: './'` — correct for an IONOS docroot. No `CNAME` file (removed; Pages-only).

## Task 4: README (done)

- [ ] README architecture row + Deploy section reflect **IONOS via SSH/SCP**. (Updated 2026-06-13.)

## Task 5: [MANUAL] IONOS + DNS + GitHub secrets (one-time)

- [ ] **IONOS panel:** create the subdomain `wu-atlas.nooroticx.tv` and point its **document root** at a dedicated folder (e.g. `/wu-atlas` or the IONOS-assigned webspace path). Note that path → it becomes `DEPLOY_PATH`.
- [ ] **SSH/SFTP:** ensure SSH access is enabled for the IONOS webspace; note host, username, port. (Same account that serves the other `nooroticx.tv` sites.)
- [ ] **DNS:** point `wu-atlas` at the IONOS site (per IONOS's subdomain setup — usually automatic when the subdomain is created in the panel; otherwise an A/CNAME per IONOS instructions). Enable HTTPS (IONOS SSL/Let's Encrypt) for the subdomain.
- [ ] **GitHub → repo Settings → Secrets and variables → Actions** → add: `SSH_HOST`, `SSH_USERNAME`, `SSH_PASSWORD`, `SSH_PORT`, `DEPLOY_PATH`.

## Task 6: Trigger + verify

- [ ] **Step 1:** Merge the deploy branch → `main` (so the workflow exists on the default branch).
- [ ] **Step 2:** Run it: repo → Actions → **Deploy to IONOS** → **Run workflow** (`workflow_dispatch`). Or `gh workflow run "Deploy to IONOS"`.
- [ ] **Step 3:** Watch the run green: test → build → backup → SCP → perms → prune.
- [ ] **Step 4: Verify live** at `https://wu-atlas.nooroticx.tv`:
  - [ ] HTTPS; deep-dark background; graph renders (suns + gold web).
  - [ ] `data/...` JSON fetches 200 (relative `base:'./'` resolves at the docroot root).
  - [ ] Dock, search, WU-STARS, drawer, islands toggle, About modal all work.
  - [ ] OG card resolves at `https://wu-atlas.nooroticx.tv/og.png`; favicon loads; no console errors.

---

## Notes

- **Why manual trigger:** SSH production deploys benefit from a deliberate push (vs auto-on-merge). If auto is wanted later, add `on: push: branches: [main]`.
- **Multi-artist (Phase 4):** IONOS hosts many subdomains under one account — `canibus-atlas`/`mitski-atlas` become additional `DEPLOY_PATH`s (separate builds), no per-repo Pages-domain limit.
- **Perf:** IONOS Apache — a `.htaccess` for gzip + cache headers on the docroot is an optional later win (the JS bundle gzips ~1.64MB→~450KB). Not required for launch.
- **nebula tuning** remains the one open viz-polish item, independent of deploy.

// src/ExplorerApp.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeContext.jsx';
import { wuTangTheme } from './theme/wu-tang/index.js';
import { useGraphData } from './engine/useGraphData.js';
import { useNodeBudget } from './engine/useNodeBudget.js';
import GraphScene from './engine/GraphScene.jsx';
import BudgetSlider from './ui/BudgetSlider.jsx';
import Drawer from './ui/Drawer.jsx';
import WuDock from './ui/WuDock.jsx';
import StarsPanel from './ui/StarsPanel.jsx';
import AboutModal from './ui/AboutModal.jsx';
import { snapshotStats } from './engine/stats.js';
import { installConsoleEgg } from './engine/consoleEgg.js';
import WuMenu from './ui/WuMenu.jsx';

const ARTIST = 'wu-tang-clan';
const ISLANDS_KEY = `rtlu.showIslands.${ARTIST}`;
const SEEN_KEY = `rtlu.seenIntro.${ARTIST}`;

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
  const [standoff, setStandoff] = useState(120); // camera fly-in distance; WU-STARS picks land further back
  const [showIslands, setShowIslands] = useState(() => {
    try { return globalThis.localStorage?.getItem(ISLANDS_KEY) !== 'false'; } catch { return true; }
  });
  const strategy = 'structural';

  useEffect(() => {
    try { globalThis.localStorage?.setItem(ISLANDS_KEY, String(showIslands)); } catch { /* ignore */ }
  }, [showIslands]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [menu, setMenu] = useState(null);        // { x, y, node } | null
  const [flyReq, setFlyReq] = useState(null);     // { node, nonce }
  const [resetNonce, setResetNonce] = useState(0);
  const flyNonce = useRef(0);

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

  // Console easter egg: install once when the galaxy is ready, so wu.stats() reports the
  // loaded snapshot numbers and the banner prints as the universe comes alive.
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

  const onBuilt = useCallback((g) => setGraph(g), []);

  // Core selection primitive: isolate `node` (white web + dim + camera), optionally opening the
  // dossier. `node = null` clears the selection (deselect + un-dim) WITHOUT re-framing the camera.
  const isolateNode = useCallback((node, withDossier) => {
    setStandoff(120);
    setSelected(node);
    setDossierOpen(!!node && withDossier);
    setStarsOpen(false);
  }, []);
  // Canvas/dock/search select → full experience (isolate + dossier open).
  const select = useCallback((node) => isolateNode(node, true), [isolateNode]);
  // WU-STARS pick: land the camera further back, dossier open.
  const selectFromStars = useCallback((node) => { setStandoff(210); setSelected(node); setDossierOpen(true); setStarsOpen(false); }, []);
  const toggleStars = useCallback(() => { setStarsOpen((o) => { if (!o) { setSelected(null); setDossierOpen(false); } return !o; }); }, []);

  // Close the dossier sidebar WITHOUT deselecting — the white web persists.
  const closeDossier = useCallback(() => setDossierOpen(false), []);

  // Full reset to a fresh float: clear selection + dossier, close the menu, re-frame the camera.
  const reset = useCallback(() => {
    setSelected(null);
    setDossierOpen(false);
    setMenu(null);
    setResetNonce((n) => n + 1);
  }, []);

  // Right-click → open the wu-menu at the cursor (node = target, or null for background).
  const openNodeMenu = useCallback((node, e) => { e?.preventDefault?.(); setMenu({ x: e?.clientX ?? 0, y: e?.clientY ?? 0, node }); }, []);
  const openBgMenu = useCallback((e) => { e?.preventDefault?.(); setMenu({ x: e?.clientX ?? 0, y: e?.clientY ?? 0, node: null }); }, []);
  const closeMenu = useCallback(() => setMenu(null), []);
  const onMenuAction = useCallback((id, node) => {
    if (id === 'reset') { reset(); return; }
    if (!node) return;
    if (id === 'isolate') isolateNode(node, false);        // visual web only, no sidebar
    else if (id === 'dossier') isolateNode(node, true);     // isolate + sidebar (= left-click)
    else if (id === 'fly') setFlyReq({ node, nonce: (flyNonce.current += 1) }); // camera only, no select
    else if (id === 'copy') { try { navigator.clipboard?.writeText(node.name); } catch { /* ignore */ } }
  }, [reset, isolateNode]);

  if (status === 'loading') return <Centered theme={theme}>Loading the universe…</Centered>;
  if (status === 'error') return <Centered theme={theme}>Could not load the snapshot: {error}</Centered>;

  return (
    <div onContextMenu={(e) => e.preventDefault()} style={{ position: 'fixed', inset: 0, background: theme.palette.bgBase }}>
      <Title theme={theme} />

      <GraphScene
        snapshot={snapshot}
        budget={budget}
        strategy={strategy}
        focusId={selected?.id ?? null}
        showIslands={showIslands}
        flyStandoff={standoff}
        onSelect={select}
        onBuilt={onBuilt}
        onNodeRightClick={openNodeMenu}
        onBackgroundRightClick={openBgMenu}
        flyRequest={flyReq}
        resetNonce={resetNonce}
      />

      {/* Top-left control cluster: budget slider + islands toggle, under the title */}
      <div style={{ position: 'absolute', top: 86, left: 18, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BudgetSlider value={budget} total={total} onChange={setBudget} />
        <IslandsToggle theme={theme} on={showIslands} onChange={setShowIslands} />
        {selected && (
          <button
            onClick={reset}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: 'transparent', border: 'none', padding: '2px 0',
              fontFamily: theme.typography.data, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
              color: theme.palette.mute,
            }}
          >
            <span aria-hidden="true" style={{ color: theme.palette.gold }}>⊗</span> reset
          </button>
        )}
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
      </div>

      <StarsPanel graph={graph} open={starsOpen} onToggle={toggleStars} onPick={selectFromStars} />
      <WuDock graph={graph} roster={theme.suns.roster} onSelect={select} />
      <Drawer node={dossierOpen ? selected : null} graph={graph} onClose={closeDossier} />
      <AboutModal open={aboutOpen} stats={snapshotStats(snapshot)} onClose={closeAbout} />
      <WuMenu menu={menu} onAction={onMenuAction} onClose={closeMenu} />

      <footer style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', zIndex: 4,
        fontFamily: theme.typography.data, fontSize: 9, color: theme.palette.mute,
        pointerEvents: 'none', lineHeight: 1.5,
      }}>
        <div aria-hidden="true">
          <span style={{ color: theme.palette.gold, letterSpacing: 1 }}>{theme.copy.creed.acronym}</span>
          {' · '}
          {theme.copy.creed.expansion}
        </div>
        <div>{theme.copy.disclaimer}</div>
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

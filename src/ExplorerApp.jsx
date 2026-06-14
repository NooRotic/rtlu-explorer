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
import AboutModal from './ui/AboutModal.jsx';
import { snapshotStats } from './engine/stats.js';

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

  const onBuilt = useCallback((g) => setGraph(g), []);
  // Selecting from the canvas/dock/search closes the stars list (swap) and opens the entity, with
  // the normal close-in camera standoff.
  const select = useCallback((node) => { setStandoff(120); setSelected(node); setStarsOpen(false); }, []);
  // Selecting from the WU-STARS list lands the camera further back (more context while browsing).
  const selectFromStars = useCallback((node) => { setStandoff(210); setSelected(node); setStarsOpen(false); }, []);
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
        flyStandoff={standoff}
        onSelect={select}
        onBuilt={onBuilt}
      />

      {/* Top-left control cluster: budget slider + islands toggle, under the title */}
      <div style={{ position: 'absolute', top: 86, left: 18, zIndex: 5, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BudgetSlider value={budget} total={total} onChange={setBudget} />
        <IslandsToggle theme={theme} on={showIslands} onChange={setShowIslands} />
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
      <Drawer node={selected} graph={graph} onClose={() => setSelected(null)} />
      <AboutModal open={aboutOpen} stats={snapshotStats(snapshot)} onClose={closeAbout} />

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

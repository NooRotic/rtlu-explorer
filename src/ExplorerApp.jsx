// src/ExplorerApp.jsx
import { useCallback, useState } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeContext.jsx';
import { wuTangTheme } from './theme/wu-tang/index.js';
import { useGraphData } from './engine/useGraphData.js';
import { useNodeBudget } from './engine/useNodeBudget.js';
import GraphScene from './engine/GraphScene.jsx';
import BudgetSlider from './ui/BudgetSlider.jsx';
import Drawer from './ui/Drawer.jsx';

const ARTIST = 'wu-tang-clan';

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
  const strategy = 'structural';

  const onBuilt = useCallback((g) => setGraph(g), []);
  const onSelect = useCallback((node) => setSelected(node), []);

  const full = { position: 'fixed', inset: 0, background: theme.palette.bgBase };

  if (status === 'loading') return <Centered theme={theme}>Loading the universe…</Centered>;
  if (status === 'error') return <Centered theme={theme}>Could not load the snapshot: {error}</Centered>;

  return (
    <div style={full}>
      <Title theme={theme} />
      <GraphScene
        snapshot={snapshot}
        budget={budget}
        strategy={strategy}
        focusId={selected?.id ?? null}
        onSelect={onSelect}
        onBuilt={onBuilt}
      />
      <BudgetSlider value={budget} total={total} onChange={setBudget} />
      <Drawer node={selected} graph={graph} onClose={() => setSelected(null)} />
    </div>
  );
}

function Title({ theme }) {
  return (
    <div style={{ position: 'absolute', top: 20, left: 22, zIndex: 5, pointerEvents: 'none' }}>
      <h1 style={{ fontFamily: theme.typography.title, fontSize: 24, color: theme.palette.goldPale, margin: 0, letterSpacing: 0.5 }}>
        {theme.copy.title}
      </h1>
      <p style={{ fontFamily: theme.typography.body, fontSize: 13, color: theme.palette.mute, margin: '2px 0 0' }}>
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

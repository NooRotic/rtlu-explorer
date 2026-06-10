// src/ui/Drawer.jsx
import { useTheme } from '../theme/ThemeContext.jsx';
import { entityStats } from '../engine/selectors.js';

export default function Drawer({ node, graph, onClose }) {
  const { palette, typography, copy } = useTheme();
  if (!node || !graph) return null;
  const stats = entityStats(node, graph.degree, graph.links, (id) => graph.byId[id]);

  return (
    <aside
      style={{
        position: 'absolute', top: 0, right: 0, height: '100%', width: 340, zIndex: 6,
        background: 'linear-gradient(180deg, rgba(7,9,18,0.96), rgba(4,5,10,0.98))',
        borderLeft: `1px solid ${hexA(palette.gold, 0.3)}`, padding: '26px 24px', overflowY: 'auto',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: palette.mute, fontSize: 20, cursor: 'pointer' }}
        aria-label="close"
      >×</button>

      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold }}>
        dossier
      </div>
      <h2 style={{ fontFamily: typography.title, fontSize: 26, color: palette.goldPale, margin: '6px 0 4px', lineHeight: 1.1 }}>
        {node.name}
      </h2>

      {/* The Phase-2.5 hook: an intentionally empty type row that lights up when entities know what they are. */}
      <div style={{ fontFamily: typography.data, fontSize: 12, color: palette.mute, marginBottom: 14 }}>
        {copy.drawer.typeRow}: <span style={{ color: palette.cyan }}>{node.type || copy.drawer.typePlaceholder}</span>
      </div>

      <Stat label={copy.drawer.referenced} value={`${stats.count.toLocaleString()}×`} t={typography} c={palette} />
      <Stat label={copy.drawer.degree} value={stats.degree.toLocaleString()} t={typography} c={palette} />
      {stats.strongest && (
        <Stat label={copy.drawer.strongestTie} value={`${stats.strongest.name} · w${stats.strongest.weight}`} t={typography} c={palette} />
      )}

      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold, margin: '18px 0 6px' }}>
        {copy.drawer.topEdges}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stats.topEdges.map((e, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px dashed ${hexA(palette.ash, 0.18)}`, fontFamily: typography.body, fontSize: 14, color: palette.ink }}>
            <span>{e.name}</span>
            <span style={{ fontFamily: typography.data, color: palette.gold }}>w{e.weight}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Stat({ label, value, t, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: `1px dashed ${hexA(c.ash, 0.18)}` }}>
      <span style={{ fontFamily: t.data, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: c.gold }}>{label}</span>
      <span style={{ fontFamily: t.body, fontSize: 14, color: c.ink }}>{value}</span>
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

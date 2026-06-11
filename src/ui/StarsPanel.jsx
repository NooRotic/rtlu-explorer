// src/ui/StarsPanel.jsx
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { topNByDegree } from '../engine/selectors.js';

// Top-right trigger title + a panel that slides in from the far right with the top-N most-connected
// entities ("the stars"). Picking a row selects it (parent swaps this panel for the J-card drawer).
export default function StarsPanel({ graph, open, onToggle, onPick }) {
  const { palette, typography, copy } = useTheme();
  const stars = useMemo(
    () => (graph ? topNByDegree(graph.nodes, graph.degree, 50) : []),
    [graph],
  );

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', top: 22, right: 24, zIndex: 7, background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: typography.data, fontSize: 13, letterSpacing: 1,
          color: palette.gold, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {copy.stars.title} <span style={{ transition: 'transform 200ms', transform: open ? 'rotate(90deg)' : 'none' }}>&#9658;</span>
      </button>

      <aside style={{
        position: 'absolute', top: 0, right: 0, height: '100%', width: 300, zIndex: 6,
        transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 260ms ease',
        background: 'linear-gradient(180deg, rgba(7,9,18,0.96), rgba(4,5,10,0.98))',
        borderLeft: `1px solid ${hexA(palette.gold, 0.3)}`, padding: '60px 18px 18px', overflowY: 'auto',
      }}>
        <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold, marginBottom: 10 }}>
          {copy.stars.hint}
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {stars.map((n, i) => (
            <li key={n.id}>
              <button
                onClick={() => onPick?.(n)}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', gap: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '8px 6px', borderTop: `1px dashed ${hexA(palette.ash, 0.16)}`,
                  color: palette.ink, fontFamily: typography.body, fontSize: 14, textAlign: 'left',
                }}
              >
                <span><span style={{ color: palette.mute, fontFamily: typography.data, fontSize: 11 }}>{i + 1}. </span>{n.name}</span>
                <span style={{ fontFamily: typography.data, color: palette.gold, fontSize: 11 }}>deg {graph.degree[n.id]}</span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

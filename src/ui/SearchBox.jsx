// src/ui/SearchBox.jsx
import { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { searchEntities } from '../engine/search.js';

export default function SearchBox({ graph, onPick }) {
  const { palette, typography, copy } = useTheme();
  const [q, setQ] = useState('');
  const results = useMemo(
    () => (graph ? searchEntities(q, graph.nodes, graph.degree, 8) : []),
    [q, graph],
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={copy.search.placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7,
          background: 'rgba(7,9,18,0.9)', border: `1px solid ${hexA(palette.gold, 0.3)}`,
          color: palette.ink, fontFamily: typography.body, fontSize: 13, outline: 'none',
        }}
      />
      {q.trim() && (
        <ul style={{
          listStyle: 'none', margin: '6px 0 0', padding: 4, position: 'absolute', bottom: '100%',
          left: 0, right: 0, marginBottom: 6, maxHeight: 260, overflowY: 'auto',
          background: 'rgba(7,9,18,0.97)', border: `1px solid ${hexA(palette.gold, 0.25)}`, borderRadius: 8,
        }}>
          {results.length === 0 && (
            <li style={{ padding: '8px 10px', color: palette.mute, fontFamily: typography.body, fontSize: 12 }}>
              {copy.search.empty}
            </li>
          )}
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => { onPick?.(r.id); setQ(''); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12,
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '7px 8px',
                  color: palette.ink, fontFamily: typography.body, fontSize: 13, textAlign: 'left',
                }}
              >
                <span>{r.name}</span>
                <span style={{ fontFamily: typography.data, color: palette.gold, fontSize: 11 }}>deg {r.degree}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

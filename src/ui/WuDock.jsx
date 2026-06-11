// src/ui/WuDock.jsx
import { useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import WuCoin from './WuCoin.jsx';
import SearchBox from './SearchBox.jsx';

// Silver floating dock: the 11 member coins with macOS-style magnify, and a search field that
// "breathes open" beneath the coins on hover. Members come from the byId map keyed by the roster.
export default function WuDock({ graph, roster, onSelect }) {
  const { palette, typography, copy } = useTheme();
  const [hovered, setHovered] = useState(null); // coin index under pointer
  const [open, setOpen] = useState(false);      // dock expanded (search visible)
  const [searchFocused, setSearchFocused] = useState(false);

  if (!graph) return null;
  const members = roster.map((name) => byName(graph, name)).filter(Boolean);

  // Dock magnification: neighbors of the hovered coin scale partially.
  const scaleFor = (i) => {
    if (hovered == null) return 1;
    const d = Math.abs(i - hovered);
    return d === 0 ? 1.5 : d === 1 ? 1.25 : d === 2 ? 1.08 : 1;
  };

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setHovered(null); if (!searchFocused) setOpen(false); }}
      style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '10px 16px 12px', borderRadius: 16,
        background: `linear-gradient(180deg, ${palette.silver}, ${hexA(palette.silverEdge, 0.9)})`,
        border: `1px solid ${palette.silverEdge}`, boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ fontFamily: typography.data, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.coinInk, opacity: 0.7 }}>
        {copy.dock}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {members.map((m, i) => (
          <div key={m.id} onMouseEnter={() => setHovered(i)}>
            <WuCoin node={m} scale={scaleFor(i)} onClick={onSelect} />
          </div>
        ))}
      </div>
      <div style={{
        width: 240, overflow: 'hidden',
        maxHeight: open ? 48 : 0, opacity: open ? 1 : 0,
        transition: 'max-height 200ms ease, opacity 200ms ease',
      }}>
        <div
          onFocus={() => setSearchFocused(true)}
          onBlur={() => { setSearchFocused(false); setOpen(false); }}
        >
          <SearchBox graph={graph} onPick={(id) => onSelect(byId(graph, id))} />
        </div>
      </div>
    </div>
  );
}

const byId = (graph, id) => graph.byId[id] ?? null;
const byName = (graph, name) => Object.values(graph.byId).find((n) => n.name === name) ?? null;

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

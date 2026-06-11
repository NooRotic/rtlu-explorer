// src/ui/WuCoin.jsx
import { useTheme } from '../theme/ThemeContext.jsx';

// Presentational member coin: black circle, gold Wu mark, name centered underneath.
export default function WuCoin({ node, scale = 1, onClick, onHover }) {
  const { palette, typography, assets } = useTheme();
  const size = 46;
  return (
    <button
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onHover?.(node)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        transform: `scale(${scale})`, transformOrigin: 'bottom center',
        transition: 'transform 140ms ease-out', width: size + 18,
      }}
      title={node.name}
    >
      <span style={{
        width: size, height: size, borderRadius: '50%', background: palette.coinInk,
        border: `1px solid ${hexA(palette.gold, 0.5)}`, display: 'grid', placeItems: 'center',
        boxShadow: `0 2px 6px rgba(0,0,0,0.5)`,
      }}>
        <img src={assets.wuMark} alt="" style={{ width: size * 0.62, height: size * 0.62 }} draggable={false} />
      </span>
      <span style={{
        fontFamily: typography.title, fontSize: 9, color: palette.goldPale, letterSpacing: 0.3,
        whiteSpace: 'nowrap', maxWidth: size + 16, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {node.name}
      </span>
    </button>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

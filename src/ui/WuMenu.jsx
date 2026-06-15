// src/ui/WuMenu.jsx
import { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { menuItemsFor } from './menuItems.js';

const MENU_W = 210;
const ROW_H = 38;

// Themed right-click menu. `menu` is { x, y, node } | null (node null = background).
// Closes on Esc, outside click, or an action. Wu colours: gold-on-void.
export default function WuMenu({ menu, onAction, onClose }) {
  const { palette, typography } = useTheme();

  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu, onClose]);

  if (!menu) return null;
  const items = menuItemsFor(menu.node);
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - MENU_W - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - items.length * ROW_H - 24));
  const header = menu.node ? menu.node.name : 'view';

  return (
    <div
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose?.(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 30 }}
    >
      <div
        role="menu"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', left, top, width: MENU_W,
          background: 'linear-gradient(180deg, rgba(9,12,20,0.98), rgba(4,5,10,0.99))',
          border: `1px solid ${hexA(palette.gold, 0.35)}`, borderRadius: 10,
          boxShadow: '0 14px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          padding: 4, fontFamily: typography.data,
        }}
      >
        <div style={{
          fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold,
          padding: '6px 10px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {header}
        </div>
        {items.map((it, i) =>
          it.divider ? (
            <div key={i} style={{ height: 1, background: hexA(palette.gold, 0.16), margin: '4px 0' }} />
          ) : (
            <MenuRow
              key={i} item={it} palette={palette}
              onClick={() => { onAction?.(it.id, menu.node); onClose?.(); }}
            />
          ),
        )}
      </div>
    </div>
  );
}

function MenuRow({ item, palette, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="menuitem" onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontSize: 12, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
        color: hover ? palette.goldPale : item.accent ? palette.gold : palette.ink,
        background: hover ? hexA(palette.gold, 0.14) : 'transparent',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {item.label}
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

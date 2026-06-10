// src/ui/BudgetSlider.jsx
import { useTheme } from '../theme/ThemeContext.jsx';
import { BUDGET_STOPS } from '../engine/budget.js';

export default function BudgetSlider({ value, total, onChange }) {
  const { palette, typography, copy } = useTheme();
  return (
    <div
      style={{
        position: 'absolute', left: 18, bottom: 18, zIndex: 5,
        background: 'rgba(7,9,18,0.82)', border: `1px solid ${hexA(palette.gold, 0.25)}`,
        borderRadius: 10, padding: '12px 16px', minWidth: 230, backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ fontFamily: typography.data, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: palette.gold }}>
        {copy.budget.label}
      </div>
      <input
        type="range" min={50} max={total} step={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: palette.gold, marginTop: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: typography.data, fontSize: 13, color: palette.ink }}>
          {value.toLocaleString()} <span style={{ color: palette.mute }}>/ {total.toLocaleString()}</span>
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {BUDGET_STOPS.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange(Math.min(s.value, total))}
              style={{
                fontFamily: typography.data, fontSize: 10, cursor: 'pointer',
                background: 'transparent', color: value === s.value ? palette.gold : palette.mute,
                border: 'none', padding: 0,
              }}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>
      <div style={{ fontFamily: typography.body, fontSize: 11, color: palette.mute, marginTop: 6 }}>
        {copy.budget.hint}
      </div>
    </div>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

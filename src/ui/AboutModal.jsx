// src/ui/AboutModal.jsx
import { useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import './AboutModal.css';

// Re-openable welcome/about dialog. Prose comes from theme.copy.about; numbers are live (from props).
export default function AboutModal({ open, stats, onClose }) {
  const { palette, typography, copy } = useTheme();
  const a = copy.about;

  // Close on Esc whenever open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center',
        background: 'rgba(4,5,10,0.66)', backdropFilter: 'blur(4px)',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: 'min(560px, 92vw)' }}>
        {/* Brand label straddling the modal's top stroke */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1,
          padding: '3px 14px', whiteSpace: 'nowrap', borderRadius: 999,
          background: 'rgba(9,12,20,0.99)', border: `1px solid ${hexA(palette.gold, 0.35)}`,
          fontFamily: typography.data, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold,
        }}>
          {copy.title}
        </div>

        <div
          role="dialog" aria-modal="true" aria-label={a.heading}
          className="about-panel"
          style={{
            background: 'linear-gradient(180deg, rgba(9,12,20,0.98), rgba(4,5,10,0.99))',
            border: `1px solid ${hexA(palette.gold, 0.35)}`,
            position: 'relative', boxShadow: '0 18px 60px rgba(0,0,0,0.6)',
          }}
        >
          <button
            onClick={onClose} aria-label="close"
            style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: palette.mute, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >×</button>

          <h2 style={{ fontFamily: typography.title, fontSize: 'clamp(22px, 6.5vw, 26px)', color: palette.goldPale, margin: '2px 0 14px', lineHeight: 1.1 }}>
            {a.heading}
          </h2>

          {/* The numbers — live from the snapshot (sits directly under the heading) */}
          <div style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '0 0 6px' }}>
            {a.numbersTitle}
          </div>
          <div style={{ fontFamily: typography.data, fontSize: 14, color: palette.gold, display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <Stat n={stats.entities} unit={a.numbersUnits.entities} c={palette} />
            <span style={{ color: palette.mute }}>·</span>
            <Stat n={stats.links} unit={a.numbersUnits.links} c={palette} />
            <span style={{ color: palette.mute }}>·</span>
            <Stat n={stats.docs} unit={a.numbersUnits.docs} c={palette} prefix="from " />
          </div>

          {a.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '0 0 5px' }}>
                {s.title}
              </h3>
              <p style={{ fontFamily: typography.body, fontSize: 14, lineHeight: 1.55, color: palette.ink, margin: 0 }}>
                {s.body}
              </p>
            </section>
          ))}

          <h3 style={{ fontFamily: typography.title, fontSize: 14, color: palette.goldPale, letterSpacing: 0.4, margin: '0 0 5px' }}>
            {a.tributeTitle}
          </h3>
          <p style={{ fontFamily: typography.body, fontSize: 12.5, lineHeight: 1.5, color: palette.mute, margin: '0 0 14px' }}>
            {a.tribute}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {a.links.map((l, i) =>
              l.href ? (
                <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                   style={{ fontFamily: typography.data, fontSize: 12, color: palette.gold, textDecoration: 'none', borderBottom: `1px solid ${hexA(palette.gold, 0.4)}` }}>
                  {l.label} ↗
                </a>
              ) : (
                <span key={i} style={{ fontFamily: typography.data, fontSize: 12, color: palette.mute }}>{l.label}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, unit, c, prefix = '' }) {
  return (
    <span>{prefix}<b style={{ color: c.ink }}>{n.toLocaleString()}</b> {unit}</span>
  );
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

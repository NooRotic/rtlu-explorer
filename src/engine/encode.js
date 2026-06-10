// src/engine/encode.js
// THE single node-visual accessor. Color/size/glow/opacity are decided here and NOWHERE else, so
// adding Phase-2.5 type-color is "register a strategy", not a rewrite. Strategies are pure
// functions (node, ctx) => { color, size, glow, opacity }.

const SUN_MIN = 6;   // scene-space radius floor for suns
const SUN_MAX = 22;  // super-hub ceiling
const DUST_MIN = 0.6;
const DUST_MAX = 3.2;
const DIM_OPACITY = 0.12;

const strategies = new Map();

export function registerStrategy(name, fn) {
  strategies.set(name, fn);
}
export function listStrategies() {
  return [...strategies.keys()];
}

/** Public accessor used by every renderer. */
export function encode(node, ctx) {
  const fn = strategies.get(ctx.strategy) ?? strategies.get('structural');
  const base = fn(node, ctx);
  // Focus dimming is strategy-independent (applies to whichever lens is active).
  if (ctx.focusSet && !ctx.focusSet.has(node.id)) {
    return { ...base, opacity: DIM_OPACITY };
  }
  return base;
}

// --- structural (default) ---------------------------------------------------
registerStrategy('structural', (node, ctx) => {
  const { palette } = ctx.theme;
  const isSun = node.tier !== 'dust';
  if (isSun) {
    const t = ctx.maxCount ? (node.count ?? 0) / ctx.maxCount : 0;
    const size = node.tier === 'super' ? SUN_MAX : SUN_MIN + t * (SUN_MAX - SUN_MIN);
    const glow = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
    return { color: palette.gold, size, glow, opacity: 1 };
  }
  const dt = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
  return { color: palette.ash, size: DUST_MIN + dt * (DUST_MAX - DUST_MIN), glow: 0, opacity: 0.7 };
});

// --- community (second lens) ------------------------------------------------
// Deterministic hue per orbit id via a hashed HSL. Suns keep gold so anchors stay legible.
// NOTE: this lens encodes cluster *membership* (hue), not magnitude — so suns render at a flat
// size here (count-based sizing is the structural lens's job). Intentional, not a regression.
registerStrategy('community', (node, ctx) => {
  const { palette } = ctx.theme;
  if (node.tier !== 'dust') {
    return { color: palette.gold, size: node.tier === 'super' ? SUN_MAX : SUN_MIN, glow: 1, opacity: 1 };
  }
  const hue = node.orbit ? hashHue(node.orbit) : 0;
  const dt = ctx.maxDegree ? (ctx.degree[node.id] ?? 0) / ctx.maxDegree : 0;
  return {
    color: node.orbit ? `hsl(${hue}, 55%, 60%)` : palette.ash,
    size: DUST_MIN + dt * (DUST_MAX - DUST_MIN),
    glow: 0,
    opacity: 0.75,
  };
});

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

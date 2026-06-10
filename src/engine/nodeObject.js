// src/engine/nodeObject.js
import * as THREE from 'three';

// Cache radial-gradient glow textures by color so we build each at most once.
const glowCache = new Map();

function glowTexture(color) {
  if (glowCache.has(color)) return glowCache.get(color);
  const size = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // white-hot center -> pale gold -> color -> transparent (mirrors the mockup's sun gradient)
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,233,168,0.95)');
  g.addColorStop(0.6, hexToRgba(color, 0.9));
  g.addColorStop(1.0, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  glowCache.set(color, tex);
  return tex;
}

function dustTexture(color) {
  const key = `dust:${color}`;
  if (glowCache.has(key)) return glowCache.get(key);
  const size = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, hexToRgba(color, 1));
  g.addColorStop(0.7, hexToRgba(color, 0.6));
  g.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  glowCache.set(key, tex);
  return tex;
}

function hexToRgba(hex, a) {
  // Accepts #RRGGBB or hsl(...) — for hsl we let the browser parse via a throwaway sprite color.
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  // hsl(...) — strip to an rgba via a temporary element is overkill in three; community lens dust
  // uses a flat sprite color instead, so just return the hsl with alpha appended.
  return hex.replace(/^hsl\(/, 'hsla(').replace(/\)$/, `, ${a})`);
}

/**
 * Build the THREE object for a node from an encode() result.
 * @param {{color, size, glow, opacity}} enc
 * @param {{tier: string}} node
 * @param {{ringColor: string}} opts  ring color comes from theme.palette.gold (passed by caller)
 */
export function buildNodeObject(enc, node, opts) {
  const group = new THREE.Group();
  const isSun = node.tier !== 'dust';

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: isSun ? glowTexture(enc.color) : dustTexture(enc.color),
      transparent: true,
      opacity: enc.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const scale = isSun ? enc.size * (1 + enc.glow * 0.6) : enc.size;
  sprite.scale.set(scale, scale, 1);
  group.add(sprite);

  if (isSun) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(enc.size * 0.62, enc.size * 0.68, 48),
      new THREE.MeshBasicMaterial({ color: opts.ringColor, transparent: true, opacity: 0.5 * enc.opacity, side: THREE.DoubleSide }),
    );
    group.add(ring);
    if (node.tier === 'super') {
      const outer = new THREE.Mesh(
        new THREE.RingGeometry(enc.size * 0.78, enc.size * 0.82, 64),
        new THREE.MeshBasicMaterial({ color: opts.ringColor, transparent: true, opacity: 0.35 * enc.opacity, side: THREE.DoubleSide }),
      );
      group.add(outer);
    }
  }
  return group;
}

// src/engine/nebulaLayer.js
import * as THREE from 'three';

function cloudTexture(color) {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const n = color.startsWith('#') ? parseInt(color.slice(1), 16) : 0xe8b306;
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  g.addColorStop(0, `rgba(${rgb},0.5)`);
  g.addColorStop(0.5, `rgba(${rgb},0.18)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

/**
 * Build the nebula sprite group + an update(t) fn for slow drift. `extent` scales offsets to the
 * graph's spatial spread so clouds sit behind the node field at any layout size.
 */
export function buildNebula(nebulaSpec, extent) {
  const group = new THREE.Group();
  const sprites = [];
  nebulaSpec.layers.forEach((layer, i) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cloudTexture(layer.color),
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const s = extent * layer.size;
    sprite.scale.set(s, s, 1);
    sprite.position.set(layer.offset[0] * extent, layer.offset[1] * extent, layer.offset[2] * extent);
    sprite.userData.basePos = sprite.position.clone();
    sprite.userData.phase = i;
    group.add(sprite);
    sprites.push(sprite);
  });

  function update(t) {
    for (const sp of sprites) {
      const ph = sp.userData.phase;
      sp.position.x = sp.userData.basePos.x + Math.sin(t * 0.0004 + ph) * extent * 0.04;
      sp.position.y = sp.userData.basePos.y + Math.cos(t * 0.0003 + ph) * extent * 0.03;
    }
  }

  return { group, update };
}

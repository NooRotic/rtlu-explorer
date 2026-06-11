// src/engine/islandHalo.js
import * as THREE from 'three';

const HALO_INTENSITY = 0.22; // fixed ash opacity — islands are quiet edge-of-universe texture
const POINT_SIZE = 2.4;

// Deterministic point on a sphere shell from an integer index (Fibonacci sphere — even, stable).
function shellPoint(i, n, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / Math.max(1, n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return [Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius];
}

/**
 * Build a faint ash halo of the unlinked entities on an outer sphere shell.
 * @param {Array<{id,name}>} islands  degree-0 nodes
 * @param {number} extent  graph spatial scale (radius multiplier)
 * @param {{palette:{ash:string}}} theme
 * @returns {THREE.Points} a points cloud (non-interactive; toggle via .visible)
 */
export function buildIslandHalo(islands, extent, theme) {
  const radius = extent * 1.35; // sits outside the active web
  const positions = new Float32Array(islands.length * 3);
  islands.forEach((_, i) => {
    const [x, y, z] = shellPoint(i, islands.length, radius);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  });
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(theme.palette.ash),
    size: POINT_SIZE,
    transparent: true,
    opacity: HALO_INTENSITY,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geom, mat);
  points.name = 'island-halo';
  return points;
}

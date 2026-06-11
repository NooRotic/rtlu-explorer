// src/engine/search.js
// Pure, artist-agnostic name search over the full entity set. Ranks prefix matches above
// substring matches; ties broken by degree (most-connected first), then name. No theme import.

/**
 * @param {string} query
 * @param {Array<{id,name}>} nodes
 * @param {Record<string, number>} degree
 * @param {number} limit
 * @returns {Array<{id, name, degree}>}
 */
export function searchEntities(query, nodes, degree, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];
  for (const n of nodes) {
    const name = n.name.toLowerCase();
    const idx = name.indexOf(q);
    if (idx === -1) continue;
    hits.push({ id: n.id, name: n.name, degree: degree[n.id] ?? 0, rank: idx === 0 ? 0 : 1 });
  }
  hits.sort(
    (a, b) =>
      a.rank - b.rank ||
      b.degree - a.degree ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
  return hits.slice(0, limit).map(({ id, name, degree }) => ({ id, name, degree }));
}

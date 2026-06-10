// src/engine/selectors.js
// Pure read-side helpers. Operate on the RAW (string-id) links so they are safe to call before or
// after react-force-graph mutates its own working copy.

/** Top-N nodes by degree, descending. Ties broken by id for determinism. */
export function topNByDegree(nodes, degree, n) {
  return [...nodes]
    .sort((a, b) => (degree[b.id] ?? 0) - (degree[a.id] ?? 0) || (a.id < b.id ? -1 : 1))
    .slice(0, n);
}

/** Set of {focus id} ∪ {ids directly linked to focus}. */
export function neighborsOf(focusId, links) {
  const set = new Set([focusId]);
  for (const l of links) {
    if (l.source === focusId) set.add(l.target);
    else if (l.target === focusId) set.add(l.source);
  }
  return set;
}

/**
 * Drawer dossier stats for one node.
 * @param resolve (id) => node-like with a .name, for naming the other end of an edge.
 */
export function entityStats(node, degree, links, resolve) {
  const edges = [];
  for (const l of links) {
    if (l.source === node.id) edges.push({ id: l.target, weight: l.weight });
    else if (l.target === node.id) edges.push({ id: l.source, weight: l.weight });
  }
  edges.sort((a, b) => b.weight - a.weight);
  const topEdges = edges.slice(0, 5).map((e) => ({ name: resolve(e.id)?.name ?? '—', weight: e.weight }));
  return {
    count: node.count ?? 0,
    degree: degree[node.id] ?? 0,
    strongest: topEdges[0] ?? null,
    topEdges,
  };
}

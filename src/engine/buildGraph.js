// src/engine/buildGraph.js
// Artist-agnostic graph normalizer. Takes the raw snapshot + a roster (supplied by the theme via
// the caller) and returns nodes/links plus degree, byId, and per-node tier + orbit. Pure: it never
// imports a theme and never mutates its inputs.

/**
 * @param {{entities: Array, links: Array}} snapshot
 * @param {{sunNames: string[], superHub: string}} roster
 */
export function buildGraph(snapshot, roster) {
  const sunSet = new Set(roster.sunNames);
  const degree = {};
  const byId = {};

  const nodes = snapshot.entities.map((e) => {
    degree[e.id] = 0;
    const tier =
      e.name === roster.superHub ? 'super' : sunSet.has(e.name) ? 'sun' : 'dust';
    const node = {
      id: e.id,
      name: e.name,
      count: e.count ?? 0,
      type: e.type ?? null,
      categories: e.categories ?? [],
      tier,
      orbit: null, // filled below
    };
    byId[e.id] = node;
    return node;
  });

  // Undirected degree.
  for (const l of snapshot.links) {
    if (degree[l.source] !== undefined) degree[l.source] += 1;
    if (degree[l.target] !== undefined) degree[l.target] += 1;
  }

  // Orbit = the sun a node co-occurs most strongly with (max summed weight to any sun node).
  // A sun is its own orbit. Build sun-id lookup first.
  const sunIds = new Set(nodes.filter((n) => n.tier !== 'dust').map((n) => n.id));
  const orbitWeight = {}; // nodeId -> { sunId: summedWeight }
  for (const l of snapshot.links) {
    accrue(orbitWeight, l.source, l.target, l.weight, sunIds);
    accrue(orbitWeight, l.target, l.source, l.weight, sunIds);
  }
  for (const n of nodes) {
    if (n.tier !== 'dust') {
      n.orbit = n.id; // suns anchor their own orbit
      continue;
    }
    const tally = orbitWeight[n.id];
    n.orbit = tally ? bestKey(tally) : null;
  }

  return { nodes, links: snapshot.links.map((l) => ({ ...l })), degree, byId };
}

function accrue(map, from, sunCandidate, weight, sunIds) {
  if (!sunIds.has(sunCandidate)) return;
  (map[from] ??= {})[sunCandidate] = (map[from][sunCandidate] ?? 0) + weight;
}

function bestKey(tally) {
  let best = null;
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(tally)) {
    if (v > bestVal) {
      bestVal = v;
      best = k;
    }
  }
  return best;
}
